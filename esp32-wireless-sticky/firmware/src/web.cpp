#include "web.h"

#include <AsyncTCP.h>
#include <DNSServer.h>
#include <ESPAsyncWebServer.h>
#include <WiFi.h>

#include "config.h"
#include "note.h"
#include "web_ui.h"

namespace web {
namespace {

AsyncWebServer sServer(80);
AsyncWebSocket sWs("/ws");
DNSServer sDns;

bool sCaptive = false;
String sMode = "ap";
String sIp;
String sSsid;

String sPostBody;   // POST /api/note 的原始 body（只在异步任务里用）
String sWsBuffer;   // 分片 WebSocket 消息的拼装缓冲
int sLastClients = -1;
uint32_t sEchoSkip = 0;  // 刚发来正文的客户端：回声不再推回给它自己

String jsonEscape(const String& in) {
  String out;
  out.reserve(in.length() + 4);
  for (size_t i = 0; i < in.length(); ++i) {
    const char c = in[i];
    if (c == '"' || c == '\\') {
      out += '\\';
      out += c;
    } else if ((uint8_t)c >= 0x20) {
      out += c;
    }
  }
  return out;
}

String statusJson() {
  const String current = note::get();

  String json;
  json.reserve(180);
  json += "{\"mode\":\"";
  json += sMode;
  json += "\",\"ip\":\"";
  json += jsonEscape(sIp);
  json += "\",\"ssid\":\"";
  json += jsonEscape(sSsid);
  json += "\",\"clients\":";
  json += String((int)sWs.count());
  json += ",\"bytes\":";
  json += String((unsigned)current.length());
  json += ",\"max\":";
  json += String(MAX_NOTE_BYTES);
  json += "}";
  return json;
}

void broadcastClients() {
  const int count = (int)sWs.count();
  if (count == sLastClients) return;
  sLastClients = count;
  sWs.textAll("N" + String(count));
}

// 一条完整消息：第一个字符是命令
void handleMessage(const char* data, size_t len) {
  if (len == 0) return;

  switch (data[0]) {
    case 'T': {
      String text;
      text.reserve(len - 1);
      text.concat(data + 1, len - 1);
      note::set(text);
      break;
    }
    case 'C':
      note::clear();
      break;
    default:
      break;
  }
}

void onWsEvent(AsyncWebSocket* server, AsyncWebSocketClient* client, AwsEventType type, void* arg, uint8_t* data, size_t len) {
  switch (type) {
    case WS_EVT_CONNECT:
      client->text("S" + statusJson());
      client->text("T" + note::get());
      if (DEBUG_SERIAL) {
        Serial.printf("[ws] client #%u connected\n", (unsigned)client->id());
      }
      break;

    case WS_EVT_DISCONNECT:
      if (DEBUG_SERIAL) {
        Serial.printf("[ws] client #%u left\n", (unsigned)client->id());
      }
      break;

    case WS_EVT_DATA: {
      const AwsFrameInfo* info = (const AwsFrameInfo*)arg;
      if (info == nullptr) return;
      if (info->len > 2048) return;  // 便签只有 600 字节，超长直接丢掉

      if (info->final && info->index == 0 && info->len == len) {
        sEchoSkip = client->id();
        handleMessage((const char*)data, len);
        break;
      }

      // 分片消息：浏览器一般不会这么发，但按协议拼一下更稳
      if (info->index == 0) sWsBuffer = "";
      if (sWsBuffer.length() + len > 2048) {
        sWsBuffer = "";
        break;
      }
      sWsBuffer.concat((const char*)data, len);
      if (info->final && (info->index + len) == info->len) {
        sEchoSkip = client->id();
        handleMessage(sWsBuffer.c_str(), sWsBuffer.length());
        sWsBuffer = "";
      }
      break;
    }

    default:
      break;
  }
}

}  // namespace

void begin(const String& mode, const String& ip, const String& ssid, bool captive) {
  sMode = mode;
  sIp = ip;
  sSsid = ssid;
  sCaptive = captive;

  sWs.onEvent(onWsEvent);
  sServer.addHandler(&sWs);

  sServer.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    AsyncWebServerResponse* response = request->beginResponse(200, "text/html; charset=utf-8", INDEX_HTML);
    response->addHeader("Cache-Control", "no-store");
    request->send(response);
  });

  sServer.on("/favicon.svg", HTTP_GET, [](AsyncWebServerRequest* request) {
    AsyncWebServerResponse* response = request->beginResponse(200, "image/svg+xml", FAVICON_SVG);
    response->addHeader("Cache-Control", "max-age=86400");
    request->send(response);
  });

  sServer.on("/favicon.ico", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(204, "text/plain", "");
  });

  sServer.on("/api/note", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/plain; charset=utf-8", note::get());
  });

  // 用原始 body 写入，方便 curl / 脚本：
  //   curl -X POST -H "Content-Type: application/octet-stream" --data-binary @note.txt http://IP/api/note
  sServer.on(
      "/api/note", HTTP_POST,
      [](AsyncWebServerRequest* request) {
        if (sPostBody.isEmpty()) {
          request->send(400, "text/plain; charset=utf-8", "empty body");
          return;
        }
        note::set(sPostBody);
        sPostBody = "";
        request->send(200, "text/plain; charset=utf-8", "ok");
      },
      nullptr,
      [](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
        (void)request;
        if (index == 0) sPostBody = "";
        if (total > 2048) return;
        if (sPostBody.length() + len <= 2048) sPostBody.concat((const char*)data, len);
      });

  sServer.on("/api/status", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "application/json; charset=utf-8", statusJson());
  });

  sServer.on("/api/clear", HTTP_POST, [](AsyncWebServerRequest* request) {
    note::clear();
    request->send(200, "text/plain; charset=utf-8", "ok");
  });

  sServer.onNotFound([](AsyncWebServerRequest* request) {
    // 手机连上热点后会自动探测 /generate_204 之类，统一送回首页
    if (sCaptive && !request->url().startsWith("/api/")) {
      request->redirect(String("http://") + sIp + "/", 302);
      return;
    }
    request->send(404, "text/plain; charset=utf-8", "not found");
  });

  sServer.begin();

  if (sCaptive) {
    sDns.start(53, "*", WiFi.softAPIP());
  }

  if (DEBUG_SERIAL) {
    Serial.printf("[web] http://%s/  mode=%s\n", sIp.c_str(), sMode.c_str());
  }
}

void setNetwork(const String& mode, const String& ip, const String& ssid, bool captive) {
  sMode = mode;
  sIp = ip;
  sSsid = ssid;

  if (captive && !sCaptive) {
    sCaptive = true;
    sDns.start(53, "*", WiFi.softAPIP());
  } else if (!captive && sCaptive) {
    sCaptive = false;
    sDns.stop();
  }

  if (DEBUG_SERIAL) {
    Serial.printf("[web] network now http://%s/ (%s)\n", sIp.c_str(), sMode.c_str());
  }
}

void tick() {
  sWs.cleanupClients();
  if (sCaptive) sDns.processNextRequest();
  broadcastClients();
}

void broadcastNote(const String& text) {
  const uint32_t skip = sEchoSkip;
  sEchoSkip = 0;
  if (skip == 0) {
    sWs.textAll("T" + text);
    return;
  }
  // 打字的那台手机不再收到自己内容的回声，避免输入框被重写导致失焦
  String message = "T" + text;
  for (AsyncWebSocketClient& c : sWs.getClients()) {
    if (c.id() != skip && c.status() == WS_CONNECTED) c.text(message);
  }
}

int clientCount() { return (int)sWs.count(); }

}  // namespace web
