/**
 * A real training run must show progress early, or a slow run looks like a hang.
 *
 * Runs a short real training in a throwaway directory, so its weights never reach .data. The
 * source is linked in because the worker bundle is built from the current directory.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { trainTransformer } from "../src/routes/train-transformer/train.js";

const originalCwd = process.cwd();
let sandbox: string;

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), "transformer-progress-"));
  mkdirSync(join(sandbox, ".data"));
  symlinkSync(join(originalCwd, "src"), join(sandbox, "src"));
  process.chdir(sandbox);
});

afterAll(() => {
  process.chdir(originalCwd);
  rmSync(sandbox, { recursive: true, force: true });
});

describe("training progress", () => {
  test("every early epoch reports, and samples stay on the every-10 schedule", async () => {
    const reported: { epoch: number; hasSample: boolean }[] = [];
    const trainer = trainTransformer({
      epochs: 12,
      temperature: 1,
      topP: 0.6,
      numLayers: 1,
      maxTokens: 5,
    });

    for await (const event of trainer) {
      if ("epoch" in event) {
        reported.push({
          epoch: event.epoch,
          hasSample: event.sample !== undefined,
        });
      }
    }

    expect(reported.map((r) => r.epoch)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12,
    ]);
    expect(reported.filter((r) => r.hasSample).map((r) => r.epoch)).toEqual([
      0, 10, 12,
    ]);
  }, 300_000);
});
