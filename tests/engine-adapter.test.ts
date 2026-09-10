import assert from 'node:assert/strict';
import test from 'node:test';
import { cortexId, type AgentCapability, type CortexId, type TaskSpec } from '../packages/core/src/index.js';
import { EngineRegistry, type EngineAdapter, type EngineContext, type EngineSession } from '../packages/engine-adapters/src/index.js';

class FakeAdapter implements EngineAdapter {
  readonly name = 'fake';
  private readonly sessions = new Map<CortexId, EngineSession>();
  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
  getCapabilities(): AgentCapability { return { engine: this.name, tools: ['terminal'], supportsPause: true, supportsStreaming: true }; }
  async createSession(task: TaskSpec, _context: EngineContext): Promise<EngineSession> {
    const session = { id: cortexId('session'), taskId: task.id, engine: this.name, status: 'created' as const };
    this.sessions.set(session.id, session); return session;
  }
  async execute(sessionId: CortexId, _instruction: string): Promise<void> { const s = this.sessions.get(sessionId); if (s) s.status = 'running'; }
  async *streamEvents(_sessionId: CortexId) {}
  async cancel(sessionId: CortexId, _reason: string): Promise<void> { const s = this.sessions.get(sessionId); if (s) s.status = 'cancelled'; }
  async pause(sessionId: CortexId): Promise<void> { const s = this.sessions.get(sessionId); if (s) s.status = 'paused'; }
  async resume(sessionId: CortexId): Promise<void> { const s = this.sessions.get(sessionId); if (s) s.status = 'running'; }
  async getStatus(sessionId: CortexId): Promise<EngineSession> { return this.sessions.get(sessionId)!; }
}

test('EngineRegistry keeps external engines behind a neutral adapter contract', async () => {
  const registry = new EngineRegistry();
  const adapter = new FakeAdapter();
  registry.register(adapter);
  assert.deepEqual(registry.list(), ['fake']);
  assert.throws(() => registry.register(adapter), /already registered/);
  const task = { id: cortexId('task'), title: 'x', objective: 'y', workspaceId: cortexId('ws'), status: 'pending' as const, dependsOn: [], budget: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const session = await registry.get('fake').createSession(task, { workspaceId: task.workspaceId });
  await adapter.execute(session.id, 'run');
  assert.equal((await adapter.getStatus(session.id)).status, 'running');
  await adapter.cancel(session.id, 'test');
  assert.equal((await adapter.getStatus(session.id)).status, 'cancelled');
});
