"""Skip-gram figures for the civil-law corpus, drawn from the saved model.

    python3 docs/images/make_civil_law_figures.py      # needs matplotlib and numpy

Input: .data/embedding-weights.json (written by the /train-embed route; corpus "civil-law").
Writes fig-skipgram-civil-law.png and prints the analogy results it recomputes, so the
README numbers can be checked against the saved vectors. No number is typed in here.
Style comes from make_figures.py so both scripts share one visual system.
"""
import json
from pathlib import Path

import numpy as np

from make_figures import HERE, KIND, plt, save

MODEL = HERE.parent.parent / ".data" / "embedding-weights.json"
WORDS = ["claimant", "defendant", "landlord", "tenant", "trader", "consumer", "creditor", "debtor",
         "seller", "buyer", "supplier", "customer", "court", "judge", "contract"]
ANALOGIES = [("landlord", "tenant", "consumer"), ("trader", "consumer", "tenant"),
             ("claimant", "defendant", "debtor"), ("creditor", "debtor", "defendant"),
             ("seller", "buyer", "customer")]


def unit(v):
    n = np.linalg.norm(v)
    return v / n if n else v


def main():
    model = json.load(open(MODEL))
    assert model.get("corpus") == "civil-law", f"expected the civil-law model, got {model.get('corpus')}"
    vocab = list(model["embeddings"])
    E = np.array([model["embeddings"][w] for w in vocab], dtype=float)
    U = np.array([unit(v) for v in E])
    idx = {w: i for i, w in enumerate(vocab)}

    # analogies, same rule as train.ts: cosine to a - b + c, inputs excluded
    for a, b, c in ANALOGIES:
        q = unit(E[idx[a]] - E[idx[b]] + E[idx[c]])
        s = U @ q
        s[[idx[a], idx[b], idx[c]]] = -np.inf
        best = int(np.argmax(s))
        print(f"{a} - {b} + {c} => {vocab[best]} ({s[best]:.2f})")

    X = np.array([E[idx[w]] for w in WORDS])
    Xc = X - X.mean(axis=0)
    _, _, vt = np.linalg.svd(Xc, full_matrices=False)
    pc = Xc @ vt[:2].T
    Xu = np.array([unit(v) for v in X])
    cos = Xu @ Xu.T

    fig, (a, b) = plt.subplots(1, 2, figsize=(11.5, 4.6), gridspec_kw={"width_ratios": [1, 1.08]})
    a.scatter(pc[:, 0], pc[:, 1], s=46, color=KIND["measured"][1], zorder=3)
    for w, (x, y) in zip(WORDS, pc):
        a.annotate(w, (x, y), xytext=(5, 4), textcoords="offset points", fontsize=9)
    a.set_xlabel("PC1")
    a.set_ylabel("PC2")
    a.set_title(f"PCA of {len(WORDS)} civil-law word vectors", loc="left", fontweight="bold")
    im = b.imshow(cos, vmin=-0.2, vmax=1, cmap="YlGnBu")
    b.set_xticks(range(len(WORDS)), WORDS, rotation=90, fontsize=8)
    b.set_yticks(range(len(WORDS)), WORDS, fontsize=8)
    b.grid(False)
    for sp in b.spines.values():
        sp.set_visible(False)
    b.set_title("Pairwise cosine similarity", loc="left", fontweight="bold")
    fig.colorbar(im, ax=b, fraction=0.046, pad=0.02)
    save(fig, "fig-skipgram-civil-law.png")


if __name__ == "__main__":
    main()
