/**
 * WinLinx Event Bridge - Módulo de Integração Inter-Sistemas
 * Permite a comunicação segura entre o WinLinx e plataformas do ecossistema
 * como CiberLab Academy e CiberSim via postMessage API.
 */

export interface WinLinxMessage {
  source: 'WINLINX';
  type: 
    | 'WINLINX_READY'
    | 'WINLINX_TASK_COMPLETED'
    | 'WINLINX_FLAG_CAPTURED'
    | 'WINLINX_LAB_FINISHED'
    | 'WINLINX_REQUEST_SYNC';
  payload: Record<string, unknown>;
  timestamp: string;
}

export function resolveParentOrigin(pageOrigin: string, configuredOrigin?: string): string | null {
  const value = configuredOrigin?.trim() || pageOrigin;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && value === url.origin ? url.origin : null;
  } catch {
    return null;
  }
}

export class WinLinxEventBridge {
  private static instance: WinLinxEventBridge;
  private readonly parentOrigin: string | null;

  private constructor() {
    this.parentOrigin = typeof window !== 'undefined' && window.parent !== window
      ? resolveParentOrigin(
        window.location.origin,
        document.querySelector<HTMLMetaElement>('meta[name="winlinx-parent-origin"]')?.content
      )
      : null;
  }

  public static getInstance(): WinLinxEventBridge {
    if (!WinLinxEventBridge.instance) {
      WinLinxEventBridge.instance = new WinLinxEventBridge();
    }
    return WinLinxEventBridge.instance;
  }

  public notifyReady() {
    this.send({
      source: 'WINLINX',
      type: 'WINLINX_READY',
      payload: { version: '1.0.0', status: 'initialized' },
      timestamp: new Date().toISOString()
    });
  }

  public notifyTaskCompleted(taskId: string, targetOS: string, flagReward?: string) {
    this.send({
      source: 'WINLINX',
      type: 'WINLINX_TASK_COMPLETED',
      payload: { taskId, targetOS, flagReward },
      timestamp: new Date().toISOString()
    });
  }

  public notifyFlagCaptured(flag: string) {
    this.send({
      source: 'WINLINX',
      type: 'WINLINX_FLAG_CAPTURED',
      payload: { flag },
      timestamp: new Date().toISOString()
    });
  }

  public notifyLabFinished(labId: string, durationSeconds?: number) {
    this.send({
      source: 'WINLINX',
      type: 'WINLINX_LAB_FINISHED',
      payload: { labId, durationSeconds },
      timestamp: new Date().toISOString()
    });
  }

  private send(msg: WinLinxMessage) {
    if (typeof window === 'undefined') return;
    try {
      if (this.parentOrigin) {
        window.parent.postMessage(msg, this.parentOrigin);
      }
      // Também dispara evento local customizado para listeners dentro do app
      window.dispatchEvent(new CustomEvent('winlinx-event', { detail: msg }));
    } catch (e) {
      console.warn('Erro ao disparar postMessage no WinLinxEventBridge:', e);
    }
  }
}
