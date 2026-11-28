import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = await mkdtemp(join(tmpdir(), 'winlinx-test-'));
const origin = 'http://127.0.0.1:4174';
const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'
], { stdio: 'inherit' });
const browser = spawn(process.env.WINLINX_CHROME || 'google-chrome', [
  '--headless', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });
let socket;
let launchError;
browser.on('error', error => { launchError = error; });

async function waitFor(check, label) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (launchError) throw launchError;
    const result = await check();
    if (result) return result;
    await delay(125);
  }
  throw new Error(`Tempo esgotado: ${label}`);
}

try {
  const debugPort = await waitFor(async () => {
    const info = await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '');
    return info.split('\n')[0];
  }, 'porta do Chromium');
  await waitFor(async () => (await fetch(origin).catch(() => null))?.ok, 'servidor Vite');

  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, {once: true});
    socket.addEventListener('error', reject, {once: true});
  });

  let sequence = 0;
  const pending = new Map();
  const errors = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    pending.get(message.id)?.(message);
  };

  async function send(method, params = {}) {
    const id = ++sequence;
    const reply = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Sem resposta do Chromium para ${method}`));
      }, 5000);
      pending.set(id, message => { clearTimeout(timeout); resolve(message); });
      socket.send(JSON.stringify({id, method, params}));
    });
    pending.delete(id);
    assert.equal(reply.error, undefined);
    return reply.result;
  }

  async function evaluate(expression) {
    const reply = await send('Runtime.evaluate', {expression, returnByValue: true});
    if (reply.exceptionDetails) throw new Error(reply.exceptionDetails.exception?.description ?? expression);
    return reply.result.value;
  }

  const text = phrase => waitFor(
    () => evaluate(`document.body.innerText.includes(${JSON.stringify(phrase)})`), phrase
  );

  async function click(label, parent) {
    const query = `[...document.querySelectorAll('button')].find(b =>
      b.innerText.trim().startsWith(${JSON.stringify(label)}) &&
      (!${JSON.stringify(parent ?? '')} || b.closest('div.rounded-lg')?.innerText.includes(${JSON.stringify(parent ?? '')})))`;
    await waitFor(() => evaluate(`Boolean(${query})`), label);
    await evaluate(`(${query}).click()`);
  }

  async function fill(selector, value) {
    const query = `document.querySelector(${JSON.stringify(selector)})`;
    await waitFor(() => evaluate(`Boolean(${query})`), selector);
    await evaluate(`${query}.focus()`);
    await send('Input.dispatchKeyEvent', {type: 'keyDown', code: 'KeyA', key: 'a', modifiers: 2, windowsVirtualKeyCode: 65});
    await send('Input.insertText', {text: value});
  }

  async function terminal(command, os = 'Linux') {
    await fill(`[aria-label="Comando ${os}"]`, command);
    await send('Input.dispatchKeyEvent', {type: 'keyDown', code: 'Enter', key: 'Enter', windowsVirtualKeyCode: 13});
  }

  async function submit(index, values) {
    for (let position = 0; position < values.length; position++) {
      await fill(`form[data-evidence-test="${index}"] input[name="${position}"]`, values[position]);
    }
    await evaluate(`document.querySelector('form[data-evidence-test="${index}"]').requestSubmit()`);
  }

  async function tagForms() {
    await evaluate(`document.querySelectorAll('form').forEach((form, index) => form.dataset.evidenceTest = index)`);
  }

  await send('Runtime.enable');
  await send('Page.navigate', {url: origin});
  await click('Labs');
  await click('Lab 02');
  await text('Tentativa atual: 0/5');
  await tagForms();
  await submit(0, ['1337', 'kworker_rev']);
  await text('Consulte a fonte de evidência');
  await terminal('ps aux | grep /tmp');
  await text('Fonte de evidência consultada');
  await submit(0, ['9999', 'kworker_rev']);
  await text('Revise a evidência para: PID suspeito');
  await submit(0, ['1337', 'kworker_rev']);
  await text('Tentativa atual: 1/5');

  await terminal('ss -tulpn');
  await tagForms();
  await submit(0, ['4444', 'kworker_rev']);
  await text('Tentativa atual: 2/5');
  await click('Verificar estado do alvo', 'Tarefa 4');
  await text('4444/TCP aberta');
  await terminal('ufw deny 4445');
  await click('Verificar estado do alvo', 'Tarefa 4');
  await text('4444/TCP aberta');
  await terminal('ufw deny 4444');
  await click('Verificar estado do alvo', 'Tarefa 4');
  await text('Tentativa atual: 3/5');

  await click('Windows Host (PowerShell)');
  await terminal('netstat -ano', 'Windows');
  await tagForms();
  await submit(0, ['8089', '4992']);
  await text('Tentativa atual: 4/5');
  await click('Verificar estado do alvo', 'Tarefa 5');
  await text('8089/TCP aberta');
  await terminal('netsh advfirewall firewall add rule name="Block 8089" dir=in action=block protocol=TCP localport=8089', 'Windows');
  await click('Verificar estado do alvo', 'Tarefa 5');
  await text('Tentativa atual: 5/5');

  await evaluate(`(() => {
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => {
      window.attemptExport = blob.text().then(JSON.parse);
      return create(blob);
    };
  })()`);
  await click('Exportar evidências da tentativa');
  await waitFor(() => evaluate('Boolean(window.attemptExport)'), 'exportação da tentativa');
  const exported = (await send('Runtime.evaluate', {expression: 'window.attemptExport', awaitPromise: true, returnByValue: true})).result.value;
  assert.equal(exported.labId, 'lab-processes-memory');
  assert.equal(exported.completedTasks.length, 5);
  assert.ok(exported.logs.some(log => log.details.includes('4444/TCP aberta')));
  assert.ok(exported.logs.some(log => log.details.includes('4444/TCP filtrada')));
  assert.ok(exported.logs.every(log => log.attemptId === exported.attemptId));
  await click('Dashboard de Módulos');
  await click('Labs');
  await text('Tentativa atual: 5/5');
  await click('Lab 03');
  await text('Tentativa atual: 0/3');
  await terminal('ufw status');
  assert.equal(await evaluate(`document.body.innerText.includes('4444/tcp                     DENY')`), false);
  await click('Lab 02');
  await text('Tentativa atual: 5/5');
  await click('Reiniciar máquinas');
  await text('Histórico: 5/5 · Tentativa atual: 0/5');
  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  const packageData = {
    version: 1,
    lab: { title: 'Cenário importado', description: 'Validação no navegador', difficulty: 'Iniciante', tasks: [
      {title: 'Consultar identidade', targetOS: 'linux', validationCommand: 'whoami'},
      {title: 'Consultar diretório', targetOS: 'linux', validationCommand: 'pwd'}
    ] }
  };
  await fill('#lab-package', '{');
  await click('Importar e abrir prévia');
  await text('JSON inválido.');
  await fill('#lab-package', JSON.stringify(packageData));
  await click('Importar e abrir prévia');
  await text('Cenário importado');
  await terminal('whoami');
  await terminal('pwd');
  await text('Tentativa atual: 2/2');
  assert.deepEqual(errors, []);
  console.log('Lab 02: evidência, rejeição, contenção, isolamento, retomada e reset verificados.');
} finally {
  socket?.close();
  browser.kill();
  server.kill();
  if (browser.pid && browser.exitCode === null && browser.signalCode === null) {
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(2000)]);
  }
  await rm(profile, {recursive: true, force: true});
}
