import { Config } from '@remotion/cli/config';
import path from 'path';

Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(17);
Config.setConcurrency(6);
Config.setChromiumOpenGlRenderer('angle');

// The Chrome Headless Shell that ships with Remotion downloads from
// storage.googleapis.com, which is unreachable from this machine; the same
// build was fetched from the npmmirror chrome-for-testing mirror and unpacked
// into node_modules/.remotion/chrome-headless-shell. Point Remotion at it.
const localShell = path.resolve(
  'node_modules/.remotion/chrome-headless-shell/chrome-headless-shell-win64/chrome-headless-shell.exe',
);
Config.setBrowserExecutable(localShell);
