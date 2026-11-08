// `npm run dev`: starts Next and opens the site in the default browser once it
// is ready. If this site is already being served on port 3000, Next would
// refuse a second dev server, so the browser is simply pointed at that one.
// Set NO_OPEN=1 to skip opening the browser.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const DEFAULT_URL = 'http://localhost:3000';

function openBrowser(url) {
  console.log(`\n  Sayt: ${url}\n`);
  if (process.env.NO_OPEN) return;
  const [cmd, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
}

async function alreadyServing() {
  try {
    // a free port refuses at once; the long wait is only for a server still compiling
    const res = await fetch(DEFAULT_URL, { signal: AbortSignal.timeout(20000) });
    return (await res.text()).includes('Zarafshon');
  } catch {
    return false;
  }
}

function startNext() {
const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  stdio: ['inherit', 'pipe', 'inherit'],
});

let url = null;
let opened = false;
child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);
  url = text.match(/Local:\s+(https?:\/\/[^\s\x1b]+)/)?.[1] ?? url;
  if (!opened && url && /Ready in/i.test(text)) {
    opened = true;
    openBrowser(url);
  }
});

child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
}

if (await alreadyServing()) {
  console.log('Dev server allaqachon ishlayapti.');
  openBrowser(DEFAULT_URL);
} else {
  startNext();
}
