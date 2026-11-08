/**
 * Hook for neural-symbolic training. Input: epochs, temperature, top-p, layers, max tokens, λ, seed.
 * Streams one card per epoch, then offers a comparison.
 */
import type {
  NeuralSymbolicDone,
  NeuralSymbolicEpoch,
  NeuralSymbolicInit,
} from "../../routes/neural-symbolic/train.js";
import type { CompareTarget } from "../components/train-neural-symbolic-result/index.js";
import type { TransformerSummary } from "../components/train-transformer-result/index.js";

import { TrainNeuralSymbolicResult } from "../components/train-neural-symbolic-result/index.js";
import { useSSEChat } from "./use-sse-chat.js";

const WHITESPACE = /\s+/;

type State = {
  init?: NeuralSymbolicInit;
  epochs: NeuralSymbolicEpoch[];
  summary?: TransformerSummary;
  compare?: CompareTarget;
  lastRender: number;
  /** A draw scheduled for epochs that arrived while drawing was skipped. */
  pending?: ReturnType<typeof setTimeout>;
};

/** Skipped epochs are drawn this long after the last draw, if nothing else draws them first. */
const TRAILING_DRAW_MS = 100;

function view(state: State) {
  return (
    <TrainNeuralSymbolicResult
      init={state.init}
      epochs={[...state.epochs]}
      summary={state.summary}
      compare={state.compare}
    />
  );
}

type Event = NeuralSymbolicInit | NeuralSymbolicEpoch | NeuralSymbolicDone;

export function useTrainNeuralSymbolicChat() {
  return useSSEChat<State, Event>({
    endpoint: "/train-neural-symbolic",
    title: "Train Neural-Symbolic",
    tagline: "CE + semantic loss, trained apart from the baseline — try: 300 0.8 0.9 2 40 2 42 (epochs, temp, top-p, layers, max tokens, λ, seed)",
    buildBody: (input) => {
      const parts = input.trim().split(WHITESPACE);
      const number = (i: number, fallback: number) => {
        const value = Number.parseFloat(parts[i]);
        return Number.isNaN(value) ? fallback : value;
      };
      return {
        epochs: number(0, 300),
        temperature: number(1, 0.8),
        topP: number(2, 0.9),
        numLayers: number(3, 2),
        maxTokens: number(4, 40),
        lambdaS: number(5, 2),
        seed: number(6, 42),
      };
    },
    initState: () => ({ epochs: [], lastRender: 0 }),
    onEvent: (parsed, state, redraw) => {
      if ("vocabSize" in parsed) {
        state.init = parsed;
      } else if ("architecture" in parsed) {
        state.summary = { architecture: parsed.architecture, finalLoss: parsed.finalLoss };
        state.compare = {
          baselineFile: parsed.baselineFile,
          neuralSymbolicFile: parsed.weightsFile,
          temperature: state.init?.temperature ?? 0.8,
          topP: state.init?.topP ?? 0.9,
          seed: parsed.seed,
        };
      } else if ("epoch" in parsed) {
        state.epochs.push(parsed);
        // Redrawing costs about 0.2 ms per card, and a saved run replays every 5 ms. Waiting 1 ms per
        // card keeps replays moving. A live epoch takes seconds, so each one still draws. The final
        // event always draws, so nothing is left out. A slow host can send a burst of epochs and
        // then pause for many seconds before the final event, so skipped epochs are drawn shortly
        // after instead of waiting for it.
        const now = performance.now();
        if (now - state.lastRender < state.epochs.length) {
          state.pending ??= setTimeout(() => {
            state.pending = undefined;
            state.lastRender = performance.now();
            redraw(view(state));
          }, TRAILING_DRAW_MS);
          return undefined;
        }
        state.lastRender = now;
      } else {
        return undefined;
      }

      clearTimeout(state.pending);
      state.pending = undefined;
      return view(state);
    },
  });
}
