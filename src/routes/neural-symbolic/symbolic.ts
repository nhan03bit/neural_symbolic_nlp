// src/routes/neural-symbolic/symbolic.ts
/**
 * Knowledge base: triples + Horn rules, closed by naive forward chaining.
 * Every fact keeps its provenance, so any ban can be explained as a rule chain.
 */
export type Triple = { rel: string; a: string; b: string };

/** Terms starting with "?" are variables, e.g. { rel: "is_a", a: "?x", b: "?y" }. */
export type Rule = { id: string; if: Triple[]; then: Triple };
export type Provenance =
  | { source: "kb" }
  | { source: "lifted"; p: number }
  | { source: "rule"; rule: string; from: string[] };

export const key = (t: Triple) => `${t.rel}:${t.a}:${t.b}`;
const isVar = (s: string) => s.startsWith("?");

/**
 * Civil-law facts for the role words in corpus.ts (L23-38). Educational, England and Wales,
 * not legal advice. `not_defined_by(x, v)` says v is not what defines the role word x. It does
 * not say a person in that role can never do v: a creditor can bring a claim.
 */
export const TRIPLES: Triple[] = [
  { rel: "defined_by", a: "claimant", b: "brings" },
  { rel: "defined_by", a: "defendant", b: "answers" },
  { rel: "defined_by", a: "landlord", b: "owns" },
  { rel: "defined_by", a: "tenant", b: "rents" },
  { rel: "defined_by", a: "trader", b: "sells" },
  { rel: "defined_by", a: "consumer", b: "buys" },
  { rel: "defined_by", a: "creditor", b: "is_owed" },
  { rel: "defined_by", a: "debtor", b: "owes" },
  { rel: "is_a", a: "claimant", b: "court_party" },
  { rel: "is_a", a: "defendant", b: "court_party" },
  { rel: "is_a", a: "landlord", b: "housing_party" },
  { rel: "is_a", a: "tenant", b: "housing_party" },
  { rel: "is_a", a: "trader", b: "trade_party" },
  { rel: "is_a", a: "consumer", b: "trade_party" },
  { rel: "is_a", a: "creditor", b: "debt_party" },
  { rel: "is_a", a: "debtor", b: "debt_party" },
  { rel: "counterpart", a: "claimant", b: "defendant" },
  { rel: "counterpart", a: "landlord", b: "tenant" },
  { rel: "counterpart", a: "trader", b: "consumer" },
  { rel: "counterpart", a: "creditor", b: "debtor" },
  { rel: "disjoint", a: "court_party", b: "housing_party" },
  { rel: "disjoint", a: "court_party", b: "trade_party" },
  { rel: "disjoint", a: "court_party", b: "debt_party" },
  { rel: "disjoint", a: "housing_party", b: "trade_party" },
  { rel: "disjoint", a: "housing_party", b: "debt_party" },
  { rel: "disjoint", a: "trade_party", b: "debt_party" },
];

export const RULES: Rule[] = [
  {
    id: "R-SYM-COUNTERPART",
    if: [{ rel: "counterpart", a: "?x", b: "?y" }],
    then: { rel: "counterpart", a: "?y", b: "?x" },
  },
  {
    id: "R-SYM-DISJOINT",
    if: [{ rel: "disjoint", a: "?c", b: "?d" }],
    then: { rel: "disjoint", a: "?d", b: "?c" },
  },
  {
    id: "R-CLASS",
    if: [{ rel: "is_a", a: "?y", b: "?d" }, { rel: "defined_by", a: "?y", b: "?v" }],
    then: { rel: "class_verb", a: "?d", b: "?v" },
  },
  {
    id: "R-COUNTER",
    if: [{ rel: "counterpart", a: "?x", b: "?y" }, { rel: "defined_by", a: "?y", b: "?v" }],
    then: { rel: "not_defined_by", a: "?x", b: "?v" },
  },
  {
    id: "R-OTHER-DOMAIN",
    if: [
      { rel: "is_a", a: "?x", b: "?c" },
      { rel: "disjoint", a: "?c", b: "?d" },
      { rel: "class_verb", a: "?d", b: "?v" },
    ],
    then: { rel: "not_defined_by", a: "?x", b: "?v" },
  },
];

type Binding = Record<string, string>;

function unify(pat: Triple, fact: Triple, b: Binding): Binding | null {
  if(pat.rel !== fact.rel) return null;

  const out: Binding = { ...b };
  const pairs: [string, string][] = [[pat.a, fact.a], [pat.b, fact.b]];

  for(const [p, f] of pairs) {
    if (isVar(p)) {
      if (out[p] === undefined)
        out[p] = f;
      else if (out[p] !== f)
        return null;
    } else if (p !== f) {
      return null;
    }
  }
  return out;
}

function subst(t: Triple, b: Binding): Triple {
  return {
    rel: t.rel,
    a: isVar(t.a) ? b[t.a] : t.a,
    b: isVar(t.b) ? b[t.b] : t.b,
  }
}

