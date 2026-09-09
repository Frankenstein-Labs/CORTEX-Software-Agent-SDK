import { CortexError, type TaskBudget } from './index.js';

export interface PolicyContext {
  tool: string;
  path?: string;
  command?: string;
  destructive?: boolean;
  callsUsed?: number;
  budget?: TaskBudget;
}

export interface Policy {
  readonly allowedTools: ReadonlySet<string>;
  readonly allowedPathPrefixes: readonly string[];
  readonly allowDestructive: boolean;
  evaluate(context: PolicyContext): void;
}

export class DefaultPolicy implements Policy {
  constructor(
    public readonly allowedTools: ReadonlySet<string> = new Set(),
    public readonly allowedPathPrefixes: readonly string[] = [],
    public readonly allowDestructive = false,
  ) {}

  evaluate(context: PolicyContext): void {
    if (!this.allowedTools.has(context.tool)) throw new CortexError('TOOL_DENIED', `Tool ${context.tool} is not permitted`);
    if (context.path && !this.allowedPathPrefixes.some(prefix => context.path?.startsWith(prefix))) {
      throw new CortexError('PATH_DENIED', `Path ${context.path} is outside the policy scope`);
    }
    if (context.destructive && !this.allowDestructive) throw new CortexError('DESTRUCTIVE_DENIED', 'Destructive operation requires explicit policy approval');
    const maxCalls = context.budget?.maxToolCalls;
    if (maxCalls !== undefined && (context.callsUsed ?? 0) >= maxCalls) throw new CortexError('BUDGET_EXCEEDED', 'Maximum tool calls exceeded');
  }
}
