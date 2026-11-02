/* =========================================================
   启动：画布 / 规格 / 渲染接口
   ========================================================= */
(function () {
  'use strict';

  const cv = document.getElementById('stage');
  const x = cv.getContext('2d');

  async function boot() {
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.all([
          document.fonts.load('400 40px "Songti SC"'),
          document.fonts.load('400 40px "SF Mono"'),
          document.fonts.load('400 40px "PingFang SC"')
        ]);
        await document.fonts.ready;
      }
      const res = await fetch('/data/spec.json', { cache: 'no-store' });
      const spec = await res.json();
      window.MV.spec = spec;
      window.MV.film.init(spec);

      window.renderFrame = (t) => {
        window.MV.film.draw(t, x);
        return cv.toDataURL('image/jpeg', 0.95);
      };
      window.renderPNG = (t) => {
        window.MV.film.draw(t, x);
        return cv.toDataURL('image/png');
      };
      window.__ready = true;
      window.MV.film.draw(0, x);
    } catch (err) {
      console.error('boot failed', err);
      window.__bootError = String(err && err.stack || err);
    }
  }

  boot();
})();
