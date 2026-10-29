"""Draws every original figure in docs/progress with matplotlib.pyplot.

    python3 docs/images/make_figures.py        # needs matplotlib and numpy

Inputs are the files written by `bun tests/ieee-data.ts` (docs/progress/ieee/data/).
No measured number is typed in here. The attention-mask figure runs a tiny numpy
attention with seeded random, untrained weights and says so in its caption.
Figures cut from the source papers (sheth2023-*, mikolov2013*, sennrich2016-*) are
not made here; they were cropped from docs/paper/ with pdftoppm.

One visual system for all figures:
  fill + border colour = status    teal: measured / implemented
                                   amber: in progress
                                   violet: specified, not built
  the border line style repeats the status so greyscale prints still read:
  solid = measured, dashed = in progress, dotted = designed only.
"""
import csv
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch

HERE = Path(__file__).parent
DATA = HERE.parent / "progress" / "ieee" / "data"
SEEDS = [42, 1, 2, 3]

# ---- design tokens ----------------------------------------------------------
INK, MUTED, GRID, BG = "#1F2937", "#6B7280", "#E5E7EB", "#FFFFFF"
KIND = {  # fill, edge, linestyle
    "measured": ("#DDF3EF", "#0F766E", "-"),
    "wip": ("#FEF0C7", "#B45309", "--"),
    "design": ("#EAE5FB", "#6D28D9", ":"),
    "neutral": ("#F3F4F6", "#4B5563", "-"),
    "accent": ("#DCE8FD", "#1D4ED8", "-"),
}
Q_COL, K_COL, V_COL = "#D97706", "#2563EB", "#0F766E"  # query / key / value
SEED_STYLE = {42: ("#0F766E", "-"), 1: ("#2563EB", "--"), 2: ("#B45309", ":"), 3: ("#6D28D9", "-.")}

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["DejaVu Sans"],  # ships with matplotlib, so every machine renders the same glyphs
    "font.size": 10, "text.color": INK, "axes.labelcolor": INK, "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.edgecolor": MUTED, "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True,
    "figure.facecolor": BG, "axes.facecolor": BG, "mathtext.fontset": "dejavusans",
})


# ---- helpers ----------------------------------------------------------------
def read_csv(name):
    with open(DATA / name) as f:
        return list(csv.DictReader(f))


def save(fig, name):
    fig.savefig(HERE / name, dpi=200, bbox_inches="tight", facecolor=BG)
    plt.close(fig)
    print("wrote", name)


def canvas(w, h, xlim, ylim, title=None, sub=None):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(*xlim)
    ax.set_ylim(*ylim)
    ax.axis("off")
    ax.grid(False)
    span = ylim[1] - ylim[0]
    if title:
        ax.text(xlim[0], ylim[1] + 0.035 * span, title, ha="left", va="bottom", fontsize=12.5, fontweight="bold")
    if sub:
        ax.text(xlim[0], ylim[1] - 0.005 * span, sub, ha="left", va="top", fontsize=8.5, color=MUTED)
    return fig, ax


def node(ax, cx, cy, w, h, text, kind="neutral", fs=9, bold=False):
    fill, edge, ls = KIND[kind]
    ax.add_patch(FancyBboxPatch((cx - w / 2, cy - h / 2), w, h, boxstyle="round,pad=0,rounding_size=0.12",
                                linewidth=1.5, linestyle=ls, edgecolor=edge, facecolor=fill, zorder=2))
    if text:
        ax.text(cx, cy, text, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal",
                zorder=3, linespacing=1.3)


def arrow(ax, a, b, color=INK, rad=0.0, lw=1.5, ls="-", z=1, ms=11):
    ax.add_patch(FancyArrowPatch(a, b, arrowstyle="-|>", mutation_scale=ms, linewidth=lw, color=color,
                                 linestyle=ls, connectionstyle=f"arc3,rad={rad}", zorder=z))


def legend_status(ax, x, y, kinds=("measured", "wip", "design")):
    names = {"measured": "measured / implemented", "wip": "in progress", "design": "specified, not built"}
    for i, k in enumerate(kinds):
        fill, edge, ls = KIND[k]
        ax.add_patch(FancyBboxPatch((x + i * 3.2, y), 0.4, 0.22, boxstyle="round,pad=0,rounding_size=0.05",
                                    linewidth=1.3, linestyle=ls, edgecolor=edge, facecolor=fill))
        ax.text(x + i * 3.2 + 0.55, y + 0.11, names[k], va="center", fontsize=8, color=MUTED)


