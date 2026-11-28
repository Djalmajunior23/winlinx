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
    await evaluate(`(() => {
      const field = ${query};
      field.focus();
      field.select();
    })()`);
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

  async function reload() {
    await evaluate('window.winlinxPreviousDocument = true');
    await send('Page.reload');
    await waitFor(async () => {
      try {
        return await evaluate('!window.winlinxPreviousDocument && document.readyState === "complete"');
      } catch {
        return false;
      }
    }, 'nova página após recarregar');
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
  await click('Firewall da sessão');
  await click('Windows (WFP / netsh)');
  await click('Testar Porta');
  await text('8089/TCP · Aberta');
  await click('Bloquear entrada TCP no simulador');
  await click('Testar Porta');
  await text('8089/TCP · Filtrada');
  await click('Labs');
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
  await reload();
  await text('Tentativa atual: 5/5');
  await terminal('ufw status');
  await text('4444/tcp                     DENY');
  await click('Logs forenses');
  await click('Linux Auditd / Auth');
  await text('4444/TCP filtrada');
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
  await reload();
  await text('Histórico: 5/5 · Tentativa atual: 0/5');
  await terminal('echo registro-nova-tentativa');
  await click('Logs forenses');
  await click('Linux Auditd / Auth');
  await text('registro-nova-tentativa');
  await click('Limpar tentativa atual');
  await text('Nenhuma evidência corresponde aos filtros.');
  await evaluate(`(() => {
    const scope = [...document.querySelectorAll('select')].find(element => element.querySelector('option[value="generated"]'));
    scope.value = 'generated';
    scope.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await text('4444/TCP filtrada');
  assert.equal(await evaluate(`document.body.innerText.includes('registro-nova-tentativa')`), false);
  await click('Labs');
  await click('Abrir histórico de tentativas');
  await text('Histórico de tentativas concluídas');
  await text('Exportar dossiê arquivado');
  await fill('input[type="search"]', 'nao-existe-winlinx');
  await text('Nenhuma tentativa encontrada.');
  await fill('input[type="search"]', 'Triagem');
  await click('Exportar dossiê arquivado');

  await click('Lab 03');
  await terminal('cat /etc/crontab');
  await tagForms();
  await submit(0, ['/opt/scripts/backup.sh', 'root']);
  await text('Tentativa atual: 1/3');
  await click('Windows Host (PowerShell)');
  await terminal('sc qc servico-inexistente', 'Windows');
  await text('Serviço não encontrado');
  await terminal('sc qc WinVulnerableUpdater', 'Windows');
  await tagForms();
  await submit(0, ['WinVulnerableUpdater', 'LocalSystem']);
  await text('Tentativa atual: 2/3');
  await click('Verificar estado do alvo');
  await text('Confira as aspas');
  await terminal(`sc config WinVulnerableUpdater binPath= '"C:\\Program Files\\Custom App\\service.exe"'`, 'Windows');
  await click('Verificar estado do alvo');
  await text('Tentativa atual: 3/3');

  await click('Lab 04');
  await terminal('cat /var/log/auth.log');
  await tagForms();
  await submit(0, ['203.0.113.55', 'root', '10:20:44']);
  await text('Revise a evidência');
  await submit(0, ['203.0.113.55', 'admin', '10:20:44']);
  await text('Tentativa atual: 1/2');
  await click('Windows Host (PowerShell)');
  await terminal('Get-EventLog -LogName Security', 'Windows');
  await tagForms();
  await submit(0, ['192.168.1.88', 'admin_ti', '4625', '10:22:13']);
  await text('Tentativa atual: 2/2');

  await click('Lab 05');
  await terminal('whoami /priv', 'Windows');
  await tagForms();
  await submit(0, ['SeChangeNotifyPrivilege']);
  await click('Linux Host (Bash)');
  await terminal('cat /etc/sudoers');
  await tagForms();
  await submit(0, ['aluno', '/usr/bin/apt-get']);
  await text('Tentativa atual: 2/4');
  await click('Verificar estado do alvo', 'Tarefa 3');
  await text('ainda não exige senha');
  await terminal('sudo visudo --require-password aluno');
  await click('Verificar estado do alvo', 'Tarefa 3');
  await text('Tentativa atual: 3/4');
  await click('Windows Host (PowerShell)');
  await terminal('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f', 'Windows');
  await click('Verificar estado do alvo', 'Tarefa 4');
  await text('Tentativa atual: 4/4');

  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  await waitFor(() => evaluate(`[...document.querySelectorAll('select')].some(select => select.querySelector('option[value="tcp-filtered"]'))`), 'critério no construtor');
  await evaluate(`(() => {
    const select = [...document.querySelectorAll('select')].find(element => element.querySelector('option[value="tcp-filtered"]'));
    select.value = 'tcp-filtered';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await click('Compilar e Exportar Pacote de Laboratório');
  const generated = await evaluate('JSON.parse(document.querySelector("#lab-package").value)');
  assert.deepEqual(generated.lab.tasks[0].verify, { kind: 'tcp-filtered', port: 4444 });
  const registryKey = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa';
  const packageData = {
    version: 1,
    lab: { title: 'Cenário importado', description: 'Validação no navegador', difficulty: 'Iniciante', tasks: [
      {title: 'Consultar identidade', targetOS: 'linux', validationCommand: 'whoami'},
      {title: 'Consultar diretório', targetOS: 'linux', validationCommand: 'pwd'},
      {title: 'Filtrar porta escolhida', targetOS: 'linux', verify: { kind: 'tcp-filtered', port: 9443 }},
      {title: 'Confirmar configuração Windows', targetOS: 'windows',
        verify: { kind: 'registry-value', key: registryKey, name: 'RunAsPPL', valueType: 'REG_DWORD', value: 1 }}
    ] }
  };
  await fill('#lab-package', '{');
  await click('Importar e abrir prévia');
  await text('JSON inválido.');
  await fill('#lab-package', JSON.stringify(packageData));
  await click('Importar para editar');
  await text('Editar tarefas importadas');
  await fill('#builder-task-1', JSON.stringify({id: 'tarefa-2', title: 'Consultar diretório revisado', targetOS: 'linux',
    validationCommand: 'pwd', requires: ['tarefa-1']}));
  await click('Subir tarefa 2');
  await click('Exportar revisão');
  await text('pré-requisitos da tarefa 1');
  await click('Descer tarefa 1');
  await click('Exportar revisão');
  const revision = await evaluate('JSON.parse(document.querySelector("#lab-package").value)');
  assert.equal(revision.lab.tasks[1].title, 'Consultar diretório revisado');
  await click('Testar revisão');
  await text('Cenário importado');
  await terminal('pwd');
  await text('Conclua as tarefas anteriores');
  await terminal('whoami');
  await terminal('pwd');
  await text('Tentativa atual: 2/4');
  await click('Verificar estado do alvo', 'Filtrar porta escolhida');
  await text('9443/TCP fechada');
  await terminal('ufw deny 9443');
  await click('Verificar estado do alvo', 'Filtrar porta escolhida');
  await text('Tentativa atual: 3/4');
  await click('Verificar estado do alvo', 'Confirmar configuração Windows');
  await text('ainda difere do objetivo');
  await click('Windows Host (PowerShell)');
  await terminal(`reg add "${registryKey}" /v RunAsPPL /t REG_DWORD /d 1 /f`, 'Windows');
  await click('Verificar estado do alvo', 'Confirmar configuração Windows');
  await text('Tentativa atual: 4/4');
  await reload();
  await text('Cenário importado');
  await text('Tentativa atual: 4/4');

  await evaluate(`(() => {
    const store = Storage.prototype.setItem;
    window.restoreWinlinxStorage = () => { Storage.prototype.setItem = store; };
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('winlinx_lab_workspace_v2:lab:')) throw new DOMException('Teste', 'QuotaExceededError');
      return store.call(this, key, value);
    };
  })()`);
  await terminal('echo registro-salvo-apos-repetir');
  await text('Não foi possível salvar a tentativa nesta aba');
  await evaluate('window.restoreWinlinxStorage()');
  await click('Tentar salvar novamente');
  await waitFor(() => evaluate(`!document.body.innerText.includes('Não foi possível salvar a tentativa nesta aba')`), 'salvamento repetido');

  await evaluate(`sessionStorage.setItem('winlinx_lab_workspace_v2:lab:lab-permissions-dacl', '{inválido')`);
  await reload();
  await text('Parte dos dados salvos estava indisponível');
  await text('Cenário importado');
  await text('Tentativa atual: 4/4');
  await click('Logs forenses');
  await click('Linux Auditd / Auth');
  await text('registro-salvo-apos-repetir');
  await evaluate('sessionStorage.clear()');
  await reload();
  await click('Labs');
  await click('Abrir histórico de tentativas');
  await text('Cenário importado');
  await click('Exportar dossiê arquivado');
  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  const blueprint = {
    version: 1,
    lab: { title: 'Laboratório versionado', description: 'Controle de revisão', difficulty: 'Iniciante',
      tasks: [{id: 'tarefa', title: 'Executar comando esperado', targetOS: 'linux', validationCommand: 'pwd'}] }
  };
  await fill('#lab-package', JSON.stringify(blueprint));
  await click('Importar para editar');
  await click('Salvar rascunho local');
  await text('Rascunho salvo na biblioteca local.');
  await reload();
  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  await click('Reabrir rascunho');
  await text('Editar tarefas importadas');
  await click('Publicar revisão local');
  await text('Versão 1 publicada no catálogo local.');
  await click('Executar versão 1');
  await text('Laboratório versionado · versão 1');
  await terminal('echo tentativa-iniciada-na-v1');

  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  await fill('#builder-task-0', JSON.stringify({ ...blueprint.lab.tasks[0], validationCommand: 'whoami' }));
  await click('Publicar revisão local');
  await text('Versão 2 publicada no catálogo local.');
  await click('Executar versão 1');
  await text('Laboratório versionado · versão 1');
  await terminal('whoami');
  await text('Tentativa atual: 0/1');
  await terminal('pwd');
  await text('Tentativa atual: 1/1');
  await text('Dossiê guardado no histórico deste navegador.');
  await evaluate(`(() => {
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => {
      window.libraryExport = blob.text().then(JSON.parse);
      return create(blob);
    };
  })()`);
  await click('Exportar evidências da tentativa');
  const libraryReport = (await send('Runtime.evaluate', {
    expression: 'window.libraryExport', awaitPromise: true, returnByValue: true
  })).result.value;
  assert.equal(libraryReport.publication.version, 1);
  assert.ok(libraryReport.logs.some(log => log.commandLine?.includes('tentativa-iniciada-na-v1')));

  await click('Dashboard de Módulos');
  await click('Lab Builder (CTF)');
  await click('Executar versão 2');
  await text('Laboratório versionado · versão 2');
  await text('Tentativa atual: 0/1');
  await terminal('pwd');
  await text('Tentativa atual: 0/1');
  await terminal('whoami');
  await text('Tentativa atual: 1/1');
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
