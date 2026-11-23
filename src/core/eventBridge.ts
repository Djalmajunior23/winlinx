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

export class WinLinxEventBridge {
  private static instance: WinLinxEventBridge;
  private isEmbedded: boolean;

  private constructor() {
    this.isEmbedded = typeof window !== 'undefined' && window.parent !== window;
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage.bind(this));
    }
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
      if (this.isEmbedded) {
        window.parent.postMessage(msg, '*');
      }
      // Também dispara evento local customizado para listeners dentro do app
      window.dispatchEvent(new CustomEvent('winlinx-event', { detail: msg }));
    } catch (e) {
      console.warn('Erro ao disparar postMessage no WinLinxEventBridge:', e);
    }
  }

  private handleIncomingMessage(event: MessageEvent) {
    if (!event.data || event.data.target !== 'WINLINX') return;
    console.log('[WinLinx EventBridge] Mensagem recebida da plataforma pai:', event.data);
  }
}
