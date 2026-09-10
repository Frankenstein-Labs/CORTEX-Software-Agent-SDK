import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { CortexError } from '../../core/src/index.js';
import { LocalWorkspace } from '../../workspace/src/index.js';

const execFileAsync = promisify(execFile);

export interface ExecResult { exitCode: number; stdout: string; stderr: string; durationMs: number; }
export interface ExecOptions { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv; }
export interface Runtime {
  exec(command: string, args?: readonly string[], options?: ExecOptions): Promise<ExecResult>;
  readFile(filePath: string): Promise<Uint8Array>;
  writeFile(filePath: string, data: Uint8Array | string): Promise<void>;
  getStatus(): Promise<{ ready: boolean; platform: string }>;
}

export class LocalHostRuntime implements Runtime {
  private readonly workspace: LocalWorkspace;

  constructor(private readonly workspaceRoot: string) {
    this.workspace = new LocalWorkspace('runtime-workspace', workspaceRoot);
  }

  private safeCwd(cwd?: string): string {
    if (!cwd) return path.resolve(this.workspaceRoot);
    const root = path.resolve(this.workspaceRoot);
    const resolved = path.resolve(root, cwd);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new CortexError('RUNTIME_PATH_ESCAPE', 'Runtime cwd escapes workspace');
    }
    return resolved;
  }

  async exec(command: string, args: readonly string[] = [], options: ExecOptions = {}): Promise<ExecResult> {
    const started = Date.now();
    try {
      const result = await execFileAsync(command, [...args], {
        cwd: this.safeCwd(options.cwd),
        env: options.env,
        timeout: options.timeoutMs ?? 30_000,
        maxBuffer: 4 * 1024 * 1024,
      });
      return { exitCode: 0, stdout: result.stdout, stderr: result.stderr, durationMs: Date.now() - started };
    } catch (error: any) {
      if (error instanceof CortexError) throw error;
      if (error?.code === 'ETIMEDOUT') throw new CortexError('RUNTIME_TIMEOUT', `Command timed out: ${command}`);
      return {
        exitCode: typeof error?.code === 'number' ? error.code : 1,
        stdout: error?.stdout ?? '',
        stderr: error?.stderr ?? error?.message ?? String(error),
        durationMs: Date.now() - started,
      };
    }
  }

  readFile(filePath: string): Promise<Uint8Array> { return this.workspace.readFile(filePath); }
  writeFile(filePath: string, data: Uint8Array | string): Promise<void> { return this.workspace.writeFile(filePath, data); }
  async getStatus(): Promise<{ ready: boolean; platform: string }> { return { ready: true, platform: process.platform }; }
}
