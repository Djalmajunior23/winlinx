import { readCustomLabPackage } from '../src/core/customLabPackage';
import { createLabSession, incorrectEvidence, matchesLabObservation, verifyLabState } from '../src/core/labSession';
import { PRACTICAL_LABS } from '../src/data/labs';
import test from 'node:test';
import assert from 'node:assert';
import { assessInboundTcp, parseTcpPort } from '../src/core/networkDefense.ts';
import { DEFAULT_SIGMA_RULE, DEFAULT_YARA_RULE, evaluateSigma, evaluateYara } from '../src/core/detectionStudio.ts';
import { resolveParentOrigin } from '../src/core/eventBridge.ts';
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

test('Linux Simulator: Kernel Copilot (explain, hint), Capabilities e Logs Forenses auditd', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // Teste de Kernel Copilot 'explain'
  const explainRes = engine.execute('explain ptrace');
  assert.strictEqual(explainRes.exitCode, 0);
  assert.ok(explainRes.output.includes('ptrace(2)'));
  assert.ok(explainRes.output.includes('Ring 0'));

  // Teste de Dica 'hint'
  const hintRes = engine.execute('hint');
  assert.strictEqual(hintRes.exitCode, 0);
  assert.ok(hintRes.output.includes('Mentor Kernel WinLinx'));

  // Teste de Capabilities (Linux PrivEsc)
  const getcapRes = engine.execute('getcap -r /');
  assert.strictEqual(getcapRes.exitCode, 0);
  assert.ok(getcapRes.output.includes('cap_setuid+ep'));
  assert.ok(getcapRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_CAPABILITIES_DISCOVERED'));

  // Teste de Hardening de Capabilities
  const setcapRes = engine.execute('setcap -r /usr/bin/python3.11');
  assert.strictEqual(setcapRes.exitCode, 0);
  assert.ok(setcapRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_CAPABILITIES_HARDENED'));

  // Teste de Geração de Logs Forenses auditd e auth.log
  assert.ok(explainRes.forensicLogs && explainRes.forensicLogs.length > 0);
  assert.strictEqual(explainRes.forensicLogs[0].source, 'audit.log');
  assert.strictEqual(explainRes.forensicLogs[0].facility, 'SYSCALL');

  const sudoRes = engine.execute('sudo su -');
  assert.ok(sudoRes.forensicLogs && sudoRes.forensicLogs.some(l => l.source === 'auth.log'));
});

test('Windows Simulator: Kernel Copilot (explain, hint) e Logs Forenses Event ID 4688/4672', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Teste de Kernel Copilot 'explain'
  const explainRes = engine.execute('explain seimpersonate');
  assert.strictEqual(explainRes.exitCode, 0);
  assert.ok(explainRes.output.includes('SeImpersonatePrivilege'));
  assert.ok(explainRes.output.includes('PrintSpoofer'));

  // Teste de Dica 'hint'
  const hintRes = engine.execute('hint');
  assert.strictEqual(hintRes.exitCode, 0);
  assert.ok(hintRes.output.includes('Dica do Mentor Windows'));

  // Teste de Geração de Logs Forenses Windows Security.evtx (Event ID 4688)
  const tasklistRes = engine.execute('tasklist');
  assert.ok(tasklistRes.forensicLogs && tasklistRes.forensicLogs.length > 0);
  assert.strictEqual(tasklistRes.forensicLogs[0].source, 'Security.evtx');
  assert.strictEqual(tasklistRes.forensicLogs[0].eventId, 4688);

  // Teste de Event ID 4672 com whoami /priv
  const privRes = engine.execute('whoami /priv');
  assert.ok(privRes.forensicLogs && privRes.forensicLogs.some(l => l.eventId === 4672));
});

