/**
 * One training epoch as a plain card: its generated text, when it has any, then the patterns that
 * triggered, the rules violated, the patterns lifted, and the epoch's semantic loss and banned mass.
 * Memoised because a run can reach thousands of cards and only the newest ever changes.
 */
import type { LiftedCandidate, LiftStatus } from "../../../routes/neural-symbolic/lift.js";
import type { NeuralSymbolicEpoch } from "../../../routes/neural-symbolic/train.js";
import { memo } from "hono/jsx";
import { formatSem } from "./format.js";
import styles from "./styles.module.css";

const STATUS_ORDER: LiftStatus[] = ["confirmed", "conflict", "novel"];
export const SYMBOL: Record<LiftStatus, string> = { confirmed: "✓", conflict: "✕", novel: "◇" };

function liftedInOrder(candidates: LiftedCandidate[]) {
  return [...candidates].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.p - a.p,
  );
}

function liftNote(c: LiftedCandidate) {
  if (c.heldBack) return " (unreviewed fact)";
  return c.passesGate ? " (passes gate)" : "";
}

function Line({ name, children }: { name: string; children: unknown }) {
  return (
    <div class={styles.cardLine}>
      <span class={styles.cardKey}>{name}</span>
      <span class={styles.cardValue}>{children}</span>
    </div>
  );
}

type Props = {
  epoch: NeuralSymbolicEpoch;
  /** The same for every card in a run, because the corpus positions never change. */
  triggered: string;
};

export const EpochCard = memo(({ epoch, triggered }: Props) => (
  <div class={styles.card}>
    <div class={styles.cardEpoch}>epoch {epoch.epoch}</div>
    {epoch.sample !== undefined && <div class={styles.cardSample}>{epoch.sample}</div>}
    <Line name="triggered">{triggered}</Line>
    <Line name="violated">
      {epoch.violated.length === 0
        ? "none"
        : epoch.violated.map((v) => `${v.rule} ${v.role} → ${v.word} ${v.p.toFixed(3)}`).join(" · ")}
    </Line>
    <Line name="lifted">
      {epoch.lifted.length === 0
        ? "none"
        : liftedInOrder(epoch.lifted).map((c, i) => (
            <span key={`${c.triple.a}|${c.triple.b}`} title={`after "${c.pattern}"`}>
              {i > 0 && " · "}
              <span class={styles[c.status]} aria-label={c.status}>{SYMBOL[c.status]}</span>
              {` ${c.triple.a} → ${c.triple.b} ${c.p.toFixed(3)}${liftNote(c)}`}
            </span>
          ))}
    </Line>
    <Line name="semantic loss">{formatSem(epoch.semLoss)}</Line>
    <Line name="banned mass">{epoch.bannedMass.toFixed(6)}</Line>
  </div>
));