def style_axes(ax):
    ax.tick_params(length=3)
    ax.grid(True, axis="y")
    ax.grid(False, axis="x")


# ---- 1. pipeline ------------------------------------------------------------
def pipeline():
    fig, ax = canvas(11.5, 2.7, (0, 11.5), (-0.2, 2.2), "Pipeline and status of each stage")
    items = [
        ("Stage 0", "ELIZA", "rule-based", "measured", "no metric here"),
        ("Stage 1", "BPE", "tokenizer", "measured", "no metric here"),
        ("Stage 2", "XOR net", "backprop", "measured", "measured"),
        ("Stage 3", "Skip-gram", "embeddings", "measured", "measured"),
        ("Stage 4", "Transformer", "decoder-only", "measured", "implemented"),
        ("Stage 5", "Symbolic layer", "KB + verifier", "design", "design only"),
        ("Stage 6", "Experiments", "E1 – E3", "design", "not run"),
    ]
    xs = np.linspace(0.85, 10.65, len(items))
    for i, (x, (a, b, c, k, note)) in enumerate(zip(xs, items)):
        node(ax, x, 1.2, 1.38, 1.15, f"{a}\n{b}\n{c}", k, fs=8.5)
        ax.text(x, 0.45, note, ha="center", fontsize=8, style="italic", color=MUTED)
        if i:
            arrow(ax, (xs[i - 1] + 0.72, 1.2), (x - 0.72, 1.2))
    legend_status(ax, 0.2, -0.15, kinds=("measured", "design"))
    save(fig, "fig-pipeline.png")


# ---- 2. XOR -----------------------------------------------------------------
def xor():
    multi = read_csv("xor_multi_loss.csv")
    single = read_csv("xor_single_loss.csv")
    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    ep = [float(r["epoch"]) for r in multi]
    for s in SEEDS:
        c, ls = SEED_STYLE[s]
        ax.semilogy(ep, [float(r[f"seed{s}"]) for r in multi], ls, color=c, lw=2, label=f"2-4-1 net, seed {s}")
    ax.semilogy([float(r["epoch"]) for r in single], [float(r["loss"]) for r in single], color=MUTED, lw=2.4,
                label="single layer (cannot solve XOR)")
    ax.set_xlabel("epoch")
    ax.set_ylabel("mean-squared error (log)")
    ax.set_title("XOR training loss", loc="left", fontweight="bold")
    ax.legend(fontsize=8, frameon=False)
    style_axes(ax)
    save(fig, "fig-xor-loss.png")

    x = json.load(open(DATA / "xor.json"))
    fig, ax = plt.subplots(figsize=(6.2, 3.4))
    width = 0.2
    for i, s in enumerate(SEEDS):
        ax.bar(np.arange(4) + (i - 1.5) * width, x[f"multi_5000_{s}"]["w1_row0"], width, color=SEED_STYLE[s][0],
               label=f"seed {s}")
    ax.axhline(0, color=INK, lw=0.8)
    ax.set_xticks(range(4), [f"hidden unit {i + 1}" for i in range(4)])
    ax.set_ylabel(r"$w_1[0,j]$ after 5000 epochs")
    ax.set_title("Same function, different first-layer weights", loc="left", fontweight="bold")
    ax.legend(fontsize=8, ncol=4, frameon=False, loc="upper center", bbox_to_anchor=(0.5, -0.12))
    style_axes(ax)
    save(fig, "fig-xor-weights.png")


