import type { OSProcess } from '../types/simulator';

export function parseTcpPort(value: string): number | null {
  const normalized = value.trim();
  const port = Number(normalized);
  return /^\d{1,5}$/.test(normalized) && port >= 1 && port <= 65535 ? port : null;
}

export function assessInboundTcp(
  port: number,
  firewall: { active: boolean; blockedPorts: readonly number[] },
  processes: readonly OSProcess[]
) {
  const listener = processes.find(process => process.status !== 'stopped' && process.networkPort === port);
  const blocked = firewall.active && firewall.blockedPorts.includes(port);

  return {
    listener,
    outcome: blocked ? 'filtered' : listener ? 'open' : 'closed'
  } as const;
}
