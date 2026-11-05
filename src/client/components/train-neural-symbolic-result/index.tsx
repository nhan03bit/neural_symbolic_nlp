/**
 * Displays a neural-symbolic training run: the setup, one card per epoch, the live charts and
 * dashboard, the final result and the comparison with the CE-only baseline. The page stays scrolled
 * to its end during training, so the dashboard comes after the cards and the cards scroll in a box.
 * Architecture and final result use the baseline page's view.
 */
import type { NeuralSymbolicEpoch, NeuralSymbolicInit } from "../../../routes/neural-symbolic/train.js";
import type { TransformerSummary } from "../train-transformer-result/index.js";
import type { CompareTarget } from "./compare-panel.js";
import { TrainTransformerResult } from "../train-transformer-result/index.js";
import { ComparePanel } from "./compare-panel.js";
import { EpochCard } from "./epoch-card.js";
import styles from "./styles.module.css";
import { SymbolicDashboard } from "./symbolic-dashboard.js";

export type { CompareTarget };

type Props = {
  init?: NeuralSymbolicInit;
  epochs: NeuralSymbolicEpoch[];
  summary?: TransformerSummary;
  compare?: CompareTarget;
};

export function TrainNeuralSymbolicResult({ init, epochs, summary, compare }: Props) {
  const triggered = init?.triggers.map((t) => t.pattern).join(" · ") ?? "";

  return (
    <div class="vstack">
      <TrainTransformerResult init={init} epochs={[]} samples={[]} />
      {init && (
        <>
          <div class={styles.label}>Semantic loss setup</div>
          <div class={styles.chips}>
            <div class={styles.chip}>λ <b>{init.lambdaS}</b></div>
            <div class={styles.chip}>seed <b>{init.seed}</b></div>
            <div class={styles.chip}>KB <b>{init.kbHash}</b></div>
            <div class={styles.chip}>constrained positions <b>{init.constrainedPositions} of {init.totalPositions.toLocaleString()}</b></div>
            <div class={styles.chip}>corpus conflicts <b>{init.corpusConflicts.length}</b></div>
          </div>
        </>
      )}
      {epochs.length > 0 && (
        <>
          <div class={styles.label}>{summary ? "Training" : "Training..."}</div>
          <div class={styles.muted}>
            {init?.lambdaS === 0 && "λ = 0: the rules are measured, not trained on. "}
            Triggered patterns are fixed corpus positions, so they are the same on every card. A rule
            is violated when its blocked word's mean p at the pattern is at least 0.02. Lifted patterns
            are reported only and never added to the KB. Generated text appears every 10th epoch.
          </div>
          <div class={styles.epochsBox}>
            <div class={styles.epochs}>
              {epochs.map((epoch) => (
                <EpochCard key={epoch.epoch} epoch={epoch} triggered={triggered} />
              ))}
            </div>
          </div>
          {init && <SymbolicDashboard init={init} epochs={epochs} />}
        </>
      )}
      <TrainTransformerResult epochs={[]} samples={[]} summary={summary} />
      {compare && <ComparePanel target={compare} />}
    </div>
  );
}
