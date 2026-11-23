import test from 'node:test';
import assert from 'node:assert';
import { LinuxSimulatorEngine } from '../src/core/linuxEngine.ts';
import { WindowsSimulatorEngine } from '../src/core/windowsEngine.ts';
import { createInitialLinuxFS, createInitialWindowsFS } from '../src/core/defaultFileSystem.ts';

test('Linux Simulator: Navegação, VFS e I/O Redirection', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // Teste de pwd e whoami
  assert.strictEqual(engine.getCurrentDir(), '/home/aluno');
  assert.strictEqual(engine.getCurrentUser(), 'aluno');

  // Teste de criação de arquivo via touch
  const touchRes = engine.execute('touch /home/aluno/teste.txt');
  assert.strictEqual(touchRes.exitCode, 0);

  // Teste de escrita via redirecionamento echo >
  const echoRes = engine.execute('echo "secret data 123" > /home/aluno/teste.txt');
  assert.strictEqual(echoRes.exitCode, 0);

  // Teste de leitura via cat
  const catRes = engine.execute('cat /home/aluno/teste.txt');
  assert.strictEqual(catRes.exitCode, 0);
  assert.strictEqual(catRes.output, 'secret data 123');

  // Teste de captura de Syscalls
  assert.ok(catRes.syscalls && catRes.syscalls.length > 0);
  assert.ok(catRes.syscalls.some(s => s.syscall.includes('openat')));
});

test('Linux Simulator: Detecção de Processos & Kill com Syscall', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // Processo malicioso deve existir inicialmente
  const psRes = engine.execute('ps aux');
  assert.ok(psRes.output.includes('kworker_rev'));

  // Mata o processo malicioso
  const killRes = engine.execute('kill -9 1337');
  assert.strictEqual(killRes.exitCode, 0);
  assert.ok(killRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_MALICIOUS_PROCESS_KILLED'));

  // Verifica que socket não aparece mais em ss
  const ssRes = engine.execute('ss -tulpn');
  assert.ok(!ssRes.output.includes('kworker_rev'));
});

test('Windows Simulator: DACL, Processos e EDR Alerts', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Teste de whoami /priv e EDR alert
  const whoamiRes = engine.execute('whoami /priv');
  assert.strictEqual(whoamiRes.exitCode, 0);
  assert.ok(whoamiRes.edrAlerts && whoamiRes.edrAlerts.length > 0);
  assert.strictEqual(whoamiRes.edrAlerts[0].mitreId, 'T1087.001');

  // Teste de finalização de processo suspeito
  const stopRes = engine.execute('Stop-Process -Id 4992');
  assert.strictEqual(stopRes.exitCode, 0);
  assert.ok(stopRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_MALICIOUS_PROCESS_TERMINATED'));

  // Teste de auditoria de DACL e remediação
  const icaclsRes = engine.execute('icacls "C:\\Program Files\\Custom App"');
  assert.ok(icaclsRes.output.includes('BUILTIN\\Users:(M,W,R)'));

  const fixRes = engine.execute('icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"');
  assert.strictEqual(fixRes.exitCode, 0);
  assert.ok(fixRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_ICACLS_REMEDIATED'));
});
