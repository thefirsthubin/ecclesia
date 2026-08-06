import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Whole-app smoke test - runs `bin/infra.ts` itself (via ts-node, exactly
 * as `cdk synth` invokes it per `cdk.json`'s own `app` command) and
 * asserts all eighteen stacks (six stacks × three environments)
 * synthesize a template file. Deliberately shells out rather than
 * `import`-ing `bin/infra.ts` directly in-process - that file constructs
 * a fresh `cdk.App()` and synthesizes it as a module-level side effect
 * (the standard CDK v2 entrypoint shape, no explicit `app.synth()` call
 * needed - CDK v2's `App` synths automatically on process exit), and
 * running it as a real subprocess is the only way to observe that
 * behavior the same way the real `cdk` CLI does.
 *
 * Reads the synthesized cloud assembly's output directory directly
 * (`{stackId}.template.json` per stack, CDK's own default naming) rather
 * than asserting on captured stdout - a plain `ts-node` invocation of a
 * CDK app (not wrapped by the `cdk` CLI) produces no stack-list console
 * output on its own, only the on-disk cloud assembly.
 *
 * Per-stack resource content is covered by each stack's own colocated
 * `*.spec.ts` file; this test only checks the whole app assembles
 * without throwing and produces every expected stack.
 */
describe('infra CDK app (bin/infra.ts)', () => {
  it('synthesizes all eighteen stacks (6 stacks x 3 environments)', () => {
    const infraDir = path.resolve(__dirname, '..');
    const outDir = path.join(infraDir, 'cdk.out', 'jest-smoke-test');
    fs.rmSync(outDir, { recursive: true, force: true });

    execFileSync('npx', ['ts-node', '--prefer-ts-exts', 'bin/infra.ts'], {
      cwd: infraDir,
      env: { ...process.env, CDK_OUTDIR: outDir },
    });

    const expectedStackIds = ['Cognito', 'Eventing', 'Ses', 'Secrets', 'Iam', 'Observability'].flatMap((stack) =>
      ['Dev', 'Staging', 'Production'].map((env) => `Ecclesia-${env}-${stack}`),
    );
    expect(expectedStackIds).toHaveLength(18);

    for (const stackId of expectedStackIds) {
      const templatePath = path.join(outDir, `${stackId}.template.json`);
      expect(fs.existsSync(templatePath)).toBe(true);
    }

    fs.rmSync(outDir, { recursive: true, force: true });
  }, 120_000);
});