# ---- 3. Skip-gram -----------------------------------------------------------
def skipgram():
    rows = read_csv("skipgram_loss.csv")
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ep = [float(r["epoch"]) for r in rows]
    for s in SEEDS:
        c, ls = SEED_STYLE[s]
        ax.plot(ep, [float(r[f"seed{s}"]) for r in rows], ls, color=c, lw=2, label=f"seed {s}")
    ax.set_xlabel("epoch")
    ax.set_ylabel("negative-sampling loss")
    ax.set_title("Skip-gram training loss", loc="left", fontweight="bold")
    ax.legend(fontsize=8, frameon=False)
    style_axes(ax)
    save(fig, "fig-skipgram-loss.png")

    pca = read_csv("skipgram_pca_seed42.csv")
    words = [r["word"] for r in pca]
    cos = np.zeros((len(words), len(words)))
    for r in read_csv("skipgram_cos_seed42.csv"):
        cos[int(r["x"]), int(r["y"])] = float(r["cos"])
    fig, (a, b) = plt.subplots(1, 2, figsize=(11.5, 4.6), gridspec_kw={"width_ratios": [1, 1.08]})
    a.scatter([float(r["pc1"]) for r in pca], [float(r["pc2"]) for r in pca], s=46, color=KIND["measured"][1],
              zorder=3)
    for r in pca:
        a.annotate(r["word"], (float(r["pc1"]), float(r["pc2"])), xytext=(5, 4), textcoords="offset points",
                   fontsize=9)
    a.set_xlabel("PC1")
    a.set_ylabel("PC2")
    a.set_title("PCA of 15 word vectors (seed 42)", loc="left", fontweight="bold")
    im = b.imshow(cos, vmin=-0.2, vmax=1, cmap="YlGnBu")
    b.set_xticks(range(len(words)), words, rotation=90, fontsize=8)
    b.set_yticks(range(len(words)), words, fontsize=8)
    b.grid(False)
    for sp in b.spines.values():
        sp.set_visible(False)
    b.set_title("Pairwise cosine similarity (seed 42)", loc="left", fontweight="bold")
    fig.colorbar(im, ax=b, fraction=0.046, pad=0.02)
    save(fig, "fig-skipgram-geometry.png")

    sg = json.load(open(DATA / "skipgram.json"))
    keys = list(sg["pairwiseGeometryPearson"])
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    xpos = np.arange(len(keys))
    ax.bar(xpos - 0.2, [sg["pairwiseGeometryPearson"][k] for k in keys], 0.4, color=KIND["measured"][1],
           label="pairwise-geometry Pearson r")
    ax.bar(xpos + 0.2, [sg["meanSameWordCosineAcrossSeeds"][k] for k in keys], 0.4, color="#9CA3AF",
           label="same-word vector cosine")
    ax.axhline(0, color=INK, lw=0.8)
    ax.set_xticks(xpos, keys)
    ax.set_xlabel("seed pair")
    ax.set_title("Seeds agree on geometry, not on coordinates", loc="left", fontweight="bold")
    ax.legend(fontsize=8, frameon=False, ncol=2, loc="upper center", bbox_to_anchor=(0.5, -0.2))
    style_axes(ax)
    save(fig, "fig-seed-agreement.png")


# ---- 4. transformer block ---------------------------------------------------
def transformer():
    fig, ax = canvas(5.6, 8.0, (-3.4, 3.8), (-0.8, 11.8), "Decoder-only block (pre-LN)",
                     "Implemented in transformer.ts. The shaded block repeats N times.")
    w = 3.4
    y = {"in": 0.0, "emb": 1.1, "ln1": 2.5, "mha": 3.8, "add1": 5.0, "ln2": 6.1, "ff": 7.2, "add2": 8.4,
         "lnf": 9.4, "out": 10.3}
    ax.add_patch(FancyBboxPatch((-2.15, 1.55), 4.9, 7.3, boxstyle="round,pad=0,rounding_size=0.25", linewidth=1.2,
                                linestyle="-", edgecolor=KIND["measured"][1], facecolor="#F2FAF8", zorder=0))
    ax.text(-2.3, 5.3, r"$\times N$", ha="right", va="center", fontsize=13, color=KIND["measured"][1],
            fontweight="bold")
    node(ax, 0, y["in"], w, 0.65, r"token ids  $t_1 \ldots t_n$", "neutral")
    node(ax, 0, y["emb"], w, 0.65, "token emb.  +  position emb.", "measured")
    node(ax, 0, y["ln1"], w, 0.6, "LayerNorm", "neutral", 8.5)
    node(ax, 0, y["mha"], w, 1.05, "causal multi-head attention\nheads  →  concat  →  $W_O$", "accent")
    node(ax, 0, y["ln2"], w, 0.6, "LayerNorm", "neutral", 8.5)
    node(ax, 0, y["ff"], w, 0.65, "FFN:  $W_1$,  ReLU,  $W_2$", "accent")
    node(ax, 0, y["lnf"], w, 0.65, "LayerNorm$_f$  +  linear head", "measured")
    node(ax, 0, y["out"], w, 0.6, "logits  →  softmax", "measured")
    for k in ("add1", "add2"):
        ax.add_patch(Circle((0, y[k]), 0.26, facecolor="white", edgecolor=INK, linewidth=1.4, zorder=3))
        ax.text(0, y[k], "+", ha="center", va="center", fontsize=12, zorder=4)
    half = {"in": 0.33, "emb": 0.33, "ln1": 0.3, "mha": 0.53, "ln2": 0.3, "ff": 0.33, "lnf": 0.33, "out": 0.3,
            "add1": 0.26, "add2": 0.26}
    order = ["in", "emb", "ln1", "mha", "add1", "ln2", "ff", "add2", "lnf", "out"]
    for a, b in zip(order[:-1], order[1:]):
        arrow(ax, (0, y[a] + half[a]), (0, y[b] - half[b]))
    # residual bypasses leave the stream just below each LayerNorm and rejoin at the "+" nodes
    for start, end in ((y["ln1"] - 0.62, y["add1"]), (y["ln2"] - 0.62, y["add2"])):
        ax.plot([0, 2.35, 2.35], [start, start, end], color=MUTED, lw=1.4, zorder=1)
        arrow(ax, (2.35, end), (0.3, end), color=MUTED, lw=1.4)
        ax.text(2.5, (start + end) / 2, "residual", rotation=90, va="center", ha="left", fontsize=8, color=MUTED)
    save(fig, "fig-transformer-block.png")


