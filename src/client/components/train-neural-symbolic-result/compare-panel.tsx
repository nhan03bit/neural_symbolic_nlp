/**
 * Runs the baseline and neural-symbolic models on one prompt and seed, side by side. It reports a
 * missing baseline rather than comparing mismatched runs.
 */
import { useState } from "hono/jsx";
import styles from "./styles.module.css";

export type CompareTarget = {
  baselineFile: string;
  neuralSymbolicFile: string;
  temperature: number;
  topP: number;
  seed: number;
};

type VerifyCounts = { parsed: number; supported: number; contradicted: number; unknown: number };
type Trace = { step: number; rulesFired: string[]; maskedTokens: string[]; massBefore: number; chosen: string };
type ModelResult = {
  file: string;
  epochs: number | null;
  unmasked: { text: string; verify: VerifyCounts };
  masked: { text: string; verify: VerifyCounts; traces: Trace[] };
};
type CompareResult = {
  dropped: string[];
  warnings: string[];
  baseline: ModelResult;
  neuralSymbolic: ModelResult;
  probes: { context: string; baseline: number; neuralSymbolic: number }[];
  meanBannedMass: { baseline: number | null; neuralSymbolic: number | null };
};

function ModelColumn({ title, model }: { title: string; model: ModelResult }) {
  return (
    <div class={styles.column}>
      <div class={styles.columnTitle}>{title}</div>
      <div class={styles.file}>{model.file}</div>

      <div class={styles.label}>Mask off</div>
      <div class={styles.text}>{model.unmasked.text}</div>
      <VerifyLine counts={model.unmasked.verify} />

      <div class={styles.label}>Mask on</div>
      <div class={styles.text}>{model.masked.text}</div>
      <VerifyLine counts={model.masked.verify} />

      <div class={styles.label}>Mask trace</div>
      {model.masked.traces.length === 0 && <div class={styles.muted}>No rule fired during this sample.</div>}
      {model.masked.traces.map((t) => (
        <div key={t.step} class={styles.trace}>
          step {t.step}: blocked {t.maskedTokens.join(",") || "nothing"}, banned mass {t.massBefore.toFixed(6)}, chose "{t.chosen}"
        </div>
      ))}
    </div>
  );
}

function VerifyLine({ counts }: { counts: VerifyCounts }) {
  return (
    <div class={styles.muted}>
      {counts.parsed} {counts.parsed === 1 ? "claim" : "claims"}: {counts.supported} supported, {counts.contradicted} contradicted, {counts.unknown} unknown
    </div>
  );
}

export function ComparePanel({ target }: { target: CompareTarget }) {
  const [prompt, setPrompt] = useState("the claimant is the person who");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/neural-symbolic/compare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...target, prompt }),
      });
      const json = await response.json();
      if (response.ok) {
        setResult(json);
      } else {
        setResult(null);
        setError(json.missing ? `${json.error}: ${json.missing}. Train it first, nothing is trained from here.` : json.error ?? "The comparison failed.");
      }
    } catch {
      setError("The comparison failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="vstack">
      <div class={styles.label}>Compare with the baseline</div>
      <div class={styles.controls}>
        <input
          class={styles.prompt}
          value={prompt}
          onInput={(e: Event) => setPrompt((e.target as HTMLInputElement).value)}
        />
        <button type="button" disabled={busy} onClick={run}>
          {busy ? "Comparing..." : "Compare"}
        </button>
      </div>
      <div class={styles.muted}>Same prompt, sampling seed {target.seed}, temperature {target.temperature}, top-p {target.topP}.</div>

      {error && <div class={styles.warning}>{error}</div>}

      {result && (
        <>
          {result.warnings.map((w) => <div key={w} class={styles.warning}>{w}</div>)}
          {result.dropped.length > 0 && (
            <div class={styles.warning}>Not in the vocabulary, so left out of the prompt: {result.dropped.join(" ")}</div>
          )}

          <div class={styles.columns}>
            <ModelColumn title="Baseline (CE only)" model={result.baseline} />
            <ModelColumn title="Neural-symbolic (CE + semantic loss)" model={result.neuralSymbolic} />
          </div>

          <div class={styles.label}>Banned mass at definition frames, mask off</div>
          <table class={styles.table}>
            <thead>
              <tr>
                <th>Context</th>
                <th>Baseline</th>
                <th>Neural-symbolic</th>
              </tr>
            </thead>
            <tbody>
              {result.probes.map((p) => (
                <tr key={p.context}>
                  <td>{p.context}</td>
                  <td>{p.baseline.toFixed(6)}</td>
                  <td>{p.neuralSymbolic.toFixed(6)}</td>
                </tr>
              ))}
              <tr class={styles.total}>
                <td>Mean of {result.probes.length} contexts</td>
                <td>{result.meanBannedMass.baseline?.toFixed(6) ?? "n/a"}</td>
                <td>{result.meanBannedMass.neuralSymbolic?.toFixed(6) ?? "n/a"}</td>
              </tr>
            </tbody>
          </table>
          <div class={styles.muted}>One comparison of two runs. It shows these two models, not a measured effect of the loss.</div>
        </>
      )}
    </div>
  );
}