test('Linux Simulator: Sistemas de Arquivos POSIX, stat, Inodes e umask', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // Teste de stat em binário com Inode e permissões octais
  const statRes = engine.execute('stat /bin/find');
  assert.strictEqual(statRes.exitCode, 0);
  assert.ok(statRes.output.includes('Inode: 131452'));
  assert.ok(statRes.output.includes('Access: (4755/-rwsr-xr-x)'));
  assert.ok(statRes.syscalls && statRes.syscalls.some(s => s.syscall.includes('newfstatat')));
  assert.ok(statRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_STAT_INODE_AUDITED'));

  // Teste de ls com flag -i (Inode display)
  const lsiRes = engine.execute('ls -i /bin');
  assert.strictEqual(lsiRes.exitCode, 0);
  assert.ok(lsiRes.output.includes('131452 find'));

  // Teste de umask
  const umaskRes = engine.execute('umask');
  assert.strictEqual(umaskRes.exitCode, 0);
  assert.strictEqual(umaskRes.output, '0022');
});

test('Windows Simulator: Sistemas de Arquivos NTFS, Alternate Data Streams (ADS) e fsutil MFT', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Teste de dir /r listando Alternate Data Streams ($DATA)
  const dirRRes = engine.execute('dir /r C:\\Users\\Aluno\\Downloads');
  assert.strictEqual(dirRRes.exitCode, 0);
  assert.ok(dirRRes.output.includes('invoice.pdf:hidden_payload.ps1:$DATA'));
  assert.ok(dirRRes.output.includes('invoice.pdf:Zone.Identifier:$DATA'));
  assert.ok(dirRRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_NTFS_ADS_STREAM_DISCOVERED'));

  // Teste de leitura de Stream ADS individual com Get-Content -Stream
  const streamRes = engine.execute('Get-Content "C:\\Users\\Aluno\\Downloads\\invoice.pdf" -Stream hidden_payload.ps1');
  assert.strictEqual(streamRes.exitCode, 0);
  assert.ok(streamRes.output.includes('FLAG{WINLINX_NTFS_ADS_STREAM_DISCOVERED_2026}'));

  // Teste de fsutil fsinfo ntfsinfo C:
  const fsutilRes = engine.execute('fsutil fsinfo ntfsinfo C:');
  assert.strictEqual(fsutilRes.exitCode, 0);
  assert.ok(fsutilRes.output.includes('NTFS Version'));
  assert.ok(fsutilRes.output.includes('Mft Start Lcn'));
  assert.ok(fsutilRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_FSUTIL_MFT_AUDITED'));
});

test('Linux Simulator: IPC (mkfifo, ipcs), LKMs (lsmod, rmmod), Resgate e Script Runner', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());

  // 1. mkfifo
  const fifoRes = engine.execute('mkfifo /tmp/my_test_pipe');
  assert.strictEqual(fifoRes.exitCode, 0);
  assert.ok(fifoRes.output.includes('prwxr-xr-x'));
  assert.ok(fifoRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_MKFIFO_PIPE_CREATED_2026}'));

  // 2. lsmod e rmmod
  const lsmodRes = engine.execute('lsmod');
  assert.strictEqual(lsmodRes.exitCode, 0);
  assert.ok(lsmodRes.output.includes('rootkit_diamorphine'));

  const rmmodRes = engine.execute('rmmod rootkit_diamorphine');
  assert.strictEqual(rmmodRes.exitCode, 0);
  assert.ok(rmmodRes.output.includes('descarregado'));
  assert.ok(rmmodRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_LKM_ROOTKIT_NEUTRALIZED_2026}'));

  // 3. restore-files
  const restoreRes = engine.execute('restore-files');
  assert.strictEqual(restoreRes.exitCode, 0);
  assert.ok(restoreRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_RANSOMWARE_RECOVERED_2026}'));

  // 4. bash script runner
  engine.execute('echo "ls /home/aluno" > /home/aluno/script.sh');
  const bashRes = engine.execute('bash /home/aluno/script.sh');
  assert.strictEqual(bashRes.exitCode, 0);
  assert.ok(bashRes.output.includes('Script Runner'));
  assert.ok(bashRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_BASH_SCRIPT_EXECUTED_2026}'));
});

