import assert from 'node:assert/strict';
import test from 'node:test';
import { cortexId, CortexError, type TaskSpec } from '../packages/core/src/index.js';
import { TaskGraph } from '../packages/core/src/task-graph.js';
import { DefaultPolicy as Policy } from '../packages/core/src/policy.js';
import { InMemoryEventBus } from '../packages/event-bus/src/index.js';
import { makeEvent } from '../packages/protocol/src/index.js';

const task = (id: ReturnType<typeof cortexId>, dependsOn: ReturnType<typeof cortexId>[] = []): TaskSpec => ({
  id, title: 'Test task', objective: 'Test objective', workspaceId: cortexId('ws'), status: 'pending', dependsOn,
  budget: { maxToolCalls: 2 }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});

test('event bus publishes, filters, and retains history', async () => {
  const bus = new InMemoryEventBus();
  const seen: string[] = [];
  const sub = bus.subscribe({ type: 'TaskCreated' }, event => { seen.push(event.type); });
  await bus.publish(makeEvent('TaskCreated', { title: 'x', objective: 'y', workspaceId: cortexId('ws') }));
  await bus.publish(makeEvent('ErrorRaised', { code: 'E', message: 'bad', recoverable: false }));
  assert.deepEqual(seen, ['TaskCreated']);
  assert.equal(bus.history({ type: 'ErrorRaised' }).length, 1);
  assert.equal(bus.unsubscribe(sub), true);
});

test('task graph exposes only dependency-ready tasks and enforces transitions', () => {
  const graph = new TaskGraph();
  const first = cortexId('task'); const second = cortexId('task');
  graph.add(task(first)); graph.add(task(second, [first]));
  assert.equal(graph.listReady().length, 1);
  graph.transition(first, 'running'); graph.transition(first, 'completed');
  assert.equal(graph.listReady()[0]?.id, second);
  assert.throws(() => graph.transition(first, 'running'), (error: unknown) => error instanceof CortexError && error.code === 'INVALID_TRANSITION');
});

test('policy denies tools, out-of-scope paths, destructive actions, and exhausted budgets', () => {
  const policy = new Policy(new Set(['terminal']), ['/workspace/'], false);
  policy.evaluate({ tool: 'terminal', path: '/workspace/app.ts', budget: { maxToolCalls: 2 }, callsUsed: 0 });
  assert.throws(() => policy.evaluate({ tool: 'browser' }), /Tool browser is not permitted/);
  assert.throws(() => policy.evaluate({ tool: 'terminal', path: '/etc/passwd' }), /outside the policy scope/);
  assert.throws(() => policy.evaluate({ tool: 'terminal', destructive: true }), /Destructive operation/);
  assert.throws(() => policy.evaluate({ tool: 'terminal', budget: { maxToolCalls: 1 }, callsUsed: 1 }), /Maximum tool calls/);
});
