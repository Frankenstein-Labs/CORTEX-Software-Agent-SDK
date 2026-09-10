import { CortexError, type CortexId, type TaskSpec, type TaskStatus, nowIso } from './index.js';

const allowed: Record<TaskStatus, readonly TaskStatus[]> = {
  pending: ['running', 'cancelled'],
  running: ['paused', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  completed: [], failed: ['pending'], cancelled: [],
};

export class TaskGraph {
  private readonly tasks = new Map<CortexId, TaskSpec>();

  add(task: TaskSpec): void {
    if (this.tasks.has(task.id)) throw new CortexError('TASK_EXISTS', `Task ${task.id} already exists`);
    for (const dependency of task.dependsOn) {
      if (dependency === task.id || !this.tasks.has(dependency)) throw new CortexError('INVALID_DEPENDENCY', `Dependency ${dependency} is not available`);
    }
    this.tasks.set(task.id, structuredClone(task));
  }

  get(id: CortexId): TaskSpec {
    const task = this.tasks.get(id);
    if (!task) throw new CortexError('TASK_NOT_FOUND', `Task ${id} was not found`);
    return structuredClone(task);
  }

  listReady(): TaskSpec[] {
    return [...this.tasks.values()]
      .filter(task => task.status === 'pending')
      .filter(task => task.dependsOn.every(id => this.tasks.get(id)?.status === 'completed'))
      .map(task => structuredClone(task));
  }

  transition(id: CortexId, status: TaskStatus, reason?: string): TaskSpec {
    const task = this.tasks.get(id);
    if (!task) throw new CortexError('TASK_NOT_FOUND', `Task ${id} was not found`);
    if (!allowed[task.status].includes(status)) {
      throw new CortexError('INVALID_TRANSITION', `Cannot transition ${task.status} -> ${status}`, { id, reason });
    }
    task.status = status;
    task.updatedAt = nowIso();
    return structuredClone(task);
  }

  assign(id: CortexId, agentId: CortexId): TaskSpec {
    const task = this.tasks.get(id);
    if (!task) throw new CortexError('TASK_NOT_FOUND', `Task ${id} was not found`);
    if (task.status !== 'pending') throw new CortexError('INVALID_ASSIGNMENT', 'Only pending tasks can be assigned');
    task.assignedAgent = agentId;
    task.updatedAt = nowIso();
    return structuredClone(task);
  }
}