test('Windows Simulator: Named Pipes (\\\\.\\pipe\\), Kernel Drivers BYOVD (driverquery), Resgate e PowerShell Runner', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // 1. Named Pipes via dir \\.\pipe\
  const pipeRes = engine.execute('dir \\\\.\\pipe\\');
  assert.strictEqual(pipeRes.exitCode, 0);
  assert.ok(pipeRes.output.includes('spoolss'));
  assert.ok(pipeRes.output.includes('samr'));
  assert.ok(pipeRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_NAMED_PIPES_AUDITED_2026}'));

  // 2. driverquery (BYOVD detection)
  const driverRes = engine.execute('driverquery');
  assert.strictEqual(driverRes.exitCode, 0);
  assert.ok(driverRes.output.includes('gdrv.sys'));
  assert.ok(driverRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_BYOVD_DRIVER_AUDITED_2026}'));

  // 3. restore-files
  const restoreRes = engine.execute('restore-files');
  assert.strictEqual(restoreRes.exitCode, 0);
  assert.ok(restoreRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_RANSOMWARE_RECOVERED_2026}'));

  // 4. powershell script runner
  engine.execute('echo "whoami" > C:\\Users\\Aluno\\script.ps1');
  const pwshRes = engine.execute('powershell -File C:\\Users\\Aluno\\script.ps1');
  assert.strictEqual(pwshRes.exitCode, 0);
  assert.ok(pwshRes.output.includes('PowerShell Script Runner'));
  assert.ok(pwshRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_POWERSHELL_SCRIPT_EXECUTED_2026}'));
});

test('WinLinx Ultimate Range: Engenharia Reversa (readelf / dumpbin) & Kerberos AD (klist)', () => {
  const linuxEngine = new LinuxSimulatorEngine(createInitialLinuxFS());
  const windowsEngine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Linux readelf
  const readelfRes = linuxEngine.execute('readelf -h binary.elf');
  assert.strictEqual(readelfRes.exitCode, 0);
  assert.ok(readelfRes.output.includes('ELF Header'));
  assert.ok(readelfRes.output.includes('.text'));
  assert.ok(readelfRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_READELF_ELF_HEADER_AUDITED_2026}'));

  // Linux klist (Kerberos PAM/SSSD)
  const linuxKlistRes = linuxEngine.execute('klist');
  assert.strictEqual(linuxKlistRes.exitCode, 0);
  assert.ok(linuxKlistRes.output.includes('krbtgt/CORP.LOCAL@CORP.LOCAL'));
  assert.ok(linuxKlistRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_KERBEROS_KLIST_INSPECTED_2026}'));

  // Windows dumpbin (PE Sections & Entropy)
  const dumpbinRes = windowsEngine.execute('dumpbin /headers agent_implant.exe');
  assert.strictEqual(dumpbinRes.exitCode, 0);
  assert.ok(dumpbinRes.output.includes('PE SIGNATURE'));
  assert.ok(dumpbinRes.output.includes('HIGH ENTROPY'));
  assert.ok(dumpbinRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_DUMPBIN_PE_HEADER_AUDITED_2026}'));

  // Windows klist (Active Directory TGT)
  const winKlistRes = windowsEngine.execute('klist');
  assert.strictEqual(winKlistRes.exitCode, 0);
  assert.ok(winKlistRes.output.includes('krbtgt/CORP.LOCAL'));
  assert.ok(winKlistRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_KERBEROS_KLIST_AUDITED_2026}'));
});

