import { trainSkipGram } from "../src/routes/train-embed/train.js";

const epochs = Number(process.argv[2] ?? 300);
const t0 = performance.now();
for await (const item of trainSkipGram({
  words: ["king", "queen", "man", "woman", "cat", "dog", "tiger", "elephant"],
  epochs, dimensions: 32, windowSize: 2, negativeSamples: 5, save: false,
})) {
  if ("vocabSize" in item) console.log("init", JSON.stringify(item));
  else if ("embeddings" in item) {
    console.log("sims", item.similarities.sort((a, b) => b.score - a.score).map((s) => `${s.a}/${s.b}=${s.score}`).join("  "));
    console.log("analogies", item.analogies.map((a) => `${a.query} => ${a.result} (${a.score})`).join(" | "));
    console.log("neighbors", item.neighbors.map((n) => `${n.word}: ${n.nearest.slice(0, 3).map((x) => x.word).join(",")}`).join(" | "));
  } else if ("loss" in item && (item.epoch === 0 || item.epoch === epochs || item.epoch % Math.floor(epochs / 5) === 0)) {
    console.log("epoch", item.epoch, "loss", item.loss);
  }
}
console.log("seconds", ((performance.now() - t0) / 1000).toFixed(1));