export class KnowledgeBase {
  readonly facts = new Map<string, { t: Triple; prov: Provenance }>();
  private readonly base: { t: Triple; prov: Provenance }[] = [];

  readonly rules: Rule[];

  constructor(triples: Triple[], rules: Rule[]) {
    this.rules = rules;
    for (const t of triples)
      this.assert(t, { source: "kb" });
    this.close();
  }

  /** Add a base fact (from the KB file or from lifting). Call close() afterwards. */
  assert(t: Triple, prov: Provenance) {
    if (this.facts.has(key(t))) return;
    this.base.push({ t, prov });
    this.facts.set(key(t), { t, prov });
    return true;
  }

  has(rel: string, a: string, b: string): boolean {
    return this.facts.has(key({ rel, a, b }));
  }

  objects(rel: string, a: string): string[] {
    const out: string[] = [];
    for (const { t } of this.facts.values())
      if (t.rel === rel && t.a === a)
        out.push(t.b);
    return out;
  }

  entities(): Set<string> {
    const s = new Set<string>();
    for (const { t } of this.facts.values()) s.add(t.a);
    return s;
  }

  /** Naive forward chaining to a fixpoint. Fine for tens of facts. */
  close(): void {
    let changed = true;
    while (changed) {
      changed = false;
      const all = [...this.facts.values()].map((f) => f.t);

      // For each rule, find all bindings that satisfy the "if" part, then add the "then" part with those bindings.
      for (const rule of this.rules) {
        let binds: { b: Binding; from: string[] }[] = [{ b: {}, from: [] }];
        for (const pat of rule.if) {
          const next: { b: Binding; from: string[] }[] = [];
          for (const { b, from } of binds) {
            for (const fact of all) {
              const u = unify(pat, fact, b);
              if (u) next.push({ b: u, from: [...from, key(fact)] });
            }
          }
          binds = next;
        }

        // For each binding that satisfies the "if" part, add the "then" part with that binding.
        for (const {b, from} of binds) {
          const t = subst(rule.then, b);
          if (!this.facts.has(key(t))) {
            this.facts.set(key(t), { t, prov: { source: "rule", rule: rule.id, from } });
            changed = true;
          }
        }
      }
    }
  }

  /** defined_by(x,v) and not_defined_by(x,v) both hold. Reported, never silently resolved. */
  contradictions(): { a: string; b: string }[] {
    const out: { a: string; b: string }[] = [];
    for (const { t } of this.facts.values()) {
      if (t.rel === "defined_by" && this.has("not_defined_by", t.a, t.b)) {
        out.push({ a: t.a, b: t.b });
      }
    }
    return out;
  }

  /** The proof of a fact as readable lines, leaves first. */
  explain(t: Triple, depth = 0): string[] {
    const f = this.facts.get(key(t));
    if (!f) return [`${" ".repeat(depth)}${key(t)} [not in KnowledgeBase]`];

    const pad = " ".repeat(depth);
    if (f.prov.source === "kb") return [`${pad}${key(t)} [KnowledgeBase]`];
    if (f.prov.source === "lifted") return [`${pad}${key(t)} [lifted, p=${f.prov.p.toFixed(3)}]`];
    
    const lines = [`${pad}${key(t)} [${f.prov.rule}]`];
    for (const k of f.prov.from) {
      const child = this.facts.get(k);
      if (child) lines.push(...this.explain(child.t, depth + 1));
    }

    return lines;
  }

  clone(): KnowledgeBase {
    const kb = new KnowledgeBase([], this.rules);
    for (const { t, prov } of this.base) kb.assert(t, prov);
    kb.close();
    return kb;
  }
}

// ─── From facts to token ids ────────────────────────────────────────────────

/**
 * Token text of each KB verb. `is_owed` maps to "owed", not "is": banning " is" would also block
 * "the debtor is the person who is liable". Its triggers below read one word further instead.
 */
export const SURFACE: Record<string, string[]> = {
  brings: ["brings"],
  answers: ["answers"],
  owns: ["owns"],
  rents: ["rents"],
  sells: ["sells"],
  buys: ["buys"],
  is_owed: ["owed"],
  owes: ["owes"],
};

export const baseForm = (word: string): string | undefined =>
  Object.keys(SURFACE).find((k) => SURFACE[k].includes(word));

/**
 * A trigger says: when the last context words match `pattern` (?x binds to a KB entity), the next
 * word is banned or supported. `only` and `except` limit which KnowledgeBase verbs the trigger may enforce.
 */
export type Trigger = {
  id: string;
  pattern: string[];
  rel: string;
  mode: "ban" | "support";
  only?: string[];
  except?: string[];
}

/** Definition frames only. One-word triggers such as "the landlord" would be legally unsound. */
export const FRAMES: string[][] = [
  ["?x", "is", "the", "person", "who"],
  ["?x", "is", "a", "person", "who"],
  ["?x", "is", "a", "business", "that"],
]