test('WinLinx Fase 4: Forense de Memória (Volatility), YARA Hunting e Cloud/Docker Breakout', () => {
  const linuxEngine = new LinuxSimulatorEngine(createInitialLinuxFS());
  const windowsEngine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Linux Volatility (Ganchos de syscalls)
  const linVolRes = linuxEngine.execute('volatility -f memory.raw linux.check_syscall');
  assert.strictEqual(linVolRes.exitCode, 0);
  assert.ok(linVolRes.output.includes('HOOKED [diamorphine.ko]'));
  assert.ok(linVolRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_VOLATILITY_SYSCALL_HOOK_DETECTED_2026}'));

  // Linux YARA
  const linYaraRes = linuxEngine.execute('yara rules.yar /proc/1337/mem');
  assert.strictEqual(linYaraRes.exitCode, 0);
  assert.ok(linYaraRes.output.includes('Detect_CobaltStrike_Beacon_Injected'));
  assert.ok(linYaraRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_YARA_MEMORY_SCAN_MATCH_2026}'));

  // Linux Docker Escape
  const linDockerRes = linuxEngine.execute('docker run -it -v /:/host_fs ubuntu chroot /host_fs');
  assert.strictEqual(linDockerRes.exitCode, 0);
  assert.ok(linDockerRes.output.includes('Container escape efetuado com sucesso'));
  assert.ok(linDockerRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_DOCKER_CONTAINER_ESCAPE_2026}'));

  // Windows Volatility (malfind)
  const winVolRes = windowsEngine.execute('vol -f memory.raw windows.malfind');
  assert.strictEqual(winVolRes.exitCode, 0);
  assert.ok(winVolRes.output.includes('PAGE_EXECUTE_READWRITE'));
  assert.ok(winVolRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_VOLATILITY_MALFIND_DETECTED_2026}'));

  // Windows YARA
  const winYaraRes = windowsEngine.execute('yara64 rule.yar C:\\Windows\\System32');
  assert.strictEqual(winYaraRes.exitCode, 0);
  assert.ok(winYaraRes.output.includes('Detect_CobaltStrike_Beacon_Injected'));
  assert.ok(winYaraRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_YARA_SCAN_MATCHED_2026}'));
});

test('WinLinx Fase 5: Quebra de Credenciais (Hashcat), Firmware Forensics (Binwalk) e SCADA OT (Modbus)', () => {
  const linuxEngine = new LinuxSimulatorEngine(createInitialLinuxFS());
  const windowsEngine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Linux Hashcat
  const linHashRes = linuxEngine.execute('hashcat -m 1800 shadow.txt rockyou.txt');
  assert.strictEqual(linHashRes.exitCode, 0);
  assert.ok(linHashRes.output.includes('Aluno@2026!'));
  assert.ok(linHashRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_HASHCAT_SHADOW_CRACKED_2026}'));

  // Linux Binwalk
  const binwalkRes = linuxEngine.execute('binwalk -e firmware.bin');
  assert.strictEqual(binwalkRes.exitCode, 0);
  assert.ok(binwalkRes.output.includes('Squashfs filesystem'));
  assert.ok(binwalkRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_BINWALK_FIRMWARE_EXTRACTED_2026}'));

  // Linux Modbus
  const modbusRes = linuxEngine.execute('modbuscli -t 192.168.10.50 -f 5 -a 1');
  assert.strictEqual(modbusRes.exitCode, 0);
  assert.ok(modbusRes.output.includes('Injeção industrial concluída'));
  assert.ok(modbusRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_MODBUS_SCADA_INJECTED_2026}'));

  // Windows Hashcat
  const winHashRes = windowsEngine.execute('hashcat64 -m 1000 ntlm.hash rockyou.txt');
  assert.strictEqual(winHashRes.exitCode, 0);
  assert.ok(winHashRes.output.includes('Password123'));
  assert.ok(winHashRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_HASHCAT_NTLM_CRACKED_2026}'));

  // Windows Modbus
  const winModbusRes = windowsEngine.execute('modbus -h 192.168.10.50 -c 1');
  assert.strictEqual(winModbusRes.exitCode, 0);
  assert.ok(winModbusRes.output.includes('Coil override complete'));
  assert.ok(winModbusRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_MODBUS_OVERRIDE_2026}'));
});

