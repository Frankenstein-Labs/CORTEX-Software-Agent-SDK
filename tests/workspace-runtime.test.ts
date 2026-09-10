import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CortexError } from '../packages/core/src/index.js';
import { LocalWorkspace } from '../packages/workspace/src/index.js';
import { LocalHostRuntime } from '../packages/runtime/src/index.js';

test('LocalWorkspace reads, writes, lists, and confines paths', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cortex-workspace-'));
  try {
    const workspace = new LocalWorkspace('ws-1', root);
    await workspace.writeFile('src/hello.txt', 'hello cortex');
    assert.equal(new TextDecoder().decode(await workspace.readFile('src/hello.txt')), 'hello cortex');
    assert.deepEqual(await workspace.listFiles('src'), ['src/hello.txt']);
    assert.equal(await workspace.exists('src/hello.txt'), true);
    await assert.rejects(() => workspace.writeFile('../outside.txt', 'blocked'), (error: unknown) => error instanceof CortexError && error.code === 'PATH_ESCAPE');
    await workspace.deleteFile('src/hello.txt');
    assert.equal(await workspace.exists('src/hello.txt'), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('LocalHostRuntime executes inside the workspace and supports file operations', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cortex-runtime-'));
  try {
    const runtime = new LocalHostRuntime(root);
    await runtime.writeFile('input.txt', 'runtime-ok');
    const result = await runtime.exec(process.execPath, ['-e', "process.stdout.write(require('node:fs').readFileSync('input.txt','utf8'))"]);
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, 'runtime-ok');
    assert.equal((await runtime.getStatus()).ready, true);
    await assert.rejects(() => runtime.exec('pwd', [], { cwd: '../' }), (error: unknown) => error instanceof CortexError && error.code === 'RUNTIME_PATH_ESCAPE');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
