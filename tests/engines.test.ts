import test from 'node:test';
import assert from 'node:assert';
import { LinuxSimulatorEngine } from '../src/core/linuxEngine.ts';
import { WindowsSimulatorEngine } from '../src/core/windowsEngine.ts';
import { createInitialLinuxFS, createInitialWindowsFS } from '../src/core/defaultFileSystem.ts';

test('Linux Simulator: Navegação, VFS e I/O Redirection', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  assert.strictEqual(engine.getCurrentDir(), '/home/aluno');
  assert.strictEqual(engine.getCurrentUser(), 'aluno');

  const touchRes = engine.execute('touch /home/aluno/teste.txt');
  assert.strictEqual(touchRes.exitCode, 0);

  const echoRes = engine.execute('echo "secret data 123" > /home/aluno/teste.txt');
  assert.strictEqual(echoRes.exitCode, 0);

  const catRes = engine.execute('cat /home/aluno/teste.txt');
  assert.strictEqual(catRes.exitCode, 0);
  assert.strictEqual(catRes.output, 'secret data 123');

  assert.ok(catRes.syscalls && catRes.syscalls.length > 0);
  assert.ok(catRes.syscalls.some(s => s.syscall.includes('openat')));
});

test('Linux Simulator: Detecção de Processos & Kill com Syscall', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  const psRes = engine.execute('ps aux');
  assert.ok(psRes.output.includes('kworker_rev'));

  const killRes = engine.execute('kill -9 1337');
  assert.strictEqual(killRes.exitCode, 0);
  assert.ok(killRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_MALICIOUS_PROCESS_KILLED'));

  const ssRes = engine.execute('ss -tulpn');
  assert.ok(!ssRes.output.includes('kworker_rev'));
});

test('Linux Simulator: Firewall Netfilter & UFW Rule', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // Bloqueio de porta maliciosa C2 (4444)
  const ufwRes = engine.execute('ufw deny 4444');
  assert.strictEqual(ufwRes.exitCode, 0);
  assert.ok(ufwRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_FIREWALL_NETFILTER_BLOCKED_4444'));

  // Confirmação que a porta 4444 foi removida de ss
  const ssRes = engine.execute('ss -tulpn');
  assert.ok(!ssRes.output.includes('4444'));
});

test('Windows Simulator: DACL, Processos e EDR Alerts', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  const whoamiRes = engine.execute('whoami /priv');
  assert.strictEqual(whoamiRes.exitCode, 0);
  assert.ok(whoamiRes.edrAlerts && whoamiRes.edrAlerts.length > 0);
  assert.strictEqual(whoamiRes.edrAlerts[0].mitreId, 'T1087.001');

  const stopRes = engine.execute('Stop-Process -Id 4992');
  assert.strictEqual(stopRes.exitCode, 0);
  assert.ok(stopRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_MALICIOUS_PROCESS_TERMINATED'));

  const icaclsRes = engine.execute('icacls "C:\\Program Files\\Custom App"');
  assert.ok(icaclsRes.output.includes('BUILTIN\\Users:(M,W,R)'));

  const fixRes = engine.execute('icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"');
  assert.strictEqual(fixRes.exitCode, 0);
  assert.ok(fixRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_ICACLS_REMEDIATED'));
});

test('Windows Simulator: Registro reg.exe e Hardening RunAsPPL', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  const queryRes = engine.execute('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa"');
  assert.strictEqual(queryRes.exitCode, 0);
  assert.ok(queryRes.output.includes('RunAsPPL'));

  // Ativação de PPL para proteção do LSASS
  const addRes = engine.execute('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f');
  assert.strictEqual(addRes.exitCode, 0);
  assert.ok(addRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_LSA_RUNASPPL_ACTIVATED'));
});

test('Windows Simulator: Firewall netsh advfirewall Rule', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Bloqueio de porta 8089 via netsh
  const firewallRes = engine.execute('netsh advfirewall firewall add rule name="Block 8089" dir=in action=block protocol=TCP localport=8089');
  assert.strictEqual(firewallRes.exitCode, 0);
  assert.ok(firewallRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_FIREWALL_RULE_APPLIED_8089'));

  // Confirmação que a porta 8089 foi removida de netstat
  const netstatRes = engine.execute('netstat -ano');
  assert.ok(!netstatRes.output.includes('8089'));
});