test('WinLinx Fase 6: Observabilidade & Defesa de Kernel (eBPF, Falco, ETW-Ti e CanaryTokens)', () => {
  const linuxEngine = new LinuxSimulatorEngine(createInitialLinuxFS());
  const windowsEngine = new WindowsSimulatorEngine(createInitialWindowsFS());

  // Linux bpftool (eBPF Probes)
  const bpfRes = linuxEngine.execute('bpftool prog show');
  assert.strictEqual(bpfRes.exitCode, 0);
  assert.ok(bpfRes.output.includes('kprobe'));
  assert.ok(bpfRes.output.includes('tracepoint'));
  assert.ok(bpfRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_BPFTOOL_PROG_AUDITED_2026}'));

  // Linux Falco (Runtime Security)
  const falcoRes = linuxEngine.execute('falco -c /etc/falco/falco.yaml');
  assert.strictEqual(falcoRes.exitCode, 0);
  assert.ok(falcoRes.output.includes('Shell spawned in container'));
  assert.ok(falcoRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_LINUX_FALCO_CONTAINER_ALERT_2026}'));

  // Windows logman (ETW-Ti)
  const logmanRes = windowsEngine.execute('logman start WinLinx-ETW-Ti-Session');
  assert.strictEqual(logmanRes.exitCode, 0);
  assert.ok(logmanRes.output.includes('Microsoft-Windows-Threat-Intelligence'));
  assert.ok(logmanRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_LOGMAN_ETW_SESSION_2026}'));

  // Windows CanaryToken (Cyber Deception)
  const canaryRes = windowsEngine.execute('canarytoken --generate --type aws');
  assert.strictEqual(canaryRes.exitCode, 0);
  assert.ok(canaryRes.output.includes('AKIAEXAMPLEFAKEHONEY2026'));
  assert.ok(canaryRes.stateChanges?.flagDiscovered?.includes('FLAG{WINLINX_WINDOWS_CANARY_TOKEN_ARMED_2026}'));
});

test('Lab de permissões Linux: a evidência acompanha o bit SUID de /bin/find', () => {
  const engine = new LinuxSimulatorEngine(createInitialLinuxFS());
  assert.ok(engine.hasFindSetuid());
  assert.ok(engine.execute('find / -perm -4000 2>/dev/null').stateChanges?.flagDiscovered);
  assert.equal(engine.execute('echo /bin/find').stateChanges?.flagDiscovered, undefined);
  assert.equal(engine.execute('chmod 755 /bin/ls').stateChanges?.flagDiscovered, undefined);
  assert.equal(engine.execute('chmod errado /bin/find').exitCode, 1);
  assert.ok(engine.hasFindSetuid());

  const fix = engine.execute('sudo chmod -s /bin/find');
  assert.equal(fix.exitCode, 0);
  assert.deepEqual(fix.stateChanges?.filesModified, ['/bin/find']);
  assert.ok(fix.forensicLogs?.some(log => log.details.includes('bit SUID desativado')));
  assert.equal(engine.hasFindSetuid(), false);
  assert.doesNotMatch(engine.execute('find / -perm -4000').output, /\/bin\/find/);

  engine.execute('chmod 4755 /bin/find');
  assert.ok(engine.hasFindSetuid());
});

