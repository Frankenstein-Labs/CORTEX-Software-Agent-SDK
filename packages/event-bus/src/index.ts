import type { CortexEvent, EventType } from '../../protocol/src/index.js';

export type EventFilter = { type?: EventType; taskId?: string; agentId?: string };
export type EventHandler = (event: CortexEvent) => void | Promise<void>;

const matches = (event: CortexEvent, filter: EventFilter): boolean =>
  (!filter.type || event.type === filter.type) &&
  (!filter.taskId || event.taskId === filter.taskId) &&
  (!filter.agentId || event.agentId === filter.agentId);

export interface EventBus {
  publish(event: CortexEvent): Promise<void>;
  subscribe(filter: EventFilter, handler: EventHandler): string;
  unsubscribe(subscriptionId: string): boolean;
  stream(filter?: EventFilter): AsyncIterable<CortexEvent>;
  history(filter?: EventFilter): readonly CortexEvent[];
}

export class InMemoryEventBus implements EventBus {
  private readonly events: CortexEvent[] = [];
  private readonly subscriptions = new Map<string, { filter: EventFilter; handler: EventHandler }>();
  private readonly waiters = new Set<(event: CortexEvent) => void>();

  async publish(event: CortexEvent): Promise<void> {
    this.events.push(event);
    const handlers = [...this.subscriptions.values()]
      .filter(subscription => matches(event, subscription.filter))
      .map(subscription => subscription.handler(event));
    for (const resolve of this.waiters) resolve(event);
    this.waiters.clear();
    await Promise.all(handlers);
  }

  subscribe(filter: EventFilter, handler: EventHandler): string {
    const id = crypto.randomUUID();
    this.subscriptions.set(id, { filter, handler });
    return id;
  }

  unsubscribe(subscriptionId: string): boolean { return this.subscriptions.delete(subscriptionId); }

  history(filter: EventFilter = {}): readonly CortexEvent[] {
    return this.events.filter(event => matches(event, filter));
  }

  async *stream(filter: EventFilter = {}): AsyncIterable<CortexEvent> {
    let cursor = 0;
    while (true) {
      while (cursor < this.events.length) {
        const event = this.events[cursor++];
        if (event && matches(event, filter)) yield event;
      }
      const event = await new Promise<CortexEvent>(resolve => this.waiters.add(resolve));
      cursor = this.events.length;
      if (matches(event, filter)) yield event;
    }
  }
}
