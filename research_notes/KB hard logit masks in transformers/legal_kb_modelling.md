# Modelling civil law as a formal KB, and which legal content can drive an absolute token ban

Scope: England and Wales (E&W). Educational project, not legal advice. Sources checked 2026-11-03. Corpus line numbers refer to `src/routes/train-embed/corpus.ts` as it stood on that date. `CIVIL_LAW_CORPUS` is lines 642-761, and by my count holds 63 concept entries, 11 trees and 44 fact patterns.

How to read the evidence grades:
- **[read]**: I read the relevant passage in the fetched text.
- **[snippet]**: I saw only a search-result summary or abstract. Check it before relying on it.
- **[unverified]**: from memory, or not checked against a primary source.
- **Inferences** are my own reasoning, and no source states them.

## How did landmark formalisations represent legislation, and what did they find hard?

### Takeaway
Every landmark system encodes the rule structure and leaves the judgment outside it. Vague concepts become inputs or conditional answers, exceptions become defaults or negation as failure, and discretion becomes a separate branch or goes unencoded. None of them turns law into unconditional prohibitions on what may be said, so a token ban goes further than any of them.

### Cited Findings

| System | Jurisdiction, and does it transfer? | Representation | What it found hard |
|---|---|---|---|
| Sergot et al. 1986, British Nationality Act | UK statute, so directly relevant | Extended Horn clauses (Prolog) | Vagueness, negation, counterfactuals, discretion |
| Logical English (Kowalski and Datoo) | ISDA derivatives documents, private drafting. Transfers as a notation | Controlled English as syntactic sugar for logic programs | Telling rules from exceptions; ambiguity |
| Catala (Merigoux et al.) | France and US. Transfers only to computational law | Prioritised default logic, literate programming | Finding correct tests; corner cases |
| LegalRuleML | Jurisdiction-neutral interchange standard | XML with metadata, strength, temporal parameters | Interchange only, so it leaves meaning to the reasoner |
| PROLEG (Satoh) | Japan, built on a civil-law doctrine. Structure transfers, the doctrine does not | General rules plus `exception(H,E)` | Making the logic acceptable to lawyers |
| Defeasible logic (Governatori; Prakken and Sartor) | Mainly European civil-law work | Strict, defeasible and defeater rules; argumentation | Conflict, change over time, contested rules |

**Sergot et al. (CACM 29(5), May 1986)** [read]
- They note that substantial amounts of statutory law are "basically definitional in nature", and that the Prolog could resemble the Act's structure, which helps confidence and maintenance — [Sergot et al.](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf).
- Vagueness: "The simplest way to handle vagueness is to assume that the vague concepts always apply and to use this assumption to generate qualified answers", for example "Peter is a citizen, if he is of good character". Rules of thumb derived from cases are "not guaranteed to cover all cases", and they deliberately avoided them — [same](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf).
- Exceptions: negation as failure is justified under a closed-world assumption and "is often appropriate for handling exceptions". They add that "It is notoriously difficult in law to determine all the legal provisions that might be relevant", and in such circumstances they would be "forced to abandon negation as failure" — [same](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf).
- Counterfactuals such as "would have done so but for" are "notoriously difficult", though they argue the drafters meant a narrower reading here — [same](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf).
- Discretion: "If ... the Secretary of State thinks fit" became two rules, a standard one and a discretionary one with an extra condition. Parts left untranslated include "decisions involving exercise of discretion by the Secretary of State" — [same](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf).
- A student, Fariba Sadri, did the translation in July and August 1983 "without any expert legal assistance" — [same](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf). So the correctness of the encoding was not established by legal review at that stage.