test('Lab de permissões Windows: a evidência exige o caminho e grupo corretos', () => {
  const engine = new WindowsSimulatorEngine(createInitialWindowsFS());
  const target = '"C:\\Program Files\\Custom App"';
  assert.ok(engine.hasCustomAppWritableDacl());
  assert.equal(engine.execute(`icacls ${target} /remove "BUILTIN\\Administrators"`).exitCode, 1);
  assert.equal(engine.execute(`icacls "${target.slice(1, -1)}\\service.exe" /remove "BUILTIN\\Users"`).exitCode, 1);
  assert.ok(engine.hasCustomAppWritableDacl());

  const fix = engine.execute(`icacls ${target} /remove "BUILTIN\\Users"`);
  assert.equal(fix.exitCode, 0);
  assert.ok(fix.forensicLogs?.some(log => log.eventId === 4670));
  assert.equal(engine.hasCustomAppWritableDacl(), false);
  const query = engine.execute(`icacls ${target}`);
  assert.equal(query.stateChanges?.flagDiscovered, undefined);
  assert.doesNotMatch(query.output, /BUILTIN\\Users/);
});

test('A sonda TCP distingue porta aberta, fechada e filtrada e rejeita entradas inválidas', () => {
  const linux = new LinuxSimulatorEngine(createInitialLinuxFS());
  const probe = (port: number) => assessInboundTcp(port, linux.getFirewallStatus(), linux.getProcesses());
  assert.equal(probe(4444).outcome, 'open');
  assert.equal(probe(65535).outcome, 'closed');
  assert.equal(linux.execute('ufw deny 4444xyz').exitCode, 1);
  assert.equal(probe(4444).outcome, 'open');
  assert.equal(linux.execute('ufw deny 4444').exitCode, 0);
  assert.equal(probe(4444).outcome, 'filtered');
  assert.ok(probe(4444).listener);

  const windows = new WindowsSimulatorEngine(createInitialWindowsFS());
  const rule = 'netsh advfirewall firewall add rule name="WinLinx" dir=in protocol=TCP localport=8089';
  assert.equal(windows.execute(rule + ' action=allow').exitCode, 1);
  assert.equal(windows.execute(rule + ' action=block').exitCode, 0);
  assert.equal(assessInboundTcp(8089, windows.getFirewallStatus(), windows.getProcesses()).outcome, 'filtered');
  for (const input of ['0', '65536', '8089abc', '8.5', '-2']) {
    assert.equal(parseTcpPort(input), null);
  }
});

test('O estúdio avalia regras editadas e distingue ausência de correspondência de erro', () => {
  assert.deepEqual(evaluateYara(DEFAULT_YARA_RULE).matches, ['anexo-sintetico.bin']);
  assert.deepEqual(evaluateYara(DEFAULT_YARA_RULE.replace('DEMO_MARKER', 'AUSENTE')).matches, []);
  assert.ok(evaluateYara(DEFAULT_YARA_RULE.replace('all of them', '$inexistente')).error);
  assert.equal(evaluateSigma(DEFAULT_SIGMA_RULE).matches?.length, 1);
  assert.deepEqual(evaluateSigma(DEFAULT_SIGMA_RULE.replace('cl Application', 'ausente')).matches, []);
  assert.ok(evaluateSigma(DEFAULT_SIGMA_RULE.replace('contains', 'regex')).error);
});

test('A ponte de iframe aceita somente origens HTTP(S) explícitas', () => {
  const origin = 'https://winlinx.example';
  assert.equal(resolveParentOrigin(origin), origin);
  assert.equal(resolveParentOrigin(origin, 'https://academy.example:8443'), 'https://academy.example:8443');
  for (const invalid of ['*', 'null', 'https://academy.example/path', 'https://user@academy.example', 'data:text/plain,test']) {
    assert.equal(resolveParentOrigin(origin, invalid), null);
  }
});