export const TRIGGERS: Trigger[] = FRAMES.flatMap((frame, i) => [
  { id: `T-F${i}-BAN`, pattern: frame, rel: "not_defined_by", mode: "ban" as const, except: ["is_owed"] },
  { id: `T-F${i}-SUP`, pattern: frame, rel: "defined_by", mode: "support" as const, except: ["is_owed"] },
  { id: `T-F${i}-IS-BAN`, pattern: [...frame, "is"], rel: "not_defined_by", mode: "ban" as const, only: ["is_owed"] },
  { id: `T-F${i}-IS-SUP`, pattern: [...frame, "is"], rel: "defined_by", mode: "support" as const, only: ["is_owed"] },
]);

/**
 * Derived but not enforced until legally reviewed: a subtenant's landlord also rents, and bare
 * "rents" runs both ways in English. The fact and its proof stay in the KB.
 */
export const NOT_ENFORCED = new Set([key({ rel: "not_defined_by", a: "landlord", b: "rents" })]);

/**
 * word → ids of tokens that are exactly " word" (a whole word starting with a space).
 * A word that BPE splits has no entry and cannot be enforced (chapter 04 §8). It is
 * reported as `unenforceable` rather than over-banning its first piece.
 */
export function buildTokenIndex(idxToToken: string[]): Map<string, number[]> {
  const idx = new Map<string, number[]>();
  idxToToken.forEach((token, id) => {
    if (!token.startsWith(" ")) return;
    const w = token.trim();
    if (!/^[a-z]+$/.test(w)) return;
    idx.set(w, [...(idx.get(w) ?? []), id]);
  })
  return idx;
}

/** One KB fact a trigger reached at this context, in a form a UI can group and display. */
export type TriggerMatch = {
  triggerId: string;
  /** The frame as written, such as "?x is the person who". */
  template: string;
  /** The frame with the role filled in, such as "claimant is the person who". */
  pattern: string;
  role: string;
  rel: string;
  mode: "ban" | "support";
  fact: string;
  word: string;
  /** The rule that derived the fact, or its source if nothing derived it. */
  rule: string;
};

export type Allowed = {
  banned: number[];
  supported: number[];
  fired: string[];
  unenforceable: string[];
  /** Facts a trigger matched but NOT_ENFORCED holds back, so an exception is never silent. */
  heldBack: string[];
  matches: TriggerMatch[];
};

export function contextWords(ids: number[], idxToToken: string[]): string[] {
  return ids.map((id) => idxToToken[id]).join("").trim().split(/\s+/);
}

/** A_t is everything except `banned`; S_t is `supported`. */
export function allowed(
  kb: KnowledgeBase,
  contextIds: number[],
  idxToToken: string[],
  tokenIndex: Map<string, number[]>,
  triggers: Trigger[] = TRIGGERS,
): Allowed {
  const words = contextWords(contextIds, idxToToken);
  const entities = kb.entities();
  const banned = new Set<number>();
  const supported = new Set<number>();
  const fired: string[] = [];
  const unenforceable: string[] = [];
  const heldBack: string[] = [];
  const matches: TriggerMatch[] = [];

  for (const trig of triggers) {
    const n = trig.pattern.length;
    if (words.length < n) continue;

    let x: string | undefined;
    const tail = words.slice(-n);

    const ok = trig.pattern.every((p, k) => {
      if (p ===  "?x") {
        x = tail[k];
        return entities.has(tail[k]);
      }
      return p === tail[k];
    });

    if (!ok || !x) continue;

    for (const obj of kb.objects(trig.rel, x)) {
      if (trig.only && !trig.only.includes(obj)) continue;
      if(trig.except?.includes(obj)) continue;

      const factKey = key({ rel: trig.rel, a: x, b: obj });
      if (trig.mode === "ban" && NOT_ENFORCED.has(factKey)) {
        heldBack.push(factKey);
        continue;
      }

      const forms = SURFACE[obj] ?? [obj];
      const target = trig.mode === "ban" ? banned : supported;

      let hit = false;
      for (const form of forms) {
        const ids = tokenIndex.get(form);
        if (!ids) {
          unenforceable.push(form);
          continue;
        }
        
        ids.forEach((id) => target.add(id));
        hit = true;
      }

      if (hit) {
        const prov = kb.facts.get(key({ rel: trig.rel, a: x, b: obj }))!.prov;
        const why = prov.source === "rule" ? prov.rule : prov.source;
        fired.push(`${trig.id}: ${trig.rel}(${x}, ${obj}) ← ${why}`);
        const role = x;
        matches.push({
          triggerId: trig.id,
          template: trig.pattern.join(" "),
          pattern: trig.pattern.map((p) => (p === "?x" ? role : p)).join(" "),
          role,
          rel: trig.rel,
          mode: trig.mode,
          fact: `${trig.rel}(${role}, ${obj})`,
          word: forms.join("/"),
          rule: why,
        });
      }
    }
  }

  for (const ban of banned) supported.delete(ban);

  return {
    banned: [...banned],
    supported: [...supported],
    fired,
    unenforceable,
    heldBack,
    matches,
  }
}