**Logical English** [read]
- The basic form of LE is "syntactic sugar for logic programs". LE is intended to be "as unambiguous as possible", and disallows pronouns — [Kowalski and Datoo, AI and Law](https://www.doc.ic.ac.uk/~rak/papers/Logical%20English%20meets%20Legal%20English.pdf) ([DOI](https://doi.org/10.1007/s10506-021-09295-3)).
- It offers two forms for exceptions. The common form is "conclusion if main conditions" plus "it is not the case that conclusion unless additional conditions". The basic form merges them into one rule. The basic form is efficient, but it loses the split between main and additional conditions. In the common form it "can sometimes be hard to tell" whether a sentence is a rule or an exception, and the two may be separated by other clauses — [same](https://www.doc.ic.ac.uk/~rak/papers/Logical%20English%20meets%20Legal%20English.pdf).
- LE executes through Prolog or s(CASP), and has been applied to Italy-France double-taxation conventions — [Sartor et al.](https://ceur-ws.org/Vol-3437/paper7GDE.pdf) [snippet].

**Catala** [read]
- The paper separates two kinds of law: some is "subject to interpretation, debate and challenges", and some "leaves little room for interpretation" and "essentially aims to rigorously describe a computation". Catala targets "legal texts that are algorithms in disguise" — [Merigoux et al.](https://arxiv.org/abs/2103.03198).
- It adopts prioritised default logic, following Lawsky's argument that this flavour best suits law — [same](https://arxiv.org/abs/2103.03198).
- It found a real bug. The authors' code first matched the official simulator on test cases, but that simulator did not cover a child in social-services custody. Reading the OpenFisca source then exposed a discrepancy: under article L755-12 the income cap does not apply to single-child families in overseas territories. OpenFisca fixed it after disclosure — [same](https://arxiv.org/abs/2103.03198).
- The compiler's core steps are proven in F★ — [same](https://arxiv.org/abs/2103.03198). That proves compilation, not that the encoding matches the law (inference).

**LegalRuleML** [read]
- A rule has parameters that vary over time: "its status (e.g. strict, defeasible, defeater), its validity (e.g. repealed, annulled, suspended), and its jurisdiction", plus temporal aspects such as "the efficacy, enforcement" — [OASIS Core Specification 1.0](https://docs.oasis-open.org/legalruleml/legalruleml-core-spec/v1.0/os/legalruleml-core-spec-v1.0-os.html).
- It became an OASIS Standard on 30 August 2021 — [OASIS announcement](https://lists.oasis-open.org/archives/members/202109/msg00000.html) [snippet].

**PROLEG**
- A program is general rules `H <= B1..Bn`, exception rules `exception(H,E)`, and `fact(P)` entries where P heads no general rule. H holds if the body is proved, unless an exception is proved — [Satoh and Takahashi, ICAIL 2021](https://ist.ksc.kwansei.ac.jp/~ktaka/LABO/DRAFTS/ICAIL2021satoh.pdf) [read].
- It implements the Japanese theory of presupposed ultimate facts, which allocates the burden of proof fact by fact. A later version moved away from presenting negation as failure because users did not find it accessible — [Springer record](https://www.springerprofessional.de/proleg-an-implementation-of-the-presupposed-ultimate-fact-theory/3789286); [JURISIN 2013](https://www.cl.cam.ac.uk/~zs315/papers/JURISIN2013.pdf) [snippet].

**Defeasible logic and argumentation**
- Governatori et al. model normative modifications in defeasible logic, and comment on retroactivity — [Norm Modifications in Defeasible Logic](https://jurix.nl/pdf/j05-03.pdf) [snippet; title and authors read].
- Prakken and Sartor's review (Artificial Intelligence 227, 2015, 214-245) covers rule representation including time and change, then reasoning where rules are contested: unforeseen situations, interpretation and evidence — [EUI repository](https://cadmus.eui.eu/handle/1814/38649) [snippet; full text not read].
- Bench-Capon observes that Prakken's norm-conflict work sits in the European civil-law tradition rather than the UK-US common-law one — [Bench-Capon](https://cgi.csc.liv.ac.uk/~tbc/publications/BenchCapon2main.pdf) [snippet].

### Inferences
- **Sergot's two-rule treatment of discretion is the most reusable idea here.** Record the discretionary branch as a named condition instead of pretending it is absent.
- **The common-form and basic-form split matters directly for bans.** The repo's trees use the basic form, which flattens exceptions into question order. Section 4 shows this causing a real error.
- **Catala's class split is the right starting point for this project.** It says which law can be formalised, and the hard-ban question narrows that further. Being computable does not make a sentence safe to ban, because a computable rule can still have exceptions and an end date.
- **Transfer limits.** Catala's French benefits and PROLEG's civil code start from enacted text. Much of E&W contract and tort in this corpus is case law, with no canonical wording to encode, so the statute-based successes do not carry across to the K-* and N-* trees.

### Gaps
- I did not read the Prakken and Sartor full text, or the Governatori and Rotolo "Changing Legal Systems" papers themselves. I saw their abstract through search only and could not tie it to a stable URL.
- Critiques of the Sergot work, such as Leith 1986, are recalled from memory and not fetched [unverified].
- Whether Logical English has production use beyond research: not established.

## What does the literature say about open texture, defeasibility, exceptions and discretion, and which of these block absolute rules?

### Takeaway
All four block absolute claims about **how a case comes out**. None of them necessarily blocks an absolute claim about **what an instrument says**. The KB should enforce the second kind only.

### Cited Findings
- Prakken calls the view that a lawyer identifies the rule, determines the facts and applies logic a naive "axiomatic method", for two reasons: open texture and defeasibility. Legislators "cannot foresee the entire future", so abstract concepts "cannot be defined in a way that solves all classification problems in advance", which in AI is "the classification problem" — [Prakken, book review](https://webspace.science.uu.nl/~prakk101/pubs/banktxt.html) [read via fetch summary].
- The same review gives Hart's rule forbidding vehicles in a park: cars and bicycles are covered, while skateboards and roller skates are unclear. It also says legal decisions "cannot take the form of a single deductive argument", and that "there can always be reasons for not applying a rule", citing the grandson who killed his father and then claimed his inheritance — [same](https://webspace.science.uu.nl/~prakk101/pubs/banktxt.html). The source's own bicycle example differs from the common telling, in which bicycles are the doubtful case.
- Silverman uses the same ordinance to argue that open texture rules out a complete formal solution — [Harvard JOLT note](https://jolt.law.harvard.edu/assets/articlePDFs/v07/07HarvJLTech449.pdf) [snippet]. Schauer's 2008 article separates vagueness from open texture — [JOTWELL review](https://juris.jotwell.com/?p=59) [snippet].
- Defeasibility is not one thing. Prakken and Sartor (2004) separate inference-based, process-based and theory-based defeasibility — [Revus](https://journals.openedition.org/revus/3110?lang=hr) [snippet]. Prakken (2001) treats adversarial defeasibility as procedural rather than logical — [Godden and Walton](https://distantreader.org/stacks/journals/il/il-510.pdf) [snippet].
- E&W text shows each obstacle in current primary law [read]:
  - **Open texture:** goods are satisfactory if they meet "the standard that a reasonable person would consider satisfactory", with "all the other relevant circumstances" — [CRA 2015 s9(2)](https://www.legislation.gov.uk/ukpga/2015/15/section/9).
  - **Express exception:** "Subject to paragraph (1), the small claims track is the normal track" for claims of not more than £10,000 — [CPR r26.9(4)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26).
  - **Displaceable default:** the "general rule" that the loser pays, "but the court may make a different order" — [CPR r44.2(2)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part-44-general-rules-about-costs).
  - **Discretion:** "The court has discretion as to" whether costs are payable, the amount and timing — [CPR r44.2(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part-44-general-rules-about-costs). A limitation period can be disapplied if "it would be equitable to allow an action to proceed" — [Limitation Act 1980 s33(1)](https://www.legislation.gov.uk/ukpga/1980/58/section/33). Damages are reduced as "the court thinks just and equitable" — [1945 Act s1(1)](https://www.legislation.gov.uk/ukpga/Geo6/8-9/28/section/1).
  - **Bounded discretion:** the court "must" order a sum "not less than the amount of the deposit and not more than three times" it, so the range is fixed and the figure is not — [Housing Act 2004 s214(4)](https://www.legislation.gov.uk/ukpga/2004/34/section/214).

### Inferences

| Obstacle | Blocks a ban on the outcome? | Blocks a ban on stating the rule? | Repo example |
|---|---|---|---|
| Open texture | Yes | No, if the sentence only restates the test | CRA-S9, N-BREACH, NUIS-FACTORS |
| Defeasibility or exceptions | Yes | Partly. The frame must be as narrow as the true default | TRACK-SMALL, C-COMMUNICATION |
| Judicial discretion | Yes | No | LIM-S11 with s33, N-CONTRIB, K-REMEDY Q3 |
| Bounded discretion | The range can be enforced, the point cannot | No | DEP-S214 |
| Evaluative multi-factor test | Yes | Only the named test, not a closed factor list | N-RISK-FACTORS, r26.13(1) "include" |
| Change over time | Depends on date | Yes, once the date passes | MEDIATION-PILOT |

- **The earlier `not_defined_by` design already applies this idea.** It rejects a claim about what defines a role, not a claim about what a person can do. "x cannot pay" fails because it is a claim about the world.
- **Negative-form bans are the riskiest.** A positive rule with an exception is merely incomplete. A ban built on it removes true sentences from the model's reachable output entirely.
- **Open texture and ban scope.** For this project, open texture matters mainly at the level of tokens like "reasonable". A mask cannot determine whether a time was reasonable, but it could safely stop a frame stating that reasonableness is irrelevant only if the frame is very narrow, which is rarely worth encoding.

### Gaps
- I did not fetch Hart's own text (*The Concept of Law*, or the 1958 Harvard Law Review article). All statements about Hart here are second-hand. Hart's early defeasibility paper is recalled from memory [unverified].

## What classes of legal statement are safe for a hard ban?

### Takeaway
A ban is safe only as a pair of an exact frame and a token, where no true completion of that frame can start with that token, on that date, in that jurisdiction. Four classes can meet this: stated numeric limits, statutory definitions, truly closed lists, and role-definition frames. Each needs a narrow frame and verification. Reasonableness tests, discretionary outcomes, multi-factor tests and most common-law rules are unsafe.

### Cited Findings

**Current figures checked against primary sources on 2026-11-03 [read]**

| Figure | Provision | Source and status shown |
|---|---|---|
| Four tracks: small claims, fast, intermediate, multi | CPR r26.1(2) (paragraph 2 read, rule number inferred from position) | [CPR Part 26](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26), "Updated: Saturday, 6 April 2024" |
| Small claims: value not more than £10,000 | r26.9(4), "Subject to paragraph (1)" | same |
| Personal injury: value up to £10,000 and PSLA up to £5,000 (RTA), £1,000 (RTA in r26.10 circumstances), £1,500 (other) | r26.9(1)(a) | same |
| Disrepair: repairs up to £1,000 and other damages up to £1,000 | r26.9(1)(b), and (c) for Wales | same |
| Fast track: not more than £25,000; trial "likely" no longer than one day | r26.9(5)-(6) | same |
| Intermediate: not more than £100,000; trial up to three days; two experts per party | r26.9(7) | same |
| Short-term right to reject: "the end of 30 days" | CRA s22(3), with (4) perishables, (1) agreement, (6)-(7) waiting period and 7 days | [s22](https://www.legislation.gov.uk/ukpga/2015/15/section/22), up to date to 3 Nov 2026, outstanding changes listed |
| Refund "within 14 days" of trader agreeing | CRA s20(15) | [s20](https://www.legislation.gov.uk/ukpga/2015/15/section/20) |
| Six-month presumption | CRA s19(14)-(15) | [s19](https://www.legislation.gov.uk/ukpga/2015/15/section/19) |
| No deduction for use in the first 6 months, with a motor-vehicle exception | CRA s24(10) | [s24](https://www.legislation.gov.uk/ukpga/2015/15/section/24), up to date to 30 Oct 2026 |
| Simple contract: six years | Limitation Act s5 | [s5](https://www.legislation.gov.uk/ukpga/1980/58/section/5) |
| Specialty: twelve years | Limitation Act s8 | [s8](https://www.legislation.gov.uk/ukpga/1980/58/section/8) |
| Personal injury: three years | Limitation Act s11(4) | [s11](https://www.legislation.gov.uk/ukpga/1980/58/section/11) |
| Deposit requirements: 30 days | Housing Act 2004 s213(3), "[F2 30]": the F2 annotation marks the figure as amended text | [s213](https://www.legislation.gov.uk/ukpga/2004/34/section/213), up to date to 1 Nov 2026 |
| Deposit penalty: 1x to 3x | Housing Act 2004 s214(4) | [s214](https://www.legislation.gov.uk/ukpga/2004/34/section/214), up to date to 3 Nov 2026 |
| Mediation pilot: 22 May 2024 to 6 April 2027 | PD 51ZE para 2 | [PD 51ZE](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51ze-small-claims-track-automatic-referral-to-mediation-pilot-scheme), "Updated: Thursday, 1 October 2026" |

The repo's track figures match these, so no figure in the track entries needs correcting. Not verified: the Froom v Butcher percentages (25% and 15%), already flagged in N-CONTRIB and repeated without a flag in FP-25's outcome.

**The limits are normal-track rules, not outcomes [read]**
- r26.9 repeatedly says "the normal track". The court "shall have regard to" r26.13(1) when allocating, and that list says "include", so it is expressly non-exhaustive — [CPR r26.12(1), r26.13(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26).
- "It is for the court to assess the financial value", disregarding amounts not in dispute, interest, costs and contributory negligence — [r26.13(2)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26).
- "The court may allocate a claim to the intermediate track where it considers it to be in the interests of justice" — [r26.9(9)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26).
- The court "must not" allocate harassment or unlawful eviction claims by a residential tenant to small claims — [r26.12(2)-(3)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26). Tree P-TRACK does not include this.

**Earlier repo findings on role definitions**
- `not_defined_by` is "Safe with fixes": store the frame per role, limit the derived verb set to the eight defining verbs, and make counterpart and disjoint relative to one claim, tenancy or debt. "Rents" is a language trap because of "rents out" — `research_notes/Civil law KB M1 M5 plan/kb_facts_against_sources.md`, which cites [CPR r2.3(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part02), [CRA 2015 s2](https://www.legislation.gov.uk/ukpga/2015/15/section/2) and [Housing Act 1988 s45](https://www.legislation.gov.uk/ukpga/1988/50/section/45). I did not re-fetch these three today.

### Inferences

**Formal test.** `ban(c, t)` is safe if and only if, for the KB's scope and date, no true sentence begins with context `c` followed by token `t`. This makes safety a property of the pair. "Ten" is not safe or unsafe by itself.

**Classification of repo content**

| Class | Hard ban? | Repo entries | Reason, or the condition for safety |
|---|---|---|---|
| Stated numeric limit, general frame | **Yes**, with frame and date | L89-91, TRACK-SMALL, TRACK-FAST, TRACK-INTERMEDIATE | The sentence restates the normal-track limit. Do not extend it to "this claim will go on" |
| Numeric limit in a general statutory period | **Conditional** | L197 and LIM-S11; L215 and DEP-S214 (range only) | The period is the rule even though s33 can disapply it |
| Numeric limit whose frame is wider than the rule | **No, until the frame is narrowed** | L195 "a claim for breach of contract has six years" | s5 covers only simple contracts, and s8 gives a specialty twelve years. Banning "twelve" removes a true sentence about deeds |
| Numeric limit with express variations | **No, as written** | L152 and CRA-S22 | See the note below this table |
| Statutory definition | **Yes**, scoped to the Act | CRA s2 definitions, CPR r2.3(1) | Enforce only against the defining frame. The corpus's plain-English versions are simplifications, so ban wrong verbs and do not assert the positive as complete |
| Role definition, `not_defined_by` | **Yes**, with the earlier fixes | L23-24, L27-28, L31-32, L37-38 | It is a claim about definitions. L27 "owns" is false as general law, but banning other verbs does not depend on it |
| Truly closed list | **Yes** | The four tracks; the r26.10 and r26.9(10) lists as lists | Wording such as "There are four tracks". The r26.9(10) items carry internal exceptions, so ban only list membership, not outcome |
| Non-exhaustive list | **No** | r26.13(1) "include"; CRA-S9 quality aspects; PD-PAC ADR forms; N-NEGLIGENCE Q1 categories | Listing is not closure. Treat the PD-PAC list as open until its wording is checked |
| Time-limited pilot | **Only with expiry enforced** | MEDIATION-PILOT, MEDIATION-GOVUK, L97, FP-36 | Disable automatically on 6 April 2027. L97 also omits the RTA and PI exclusion and the specified-sum condition, so it is too wide regardless |
| Jurisdiction-specific change | **Only with the scope in the frame** | L220, DEP-30DAYS, L327 | See the section on change below. L220 has no "in England" |
| Settled common-law proposition with exceptions | **No**, soft constraint at most | C-COMMUNICATION ("generally"), C-POSTAL, C-PAST, C-INTENTION ("rebutted"), LIM-ACCRUAL | Case law has no canonical text. Exceptions can be added by later cases. 47 of 63 concept entries are tagged [STD], which is unverified by the repo's own convention |
| Mandatory consequence | **Range or modality only** | DEP-S214 | "must" and the range hold. The amount and s214(3)'s choice ("as it thinks fit") do not |
| Reasonableness test | **No** | CRA-S9, CRA-S10, CRA-S23, N-BREACH, NUIS-PRIVATE | Open texture |
| Discretionary remedy | **No** | C-SPECIFIC-PERF, K-REMEDY Q3, N-CONTRIB, r44.2 costs, LIM s33 | Discretion |
| Common-law multi-factor test | **No** | N-CAPARO, N-RISK-FACTORS, N-ROBINSON, C-INNOMINATE, NUIS-FACTORS, CHURCHILL-TEST | Evaluative. N-ROBINSON says Caparo is not a universal test, so even the test's scope is contested |
| Secondary-source report | **No** | CHURCHILL, CPR-ADR-2024, POST-CHURCHILL | The corpus tags these [SECONDARY] |
| Soft guideline | **No** | L77 "usually ... fourteen days", PAC-PD | The text itself says "about 14 days" and "usually" |

**Note on CRA s22.** A one-sided ban looks attractive: s22(4) only shortens the period, so ban numerals above thirty. That fails too. The parties may agree that the right is exercised later (s22(1)), and the waiting period stops the clock (s22(6)-(7)). FP-32 is a live counter-example to banning shorter numbers. The safest form is a ban only inside a frame that states the default ("unless subsection (4) applies"), and L152 does not say that.

**The figures-only conclusion.** The strongest candidates are L89, L90 and L91. These are the only legal-limit sentences I would make hard first, along with role definitions.

**Design rules for numeric bans**
- **Deny wrong numerals, do not allow only the right one.** Non-numeric continuations must stay open ("up to the value of", "up to and including"). An allow-list would make true variants unreachable.
- **Use a small automaton, not a one-step ban.** "Twenty five thousand" and "one hundred thousand" span several tokens and share prefixes with wrong values such as "twenty thousand" and "one thousand". The ban state has to advance token by token.
- **Anchor the entire frame.** "the small claims track is for" is too short, since true completions include disrepair and PI sub-limits. L89's full prefix "the small claims track is for claims up to" is much safer.
- **Do not fire inside negation, hypotheticals or past tense.** "was for claims up to five thousand" and "is not for claims up to" are different frames. Exact prefix matching handles this by not firing.
- **Accept that this will rarely fire.** The earlier repo probe found role-frame triggers at 8 of 5,390 token-stream positions (0.148%) — `research_notes/Civil law KB M1 M5 plan/repo_probes_2026-11-03.md`. Track-limit frames are likely to be similarly rare, so a hard ban buys a guarantee, not much reduction in overall error.

### Gaps
- I did not check how number words in L89-91 tokenise under the current vocabulary. The earlier probe covers roles and verbs only, so run this before designing the automaton.
- This classification is mine and has had no legal review. The CHURCHILL and common-law entries in particular rest on the repo's own unverified [STD] citations.
- I did not read the wording of PD-PAC para 10, so whether its ADR list is closed remains open.

## How have decision trees or flowchart guidance been compiled into logic rules, how is correctness checked, and can the repo's fact patterns serve as a test suite?

### Takeaway
Trees compile cleanly into rules, with "Otherwise" becoming negation as failure and judgment questions becoming declared inputs. They should not compile into token bans on outcomes, because no tree in the repo reaches an outcome through closed questions alone without qualification. The fact patterns work as a regression suite, and they already found a real bug: tree P-TRACK as written gives the wrong answer on FP-37.

### Cited Findings
- Sergot's method reduces defined concepts to undefined concrete ones, whose values come from the user or another source — [Sergot et al.](https://www.doc.ic.ac.uk/~rak/papers/British%20Nationality%20Act.pdf) [read].
- Janatian et al. use GPT-4 to extract JusticeBot "pathways" linking legal criteria to conclusions. 60% were rated as equivalent or better than manual ones in a blind comparison, and the output is framed as a draft for a legal expert — [arXiv 2311.04911](https://arxiv.org/abs/2311.04911v1) [snippet].
- PROLEG builds a proof tree from general rules and exceptions, and presents it as a "block diagram" — [Satoh and Takahashi](https://ist.ksc.kwansei.ac.jp/~ktaka/LABO/DRAFTS/ICAIL2021satoh.pdf) [read].
- DMN tooling checks decision tables for completeness and consistency and runs test values, with hit policies that settle what happens when several rules match — [Trisotech](https://www.trisotech.com/business-rules-decision-models-dmn/); [SpiffWorkflow](https://spiff-arena.readthedocs.io/en/latest/Building_Diagrams/dmn.html) [snippet; vendor documentation, not about law].
- Validation in legal formalisation depends on test cases, and "the validation of the implementation depends on lawyer-written test cases, whose number and quality suffer from budget restrictions" — [Merigoux et al.](https://arxiv.org/abs/2103.03198) [read].
- SARA pairs statutes with cases and a hand-built Prolog system "designed to fully solve the task", while machine reading models show low out-of-the-box performance — [Holzenberger et al.](https://arxiv.org/abs/2005.05257) [read].
- DeonticBench gives 6,232 tasks with reference Prolog. Best hard-subset results reach only 44.4% on SARA Numeric and 46.6 macro-F1 on Housing — [arXiv 2604.04443](https://arxiv.org/abs/2604.04443) [read abstract; preprint].

**Repo test: I executed P-TRACK literally** (script in the scratchpad, repo unchanged; facts hand-encoded from the fact patterns).

| Case | Expected | Tree as written | With fix |
|---|---|---|---|
| FP-36, £8,000 debt | Small claims | Small claims, pass | pass |
| **FP-37, pedestrian, PSLA £3,000, total £4,000** | **Fast track** | **Small claims, FAIL** | pass |
| FP-37 contrast, car occupant | Small claims | Small claims, pass | pass |
| FP-38, £18,000 | Fast track | Fast track, pass | pass |
| FP-39, £60,000 | Intermediate | Intermediate, pass | pass |
| Synthetic: disrepair, repairs £5,000, total £5,000 | Fast track | **Small claims, FAIL** | pass |

- **Cause.** At line 713, Q2 and Q3 say "Otherwise -> Q4", and Q4 sends any value up to £10,000 to small claims. So a claim that just failed the PI or disrepair sub-limit is sent back to small claims. [r26.9(4)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26) begins "Subject to paragraph (1)", and FP-37 itself assumes this.
- **Fix.** Those two "Otherwise" branches should go to Q5. This is my reading of the rule and the fact pattern, not a legal opinion, and I have not changed the repo.

**Other omissions from P-TRACK, compared with r26.9 and r26.12 [read]**
- r26.12(2)-(3) harassment and unlawful eviction prohibition.
- Non-monetary relief, r26.9(5)(b)(ii) and (8).
- Interests-of-justice allocation, r26.9(9).
- Clinical negligence exception, r26.9(10)(b).
- Value is assessed by the court, r26.13(2).

**Fact-pattern coverage (hand count from reading lines 717-760)**

| Tree | Fact patterns | Branches with no fact pattern |
|---|---|---|
| K-FORMATION | FP-01 to FP-11 (11) | Revocation received first (Q3a otherwise), deed exception |
| K-BREACH | FP-12 to FP-14 (3) | Q1 no breach; innominate with termination |
| K-REMEDY | FP-15 to FP-17 (3) | Q1 nominal damages |
| N-NEGLIGENCE | FP-18 to FP-26 (9) | Q5 no damage; Q7 full damages only implied |
| CRA-GOODS | FP-27 to FP-32 (6) | Q0 not a consumer; Q1 goods conform |
| CRA-SERVICES | FP-33 (1) | Q1 no breach; s56 price reduction |
| P-LIMITATION | FP-34, FP-35 (2) | Q3 tort; contract in time |
| P-TRACK | FP-36 to FP-39 (4) | Q1 mandatory multi-track; Q3 disrepair; default multi-track |
| P-ADR | FP-40, FP-41, plus FP-36 (2 own) | Q3 no sanction; no fact pattern's path names Q1, though FP-41 is close |
| DEP | FP-42 (1) | Q1 yes |
| NUIS | FP-43, FP-44 (2) | Q2 no nuisance |

A regex over outcomes finds 9 of 44 with hedging wording (LIKELY, MAY, guideline, "if the defendant"): FP-12, 17, 25, 32, 34, 35, 37, 40, 41. FP-12's "MAY TERMINATE" is a legal permission rather than a hedge. Concept entries by tag: 47 [STD], 13 [VERIFIED], 3 [SECONDARY].

### Inferences

**Compilation recipe**
1. Give each question a type: `fact` (given by the case), `num` (a comparison against a verified parameter), or `judge` (an evaluative or discretionary predicate).
2. Make each root-to-leaf path one rule, with "Otherwise" as `not` under an explicitly stated closed-world assumption.
3. Treat `judge` predicates as inputs, never derived, and return Sergot-style conditional answers, for example "liable if the breach was unreasonable".
4. Represent "subject to", "unless" and "except" as explicit priority or exception edges in the PROLEG or Catala style, rather than relying on question order.

```prolog
% Sketch only: the disrepair, mandatory multi-track and intermediate clauses are omitted.
track(C, small) :- pi(C), value(C,V), V =< 10000, psla_limit(C,L), psla(C,P), P =< L.
track(C, small) :- \+ pi(C), \+ disrepair(C), value(C,V), V =< 10000.
track(C, fast)  :- \+ track(C, small), value(C,V), V =< 25000,
                   judge(trial_likely_within_one_day(C)), judge(experts_limited(C)).
```

The `judge` wrapper reflects that r26.9(6) says "if the court considers".

**Question types by tree (my reading)**

| Tree | Mostly | Questions that block an outcome ban |
|---|---|---|
| K-FORMATION | judge | Q1 willingness to be bound, Q5 rebuttal, Q6 certainty |
| K-BREACH | judge | Q2 importance, Q4 "substantially the whole benefit" |
| K-REMEDY | judge | Q2 contemplation, Q3 adequacy and discretion |
| N-NEGLIGENCE | judge | Nearly all |
| CRA-GOODS | mixed | Q1 quality, Q2 perishables, Q3 reasonable time |
| CRA-SERVICES | judge | Q1 care and skill, Q2 reasonable time |
| P-LIMITATION | mostly num | s33 discretion; must be pleaded; s32 postponement for fraud, concealment or mistake is not in the tree |
| P-TRACK | num and judge | "court considers"; r26.13 factors |
| P-ADR | judge | Q3 unreasonable refusal |
| DEP | fact | Closest to closed. The leaf's "must" is firm, while the 1x-3x amount and s214(3) choice are not. s214 applicability was amended in 2026 |
| NUIS | mixed | Q2 unreasonable interference |

So no tree supports an unconditional token ban on its outcome words. DEP comes closest, and only for the modality and the range.

**What trees can safely drive**
- **Internal-consistency checks.** If the model generates the corpus's own format, a mask can stop "K-BREACH Q3 = yes" being followed by any outcome other than DAMAGES ONLY, or stop references to a Q7 in a tree that has no Q7. That is safe because it constrains consistency with the repo's trees, not the truth of the law.
- **Post-generation checking and training-time soft loss.** These tolerate exceptions in a way masks cannot.

**The fact patterns as a test suite: yes, with limits**
- **They detect internal errors,** as FP-37 shows. Expected outcomes are written by the same author as the trees, though, so they check consistency, not legal correctness. Catala's bug only appeared by comparing against an independent implementation and reading its source.
- **Hedged outcomes need three-valued assertions.** Use `yes`, `no`, and `depends_on(judge_predicate)`. Asserting a `judge` value as a plain test fixture hides the judgment.
- **Facts are often underspecified.** FP-30 and FP-31 state no elapsed time, and FP-32 gives no perishable period. Each needs an explicit encoding or a conditional expected result.
- **Add what is missing.** Boundary tests at the limits (£10,000 and £10,001; day 30 and day 31; 1 and 2 experts for each threshold), one test for each uncovered branch in the table above, mutation tests (change one threshold and confirm a test fails), and a check that each leaf is reachable and exactly one rule fires per case.
- **Fact patterns should also test the mask.** For each fact-pattern sentence or corpus line, assert that no ban fires. A ban that fires on a true training sentence is a defect by construction. The repo probe already applied this idea with 0 conflicts for role frames.

### Gaps
- I found no published account of compiling official E&W flowchart guidance into logic, or of legal test-suite coverage criteria. My search on this returned only general DMN material. An absence from that one search is weak evidence.
- I executed only P-TRACK. The other ten trees were reviewed by reading, not run.
- The Janatian figure is from the abstract. I did not review its evaluation design.

## What does a KB statement need to be auditable and maintainable, and how do projects handle law that changes?

### Takeaway
Each statement needs a pinpoint source with quoted text, its extent, its in-force and expiry dates, a check date, a verification status and linked tests. Enforcement should be derived from those fields, so a statement that is out of date or unverified automatically stops being hard. A single effective date is not enough, as the Renters' Rights Act shows.

### Cited Findings
- LegalRuleML separates a rule's status, validity (repealed, annulled, suspended), jurisdiction, and temporal aspects including efficacy and enforcement — [OASIS](https://docs.oasis-open.org/legalruleml/legalruleml-core-spec/v1.0/os/legalruleml-core-spec-v1.0-os.html) [read]. Its metadata also holds legal sources and provenance — [Enabling Reasoning with LegalRuleML](https://arxiv.org/pdf/1711.06128) [snippet].
- OpenFisca keys parameter values by date. When a mechanism changes shape, it uses dated formula variants, and correcting a parameter value is a patch-level release — [OpenFisca legislation evolutions](https://openfisca.readthedocs.io/en/latest/coding-the-legislation/40_legislation_evolutions.html); [semver guidelines](https://edarin.gitbooks.io/openfisca-gitbook/content/en/contribute/semver.html) [snippet].
- Each legislation.gov.uk section shows an "up to date with all changes known to be in force on or before" date and a list of changes yet to be applied. The dates differ between sections of one Act: CRA s22 shows 3 November 2026 and s24 shows 30 October 2026. The site warns that revised legislation "may not be fully up to date" — [CRA s22](https://www.legislation.gov.uk/ukpga/2015/15/section/22); [CRA s24](https://www.legislation.gov.uk/ukpga/2015/15/section/24) [read].
- Sections carry extent markers: Limitation Act s32 is "E+W", Housing Act s213 is "E+W", and Road Traffic Act s149 is "E+W+S" — [s32](https://www.legislation.gov.uk/ukpga/1980/58/section/32); [s213](https://www.legislation.gov.uk/ukpga/2004/34/section/213); [s149](https://www.legislation.gov.uk/ukpga/1988/52/section/149) [read].

**Renters' Rights Act 2025 [read]**
- Phased commencement: Phase 1 from 1 May 2026, Phase 2 (database and Ombudsman) from late 2026, and Phase 3 subject to consultation. The roadmap is marked "Applies to England" and says the Phase 1 section 21 abolition and tenancy reforms "will not apply initially to the social rented sector" — [MHCLG roadmap](https://www.gov.uk/government/publications/renters-rights-act-2025-implementation-roadmap/implementing-the-renters-rights-act-2025-our-roadmap-for-reforming-the-private-rented-sector). The roadmap may have been overtaken, and I did not check whether the social-sector position has since changed.
- Housing Act s214's amendments commenced on "1.5.2026 for specified purposes", and (1ZA) gives a special rule for tenancies that were assured shortholds immediately before commencement — [s214](https://www.legislation.gov.uk/ukpga/2004/34/section/214). So the same section reads differently by tenancy history.
- GOV.UK states flatly that "APTs replaced assured shorthold tenancies on 1 May 2026" — [GOV.UK tenancy deposit protection](https://www.gov.uk/tenancy-deposit-protection). That is simpler than the roadmap's position.
- Wales runs on a different scheme: CPR has a separate limb for "the Renting Homes (Wales) Act 2016" — [r26.9(1)(c), r26.12(3)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26).

**Pilots [read]**
- PD 51ZE now runs "from 22 May 2024 to 6 April 2027", and "For claims to which the pilot does not apply, the Civil Procedure Rules and practice directions will continue to apply without modification" — [PD 51ZE paras 2, 5](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51ze-small-claims-track-automatic-referral-to-mediation-pilot-scheme). An earlier indexed version gave 21 May 2026 as the end — [search-indexed copy of the same page](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51ze-small-claims-track-automatic-referral-to-mediation-pilot-scheme) [snippet]. MEDIATION-PILOT records the same change.

**Page stamps are not effective dates [read]**
- CPR Part 44's page says "Updated: Sunday, 1 October 2023", yet it contains r44.2(5)(e), on failure to comply with an ADR order — [CPR Part 44](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part-44-general-rules-about-costs). The repo's CPR-ADR-2024 entry dates that amendment to 1 October 2024, on a secondary source. If that date is right, the stamp is older than the text. The two sources conflict and I have not resolved which is wrong, so the amending SI should be checked.
- This fetch does confirm rule numbers the corpus marks unverified: r44.2(5)(e), plus r1.1(2)(f) and r1.4(2)(e) on [CPR Part 1](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part01). r3.1(2)(o) was not checked.

### Inferences

**Minimum record**

```yaml
id: track.small.general.limit
statement: limit(small_claims_normal_track, value, 10000, GBP)
class: numeric_limit            # drives allowed enforcement
modality: normal_track          # is | must | may | normal | presumption
frames: ["the small claims track is for claims up to"]
deny: [numerals except the path "ten thousand"]
source:
  instrument: Civil Procedure Rules 1998
  provision: r26.9(4)
  url: https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26
  quote: "Subject to paragraph (1), the small claims track is the normal track for any claim which has a value of not more than £10,000."
  retrieved: 2026-11-03
  page_stamp: 2024-04-06        # not an effective date
  checked_up_to: null           # legislation.gov.uk gives this; CPR pages do not
  outstanding_changes: unknown
scope:
  extent: [England, Wales]
  excludes: [Scotland, Northern Ireland]
time:
  in_force_from: null           # unverified; do not guess
  in_force_to: null
  applies_when: null            # e.g. claim issued on or after, former AST
  review_by: 2027-04-06         # project-chosen review date, not a legal date
relations:
  subject_to: [track.small.pi, track.small.disrepair]
  overridden_by: [r26.12(2), r26.12(3)]
open_texture: []
verification:
  status: VERIFIED              # VERIFIED | SECONDARY | STD
  by: <person>
tests: [FP-36, boundary-10000, boundary-10001]
version: 1
enforcement: hard               # derived, never hand-set
```

**Derive enforcement with a gate.** `hard` requires all of these:
- status is VERIFIED against a primary source;
- class is in the safe set;
- an exact frame exists;
- today is within the time window and before `review_by`;
- scope is stated;
- all tests pass, and no training sentence triggers a conflict.

Otherwise the entry drops to `soft` or `none`. By this gate, 50 of the 63 concept entries could not be hard today, being [STD] or [SECONDARY].

**Fail open on expiry.** A stale ban suppresses true text with certainty, while a missing ban only leaves the model's ordinary error rate. So an expired or unreviewed rule should switch itself off and log the event.

**Three time axes are needed.** Law in force at a date, law applying to a given event (claims issued on or after 22 May 2024, or a former AST), and the date the KB entry was checked. Governatori and Rotolo's two timelines point the same way [snippet, no stable URL], and OpenFisca and LegalRuleML handle parts of this.

**Model each pilot as a modifier with scope.** MEDIATION-CONFLICT shows two simultaneously valid versions of r26.6. Pilot rules should override the base rule for scoped claims rather than replacing it.

**Weights are the awkward part.** A KB can update overnight, but trained weights still encode old text. Mask rules can be changed without retraining, which is a real maintainability advantage, and it means the mask may need to suppress what the model memorised. Corpus sentences like L97, L220 and L327 are time-bound training data and should carry the same metadata.

**"England and Wales" cannot be a single scope value.** Housing law differs between the two.
- L220 ("assured periodic tenancies replaced assured shorthold tenancies") has no "in England".
- DEP-30DAYS says "Assured periodic tenancies replaced assured shorthold tenancies on 1 May 2026", which the roadmap's social-sector carve-out makes potentially too broad, if that carve-out still stands.

### Gaps
- Commencement details for RRA Phases 2 and 3 as of today, and the current social-sector position: not checked beyond the roadmap.
- I could not confirm how Catala handles date-dependent rules, or get primary documentation on the legislation.gov.uk point-in-time API. I saw only the status banners on section pages.
- In-force dates for the r26.9 limits are left null above. I did not verify them, and the corpus marks the intermediate track's 1 October 2023 start as [STD].

## Are there precedents for hard or structured constraints on legal LLM output, and what is measured about legal hallucination?

### Takeaway
Verification after generation and retrieval grounding are the established approaches. I found no study applying KB-derived token-level bans to enforce legal correctness. The closest is LegalSearchLM, which uses token-level constrained decoding on legal text, but for retrieval and against a corpus index, so it does not test legal truth. The measured studies also show that constraining citations does not solve the problem: a real citation can still support a false statement.

### Cited Findings

**Measured hallucination**
- Given "a direct, verifiable question about a randomly selected federal court case, LLMs hallucinate between 58% (ChatGPT 4) and 88% (Llama 2) of the time". Performance is better on newer, more salient cases and prominent jurisdictions, and worse in lower courts — [Dahl et al. preprint](https://arxiv.org/abs/2401.01301) [read]; published in Journal of Legal Analysis 16(1):64-93, 2024 — [Stanford listing](https://impact.stanford.edu/article/large-legal-fictions-profiling-legal-hallucinations-large-language-models) [snippet]. It also documents contra-factual bias, meaning models accept queries built on false premises.
- Lexis+ AI, Westlaw AI-Assisted Research and Ask Practical Law AI "each hallucinate between 17% and 33% of the time", less than GPT-4 — [Magesh et al. preprint](https://arxiv.org/abs/2405.20362) [read]; published in Journal of Empirical Legal Studies 22(2):216-242, 2025 — [Crossref record](https://doi.org/10.1111/jels.12413) [read]. I read the preprint and did not compare its figures with the published version.
- Magesh et al. count a response as hallucinated if it is incorrect or misgrounded. A response can cite a real source that does not support its proposition. A reply about the fictional Judge Wilgarten cited a real case, "'hallucination-free' in a narrow sense", while still being wrong — [same](https://arxiv.org/abs/2405.20362) [read].
- Both studies concern US law and large models. Neither measures E&W law or a small from-scratch model.

**E&W judicial position [read]**
- Tools such as ChatGPT "are not capable of conducting reliable legal research". They "may cite sources that do not exist" and "may purport to quote passages from a genuine source that do not appear in that source" — [Ayinde v Haringey; Al-Haroun v Qatar National Bank [2025] EWHC 1383 (Admin), para 6](https://www.judiciary.uk/wp-content/uploads/2025/06/Ayinde-v-London-Borough-of-Haringey-and-Al-Haroun-v-Qatar-National-Bank.pdf).
- Users have "a professional duty" to check accuracy "by reference to authoritative sources", including the Government's legislation database, the National Archives judgments database, the official Law Reports and reputable publishers' databases — [same, para 7](https://www.judiciary.uk/wp-content/uploads/2025/06/Ayinde-v-London-Borough-of-Haringey-and-Al-Haroun-v-Qatar-National-Bank.pdf). That is a usable source allowlist for the KB, and it binds lawyers rather than this project.

**Token-level and structured constraints**
- **LegalSearchLM** (EMNLP 2025): constrained beam decoding over an FM-index "ensuring that the generated content always exists in a document within the corpus". It is Korean case retrieval over 1.2M candidates, outperforming baselines by 6-20% — [Kim et al.](https://arxiv.org/abs/2505.23832) [read]. The check is existence in a corpus, not legal correctness, and the metric is retrieval.
- **General citation comparison** (not legal): constrained decoding with a finite-state automaton lost to post-hoc span alignment on most snippet scores (ASQA Snippet-F1 55.11 against 61.87 on one model). The authors say the findings may not transfer to legal or financial QA — [Yeginbergen et al.](https://arxiv.org/html/2606.07130) [read via fetch; preprint].
- **Masking limits, general:** per-token masking is myopic, and greedy masking does not sample from the model's true conditional distribution given the constraint — [Locally Constrained Resampling](https://arxiv.org/pdf/2410.13111) [snippet].

**Symbolic checkers after, or around, an LLM**
- GPT-4o and GPT-5 helped translate IRC section 121 into Prolog, and the hybrid gave deterministic, reproducible detection of an inconsistency, while GPT-4o alone found it in one of three strategies — [arXiv 2511.11954](https://arxiv.org/abs/2511.11954) [read abstract; preprint].
- "Closing the Loop" proposes "LLM proposes, verifier disposes" on a calculus extending Catala: "provable correctness" for computational components, and only "structural guarantees" for open-textured analysis, shown on German deadlines, US Commerce Clause analysis and sanctions proportionality — [arXiv 2606.23913](https://arxiv.org/abs/2606.23913) [read abstract; preprint, demonstration rather than measured evaluation as far as the abstract shows].
- Practitioner sources report a design in which the model never writes a citation and an allowlist intersects with retrieved ids — [Arelion case study](https://arelion.dev/case-studies/legal-research-assistant/) [snippet; not peer reviewed, vendor-type source].

**Direct answer on token-level legal constraints.** No study I found applied token-level constraints derived from a legal KB to enforce legal correctness in generated text. I ran two extended web searches for this, one of them citation-focused. Semantic Scholar queries were rate-limited, so I could not query it systematically, and I did not search ICAIL or JURIX proceedings directly. This is a real but limited negative result.

### Inferences
- **Hallucination rates do not predict the benefit here.** These numbers come from large models on open-ended questions about US case law. A small model trained on simple sentences fails differently, so the project should measure its own rates using frames and verifiers, as the repo probe does.
- **A mask addresses only one failure type.** It can stop a named wrong value or an unlisted citation in a known frame. It cannot address misgrounding, false premises or wrong reasoning, which Magesh and Dahl show are central.
- **A citation allowlist is safe for existence only.** For this repo, an allowlist of case names would stop invented cases in a citation frame, but the corpus's own citations are mostly [STD]. Check them on Find Case Law first, or the allowlist simply certifies unverified text. Never present an allowed citation as support for the sentence it accompanies.
- **The pattern across the literature favours layers.** Use a deterministic mask for narrow frames, a verifier that can return "unknown", and conditional answers for judgment predicates. The repo's verifier and M5 probes already follow this, and the new element here is the gate that decides which statements qualify.
- **What the project can honestly claim.** "In these frames, on this date, the model cannot generate these specific wrong tokens." It cannot claim that the model's legal output is correct, or that it does not hallucinate.

### Gaps
- There is no evidence on E&W legal hallucination rates comparable to Dahl or Magesh. I did not search specifically for one.
- The mapping of Magesh's per-product rates was not extracted, so only the 17-33% range is reported.
- I did not assess commercial "verified citation" products beyond the claims quoted in Magesh et al.
- Several 2026 preprints here (2604.04443, 2606.07130, 2606.23913) are not peer reviewed as far as I could tell.