test('Tentativas mantêm máquinas, observações e evidências isoladas', () => {
  const first = createLabSession();
  const second = createLabSession();
  const lab = PRACTICAL_LABS.find(item => item.id === 'lab-processes-memory')!;
  const task = lab.tasks.find(item => item.verify === 'linux-tcp-filtered')!;
  for (const required of task.requires ?? []) first.completed.add(required);
  assert.equal(verifyLabState(task, first).passed, false);
  first.linux.execute('ufw deny 4445');
  assert.equal(verifyLabState(task, first).passed, false);
  first.linux.execute('ufw deny 4444');
  assert.equal(verifyLabState(task, first).passed, true);
  assert.equal(verifyLabState(task, second).passed, false);
  assert.deepEqual(second.linux.getFirewallStatus().blockedPorts, []);
  const observation = lab.tasks.find(item => item.id === 'task-proc-linux-net')!;
  const alternative = 'netstat -tulpn';
  assert.equal(matchesLabObservation(observation, 'linux', alternative, second.linux.execute(alternative)), true);
  assert.deepEqual(incorrectEvidence(observation, ['4445', 'kworker_rev']), ['Porta TCP em escuta']);
  assert.deepEqual(incorrectEvidence(observation, ['4444', 'kworker_rev']), []);
});

test('Remediações do serviço e das políticas exigem o alvo correto e podem ser relidas', () => {
  const { linux, windows } = createLabSession();
  assert.equal(windows.execute('sc qc desconhecido').exitCode, 1);
  assert.equal(windows.hasQuotedUpdaterPath(), false);
  assert.equal(windows.execute(`sc config WinVulnerableUpdater binPath= '"C:\\Program Files\\Custom App\\service.exe"'`).exitCode, 0);
  assert.equal(windows.hasQuotedUpdaterPath(), true);
  assert.ok(windows.execute('sc qc WinVulnerableUpdater').output.includes('"C:\\Program Files\\Custom App\\service.exe"'));
  assert.match(windows.execute('sc query WinVulnerableUpdater').output, /RUNNING/);
  assert.equal(windows.execute('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa" /v runasppl /t REG_DWORD /d 1 /f').exitCode, 0);
  assert.equal(windows.isLsaPplConfigured(), true);
  assert.equal(linux.execute('sudo visudo --require-password outra').exitCode, 1);
  assert.equal(linux.requiresSudoPasswordForStudent(), false);
  assert.equal(linux.execute('sudo visudo --require-password aluno').exitCode, 0);
  assert.equal(linux.requiresSudoPasswordForStudent(), true);
  assert.match(linux.execute('cat /etc/sudoers').output, /PASSWD: \/usr\/bin\/apt-get/);
});

test('Pacotes personalizados validam versão e preservam múltiplas tarefas', () => {
  const source = {
    version: 1, lab: { title: 'Teste', description: 'Cenário', difficulty: 'Iniciante',
      tasks: [
        { title: 'Identidade', targetOS: 'linux', validationCommand: 'whoami' },
        { title: 'Diretório', targetOS: 'windows', validationCommand: 'cd' }
      ] }
  };
  assert.throws(() => readCustomLabPackage(JSON.stringify({ ...source, version: 2 })), /versão/);
  const lab = readCustomLabPackage(JSON.stringify(source));
  assert.equal(lab.tasks.length, 2);
  assert.notEqual(lab.tasks[0].id, lab.tasks[1].id);
  assert.notEqual(lab.id, readCustomLabPackage(JSON.stringify(source)).id);
});

test('Fontes de evidência dos Labs 02 a 05 correspondem aos registros da tentativa', () => {
  for (const lab of PRACTICAL_LABS.slice(1)) {
    const session = createLabSession();
    for (const task of lab.tasks.filter(item => item.evidence?.length)) {
      const os = task.targetOS === 'windows' ? 'windows' : 'linux';
      for (const command of [task.validationCommand!, ...(task.alternativeCommands ?? [])]) {
        const result = session[os].execute(command);
        assert.ok(matchesLabObservation(task, os, command, result), task.id + ' ' + command);
        for (const field of task.evidence ?? []) assert.ok(result.output.toLowerCase().includes(field.expected.toLowerCase()), task.id + ' ' + field.label);
        assert.equal(matchesLabObservation(task, os, command + ' argumento-extra', result), false);
      }
    }
  }
});
