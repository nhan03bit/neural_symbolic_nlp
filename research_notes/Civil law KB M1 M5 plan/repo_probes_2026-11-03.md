# Repo probes, 2026-11-03

Read-only probes run by the coordinator with the real tokenizer (`buildVocabulary(2000)`) and saved v4 weights. Scripts are in the session scratchpad, not in the repo. Nothing in `src/` was changed. One seed (the 42 run), on the memorised PRE TRAINING baseline, one trigger family. These are probes, not E1-E3 results.

Weights: `.data/transformer-weights-e2000-l2-d32-h2-ff128-ctx32-cbf9d5315-v4.json` and the `-e{300,500,1000,1500}-...-v4.json` checkpoints of the same run. The weights file's vocabulary equals the rebuilt vocabulary.

## Tokens
- Vocabulary 937, 934 tokens with a leading space. `buildTokenIndex` still works.
- All 8 roles and all 8 verbs are single tokens. Chapter 07 mismatch 5 (`creditor`, `buyer`, `seller` split) is out of date.
- `landlord pays` and `trader pays` occur in the corpus, so one-word-trigger bans such as "x cannot pay" contradict the training text.

## KB tested
- defined_by: claimant-brings, defendant-answers, landlord-owns, tenant-rents, trader-sells, consumer-buys, creditor-is_owed, debtor-owes.
- is_a: claimant, defendant -> court_party; landlord, tenant -> housing_party; trader, consumer -> trade_party; creditor, debtor -> debt_party.
- counterpart: the four pairs. disjoint: the four classes.
- Rules: R-SYM-COUNTERPART, R-SYM-DISJOINT, R-COUNTER, R-CLASS, R-OTHER-DOMAIN.
- Surface: is_owed -> " is". Frames: `?x is the person who`, `?x is a person who`, `?x is a business that`.
- Closure: 100 facts, 0 contradictions, exactly 7 banned verbs per role. `allowed()` engine from chapter 07 reused unchanged except for removing the `lives_in` special case.

Proof of not_defined_by(claimant,owns):
```
not_defined_by(claimant,owns)  [R-OTHER-DOMAIN]
  is_a(claimant,court_party)  [kb]
  disjoint(court_party,housing_party)  [kb]
  class_verb(housing_party,owns)  [R-CLASS]
    is_a(landlord,housing_party)  [kb]
    defined_by(landlord,owns)  [kb]
```

## Coverage (M5 reach)
- Token stream: fires at 8 of 5,390 positions (0.148%), 0 conflicts, target in the supported set at all 8, `unenforceable` empty.
- Training windows (`seq.input.slice(0, t+1)`, 5,374 windows of 16): 86 of 85,984 positions (0.100%), 0 conflicts.

## Banned mass at `the x is <frame>` (massBefore, T = 1)
| Checkpoint | Mean over 8 roles | claimant banned / brings |
| e300 | 0.1094 | 0.182 / 0.001 |
| e500 | 0.3221 | 0.525 / 0.001 |
| e1000 | 0.2453 | 0.748 / 0.087 |
| e1500 | 0.1450 | 0.532 / 0.361 |
| e2000 | 0.0991 | 0.331 / 0.614 |

e2000 by role: claimant 0.331, defendant 0.122, landlord 0.018, tenant 0.121, trader 0.008, consumer 0.059, creditor 0.023, debtor 0.111.

## Saved samples (history of the e2000 file, prompt `the claimant is`, T = 1, top-p 0.6)
| Epochs | Samples | Parsed claims | Banned verb | Other wrong verb |
| 0-500 | 51 | 3 | 0 | 3 |
| 510-1000 | 50 | 54 | 47 | 4 |
| 1010-1500 | 50 | 78 | 35 | 0 |
| 1510-2000 | 50 | 95 | 12 | 0 |

The new verifier reproduces 1510-2000: 95 parsed, 83 supported, 12 contradicted, 0 unknown. On text with no frame it returns 0 claims parsed.

## Mask round trip on e2000
Scratchpad copy of `generateText` with one optional processor call before the temperature loop.

- No processor versus unmodified `generateText`: 0 differences in 200 seeds (20 tokens, T = 1, top-p 0.6).
- One draw at the frame, 8 roles x 400 seeds, T = 1:
| top-p | Off: banned draws | Mask: banned draws |
| 0.6 | 0 of 3,200 | 0 of 3,200 |
| 0.9 | 208 of 3,200 | 0 of 3,200 |
| 1.0 | 307 of 3,200 | 0 of 3,200 |
- massAfter 0, 0 fallbacks.
- Free generation, 300 seeds, 20 tokens, prompt `the claimant is`:
| Setting | Off | Mask |
| T = 1, top-p 0.6 | 600 parsed, 0 contradicted | 600 parsed, 0 contradicted |
| T = 0.8, top-p 0.9 | 580 parsed, 56 contradicted | 600 parsed, 0 contradicted |
- With the mask at T = 1, top-p 0.6: trigger fired at 600 of 6,000 steps (10.0%), mean massBefore when fired 0.180.

So at the baseline's own recorded setting (T = 1, top-p 0.6) on e2000, the violation does not occur and the mask has nothing to remove. It appears at wider nucleus settings and at earlier checkpoints.

## M5 interaction at `the claimant is the person who`, e2000
- L_sem unmasked 0.067084 (divided by S = 6). After masking, about -1e-9: floating-point rounding, so a test needs a tolerance.
- CE 0.48827 = masked CE 0.08577 + (-log P_A) 0.40251. Checked to 5 decimals.

## Trace change
`chosen` was removed from `StepTrace` so the figure has no sample -> trace edge. Chapter 04 (line 152), chapter 05 (E3 protocol, line 75) and `docs/architecture.md` (line 905) still list it.