# ---- 5. taxonomy mapping (redrawn from Sheth et al., Fig. 1) ----------------
def taxonomy():
    rows = [
        ("1a  Compressed knowledge-graph representation", "e.g. K-Adapter, TDLR",
         "Perception H · Abstraction M · Analogy M · Planning M",
         "Explainability L · Constraints M · Scalability H · Continual H", 6.2),
        ("1b  Compressed logic representation", "e.g. KB-ANN, Logical Neural Networks",
         "Perception L · Abstraction M · Analogy M · Planning M",
         "Explainability L · Constraints L · Scalability L · Continual L", 4.5),
        ("2a  Decoupled integration", "e.g. Langchain pipelines, Wolfram + ChatGPT",
         "Perception H · Abstraction M · Analogy M · Planning M",
         "Explainability M · Constraints M · Scalability H · Continual L", 2.4),
        ("2b  Intertwined integration", "e.g. probabilistic programs, PK-iL",
         "Perception H · Abstraction H · Analogy H · Planning H",
         "Explainability H · Constraints H · Scalability H · Continual H", 0.7),
    ]
    mine = {0: "This work: logit hard mask / soft bias\n(1a-style, by analogy)",
            2: "This work: verifier + reasoning trace\n(2a)",
            3: "Future: training-time semantic loss\n(towards 2b)"}
    fig, ax = canvas(14.0, 6.4, (-0.2, 14.0), (-0.4, 7.2), "Taxonomy of neurosymbolic methods and where this work sits",
                     "Redrawn from Fig. 1 of Sheth, Roy and Gaur (2023); H / M / L are the authors' ratings.")
    node(ax, 0.9, 3.45, 1.6, 1.3, "Neurosymbolic\nAI methods", "neutral", 9, True)
    node(ax, 3.3, 5.35, 2.8, 1.2, "1. Lowering\nsymbolic knowledge compressed\ninto neural patterns", "accent", 8.2)
    node(ax, 3.3, 1.55, 2.8, 1.2, "2. Lifting\nneural patterns lifted into\nsymbolic knowledge", "accent", 8.2)
    arrow(ax, (1.7, 3.8), (1.9, 5.2), rad=-0.1)
    arrow(ax, (1.7, 3.1), (1.9, 1.7), rad=0.1)
    for i, (t, eg, a, b, yy) in enumerate(rows):
        node(ax, 7.85, yy, 5.7, 1.4, "", "neutral")
        ax.text(5.2, yy + 0.45, t, fontsize=9.5, fontweight="bold", va="center")
        ax.text(5.2, yy + 0.12, eg, fontsize=8, color=MUTED, va="center", style="italic")
        ax.text(5.2, yy - 0.25, a, fontsize=8.5, va="center")
        ax.text(5.2, yy - 0.52, b, fontsize=8.5, va="center")
        arrow(ax, (4.75, 5.35 if i < 2 else 1.55), (5.0, yy), rad=0.05, lw=1.2)
        if i in mine:
            node(ax, 12.5, yy, 2.8, 1.0, mine[i], "design", 7.6)
            arrow(ax, (11.1, yy), (10.75, yy), color=KIND["design"][1], lw=1.2, ms=9)
    save(fig, "fig-taxonomy-mapping.png")


