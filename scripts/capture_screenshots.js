import http from 'http';
import fs from 'fs';
import path from 'path';

const CDP_PORT = 9222;
const DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYzJmMTE5ZDM2ZjczZTQ5MTg3ZTVkZiIsImlhdCI6MTc5MTE2MDYwMSwiZXhwIjoxNzkzNzUyNjAxfQ.lA2VgnoS6KQdNtlqfPGHeRdW4FzsenTgOKRLBCiti30';

async function getDebuggerUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
          let str = '';
          res.on('data', chunk => str += chunk);
          res.on('end', () => resolve(str));
        }).on('error', reject);
      });
      const list = JSON.parse(data);
      const page = list.find(item => item.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        return page.webSocketDebuggerUrl;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('Could not find Edge debug page');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.pending.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath} (${buffer.length} bytes)`);
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  const screenshotsDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const wsUrl = await getDebuggerUrl();
  const cdp = new CDPClient(wsUrl);
  await cdp.connect();
  console.log('Connected to CDP');

  // Set desktop viewport at 1440x920, 2x retina scale for crisp typography
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 920,
    deviceScaleFactor: 2,
    mobile: false,
  });

  // Navigate and inject token
  console.log('Navigating to http://localhost:5173...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 1500));

  await cdp.eval(`localStorage.setItem('token', '${DEMO_TOKEN}');`);
  await cdp.send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 2000));

  // --- SCREEN 1: Initial Build Mode with Parameters Expanded ---
  console.log('1. Setting up Initial Build mode...');
  await cdp.eval(`
    (() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const text = "Build a real-time collaborative whiteboard engine with CRDT synchronization, undo/redo history, role-based room access controls, and WebSocket streaming.";
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Open Parameters
      const buttons = Array.from(document.querySelectorAll('button'));
      const paramBtn = buttons.find(b => b.textContent && b.textContent.includes('Parameters'));
      if (paramBtn && paramBtn.querySelector('svg')) {
        paramBtn.click();
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.screenshot(path.join(screenshotsDir, 'workbench-initial-build.png'));

  // --- SCREEN 2: Live Compilation & Refined Output Viewer ---
  console.log('2. Triggering compilation...');
  await cdp.eval(`
    (() => {
      const compileBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().startsWith('Compile'));
      if (compileBtn) compileBtn.click();
    })()
  `);

  // Wait for compile to complete (result viewer appears)
  console.log('Waiting for compilation result from Groq...');
  for (let i = 0; i < 30; i++) {
    const hasViewer = await cdp.eval(`Boolean(document.querySelector('pre') && document.querySelector('button')?.textContent.includes('Copy'))`);
    if (hasViewer) {
      console.log('Compilation completed!');
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Scroll down slightly or collapse parameters to focus on prompt and compiled output
  await cdp.eval(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const paramBtn = buttons.find(b => b.textContent && b.textContent.includes('Parameters'));
      // Collapse parameters so compiled result is centered in view
      if (paramBtn) paramBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));
  await cdp.screenshot(path.join(screenshotsDir, 'workbench-compiled-output.png'));

  // --- SCREEN 3: Command Fix Mode ---
  console.log('3. Setting up Command Fix mode...');
  await cdp.eval(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fixTab = buttons.find(b => b.textContent && b.textContent.trim() === 'Command Fix');
      if (fixTab) fixTab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  await cdp.eval(`
    (() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const errorText = \`TypeError: Cannot read properties of undefined (reading 'headers')
    at authMiddleware (server/middleware/auth.js:14:28)
    at Layer.handle [as handle_request] (express/lib/router/layer.js:95:5)
    at Route.dispatch (express/lib/router/route.js:112:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\`;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, errorText);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Open Parameters for fix mode
      const buttons = Array.from(document.querySelectorAll('button'));
      const paramBtn = buttons.find(b => b.textContent && b.textContent.includes('Parameters'));
      if (paramBtn) paramBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));
  await cdp.screenshot(path.join(screenshotsDir, 'workbench-command-fix.png'));

  // --- SCREEN 4: Settings & BYOK Page ---
  console.log('4. Navigating to Settings & BYOK...');
  await cdp.send('Page.navigate', { url: 'http://localhost:5173/settings#settings' });
  await new Promise(r => setTimeout(r, 1500));

  await cdp.screenshot(path.join(screenshotsDir, 'settings-byok-security.png'));

  console.log('All 4 screens captured successfully!');
  cdp.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
