/**
 * The run at a glance: one epoch's symbolic numbers and trigger patterns, then the live loss charts,
 * last because the page stays scrolled to its end during training. It follows the latest epoch, and
 * hovering a chart reads an earlier one. The epoch cards hold the full lists of rules and lifted
 * patterns, so this only counts them.
 */
import type { LiftStatus } from "../../../routes/neural-symbolic/lift.js";
import type { NeuralSymbolicEpoch, NeuralSymbolicInit } from "../../../routes/neural-symbolic/train.js";
import { useState } from "hono/jsx";
import { SYMBOL } from "./epoch-card.js";
import { formatSem } from "./format.js";
import { LossChart } from "./loss-chart.js";
import styles from "./styles.module.css";

const STATUSES: LiftStatus[] = ["confirmed", "conflict", "novel"];
const formatCe = (v: number) => v.toFixed(6);

type Props = {
  init: NeuralSymbolicInit;
  epochs: NeuralSymbolicEpoch[];
};

export function SymbolicDashboard({ init, epochs }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const latest = epochs.length - 1;
  const active = hover === null ? latest : Math.min(hover, latest);
  const epoch = epochs[active];
  const lastEpoch = epochs[latest].epoch;
  const chart = { active, lastEpoch, onHover: setHover };
  const totalRules = init.triggers.reduce((sum, t) => sum + t.rules.filter((r) => r.mode === "ban").length, 0);

  return (
    <div class="vstack">
      <div class={styles.label}>Symbolic dashboard: epoch {epoch.epoch}{hover === null ? " (latest)" : ""}</div>
      <div class={styles.stats}>
        <div>
          <div class={styles.statValue}>{formatSem(epoch.semLoss)}</div>
          <div class={styles.muted}>semantic loss</div>
        </div>
        <div>
          <div class={styles.statValue}>{epoch.bannedMass.toFixed(6)}</div>
          <div class={styles.muted}>banned mass</div>
        </div>
        <div>
          <div class={styles.statValue}>{epoch.violated.length} of {totalRules}</div>
          <div class={styles.muted}>rules violated</div>
        </div>
        {STATUSES.map((status) => (
          <div key={status}>
            <div class={styles.statValue}>
              <span class={styles[status]} aria-hidden="true">{SYMBOL[status]}</span> {epoch.lifted.filter((c) => c.status === status).length}
            </div>
            <div class={styles.muted}>{status}</div>
          </div>
        ))}
      </div>

      <div class={styles.tableScroll}>
        <table class={`${styles.table} ${styles.compact}`}>
          <thead>
            <tr>
              <th>Trigger pattern</th>
              <th class={styles.number}>Semantic loss</th>
              <th class={styles.number}>Banned mass</th>
              <th>Words at p ≥ 0.02</th>
            </tr>
          </thead>
          <tbody>
            {init.triggers.map((trigger, g) => {
              const violated = epoch.violated.filter((v) => v.pattern === trigger.pattern);
              return (
                <tr key={trigger.pattern}>
                  <td class={styles.pattern}>{trigger.pattern}</td>
                  <td class={styles.number}>{formatSem(epoch.triggerStats[g].semLoss)}</td>
                  <td class={styles.number}>{epoch.triggerStats[g].bannedMass.toFixed(6)}</td>
                  <td>{violated.length === 0 ? "none" : violated.map((v) => `${v.word} ${v.p.toFixed(3)}`).join(", ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div class={styles.label}>Loss by epoch</div>
      <div class={styles.charts}>
        <LossChart title="Cross-entropy loss" values={epochs.map((e) => e.loss)} format={formatCe} {...chart} />
        <LossChart
          title="Semantic loss"
          values={epochs.map((e) => e.semLoss)}
          format={formatSem}
          reference={init.control?.semLoss}
          referenceLabel="no rule (λ = 0)"
          {...chart}
        />
      </div>
      {init.lambdaS > 0 && !init.control && (
        <div class={styles.muted}>
          No λ = 0 run is saved for these settings, so semantic loss has no control to compare with. Train one
          with: {`${init.epochs} ${init.temperature} ${init.topP} ${init.numLayers} 40 0 ${init.seed}`}
        </div>
      )}
    </div>
  );
}
