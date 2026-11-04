"""README figure: one real sentence traced through the civil-law knowledge base.

    python3 docs/images/make_kb_figure.py      # needs matplotlib

Writes fig-civil-law-kb.png. An original drawing in the visual convention of process-knowledge figures
(Sheth, Roy and Gaur 2023, Fig. 4): query text with concept callouts, a block arrow, a dashed panel with
elliptical True/False nodes, one green reached outcome and formulas as plain text. Measurements and reasons
are in reports/Symbolic KB figure conventions.md.

The graph's defined_by, is_a and counterpart facts are parsed from symbolic.ts, and the path's facts are asserted
against that file. The test nodes, rule lines and TRACE are typed by hand. TRACE is a read-only probe of the saved
e2000 weights (frame alone, one trained run, mask off, T = 1). Its scripts and raw output are recorded in
research_notes/Symbolic KB figure conventions/civil_law_worked_example.md.
"""
import math
import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Ellipse, FancyBboxPatch, Polygon, Rectangle

HERE = Path(__file__).parent
KB_FILE = HERE.parent.parent / "src" / "routes" / "neural-symbolic" / "symbolic.ts"
TRACE = {"brings": 0.6137, "owns": 0.1246, "said": 0.0118}  # next-token probabilities, see the docstring

plt.rcParams.update({"font.family": ["Arial", "DejaVu Sans"], "mathtext.fontset": "stix"})
INK, EDGE, GREY, GREEN, FAINT = "#010202", "#595959", "#EEEDED", "#94C47D", "#8A8A8A"
S = 10 / 5.66  # geometry is in points of the reference figure, scaled so the node font is 10 pt
W, H = 400, 279
LW, FS, FS_CALLOUT = 0.47 * S, 5.66 * S, 4.47 * S
DASH = (0, (4, 3))

fig = plt.figure(figsize=(W * S / 72, H * S / 72))
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W)
ax.set_ylim(H, 0)
ax.axis("off")


def label(x, y, s, fs=FS, ha="center", va="center", color=INK, weight="normal", z=6):
    return ax.text(x, y, s, fontsize=fs, ha=ha, va=va, color=color, fontweight=weight, zorder=z, linespacing=1.15)


def oval(cx, cy, w, h, s, fill=GREY, fs=FS, weight="normal", ink=INK):
    ax.add_patch(Ellipse((cx, cy), w, h, fc=fill, ec=ink, lw=LW, zorder=3))
    label(cx, cy, s, fs=fs, weight=weight, color=INK if ink == INK else "#3A3A3A", z=4)


def edge(p, q, taken=False, head=True, color=INK, lw=None):
    """Taken edges are solid and heavier. All others use the reference's dash, with a separate filled head."""
    (a, b), (c, d) = p, q
    length = math.hypot(c - a, d - b)
    ux, uy = (c - a) / length, (d - b) / length
    hl, hw = (3.2, 2.4) if taken else (2.14, 1.55)
    stop = hl * 0.7 if head else 0
    ax.add_line(Line2D([a, c - ux * stop], [b, d - uy * stop], color=color, lw=lw or (LW * 2.2 if taken else LW),
                       ls="-" if taken else DASH, zorder=2, dash_capstyle="butt"))
    if head:
        bx, by, nx, ny = c - ux * hl, d - uy * hl, -uy * hw / 2, ux * hw / 2
        ax.add_patch(Polygon([(c, d), (bx + nx, by + ny), (bx - nx, by - ny)], fc=color, ec="none", zorder=5))


def callout(x, y, w, h, head, value, fill=GREY):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=3.6", fc=fill, ec=EDGE, lw=LW, zorder=7))
    label(x + w / 2, y + h * 0.31, head, fs=FS_CALLOUT, weight="bold", z=8)
    label(x + w / 2, y + h * 0.71, value, fs=FS_CALLOUT, z=8)


def runs(x, y, parts, fs):
    """Draw mixed regular and bold words on one line. Returns each word's (left, right) in data units."""
    renderer = fig.canvas.get_renderer()
    inverse = ax.transData.inverted()

    def width(text):
        box = text.get_window_extent(renderer)
        return inverse.transform((box.x1, 0))[0] - inverse.transform((box.x0, 0))[0]

    probe = ax.text(0, 0, "n n", fontsize=fs)
    solid = ax.text(0, 0, "nn", fontsize=fs)
    gap = width(probe) - width(solid)
    probe.remove()
    solid.remove()
    spans = {}
    for word, bold in parts:
        t = label(x, y, word, fs=fs, ha="left", va="baseline", weight="bold" if bold else "normal")
        spans[word] = (x, x + width(t))
        x += width(t) + gap
    return spans


