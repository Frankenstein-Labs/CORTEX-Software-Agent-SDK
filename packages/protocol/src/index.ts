import type { AgentRole, CortexId, TaskStatus } from '../../core/src/index.js';

export const PROTOCOL_VERSION = 1 as const;

export type EventType =
  | 'TaskCreated' | 'TaskAssigned' | 'TaskStarted' | 'TaskCompleted' | 'TaskFailed'
  | 'AgentStarted' | 'AgentStopped' | 'AgentMessage' | 'ToolRequested' | 'ToolCompleted'
  | 'ArtifactCreated' | 'ReviewRequested' | 'ReviewCompleted' | 'ErrorRaised';

export interface CortexEvent<T extends EventType = EventType, P = unknown> {
  id: CortexId;
  version: typeof PROTOCOL_VERSION;
  type: T;
  timestamp: string;
  taskId?: CortexId;
  agentId?: CortexId;
  correlationId?: CortexId;
  payload: P;
}

export interface TaskCreatedPayload { title: string; objective: string; workspaceId: CortexId; }
export interface TaskStatusPayload { status: TaskStatus; reason?: string; }
export interface TaskAssignedPayload { agentId: CortexId; role: AgentRole; }
export interface ToolPayload { tool: string; input?: unknown; output?: unknown; }
export interface ErrorPayload { code: string; message: string; recoverable: boolean; }

export const makeEvent = <T extends EventType, P>(
  type: T,
  payload: P,
  ids: { taskId?: CortexId; agentId?: CortexId; correlationId?: CortexId } = {},
): CortexEvent<T, P> => ({
  id: `${type}_${crypto.randomUUID()}` as CortexId,
  version: PROTOCOL_VERSION,
  type,
  timestamp: new Date().toISOString(),
  ...ids,
  payload,
});