# ---- 6. neuro-symbolic data flow -------------------------------------------
def flow():
    fig, ax = canvas(9.2, 6.3, (-2.6, 8.4), (-1.0, 6.4), "Proposed neuro-symbolic data flow",
                     "Symbolic parts specified, not implemented. They act on the logits and on the finished text.")
    w = 3.6
    node(ax, 0, 0, w, 0.65, "context ids", "neutral")
    node(ax, 0, 1.3, w, 0.65, r"transformer  →  logits $\in \mathbb{R}^V$", "measured")
    node(ax, 0, 2.8, w, 1.0, "logits processor\nmask $-\\infty$  ·  bias $+\\lambda$", "design", bold=True)
    node(ax, 0, 4.3, w, 0.65, "temperature · top-$p$ · sample", "neutral")
    node(ax, 0, 5.5, w, 0.65, "verifier (post hoc)", "design", bold=True)
    node(ax, 5.2, 4.2, 2.9, 1.0, "knowledge base\ntriples · Horn rules", "design")
    node(ax, 5.2, 1.5, 2.9, 0.8, "reasoning trace\nrules fired · mass moved", "design", 8.5)
    for a, b in ((0.33, 0.97), (1.63, 2.3), (3.3, 3.97), (4.63, 5.17)):
        arrow(ax, (0, a), (0, b))
    arrow(ax, (3.75, 4.0), (1.82, 3.05), color=KIND["design"][1], rad=0.1)
    arrow(ax, (5.2, 4.7), (1.82, 5.5), color=KIND["design"][1], rad=0.15)
    arrow(ax, (1.82, 2.55), (3.75, 1.75), color=KIND["design"][1], rad=-0.1)
    legend_status(ax, -2.4, -0.9, kinds=("measured", "design"))
    save(fig, "fig-neurosymbolic-flow.png")


# ---- 7. attention explainers (original; they replace screenshots of the study note)
TOK = ["The", "cat", "sat", "on", "the", "mat"]


def tokens_row(ax, toks, y, xs, hl=None, fs=11):
    for x, t in zip(xs, toks):
        ax.text(x, y, t, ha="center", va="center", fontsize=fs, fontweight="bold" if t == hl else "normal",
                color=KIND["accent"][1] if t == hl else INK)


def arc(ax, x0, y0, x1, y1, w, color, rad):
    ax.add_patch(FancyArrowPatch((x0, y0), (x1, y1), arrowstyle="-|>", mutation_scale=9, linewidth=w, color=color,
                                 connectionstyle=f"arc3,rad={rad}", alpha=0.9, zorder=1, shrinkA=2, shrinkB=2))


def attention_qkv():
    xs = np.arange(len(TOK)) * 2.0 + 1.0
    fig, ax = canvas(10.5, 4.6, (0, 12.4), (-1.9, 3.8), "Query, key and value",
                     "Schematic. Arc width = attention weight (illustrative, not measured). "
                     "The token “sat” can only look left.")
    tokens_row(ax, TOK, -0.1, xs, "sat")
    for x in xs:
        ax.add_patch(Circle((x, 0.8), 0.32, facecolor=KIND["neutral"][0], edgecolor=KIND["neutral"][1], lw=1.4,
                            zorder=2))
        for dx, c in ((-0.38, Q_COL), (0.0, K_COL), (0.38, V_COL)):
            ax.add_patch(Circle((x + dx, 1.65), 0.14, facecolor=c, edgecolor="white", lw=0.8, zorder=3))
            ax.plot([x, x + dx], [1.12, 1.52], color="#CBD5E1", lw=1, zorder=1)
    qx = xs[2] - 0.38
    arc(ax, qx, 1.9, xs[0], 1.9, 1.4, Q_COL, 0.55)
    arc(ax, qx, 1.9, xs[1], 1.9, 3.6, Q_COL, 0.7)
    ax.text(xs[1] + 0.0, 3.05, "high weight", ha="center", fontsize=8, color=Q_COL)
    ax.text(xs[0] + 0.3, 2.55, "low weight", ha="center", fontsize=8, color=Q_COL)
    for j in (3, 4, 5):
        ax.plot([xs[j]], [1.85], marker="x", color=MUTED, markersize=7, zorder=2)
    ax.text(xs[4], 2.35, "hidden by the causal mask", ha="center", fontsize=8.5, color=MUTED)
    for x, c, t, d in ((0.4, Q_COL, "Query", "what a token is looking for"),
                       (4.4, K_COL, "Key", "what a token offers"),
                       (8.0, V_COL, "Value", "the content it passes on")):
        ax.add_patch(Circle((x, -1.35), 0.14, facecolor=c, edgecolor="white"))
        ax.text(x + 0.3, -1.35, f"{t}: {d}", va="center", fontsize=9)
    save(fig, "fig-attn-qkv.png")