def read_kb():
    code = KB_FILE.read_text()
    block = code[code.index("export const TRIPLES"):code.index("export const RULES")]
    facts = re.findall(r'rel: "(\w+)", a: "(\w+)", b: "(\w+)"', block)
    pick = lambda rel: [(a, b) for r, a, b in facts if r == rel]
    return dict(pick("defined_by")), dict(pick("is_a")), pick("counterpart"), set(facts), set(re.findall(r'id: "(R-[A-Z-]+)"', code))


# ---- query, with concepts attached to the words that carry them ----------------------------------------------
verbs, classes, pairs, facts, rule_ids = read_kb()
assert verbs["claimant"] == "brings" and verbs["landlord"] == "owns"
assert classes["claimant"] == "court_party" and classes["landlord"] == "housing_party"
assert ("disjoint", "court_party", "housing_party") in facts and {"R-CLASS", "R-OTHER-DOMAIN"} <= rule_ids

label(10, 6.5, r"$\mathbf{X}$ = the words before owns     $\mathbf{Z}$ = concepts bound by exact word match, no learned parameters", ha="left")
ax.add_patch(FancyBboxPatch((4, 13), W - 8, 62, boxstyle="round,pad=0,rounding_size=13.2", fc="white", ec=INK,
                            lw=2 * LW, zorder=1))
QY = 49
span = runs(13, QY, [("the", False), ("claimant", True), ("is the person who", True), ("owns", True), ("the home.", False)],
            FS * 1.3)
label(span["the home."][1] + 9, QY, "model sample: seed 1, T = 1, top-p 1.0, mask off", fs=FS_CALLOUT, ha="left", va="baseline", color=EDGE)


def leader(x, y0, y1):
    ax.add_line(Line2D([x, x], [y0, y1], color=EDGE, lw=LW, zorder=6))


claimant_x, frame_x, owns_x = (sum(span[w]) / 2 for w in ("claimant", "is the person who", "owns"))
callout(9, 18, 72, 14, "KB lookup from the role word", "is_a(claimant, court_party)")
leader(claimant_x, 32, 40)
callout(frame_x - 2, 18, 62, 14, "Frame T-F0", "?x is the person who")
leader(frame_x, 32, 40)
callout(frame_x + 66, 18, 126, 14, "Corpus L23, for comparison", "the claimant is the person who brings a claim")
callout(9, 57, 113, 14, "CPR r2.3(1), a source and not a KB fact", "'claimant' means a person who makes a claim")
leader(claimant_x, 52, 57)
callout(owns_x - 5, 64, 62, 14, "Next word, frame alone", f"owns, p = {TRACE['owns']:.4f}", GREEN)
leader(owns_x, 52, 64)

# block arrow into the panel
ax.add_patch(Polygon([(x + 200, y) for x, y in [(-4.2, 72), (4.2, 72), (4.2, 77.6), (8.3, 77.6), (0, 83.2), (-8.3, 77.6), (-4.2, 77.6)]],
                     fc=INK, ec="none", zorder=8))
ax.add_patch(Rectangle((4, 80), W - 8, 171, fc="none", ec=INK, lw=LW, ls=DASH, zorder=1))

# ---- the test allowed() applies to this word --------------------------------------------------------------------
root, n2, n3 = (74, 99), (58, 137), (48, 176)
oval(*root, 78, 24, "Frame with a\nKB role?")
oval(*n2, 80, 25, "Does owns define\nthe claimant?")
oval(*n3, 86, 25, "Is a ban on owns enforced\nin this frame?", fs=FS * 0.92)
oval(42, 220, 70, 33, "Banned in\nthis frame ($\\mathbf{Y}$)\n" + f"owns, p = {TRACE['owns']:.4f}", GREEN, fs=FS * 0.92)
oval(136, 131, 56, 25, "No constraint ($\\mathbf{Y}$)", fs=FS * 0.82)
oval(128, 172, 58, 27, "Supported ($\\mathbf{Y}$)\n" + f"brings, {TRACE['brings']:.4f}", fs=FS * 0.86)
oval(119, 220, 62, 27, "No constraint ($\\mathbf{Y}$)\n" + f"said, {TRACE['said']:.4f}", fs=FS * 0.86)
edge((root[0], 111), (n2[0] + 2, 124.5))
label(58, 117, "True", ha="right")
edge((root[0] + 4, 110.9), (134, 118.5))
label(112, 110, "False", ha="left")
edge((n2[0], 149.5), (n3[0], 163.5))
label(49, 156, "False", ha="right")
edge((n2[0] + 22, 147.4), (112, 159.5))
label(94, 148, "True", ha="left")
edge((n3[0], 188.5), (42, 203.5))
label(41, 195, "True", ha="right")
edge((n3[0] + 22, 186.8), (106, 207))
label(87, 193, "False", ha="left")

