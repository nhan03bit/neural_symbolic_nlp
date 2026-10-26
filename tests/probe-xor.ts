import { trainMultiLayer, trainSingleLayer } from "../src/routes/neural-net/train.js";

async function last(gen: AsyncGenerator<any>) {
  let final: any, firstLoss: number | undefined, lastLoss = 0;
  for await (const item of gen) {
    if ("predictions" in item) final = item;
    else { firstLoss ??= item.loss; lastLoss = item.loss; }
  }
  return { final, firstLoss, lastLoss };
}

for (const epochs of [500, 5000]) {
  for (const seed of [42, 1, 2, 3]) {
    const m = await last(trainMultiLayer(epochs, seed));
    const w = (m.final.weights as any).weights ?? m.final.weights;
    console.log(`multi epochs=${epochs} seed=${seed} loss ${m.firstLoss?.toFixed(4)} -> ${m.lastLoss.toFixed(5)} preds=${m.final.predictions.map((p: any) => p.actual.toFixed(2)).join(",")} w1[0]=${JSON.stringify(w.w1?.[0]?.map((x: number) => +x.toFixed(2)))}`);
  }
}
const s = await last(trainSingleLayer(500, 42));
console.log("single", s.firstLoss?.toFixed(4), "->", s.lastLoss.toFixed(4), s.final.predictions.map((p: any) => p.actual.toFixed(2)).join(","));
const again = await last(trainMultiLayer(500, 42));
const again2 = await last(trainMultiLayer(500, 42));
console.log("deterministic:", again.lastLoss === again2.lastLoss);