def attention_bank():
    fig, axes = plt.subplots(1, 2, figsize=(11.5, 3.2))
    cases = [
        (["the", "muddy", "river", "bank"], {1: 1.6, 2: 3.4}, KIND["measured"][1], "river sense"),
        (["I", "deposit", "money", "at", "the", "bank"], {1: 2.4, 2: 3.4}, KIND["design"][1], "finance sense"),
    ]
    for ax, (toks, ws, col, tag) in zip(axes, cases):
        n = len(toks)
        xs = np.arange(n) * 2.1 + 1.0
        ax.set_xlim(0, 6 * 2.1 + 0.2)
        ax.set_ylim(-1.0, 2.1)
        ax.axis("off")
        ax.grid(False)
        tokens_row(ax, toks, 0, xs, "bank")
        ax.add_patch(FancyBboxPatch((xs[-1] - 0.7, -0.35), 1.4, 0.7, boxstyle="round,pad=0,rounding_size=0.15",
                                    edgecolor=col, facecolor="none", lw=1.8))
        for j, w in ws.items():
            arc(ax, xs[-1], 0.5, xs[j], 0.5, w, col, 0.4)
        ax.text(xs[-1], -0.85, f"“bank”  →  {tag}", ha="center", fontsize=9.5, color=col, fontweight="bold")
    fig.suptitle("One word, two contexts: “bank” attends to different left neighbours", x=0.02, ha="left",
                 fontsize=12.5, fontweight="bold")
    fig.text(0.02, -0.02, "Schematic. A decoder-only token sees only tokens to its left, so the disambiguating words "
             "must come before “bank”. Arc width is illustrative.", fontsize=8.5, color=MUTED, ha="left")
    save(fig, "fig-attn-bank.png")


def attention_causal():
    rng = np.random.default_rng(7)
    n, d = len(TOK), 8
    X = rng.normal(size=(n, d))
    Wq, Wk = rng.normal(size=(d, d)) / np.sqrt(d), rng.normal(size=(d, d)) / np.sqrt(d)
    mask = np.tril(np.ones((n, n)))
    S = np.where(mask == 1, (X @ Wq) @ (X @ Wk).T / np.sqrt(d), -np.inf)
    A = np.exp(S - S.max(1, keepdims=True))
    A /= A.sum(1, keepdims=True)
    fig, (a, b) = plt.subplots(1, 2, figsize=(10.2, 4.7))
    a.imshow(1 - mask, cmap="Greys", vmin=0, vmax=1.7)
    for i in range(n):
        for j in range(n):
            a.text(j, i, "0" if mask[i, j] else "−∞", ha="center", va="center", fontsize=10, fontweight="bold",
                   color=INK if mask[i, j] else "white")
    b.imshow(A, cmap="YlGnBu", vmin=0, vmax=1)
    for i in range(n):
        for j in range(i + 1):
            b.text(j, i, f"{A[i, j]:.2f}", ha="center", va="center", fontsize=8.5,
                   color="white" if A[i, j] > 0.55 else INK)
    for ax_, t in ((a, "Causal mask  M"), (b, "softmax(QKᵀ/√d_k + M)")):
        ax_.set_xticks(range(n), TOK, fontsize=9)
        ax_.set_yticks(range(n), TOK, fontsize=9)
        ax_.xaxis.tick_top()
        ax_.grid(False)
        for sp in ax_.spines.values():
            sp.set_visible(False)
        ax_.set_title(t, loc="left", fontweight="bold", pad=26)
    a.set_ylabel("query token (row)")
    fig.text(0.02, 0.0, "Computed here with seeded random, untrained weights (numpy, seed 7, d = 8). It shows structure: "
             "each row sums to 1 and no token attends to the future. It is not learned behaviour.",
             fontsize=8.5, color=MUTED, ha="left")
    save(fig, "fig-attn-causal.png")