# ---- the knowledge base, with this word's path through it ----------------------------------------------------
step = 54
COLUMNS = [200 + step * k for k in range(4)]
ROW_V_TOP, ROW_R_TOP, ROW_C, ROW_R_BOT, ROW_V_BOT = 97, 122, 153, 184, 209
EW, EH = 44, 16
nodes = {}


def kb_node(name, x, y, text=None, on_path=False, fill=GREY, weight="normal"):
    nodes[name] = (x, y)
    oval(x, y, EW, EH, text or name, fill=fill, fs=FS * 0.82, weight=weight, ink=INK if on_path else FAINT)


path_nodes = {"claimant", "court_party", "housing_party", "landlord"}
for x, (top, bottom) in zip(COLUMNS, pairs):
    assert classes[top] == classes[bottom]
    kb_node(classes[top], x, ROW_C, classes[top].replace("_", " "), on_path=classes[top] in path_nodes)
    kb_node(top, x, ROW_R_TOP, on_path=top in path_nodes, weight="bold" if top == "claimant" else "normal")
    kb_node(bottom, x, ROW_R_BOT)
    for role, y in ((top, ROW_V_TOP), (bottom, ROW_V_BOT)):
        verb = verbs[role]
        word = verb.replace("_", " ")
        reached = verb == "owns"
        kb_node(f"v:{verb}", x, y, word, on_path=reached, fill=GREEN if reached else GREY, weight="bold" if reached else "normal")
        ry = ROW_R_TOP if role == top else ROW_R_BOT
        sign = 1 if role == top else -1
        if not reached:
            edge((x, ry - sign * EH / 2), (x, y + sign * EH / 2), color=FAINT)
    for role, ry, sign in ((top, ROW_R_TOP, 1), (bottom, ROW_R_BOT, -1)):
        if role not in path_nodes:
            edge((x, ry + sign * EH / 2), (x, ROW_C - sign * EH / 2), color=FAINT)

# the path, numbered in the order the proof uses it
c0, c1 = COLUMNS[0], COLUMNS[1]
edge((c0, ROW_R_TOP + EH / 2), (c0, ROW_C - EH / 2), taken=True)
edge((c0 + EW / 2, ROW_C), (c1 - EW / 2, ROW_C), taken=True, head=False)
edge((c1, ROW_R_TOP + EH / 2), (c1, ROW_C - EH / 2), taken=True)
edge((c1, ROW_R_TOP - EH / 2), (c1, ROW_V_TOP + EH / 2), taken=True)
for x, y, s, ha in [(c0 - 2, 138, "1  is_a", "right"), ((c0 + c1) / 2, ROW_C + 11, "2  disjoint", "center"),
                    (c1 - 2, 138, "3  is_a", "right"), (c1 - 2, 109.5, "4  defined_by", "right")]:
    label(x, y, s, fs=FS * 0.74, ha=ha)

label(168, 223, r"$\mathbf{R\text{-}CLASS}$, steps 3, 4:  is_a($y$, $d$) $\wedge$ defined_by($y$, $v$) $\Rightarrow$ class_verb($d$, $v$)",
      fs=FS * 0.8, ha="left")
label(168, 232, r"$\mathbf{R\text{-}OTHER\text{-}DOMAIN}$, steps 1, 2:  is_a($x$, $c$) $\wedge$ disjoint($c$, $d$) $\wedge$ class_verb($d$, $v$) "
      r"$\Rightarrow$ not_defined_by($x$, $v$)", fs=FS * 0.8, ha="left")

# ---- output ------------------------------------------------------------------------------------------------------
label(10, 259, r"$\mathbf{Y}$ = allowed(KB, $\mathbf{X}$)", ha="left")
ax.add_patch(FancyBboxPatch((168, 239), 110, 9, boxstyle="round,pad=0,rounding_size=2", fc=GREEN, ec="none", zorder=2))
label(223, 243.5, "not_defined_by(claimant, owns)", fs=FS * 0.86)
label(283, 243.5, "owns does not define the role word", fs=FS * 0.76, ha="left", color=EDGE)
for y, line in [(259, "England and Wales, educational, not legal advice. No mask is connected yet: a banned word is not removed today."),
                (266, "not_defined_by says a verb does not define the role word, not that a claimant can never own anything. p: e2000 weights, one run, mask off, T = 1."),
                (273, "Party names are KB class labels, disjoint as labels and not as people. defined_by(landlord, owns) is a corpus simplification.")]:
    label(W - 8, y, line, fs=FS_CALLOUT, ha="right", color=EDGE)
fig.savefig(HERE / "fig-civil-law-kb.png", dpi=220, facecolor="white")
print("wrote fig-civil-law-kb.png")
