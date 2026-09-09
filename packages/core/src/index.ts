export type CortexId = string & { readonly __brand: 'CortexId' };

export const cortexId = (prefix: string): CortexId =>
  `${prefix}_${crypto.randomUUID()}` as CortexId;

export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type AgentRole = 'architect' | 'developer' | 'designer' | 'researcher' | 'tester' | 'reviewer' | 'security' | 'debugger' | 'devops' | 'explorer';

export interface TaskBudget {
  maxTokens?: number;
  maxRuntimeMs?: number;
  maxToolCalls?: number;
  maxCostCents?: number;
}

export interface TaskSpec {
  id: CortexId;
  title: string;
  objective: string;
  workspaceId: CortexId;
  status: TaskStatus;
  dependsOn: CortexId[];
  assignedAgent?: CortexId;
  budget: TaskBudget;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCapability {
  engine: string;
  tools: string[];
  supportsPause: boolean;
  supportsStreaming: boolean;
}

export interface AgentSpec {
  id: CortexId;
  role: AgentRole;
  name: string;
  capabilities: AgentCapability;
}

export type ArtifactKind = 'code' | 'file' | 'design' | 'screenshot' | 'report';

export interface Artifact {
  id: CortexId;
  kind: ArtifactKind;
  taskId: CortexId;
  uri: string;
  sha256?: string;
  metadata: Record<string, string>;
  createdAt: string;
}

export class CortexError extends Error {
  constructor(public readonly code: string, message: string, public readonly details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'CortexError';
  }
}

export const nowIso = (): string => new Date().toISOString();

export { TaskGraph } from './task-graph.js';
export { DefaultPolicy } from './policy.js';
