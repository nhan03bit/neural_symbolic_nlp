/**
 * One measure over all epochs, redrawn as each epoch arrives. Each measure gets its own chart,
 * because cross-entropy and semantic loss differ by about a million times and would need two axes
 * on one. The y axis runs from the series' lowest to highest value and is labelled with both, so
 * shape reads as change, not size.
 */
import styles from "./styles.module.css";

type Props = {
  title: string;
  values: number[];
  format: (value: number) => string;
  /** Index of the epoch being read: the hovered one, or the latest. */
  active: number;
  lastEpoch: number;
  onHover: (index: number | null) => void;
};

const WIDTH = 1000;
const HEIGHT = 100;

export function LossChart({ title, values, format, active, lastEpoch, onHover }: Props) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const last = Math.max(1, values.length - 1);
  const x = (i: number) => (i / last) * 100;
  const y = (v: number) => (1 - (v - min) / span) * 100;
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / last) * WIDTH).toFixed(1)} ${((y(v) / 100) * HEIGHT).toFixed(1)}`)
    .join("");

  const indexAt = (e: PointerEvent) => {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    return Math.round(ratio * (values.length - 1));
  };

  return (
    <figure class={styles.chart}>
      <figcaption class={styles.chartHead}>
        <span class={styles.muted}>{title}</span>
        <span class={styles.statValue}>{format(values[active])}</span>
      </figcaption>
      <div class={styles.chartAxis}>
        <span>{format(max)}</span>
        <span>{format(min)}</span>
      </div>
      <div
        class={styles.plot}
        onPointerMove={(e: PointerEvent) => onHover(indexAt(e))}
        onPointerLeave={() => onHover(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={`${title} by epoch, from ${format(values[0])} to ${format(values.at(-1)!)}`}>
          <path d={path} class={styles.line} />
        </svg>
        {/* HTML rather than SVG: the stretched plot would turn a circle into an oval. */}
        <div class={styles.crosshair} style={{ left: `${x(active)}%` }} />
        <div class={styles.marker} style={{ left: `${x(active)}%`, top: `${y(values[active])}%` }} />
      </div>
      <div class={styles.chartEpochs}>
        <span>epoch 0</span>
        <span>epoch {lastEpoch}</span>
      </div>
    </figure>
  );
}
