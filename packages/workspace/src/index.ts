import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CortexError } from '../../core/src/index.js';

export interface Workspace {
  readonly id: string;
  readFile(filePath: string): Promise<Uint8Array>;
  writeFile(filePath: string, data: Uint8Array | string): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(directory?: string): Promise<string[]>;
  createDirectory(directory: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
}

export class LocalWorkspace implements Workspace {
  constructor(public readonly id: string, public readonly root: string) {}

  private resolve(relativePath: string): string {
    if (path.isAbsolute(relativePath)) throw new CortexError('PATH_NOT_RELATIVE', 'Workspace paths must be relative');
    const target = path.resolve(this.root, relativePath);
    const root = path.resolve(this.root);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      throw new CortexError('PATH_ESCAPE', `Path escapes workspace: ${relativePath}`);
    }
    return target;
  }

  async readFile(filePath: string): Promise<Uint8Array> { return fs.readFile(this.resolve(filePath)); }

  async writeFile(filePath: string, data: Uint8Array | string): Promise<void> {
    const target = this.resolve(filePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }

  async deleteFile(filePath: string): Promise<void> {
    await fs.rm(this.resolve(filePath), { force: true });
  }

  async listFiles(directory = '.'): Promise<string[]> {
    const base = this.resolve(directory);
    const entries = await fs.readdir(base, { withFileTypes: true });
    return entries.map(entry => path.posix.join(directory === '.' ? '' : directory, entry.name));
  }

  async createDirectory(directory: string): Promise<void> { await fs.mkdir(this.resolve(directory), { recursive: true }); }

  async exists(filePath: string): Promise<boolean> {
    try { await fs.access(this.resolve(filePath)); return true; } catch { return false; }
  }
}