def multihead_ffn():
    fig, ax = canvas(11.5, 4.7, (0, 11.8), (-0.9, 4.6), "From heads to a refined token",
                     "Schematic of one position. The same head, W_O and FFN weights are used at every position.")
    node(ax, 0.9, 2.0, 1.5, 0.9, "token\nvector $x$", "neutral")
    hy = [3.4, 2.4, 1.4, 0.4]
    labels = ["head 1", "head 2", "…", "head h"]
    for yy, lab in zip(hy, labels):
        if lab == "…":
            ax.text(3.4, yy, "⋮", ha="center", va="center", fontsize=16, color=MUTED)
            continue
        node(ax, 3.4, yy, 2.6, 0.7, f"{lab}:  $\\mathrm{{softmax}}(QK^{{\\top}}/\\sqrt{{d_k}}+M)V$", "accent", 8)
        arrow(ax, (1.65, 2.0), (2.1, yy), color=MUTED, lw=1.1, ms=8)
        arrow(ax, (4.7, yy), (5.25, 2.0), color=MUTED, lw=1.1, ms=8)
    node(ax, 6.0, 2.0, 1.4, 0.9, "concat", "neutral")
    node(ax, 7.6, 2.0, 1.3, 0.9, "$W_O$\nproject", "accent")
    node(ax, 9.3, 2.0, 1.5, 0.9, "context\nvector", "neutral")
    arrow(ax, (6.7, 2.0), (6.95, 2.0))
    arrow(ax, (8.25, 2.0), (8.55, 2.0))
    node(ax, 9.3, 0.4, 1.9, 0.7, "FFN  (2 layers)", "accent", 8.5)
    arrow(ax, (9.3, 1.55), (9.3, 0.77))
    ax.text(10.4, 0.4, "refined token →\nnext layer", fontsize=8.5, va="center", color=MUTED)
    ax.text(3.4, 3.95, "h heads in parallel, each in a d/h sub-space", ha="center", fontsize=8.5, color=MUTED)
    save(fig, "fig-attn-multihead.png")


def layers():
    fig, ax = canvas(8.6, 5.9, (-0.2, 8.4), (-0.9, 6.0), "Stacked layers",
                     "The study note's intuition. Not measured in this project.")
    names = [("Layer 1", "“syntax”", "which words go together"), ("Layer 2", "“meaning”", "what they refer to"),
             ("Layer 3", "“reasoning”", "the note's hope; no evidence at this scale")]
    ys = [1.4, 3.0, 4.6]
    for (a, b, c), yy in zip(names, ys):
        node(ax, 3.2, yy, 4.8, 1.2, f"{a}   {b}\nattention  +  feed-forward\n{c}", "accent", 8.8)
    for y0, y1 in zip(ys[:-1], ys[1:]):
        arrow(ax, (3.2, y0 + 0.62), (3.2, y1 - 0.62))
    for x in np.linspace(1.4, 5.0, 6):
        ax.add_patch(Circle((x, -0.1), 0.16, facecolor=KIND["neutral"][0], edgecolor=KIND["neutral"][1], lw=1.2))
        arrow(ax, (x, 0.08), (x, 0.74), color=MUTED, lw=1, ms=7)
    ax.text(3.2, -0.6, "one vector per token in, one vector per token out", ha="center", fontsize=8.5, color=MUTED)
    node(ax, 7.0, 3.0, 2.1, 1.6, "what the\nobjective rewards:\nnext-token\nplausibility", "design", 8.2)
    arrow(ax, (5.7, 3.0), (5.95, 3.0), color=KIND["design"][1], lw=1.2, ms=9)
    save(fig, "fig-layers.png")


if __name__ == "__main__":
    for fn in (pipeline, xor, skipgram, transformer, taxonomy, flow, attention_qkv, attention_bank, attention_causal,
               multihead_ffn, layers):
        fn()
