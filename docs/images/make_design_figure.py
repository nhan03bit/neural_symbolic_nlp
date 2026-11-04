"""The README's pipeline figure: one knowledge base, one allowed set, two integration points.

    python3 docs/images/make_design_figure.py      # needs matplotlib and numpy

Writes fig-design-pipeline.png. It is a design diagram, so it has no inputs and no measured
number is typed in here. Style comes from make_figures.py so all figures share one visual
system: solid teal = implemented, dotted violet = specified, not built.
"""
from matplotlib.patches import Rectangle

from make_figures import INK, KIND, MUTED, arrow, canvas, legend_status, node, save

BUILT, DESIGN = "measured", "design"
RAIL = KIND[DESIGN][1]  # the allowed set and the KB are not built, so their connectors are violet


def rail(ax, points, ls=":"):
    """A connector with right-angled corners; only the last segment has an arrowhead."""
    for a, b in zip(points[:-2], points[1:-1]):
        ax.plot([a[0], b[0]], [a[1], b[1]], color=RAIL, lw=1.5, ls=ls, zorder=1, solid_capstyle="round")
    arrow(ax, points[-2], points[-1], color=RAIL, ls=ls)


def lane(ax, y0, y1, title, sub):
    ax.add_patch(Rectangle((3.75, y0), 13.2, y1 - y0, facecolor="#F9FAFB", edgecolor="none", zorder=0))
    ax.text(16.8, y1 - 0.12, title, ha="right", va="top", fontsize=10, fontweight="bold")
    ax.text(16.8, y1 - 0.42, sub, ha="right", va="top", fontsize=8.5, color=MUTED, linespacing=1.25)


def main():
    fig, ax = canvas(13.2, 6.5, (0, 17), (-0.15, 8.3),
                     title="One knowledge base, one allowed set, two integration points")

    lane(ax, 5.15, 7.7, "Training (integration point 2)", "shapes the distribution,\nchanges the weights")
    lane(ax, 1.1, 4.0, "Decoding (integration point 1)", "guarantees covered cases,\nnever touches the weights")

    # the shared source
    node(ax, 1.05, 4.55, 1.7, 1.25, "Knowledge\nbase: triples,\nHorn rules", DESIGN, bold=True)
    node(ax, 3.05, 4.55, 1.2, 1.25, "allowed\nset $A_t$", DESIGN, fs=10, bold=True)
    arrow(ax, (1.9, 4.55), (2.45, 4.55), color=RAIL, ls=":")

    # training lane, gradient path
    y = 5.95
    node(ax, 5.0, y, 1.5, 0.85, "corpus\nwindows", BUILT)
    node(ax, 7.15, y, 1.7, 0.85, "transformer\nforward", BUILT)
    node(ax, 9.95, y, 2.75, 0.85, "$L$ = CE + $\\lambda_s\\cdot(-\\log P_A)$\n Semantic Loss", DESIGN)
    node(ax, 12.65, y, 1.55, 0.85, "backward,\nAdam", BUILT)
    node(ax, 15.2, y, 1.4, 0.85, "weights", BUILT, bold=True)
    for a, b in [(5.75, 6.3), (8.0, 8.575), (11.325, 11.875), (13.425, 14.5)]:
        arrow(ax, (a, y), (b, y))

    # decoding lane, logit path
    y = 2.1
    node(ax, 4.75, y, 1.1, 0.85, "generated\nprefix", BUILT, fs=8)
    node(ax, 6.45, y, 1.45, 0.85, "transformer\nforward", BUILT)
    node(ax, 8.25, y, 0.95, 0.85, "logits", BUILT)
    node(ax, 10.45, y, 1.8, 0.85, "Hard Logit\nMask: $-\\infty$", DESIGN)
    node(ax, 12.5, y, 1.6, 0.85, "temperature,\ntop-p, sample", BUILT)
    node(ax, 14.1, y, 0.75, 0.85, "text", BUILT)
    node(ax, 15.85, y, 1.5, 0.85, "Verifier\nparse, check", DESIGN)
    for a, b in [(5.3, 5.725), (7.175, 7.775), (8.725, 9.55), (11.35, 11.7), (13.3, 13.725), (14.475, 15.1)]:
        arrow(ax, (a, y), (b, y))

    # the one allowed set, used twice
    rail(ax, [(3.05, 5.175), (3.05, 7.9), (9.95, 7.9), (9.95, 6.375)])
    ax.text(6.4, 7.95, "$A_t$ on corpus prefixes, unmasked probabilities", ha="center", va="bottom", fontsize=8.5,
            color=RAIL)
    rail(ax, [(3.05, 3.925), (3.05, 0.8), (10.45, 0.8), (10.45, 1.675)])
    ax.text(6.75, 0.86, "$A_t$ on generated prefixes", ha="center", va="bottom", fontsize=8.5, color=RAIL)

    # the KB also feeds the verifier directly
    rail(ax, [(1.05, 3.925), (1.05, 0.25), (15.85, 0.25), (15.85, 1.675)])
    ax.text(8.45, 0.31, "the same facts check the finished text", ha="center", va="bottom", fontsize=8.5, color=RAIL)

    # the saved weights are how training reaches decoding
    ax.plot([15.2, 15.2], [5.525, 4.55], color=INK, lw=1.5, zorder=1)
    ax.plot([15.2, 6.45], [4.55, 4.55], color=INK, lw=1.5, zorder=1)
    ax.plot([6.45, 6.45], [4.55, 4.3], color=INK, lw=1.5, zorder=1)
    arrow(ax, (6.45, 4.4), (6.45, 2.525))
    ax.text(11.1, 4.6, "saved weights carry training into decoding", ha="center", va="bottom", fontsize=8.5,
            color=MUTED)

    # where the two stages meet: mass the trained network still puts on banned tokens, before the mask
    node(ax, 9.2, 3.3, 1.7, 1.0, "massBefore\nbanned mass\nbefore masking", "accent", fs=8.5)
    ax.plot([9.2, 9.2], [2.8, 2.1], color=KIND["accent"][1], lw=1.5, zorder=1)
    ax.plot([9.2], [2.1], "o", color=KIND["accent"][1], ms=6, zorder=4)
    node(ax, 11.65, 3.3, 1.8, 1.0, "Reasoning\nTrace: rules fired,\ntokens blocked", DESIGN, fs=8)
    arrow(ax, (10.05, 3.3), (10.75, 3.3), color=RAIL, ls=":")
    arrow(ax, (11.15, 2.525), (11.15, 2.8), color=RAIL, ls=":")

    legend_status(ax, 10.6, 7.92, kinds=(BUILT, DESIGN))
    save(fig, "fig-design-pipeline.png")


if __name__ == "__main__":
    main()
