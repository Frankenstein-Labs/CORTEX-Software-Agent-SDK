import type { AgentCapability, CortexId, TaskSpec } from '../../core/src/index.js';
import type { CortexEvent } from '../../protocol/src/index.js';

export interface EngineSession { id: CortexId; taskId: CortexId; engine: string; status: 'created' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'; }
export interface EngineContext { workspaceId: CortexId; policyId?: string; budget?: Record<string, number>; metadata?: Record<string, string>; }
export interface EngineAdapter {
  readonly name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getCapabilities(): AgentCapability;
  createSession(task: TaskSpec, context: EngineContext): Promise<EngineSession>;
  execute(sessionId: CortexId, instruction: string): Promise<void>;
  streamEvents(sessionId: CortexId): AsyncIterable<CortexEvent>;
  cancel(sessionId: CortexId, reason: string): Promise<void>;
  pause(sessionId: CortexId): Promise<void>;
  resume(sessionId: CortexId): Promise<void>;
  getStatus(sessionId: CortexId): Promise<EngineSession>;
}

export class EngineRegistry {
  private readonly adapters = new Map<string, EngineAdapter>();

  register(adapter: EngineAdapter): void {
    if (this.adapters.has(adapter.name)) throw new Error(`Engine adapter already registered: ${adapter.name}`);
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): EngineAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) throw new Error(`Engine adapter is not registered: ${name}`);
    return adapter;
  }

  list(): string[] { return [...this.adapters.keys()].sort(); }
}
