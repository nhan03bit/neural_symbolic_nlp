# Civil disputes law in England & Wales: raw domain-knowledge text for a neurosymbolic reasoning corpus

DISCLAIMER: This is educational and research material for building a machine-reasoning corpus. It is not legal advice. The fact patterns are fictional. The law changes. Check any rule against the current official text before relying on it.

Format target: Sheth, Roy & Gaur (2023), Fig. 4 (local notes: `research_notes/Neurosymbolic reasoning corpus from paper/paper_text_examples.md`, item E10). The pipeline is text X → mapped concepts Z with definitions → expert-defined decision tree → label Y with an explanation. Every unit below uses four layers: (1) concept definitions, (2) if-then decision trees with explicit "otherwise" branches, (3) fictional fact patterns, and (4) the outcome with a "because …" explanation.

Jurisdiction: England & Wales only. Scotland and Northern Ireland have separate legal systems. Scottish differences are flagged where relevant.

Access date for every web source below: 31 October 2026. Fetch method: WebFetch and WebSearch, using public queries only. No local project files were sent to any external service.

Verification legend:
- [VERIFIED 2026-10-31]: the official page was fetched this session and the figure or text was confirmed.
- [SECONDARY]: confirmed only through secondary or law-firm sources found this session.
- [STD]: standard, long-settled case law or statute quoted from established legal knowledge. It was not re-fetched this session, so the citation should be checked on BAILII, the National Archives' Find Case Law, or legislation.gov.uk before publication. Bailii.org returned HTTP 403 to automated fetches this session.

Source licences (for corpus provenance):
- legislation.gov.uk: Crown copyright, Open Government Licence v3.0. The OGL notice is on every legislation page.
- justice.gov.uk (Civil Procedure Rules and Practice Directions) and gov.uk: Crown copyright, OGL v3.0, unless stated otherwise.
- judiciary.uk and the National Archives' Find Case Law: judgments are published under the Open Justice Licence (Find Case Law) or Crown copyright terms. [STD; licence terms not re-fetched this session]
- BAILII: free to read, but its terms restrict bulk copying and republication. Cite it, do not scrape it. [STD]
- Citizens Advice: © Citizens Advice, not OGL. Use it for paraphrased orientation only. [STD]
- LegalBench (Guha et al. 2023) is used only as a format reference; licences vary by task, many are CC BY 4.0. COLIEE data requires a signed memorandum. [STD; not fetched]
- Layers (1)–(4) as written here are my own wording ([AUTHORED]) unless a passage is quoted.

---

## Contract: formation, breach (conditions / warranties / innominate terms), remedies

### Takeaway
A contract exists only if there is an offer (not an invitation to treat), an acceptance that mirrors it and is communicated (the postal rule is an exception), consideration, an intention to create legal relations, and sufficiently certain terms. If any element fails, there is no contract, and the reason is the missing element. Breach of a condition allows termination plus damages. Breach of a warranty gives damages only. Breach of an innominate term allows termination only if it deprives the innocent party of substantially the whole benefit (Hongkong Fir). Damages are limited by remoteness (Hadley v Baxendale). Specific performance is discretionary and is available only where damages are inadequate.

### Cited Findings

#### Layer 1: concept definitions (one concept per sentence) [AUTHORED from STD case law]
- C-OFFER: An offer is a statement of the terms on which the offeror is willing to be bound as soon as the offeree accepts. [STD: Carlill v Carbolic Smoke Ball Co [1893] 1 QB 256]
- C-ITT: An invitation to treat is an invitation to others to make offers, such as goods displayed in a shop window or on a self-service shelf. [STD: Fisher v Bell [1961] 1 QB 394; Pharmaceutical Society of GB v Boots Cash Chemists [1953] 1 QB 401 (CA)]
- C-UNILATERAL: A unilateral offer, such as a public reward, is accepted by performing the requested act; no separate notice of acceptance is needed. [STD: Carlill]
- C-ACCEPT: An acceptance is a final and unqualified assent to all the terms of the offer. [STD]
- C-COUNTER: A counter-offer rejects the original offer and destroys it, so the original offer can no longer be accepted. [STD: Hyde v Wrench (1840) 3 Beav 334]
- C-COMMUNICATION: An acceptance generally takes effect only when it is communicated to the offeror, and silence is not acceptance. [STD: Felthouse v Bindley (1862) 11 CB NS 869; Entores v Miles Far East Corp [1955] 2 QB 327]
- C-POSTAL: Under the postal rule, an acceptance sent by post takes effect when it is posted, provided posting is a reasonable means of acceptance and the offer does not exclude the rule. [STD: Adams v Lindsell (1818) 1 B & Ald 681; Holwell Securities v Hughes [1974] 1 WLR 155]
- C-REVOCATION: Revocation of an offer takes effect only when the offeree receives it. [STD: Byrne v Van Tienhoven (1880) 5 CPD 344]
- C-CONSIDERATION: Consideration is "some right, interest, profit or benefit accruing to the one party, or some forbearance, detriment, loss or responsibility given, suffered or undertaken by the other". [STD: Currie v Misa (1875) LR 10 Ex 153, quoted in its traditional form]
- C-SUFFICIENT: Consideration must be sufficient but need not be adequate, so a token sum is enough. [STD: Chappell & Co v Nestlé [1960] AC 87]
- C-PAST: Past consideration is no consideration. An act done before the promise was made cannot support that promise. [STD: Re McArdle [1951] Ch 669]
- C-INTENTION: Intention to create legal relations is presumed absent in social and domestic agreements and presumed present in commercial agreements. Either presumption can be rebutted by evidence. [STD: Balfour v Balfour [1919] 2 KB 571; Edwards v Skyways [1964] 1 WLR 349]
- C-CERTAINTY: Terms must be certain enough for a court to give them meaning; a vague essential term means no contract. [STD: Scammell v Ouston [1941] AC 251]
- C-CONDITION: A condition is a term that goes to the root of the contract; breach entitles the innocent party to terminate and claim damages. [STD: Poussard v Spiers (1876) 1 QBD 410]
- C-WARRANTY: A warranty is a minor or subsidiary term; breach entitles the innocent party to damages only. [STD: Bettini v Gye (1876) 1 QBD 183]
- C-INNOMINATE: For an innominate term, the remedy depends on how serious the consequences of the breach are. Termination is allowed only if the breach deprives the innocent party of substantially the whole benefit of the contract. [STD: Hongkong Fir Shipping v Kawasaki Kisen Kaisha [1962] 2 QB 26]
- C-REMOTENESS-K: Contract damages are recoverable only for loss that (a) arises naturally, in the usual course of things, from the breach, or (b) was reasonably in the contemplation of both parties when they contracted as the probable result of breach. [STD: Hadley v Baxendale (1854) 9 Exch 341; Victoria Laundry v Newman [1949] 2 KB 528]
- C-SPECIFIC-PERF: Specific performance is an equitable, discretionary order to perform the contract. It is usually granted only where damages are inadequate, for example for land or unique goods, and it is not normally ordered to compel continuous activity or personal service. [STD: Beswick v Beswick [1968] AC 58; Co-operative Insurance v Argyll Stores [1998] AC 1]

#### Layer 2: decision trees
TREE K-FORMATION (expert-defined, [AUTHORED] from the cases above)
- Q1. Is there a statement showing willingness to be bound on acceptance (an offer)?
  - Yes → Q2.
  - Otherwise (it is an invitation to treat, a request for information, or a mere puff) → Y = NO CONTRACT, because there is no offer (Fisher v Bell; Boots).
- Q2. Did the offeree accept unconditionally, without varying the terms?
  - Yes → Q3.
  - Otherwise, if the terms were varied → this is a counter-offer, the original offer is destroyed, Y = NO CONTRACT on the original terms (Hyde v Wrench).
- Q3. Was the acceptance communicated, or does an exception apply (postal rule; unilateral offer accepted by performance)?
  - Yes → Q4.
  - Otherwise (silence, or acceptance never received) → Y = NO CONTRACT, because the acceptance was not communicated (Felthouse v Bindley; Entores).
- Q3a (timing). Was the acceptance posted before the offeror's revocation reached the offeree, with post a reasonable means of acceptance?
  - Yes → the acceptance is effective on posting (Adams v Lindsell).
  - Otherwise, if the revocation was received first → the offer had lapsed, Y = NO CONTRACT.
- Q4. Did each side give something of value (sufficient), not past, moving from the promisee?
  - Yes → Q5.
  - Otherwise → Y = NO CONTRACT (an unenforceable gratuitous promise), because there is no consideration (Currie v Misa; Re McArdle). Exception: a promise made by deed needs no consideration.
- Q5. Is the context commercial (intention presumed) or social/domestic (no intention presumed), and is the presumption rebutted?
  - Intention present → Q6.
  - Otherwise → Y = NO CONTRACT, because there is no intention to create legal relations (Balfour v Balfour).
- Q6. Are the essential terms certain?
  - Yes → Y = VALID CONTRACT.
  - Otherwise → Y = NO CONTRACT, because the terms are uncertain (Scammell v Ouston).
- Scotland contrast: Scots law does not require consideration. A unilateral gratuitous promise can bind if it is made in writing in the course of business or in other qualifying cases [STD: Requirements of Writing (Scotland) Act 1995 s1(2)(a)(ii); not verified this session].

TREE K-BREACH
- Q1. Was a term of the contract broken (non-performance, defective performance, or repudiation)?
  - Otherwise → Y = NO BREACH.
- Q2. Is the term a condition (by statute, by express agreement, or by its importance to the contract)?
  - Yes → Y = INNOCENT PARTY MAY TERMINATE AND CLAIM DAMAGES (Poussard v Spiers).
- Q3. Is the term a warranty?
  - Yes → Y = DAMAGES ONLY, the contract continues (Bettini v Gye).
- Q4. Otherwise the term is innominate. Did the breach deprive the innocent party of substantially the whole benefit?
  - Yes → Y = MAY TERMINATE AND CLAIM DAMAGES.
  - Otherwise → Y = DAMAGES ONLY (Hongkong Fir).

TREE K-REMEDY
- Q1. Did loss flow from the breach (causation)?
  - Otherwise → Y = NOMINAL DAMAGES only.
- Q2. Was the loss of a kind arising naturally from the breach (limb 1), or specially known to both parties at the time of contracting (limb 2)?
  - Yes → the loss is recoverable.
  - Otherwise → Y = THAT LOSS IS TOO REMOTE (Hadley v Baxendale; Victoria Laundry).
- Q3. Are damages an adequate remedy?
  - Yes → Y = DAMAGES ONLY.
  - Otherwise, if the subject matter is unique (land, a unique chattel), no personal service is to be compelled, and there is no bar in equity → Y = SPECIFIC PERFORMANCE MAY BE ORDERED (discretionary).

#### Layers 3 & 4: fact patterns and outcomes [AUTHORED, fictional]
- FP-01. Text: "A boutique displays a coat in its window priced £20 by mistake. Asha walks in, says 'I accept your offer,' and demands the coat at £20. The shop refuses." Concepts: C-ITT, C-OFFER. Path: Q1 = no. Y: NO CONTRACT, because a window display is an invitation to treat, not an offer. Asha made the offer and the shop was free to refuse it (Fisher v Bell; Boots).
- FP-02. Text: "Ben takes a tin of paint from a supermarket shelf and puts it in his basket. Before he reaches the till, the shop says it will not sell him that tin." Path: Q1 = no at the shelf. Y: NO CONTRACT yet, because goods on a self-service shelf are an invitation to treat. The customer offers at the till and the cashier accepts there (Boots).
- FP-03. Text: "A poster says '£100 reward to anyone who returns my lost dog Pip.' Cara sees the poster, finds Pip and returns him." Concepts: C-UNILATERAL. Path: offer → acceptance by performance → consideration (the act) → intention (the public promise) → certain. Y: VALID CONTRACT; Cara is entitled to £100, because a public reward is a unilateral offer accepted by performing the act (Carlill).
- FP-04. Text: "Dev offers to sell his car to Ella for £5,000. Ella replies, 'I'll pay £4,500.' Dev refuses. Ella then says, 'Fine, I accept £5,000.'" Path: Q2 = no (counter-offer). Y: NO CONTRACT, because Ella's counter-offer destroyed Dev's original offer. Her later "acceptance" is only a fresh offer, which Dev may refuse (Hyde v Wrench).
- FP-05. Text: "On 1 May, Finn writes offering to sell wool. Gita posts her acceptance on 3 May; it arrives on 6 May. Finn's letter revoking the offer reaches Gita on 4 May." Path: Q3a = yes. Y: VALID CONTRACT formed on 3 May, because under the postal rule acceptance is complete on posting. Revocation is effective only on receipt, which was too late (Adams v Lindsell; Byrne v Van Tienhoven).
- FP-06. Text: "Hal writes to his nephew: 'If I hear no more, I consider the horse mine at £30.' The nephew says nothing." Path: Q3 = no. Y: NO CONTRACT, because silence cannot amount to acceptance (Felthouse v Bindley).
- FP-07. Text: "Iris repaints her neighbour's fence as a surprise. A week later, the grateful neighbour promises to pay her £200, then refuses to pay." Path: Q4 = no (past consideration). Y: NO CONTRACT, because the repainting was finished before the promise was made, and past consideration is no consideration (Re McArdle).
- FP-08. Text: "Jon agrees to sell his old bike to his friend for £1 in a written agreement, then changes his mind." Path: Q4 = yes. Y: VALID CONTRACT, because consideration must be sufficient but need not be adequate. £1 is "some … benefit" (Currie v Misa; Chappell v Nestlé).
- FP-09. Text: "While living together happily, Kemi promises her husband £50 a month for household costs. After they separate, he sues for unpaid sums." Path: Q5 = no. Y: NO CONTRACT, because domestic agreements are presumed not to be intended to have legal effect, and nothing rebuts that presumption (Balfour v Balfour).
- FP-10. Text: "An airline tells pilots being made redundant that they will receive an 'ex gratia' payment, then refuses to pay." Path: Q5 = yes. Y: VALID CONTRACT, because in a commercial context intention is presumed. Calling a payment "ex gratia" does not rebut that presumption (Edwards v Skyways).
- FP-11. Text: "Two firms agree to buy a van 'on hire-purchase terms', without saying what those terms are." Path: Q6 = no. Y: NO CONTRACT, because the essential terms are too vague for a court to enforce (Scammell v Ouston).
- FP-12. Text: "A lead singer contracted for a run of performances falls ill and misses opening night and the first week. The producer hires a replacement." Path: K-BREACH Q2 = yes. Y: PRODUCER MAY TERMINATE, because failure to perform at the start went to the root of the contract and was a breach of condition (Poussard v Spiers).
- FP-13. Text: "A singer misses three of the six days of rehearsals but is ready for every performance." Path: K-BREACH Q3 = yes. Y: DAMAGES ONLY, because the rehearsal term was subsidiary (a warranty), so its breach does not justify termination (Bettini v Gye).
- FP-14. Text: "A ship chartered for 24 months is out of service for 5 weeks with engine repairs caused by an incompetent crew." Path: K-BREACH Q4 = no. Y: DAMAGES ONLY, because the seaworthiness term was innominate and the delay did not deprive the charterer of substantially the whole benefit (Hongkong Fir).
- FP-15. Text: "A carrier delivers a broken mill shaft to the repairers several days late. The mill sits idle. The carrier was never told that the mill had no spare shaft." Path: K-REMEDY Q2 = no for lost profits. Y: LOST PROFITS NOT RECOVERABLE, because the stoppage did not arise naturally from late carriage and the special circumstances were not communicated (Hadley v Baxendale).
- FP-16. Text: "A boiler supplier delivers five months late to a laundry. The laundry claims its ordinary lost profits, plus profits from unusually lucrative dyeing contracts that the supplier knew nothing about." Y: ORDINARY PROFITS RECOVERABLE, EXCEPTIONAL PROFITS TOO REMOTE, because only the ordinary loss was within reasonable contemplation (Victoria Laundry).
- FP-17. Text: "Lena contracts to buy a particular cottage. The seller refuses to complete." Path: K-REMEDY Q3 = damages inadequate. Y: SPECIFIC PERFORMANCE LIKELY, because land is treated as unique, so money cannot buy an equivalent [STD]. Contrast: if the subject were mass-produced goods, damages would be adequate and specific performance would be refused.

### Inferences
- K-FORMATION is a strict conjunctive chain, like the Fig. 4 tree in the paper. Each "otherwise" leaf is labelled with the first failed element, which gives one explanation token per negative outcome. This suits an evaluation of "which rule fired".
- K-BREACH is a classification, not a chain. The condition/warranty/innominate label is itself the decision variable Z. FP-12 to FP-14 form a minimal contrast set (same domain, different term types).
- For the consumer sub-domain, statute overrides the common-law tree. Under the CRA 2015, terms on quality, fitness and description are treated as included (see the next section), and the remedies are statutory.

### Gaps
- None of the contract case citations were re-fetched this session (bailii.org returned 403). The citations are standard textbook citations, but report and page references should be checked on BAILII or Find Case Law.
- The Currie v Misa definition is quoted in its traditional textbook form, not from a fetched report.
- Practical Benefit (Williams v Roffey [1991] 1 QB 1) and promissory estoppel were not covered, for scope.

---

## Negligence: duty, breach, causation, remoteness, defences

### Takeaway
A negligence claim succeeds only if: a duty of care is owed (established categories apply directly, per Robinson v CC West Yorkshire [2018] UKSC 4; Caparo is used only for genuinely novel situations); the duty is breached (falling below the reasonable person's standard); the breach caused the damage on the "but for" test (Barnett); and the damage is of a reasonably foreseeable kind (The Wagon Mound (No 1)). Damages are then reduced for contributory negligence under the Law Reform (Contributory Negligence) Act 1945, or barred entirely by volenti.

### Cited Findings

#### Layer 1: concept definitions [AUTHORED from STD case law]
- N-DUTY: A duty of care is a legal obligation to take reasonable care to avoid causing foreseeable harm to persons one ought reasonably to have in contemplation, the "neighbour principle". [STD: Donoghue v Stevenson [1932] AC 562, Lord Atkin. This was a Scottish appeal to the House of Lords, accepted as stating the law of England & Wales too.]
- N-CAPARO: For a novel situation, a duty is imposed only if harm was reasonably foreseeable, there was sufficient proximity between the parties, and it is fair, just and reasonable to impose a duty. [STD: Caparo Industries v Dickman [1990] 2 AC 605]
- N-ROBINSON: Caparo is not a universal three-stage test. Where a duty is established by precedent, such as a positive act causing physical injury, the court applies that precedent. For novel cases, it develops the law incrementally by analogy with established categories. [STD: Robinson v Chief Constable of West Yorkshire Police [2018] UKSC 4]
- N-BREACH: A breach of duty occurs when the defendant fails to do what the reasonable person would do in the circumstances. [STD: Blyth v Birmingham Waterworks (1856) 11 Ex 781]
- N-RISK-FACTORS: The standard is weighed against the likelihood of harm, the seriousness of harm, the cost of precautions, and the social value of the activity. [STD: Bolton v Stone [1951] AC 850; Paris v Stepney BC [1951] AC 367; Latimer v AEC [1953] AC 643]
- N-OBJECTIVE: The standard is objective and is not lowered for inexperience. A learner driver is judged as a reasonably competent driver. [STD: Nettleship v Weston [1971] 2 QB 691]
- N-PROFESSIONAL: A professional is not in breach if they acted in accordance with a practice accepted as proper by a responsible body of professional opinion, and that opinion is capable of logical support. [STD: Bolam [1957] 1 WLR 582; Bolitho [1998] AC 232]
- N-BUTFOR: Factual causation is satisfied if the damage would not have occurred but for the defendant's breach. [STD: Barnett v Chelsea & Kensington Hospital Management Committee [1969] 1 QB 428]
- N-REMOTE: The defendant is liable only for damage of a kind that was reasonably foreseeable. The precise manner and extent need not be foreseen. [STD: Overseas Tankship v Morts Dock ("The Wagon Mound (No 1)") [1961] AC 388; Hughes v Lord Advocate [1963] AC 837]
- N-CONTRIB: Where the claimant's own fault contributed to the damage, damages are reduced to the extent the court thinks just and equitable, having regard to the claimant's share of responsibility. [STD: Law Reform (Contributory Negligence) Act 1945 s1(1), https://www.legislation.gov.uk/ukpga/Geo6/8-9/28/section/1, not fetched; Froom v Butcher [1976] QB 286, seatbelt guideline 25% / 15%]
- N-VOLENTI: Volenti non fit injuria is a complete defence where the claimant, with full knowledge of the risk, freely and voluntarily agreed to run it. [STD: Morris v Murray [1991] 2 QB 6]. It cannot be raised against a passenger in a motor vehicle where insurance is compulsory [STD: Road Traffic Act 1988 s149].

#### Layer 2: decision tree
TREE N-NEGLIGENCE
- Q1 (duty). Does the case fall within an established duty category (road users, doctor–patient, employer–employee, manufacturer–consumer, a positive act causing physical injury)?
  - Yes → duty owed (Robinson) → Q2.
  - Otherwise (novel situation, pure economic loss, an omission, or a public authority failing to confer a benefit) → apply incremental analogy and the Caparo factors.
    - Foreseeable AND proximate AND fair, just and reasonable → duty → Q2.
    - Otherwise → Y = NO LIABILITY, because no duty of care (Caparo).
- Q2 (breach). Did the defendant fall below the reasonable person standard, weighing likelihood, severity, cost of precautions and utility?
  - Yes → Q3.
  - Otherwise → Y = NO LIABILITY, because there was no breach (Bolton v Stone).
- Q3 (factual causation). But for the breach, would the damage have occurred?
  - It would NOT have occurred → Q4.
  - Otherwise (it would have happened anyway) → Y = NO LIABILITY, because causation fails (Barnett).
- Q4 (remoteness). Was damage of this kind reasonably foreseeable?
  - Yes → Q5.
  - Otherwise → Y = NO LIABILITY, because the damage is too remote (Wagon Mound (No 1)).
- Q5 (damage). Is there actionable damage (personal injury, property damage, recognised psychiatric injury, or recoverable economic loss)?
  - Yes → Q6.
  - Otherwise → Y = NO LIABILITY, because negligence is not actionable without damage.
- Q6 (defences). Did the claimant fully and freely consent to the specific risk, where s149 RTA 1988 does not bar the defence?
  - Yes → Y = NO LIABILITY, because volenti applies (Morris v Murray).
  - Otherwise → Q7.
- Q7. Did the claimant's own fault contribute to the damage?
  - Yes → Y = LIABLE, DAMAGES REDUCED by the just and equitable percentage (1945 Act s1).
  - Otherwise → Y = LIABLE, FULL DAMAGES.

#### Layers 3 & 4: fact patterns and outcomes [AUTHORED, fictional]
- FP-18. Text: "Maya drinks a bottle of ginger beer bought for her by a friend. The opaque bottle contained a decomposed snail and she becomes ill. She has no contract with the manufacturer." Path: Q1 = yes (manufacturer–consumer). Y: DUTY OWED, so she can sue the manufacturer in negligence, because a manufacturer owes a duty of care to the ultimate consumer where there is no reasonable possibility of intermediate examination (Donoghue v Stevenson).
- FP-19. Text: "Police officers tackle a suspect on a busy pavement and knock over Nora, a passer-by, injuring her. The force argues that police owe no duty under Caparo." Path: Q1 = yes (positive act causing foreseeable physical injury). Y: DUTY OWED, because the police are subject to the ordinary law of negligence for positive acts. It is unnecessary to reapply Caparo where a duty is established (Robinson v CC West Yorkshire [2018] UKSC 4).
- FP-20. Text: "An investor buys shares in a company relying on the audited accounts. The auditor prepared the accounts only for the shareholders' statutory purposes and did not know of this investor." Path: Q1 = novel / economic loss → Caparo proximity = no. Y: NO DUTY, because the auditor did not prepare the accounts for this purpose or for this person, so proximity is lacking (Caparo).
- FP-21. Text: "On her third driving lesson, Olu mounts the kerb and injures a pedestrian. She argues she did her best as a learner." Path: Q2 = yes. Y: BREACH, because the standard is that of a reasonably competent driver and inexperience does not lower it (Nettleship v Weston).
- FP-22. Text: "A cricket ball is hit out of a ground and injures Priya on a quiet road. Balls had cleared the fence about six times in thirty years." Path: Q2 = no. Y: NO BREACH, because the risk was so small that a reasonable person would not have taken further precautions (Bolton v Stone).
- FP-23. Text: "Quinn attends A&E after drinking contaminated tea and is sent home unexamined. He dies of arsenic poisoning. Evidence shows he would have died even if he had been treated promptly." Path: Q1 yes, Q2 yes, Q3 fails. Y: NO LIABILITY, because the "but for" test is not satisfied. He would have died anyway (Barnett v Chelsea & Kensington HMC).
- FP-24. Text: "A ship's crew carelessly spills furnace oil into a harbour. Days later, molten metal from welding ignites the oil, and a wharf burns. Experts say oil on water was not foreseeably flammable." Path: Q4 = no. Y: NO LIABILITY FOR THE FIRE, because fire damage was not a reasonably foreseeable kind of damage (Wagon Mound (No 1)).
- FP-25. Text: "Rhys is injured when Sam negligently crashes into his car. Rhys was not wearing a seatbelt, and the belt would have prevented his injuries altogether." Path: Q7 = yes. Y: SAM IS LIABLE, BUT DAMAGES ARE REDUCED (guideline 25%), because Rhys's failure to wear a seatbelt contributed to the damage (1945 Act s1; Froom v Butcher).
- FP-26. Text: "Tom knowingly takes a joyride in a light aircraft piloted by a friend who has visibly drunk a large amount of whisky. The plane crashes." Path: Q6 = yes. Y: NO LIABILITY, because Tom fully and freely accepted an obvious and extreme risk (volenti; Morris v Murray). Contrast: if this were a passenger in a car with a drunk driver, s149 RTA 1988 would prevent volenti, and contributory negligence would apply instead.

### Inferences
- Robinson changes the first node of the tree. Since 2018, Q1 is a lookup for an established category first, with Caparo as the fallback branch. Corpora that encode "duty = Caparo three-stage test" for every case would encode an outdated rule. This is a useful "updatability" item, as in Sheth et al. E11.
- Q6/Q7 order matters: volenti is a complete defence (leaf = no liability), while contributory negligence only modifies the label (a partial liability leaf). This gives the tree a graded output, not just a binary one.

### Gaps
- No negligence case was re-fetched this session (bailii returned 403). The citations are standard and should be verified on Find Case Law.
- The 25%/15% seatbelt percentages are from Froom v Butcher as commonly cited and were not verified this session.
- Psychiatric injury (Alcock), omissions (Michael v CC South Wales [2015] UKSC 2), and occupiers' liability were not covered.

---

## Consumer Rights Act 2015: goods (ss9–11, 19–24) and services (s49)

### Takeaway
For contracts between a trader and a consumer, every goods contract is treated as including terms that the goods are of satisfactory quality (s9), fit for any particular purpose made known (s10), and as described (s11). If the goods do not conform, the consumer has a short-term right to reject, normally within 30 days (s22). After that, or instead, the consumer has the right to repair or replacement (s23), then a price reduction or final right to reject (s24). Services must be performed with reasonable care and skill (s49).

### Cited Findings

#### Layer 1: concept definitions
- CRA-S22: The short-term right to reject must be exercised before "the end of 30 days", counted from the day after ownership or possession has transferred, the goods have been delivered, and any required installation has been notified. For goods "of a kind that can reasonably be expected to perish after a shorter period", the limit is that shorter period (s22(3)–(4)). [VERIFIED 2026-10-31: https://www.legislation.gov.uk/ukpga/2015/15/section/22. The page says it is "up to date with all changes known to be in force on or before 29 October 2026" and lists two outstanding changes by 2024 c. 13 (the Digital Markets, Competition and Consumers Act 2024), s278, concerning cross-references to s12(2A) and s37(2A). FLAG: an amendment is pending.]
- CRA-S9: Goods must be of satisfactory quality, meaning they meet the standard a reasonable person would consider satisfactory, taking account of any description, the price, and all other relevant circumstances. Quality aspects include fitness for the usual purposes, appearance and finish, freedom from minor defects, safety and durability. [STD: https://www.legislation.gov.uk/ukpga/2015/15/section/9, not fetched this session]
- CRA-S10: If the consumer makes known to the trader a particular purpose for the goods, the goods must be reasonably fit for that purpose, unless the consumer did not rely, or it was unreasonable to rely, on the trader's skill or judgment. [STD: https://www.legislation.gov.uk/ukpga/2015/15/section/10, not fetched]
- CRA-S11: Goods supplied by description must match the description. [STD: https://www.legislation.gov.uk/ukpga/2015/15/section/11, not fetched]
- CRA-S19-PRESUMPTION: Goods that do not conform within six months of delivery are taken not to have conformed on the day of delivery, unless the trader proves otherwise or the presumption is incompatible with the nature of the goods. [STD: s19(14)–(15), https://www.legislation.gov.uk/ukpga/2015/15/section/19, not fetched]
- CRA-S20-REFUND: On rejection, the trader must refund without undue delay, and in any event within 14 days of agreeing that the consumer is entitled to a refund. [STD: s20(15), not fetched]
- CRA-S23: Where the consumer requires repair or replacement, the trader must do it within a reasonable time, without significant inconvenience to the consumer, and bear the necessary costs. The consumer cannot require a remedy that is impossible or disproportionate compared with the other remedy. [STD: https://www.legislation.gov.uk/ukpga/2015/15/section/23, not fetched]
- CRA-S24: The consumer may claim a price reduction or exercise the final right to reject if, after one repair or one replacement, the goods still do not conform, or if repair or replacement is impossible or not done within a reasonable time without significant inconvenience. A deduction for use may apply to a refund under the final right to reject (none if exercised within 6 months, except for motor vehicles). [STD: s24(5)–(10), not fetched]
- CRA-S49: Every contract to supply a service is treated as including a term that the trader must perform the service with reasonable care and skill. [STD: https://www.legislation.gov.uk/ukpga/2015/15/section/49, not fetched]
- CRA-S54-56: If a service is not performed with reasonable care and skill, the consumer may require repeat performance (s55). If repeat performance is impossible or not done within a reasonable time without significant inconvenience, the consumer may claim a price reduction (s56). [STD, not fetched]
- Territorial note: CRA 2015 Part 1 extends to England & Wales, Scotland and Northern Ireland, with modifications for Scots law, such as the terminology for rejection and damages. [STD; not verified this session]

#### Layer 2: decision tree
TREE CRA-GOODS
- Q0. Is the contract between a trader and a consumer (an individual acting wholly or mainly outside their trade)?
  - Otherwise → apply the Sale of Goods Act 1979 (business-to-business) or the common law, not the CRA.
- Q1. Do the goods fail s9 (quality), s10 (a purpose made known) or s11 (description)?
  - Otherwise → Y = NO CRA REMEDY (the goods conform).
- Q2. Is it within 30 days (s22), or within a shorter perishable period, from transfer + delivery + installation notice?
  - Yes → Y = SHORT-TERM RIGHT TO REJECT: full refund within 14 days (s20, s22).
  - Otherwise → Q3.
- Q3. Has the consumer had one repair or replacement, or is repair/replacement impossible, or did the trader fail to do it within a reasonable time without significant inconvenience?
  - No → Y = RIGHT TO REPAIR OR REPLACEMENT at the trader's cost (s23). The burden on the trader's side is eased by the s19(14) presumption within 6 months.
  - Yes → Y = PRICE REDUCTION OR FINAL RIGHT TO REJECT (s24).

TREE CRA-SERVICES
- Q1. Was the service performed with reasonable care and skill (s49)?
  - Yes → Y = NO BREACH.
  - Otherwise → Q2.
- Q2. Is repeat performance possible within a reasonable time without significant inconvenience?
  - Yes → Y = REPEAT PERFORMANCE at no cost (s55).
  - Otherwise → Y = PRICE REDUCTION, which may be up to the full price (s56).

#### Layers 3 & 4: fact patterns and outcomes [AUTHORED, fictional]
- FP-27. Text: "Uma buys a new kettle from a shop. Twelve days later it stops heating. She wants her money back, not a repair." Path: Q1 yes (s9) → Q2 yes. Y: FULL REFUND, because the kettle is not of satisfactory quality and she is within the 30-day short-term right to reject (CRA 2015 ss9, 20, 22).
- FP-28. Text: "Victor's new laptop develops a faulty screen after two months. The retailer says he is too late to reject it." Path: Q2 no → Q3 no. Y: RIGHT TO REPAIR OR REPLACEMENT, because the 30-day period has passed, but s23 applies. The fault appeared within six months, so it is presumed to have existed at delivery (CRA 2015 ss19(14), 23).
- FP-29. Text: "After Victor's laptop has been repaired once, the same fault returns." Path: Q3 yes. Y: PRICE REDUCTION OR FINAL RIGHT TO REJECT, because one repair has failed (CRA 2015 s24).
- FP-30. Text: "Wen tells a shop assistant she needs boots that are waterproof for hill walking and buys the pair recommended. They leak on the first wet walk." Path: Q1 yes via s10. Y: BREACH OF s10, because Wen made her particular purpose known and relied on the trader's recommendation (CRA 2015 s10). She can reject within 30 days.
- FP-31. Text: "A jumper sold online as '100% merino wool' turns out to be acrylic." Path: Q1 yes via s11. Y: BREACH OF s11, because the goods do not match their description (CRA 2015 s11).
- FP-32. Text: "Xavi buys a bouquet of fresh flowers, which wilt on day 5. He asks for a refund on day 25." Path: Q2: perishable rule. Y: THE SHORT-TERM RIGHT TO REJECT MAY HAVE EXPIRED, because for goods expected to perish sooner, the deadline is that shorter period, not 30 days (CRA 2015 s22(4)). Other remedies, such as s23 or s24, may still be relevant.
- FP-33. Text: "A handyman fixes kitchen shelves with screws that are too short, and the shelves collapse a week later." Path: CRA-SERVICES Q1 no → Q2 yes. Y: REPEAT PERFORMANCE AT NO COST, because the service was not performed with reasonable care and skill (CRA 2015 ss49, 55). If repeat performance is impossible, a price reduction applies (s56).

### Inferences
- The CRA trees are time-indexed. Q2 depends on day arithmetic, so the R-ADD style "fact + math → answer" template in the existing corpus (see paper notes E9) can be combined with a rule lookup, for example "bought day 0, fault day 12, 12 ≤ 30 → reject".
- FP-27/28/29 form a progression contrast set over the same goods, where only time and history change.

### Gaps
- Only s22 was fetched and verified this session. The wording of ss9, 10, 11, 19, 20, 23, 24 and 49 is paraphrased from standard knowledge, and the exact text should be checked on legislation.gov.uk.
- The outstanding DMCC Act 2024 s278 changes to s22 were not examined in detail. Whether they have since come into force, or change the 30-day rule, was not confirmed. They appear to be cross-reference amendments only.

---

## Procedure: limitation, CPR tracks, pre-action conduct and ADR, Churchill, mandatory small-claims mediation

### Takeaway
Limitation is 6 years for tort (s2) and simple contract (s5), and 3 years for personal injury from accrual or the date of knowledge (s11(4)). As of 31 October 2026, the CPR track thresholds are: small claims up to £10,000 (PI: PSLA up to £1,500, RTA PSLA up to £5,000; housing disrepair up to £1,000 repair cost and £1,000 other damages); fast track up to £25,000; intermediate track up to £100,000 (from 1 October 2023); multi-track above that or for listed claim types. Parties must follow pre-action protocols or the Practice Direction – Pre-Action Conduct; "litigation should be a last resort". Churchill v Merthyr Tydfil [2023] EWCA Civ 1416 confirmed the court's power to order ADR, and the CPR were amended from 1 October 2024 to reflect it. Mandatory one-hour free HMCTS mediation for small-claims specified money claims began on 22 May 2024 under the PD 51ZE pilot. The pilot now runs to 6 April 2027 (FLAG: it is a pilot, and its end date has already been changed once).

### Cited Findings

#### Layer 1: concept definitions and verified figures
- LIM-S5: "An action founded on simple contract shall not be brought after the expiration of six years from the date on which the cause of action accrued." [VERIFIED 2026-10-31: https://www.legislation.gov.uk/ukpga/1980/58/section/5, "up to date with all changes known to be in force on or before 31 October 2026"]
- LIM-S11: For personal injury, "the period applicable is three years from— (a) the date on which the cause of action accrued; or (b) the date of knowledge (if later) of the person injured" (s11(4)). If the person dies within the period, it is three years from the date of death or the personal representative's knowledge, whichever is later (s11(5)). [VERIFIED 2026-10-31: https://www.legislation.gov.uk/ukpga/1980/58/section/11, up to date to 31 October 2026, with one change yet to be applied ("applied by 2024 c. 13, s. 234(4)")]
- LIM-S2: An action founded on tort shall not be brought after six years from the date on which the cause of action accrued. [STD: https://www.legislation.gov.uk/ukpga/1980/58/section/2, not fetched this session. The s5 page did not display s2.] "Date of knowledge" is defined in s14 [STD]. Negligence causing latent damage, other than personal injury, has an extra period under s14A [STD].
- LIM-ACCRUAL: In contract, the cause of action accrues on breach. In negligence, it accrues when damage is suffered [STD].
- Scotland contrast: the Prescription and Limitation (Scotland) Act 1973 applies. Contractual obligations generally prescribe after 5 years, and personal injury actions have a 3-year limitation [STD; not verified this session].
- TRACK-SMALL: The small claims track is the normal track for: claims of no more than £10,000 (r26.9(4)); personal injury claims of no more than £10,000 where pain, suffering and loss of amenity (PSLA) damages are no more than £1,500, or no more than £5,000 for road traffic accident claims (£1,000 for RTA claims within r26.10, for example children, protected parties and pedestrians); and residential disrepair claims by tenants where repair costs are no more than £1,000 and other damages are no more than £1,000. [VERIFIED 2026-10-31: https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part26, page marked "Updated: Saturday, 6 April 2024"]
- TRACK-FAST: The fast track is for monetary claims of no more than £25,000, normally with a trial of no more than one day and limited expert evidence (one expert per party per field, experts in two fields). [VERIFIED 2026-10-31: same page, r26.9(5)–(6)]
- TRACK-INTERMEDIATE: The intermediate track is for claims suitable for neither the small claims nor the fast track, with monetary relief of no more than £100,000, a trial of no more than three days, no more than two experts per party, and no more than one claimant against one or two defendants (or two claimants against one defendant). [VERIFIED 2026-10-31: same page, r26.9(7)–(9). The introduction date of 1 October 2023 is STD; the CPR page itself does not state it.]
- TRACK-MULTI: The multi-track is the normal track for claims that do not normally fall into the other tracks. Certain claims always go there, including mesothelioma and asbestos claims, most clinical negligence claims, claims for harm or abuse of children or vulnerable adults, claims triable by jury, and some claims against the police or public authorities. [VERIFIED 2026-10-31: same page, r26.9(10)–(12)]
- Scotland contrast: Scottish sheriff courts use "simple procedure" (generally up to £5,000), not CPR tracks [STD; not verified this session].
- PAC-PD: Under the Practice Direction – Pre-Action Conduct and Protocols: "Litigation should be a last resort" (para 8). The claimant should send a concise letter setting out the basis of the claim, and the defendant should reply within a reasonable time: about 14 days in a straightforward case, and no more than 3 months in a very complex one (para 6). The listed forms of ADR are mediation, arbitration, early neutral evaluation and ombudsman schemes (para 10). "A refusal to participate in ADR might be considered unreasonable by the court" and could lead to costs consequences (para 11). The available sanctions include adverse costs, indemnity costs, and interest adjustments, with defendant interest up to "10% above base rate" (para 16). The court is concerned with substantial compliance, not minor breaches (para 13). [VERIFIED 2026-10-31: https://www.justice.gov.uk/courts/procedure-rules/civil/rules/pd_pre-action_conduct, page marked "Updated: Wednesday, 6 April 2022". FLAG: the page shows no post-Churchill amendment, so check whether a revised PD-PAC has been issued. The Civil Justice Council consulted on reforming pre-action protocols in 2022–23 (STD).]
- CHURCHILL: In Churchill v Merthyr Tydfil County Borough Council [2023] EWCA Civ 1416, the Court of Appeal held that courts can lawfully order parties to engage in non-court-based dispute resolution, or stay proceedings for it. One commentary describes this as departing from the dictum in Halsey v Milton Keynes General NHS Trust [2004] EWCA Civ 576. The court declined to lay down prescriptive rules on when to order ADR. [SECONDARY: search results summarising https://www.39essex.com/?p=11399, https://www.hsfkramer.com/zh_HK/notes/adr/2024-posts/compulsory-adr--changes-to-court-rules-from-1-october-2024, https://nortonrosefulbright.com/en/inside-disputes/blog/202411-changes-to-cpr-to-reflect-courts-power-to-compel-adr]
  - The test commonly quoted from the judgment is that an order must not impair the very essence of the claimant's right to a judicial hearing, and must be proportionate to achieving the legitimate aim of settling the dispute fairly, quickly and at reasonable cost. The judgment date was 29 November 2023, and the panel was Sir Geoffrey Vos MR, Lady Carr LCJ and Birss LJ. Halsey para 9 was treated as obiter. [STD: neither the primary judgment (BAILII returned 403, judiciary.uk URL 404) nor this wording was verified this session.]
- CPR-ADR-2024: The Civil Procedure (Amendment No. 3) Rules 2024 (SI 2024/839), in force 1 October 2024, amended CPR Parts 1, 3, 28, 29 and 44 to embed the court's power to order or encourage ADR, including as a costs consideration. [SECONDARY: https://www.paulhastings.com/insights/london-litigation/cpr-changes-bring-mandatory-adr-from-1-october-2024; https://ciarb.org/news-listing/historic-moment-as-cpr-changes-embed-promotion-of-adr. The exact rule numbers, e.g. r1.1(2)(f), r3.1(2)(o) and r44.2(5)(e), are STD and were not verified.]
- POST-CHURCHILL: Commentary reports that in Northamber v Genee the Court of Appeal sanctioned a party for failure to mediate following Churchill. [SECONDARY: https://www.fieldfisher.com/en/insights/cpr-amendments-how-courts-are-mandating-alternative-dispute-resolution-in-civil-cases, single source, not verified]
- MEDIATION-PILOT: Practice Direction 51ZE (Small Claims Track Automatic Referral to Mediation Pilot Scheme) applies to claims issued on or after 22 May 2024, and the pilot runs to 6 April 2027. Under modified r26.6, where the only remedy claimed is "a judgment for a specified sum of money", then "Where all parties have filed their directions questionnaire, the claim will be referred to the Mediation Service". Road traffic accident and personal injury claims are excluded. Online Civil Money Claims are dealt with under PD 51R, where the mediation duty applies to claims from 5 November 2024. Under modified r27.8(7), the court "must consider whether any sanction is appropriate", having regard to attendance at mediation. [VERIFIED 2026-10-31: https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part51/practice-direction-51ze-small-claims-track-automatic-referral-to-mediation-pilot-scheme, page "Updated: Thursday, 1 October 2026"]
  - FLAG: a 2024 law-firm source gave the end date as 21 May 2026 [SECONDARY: https://www.rpclegal.com/thinking/insurance-and-reinsurance/compulsory-mediation-in-small-claims-a-quick-guide-for-the-busy-lawyer/]. The official page now says 6 April 2027, so the pilot was extended. Treat it as time-limited.
- MEDIATION-GOVUK: For claims of £10,000 or less, parties must attend court-organised mediation. It is a free telephone appointment lasting up to one hour, in which an HMCTS mediator speaks to each side separately. If a party fails to attend, the judge can impose sanctions such as striking out the case or ordering payment of court costs, even if that party wins. [VERIFIED 2026-10-31: https://www.gov.uk/guidance/small-claims-mediation-service, no last-updated date captured] The government press release states that from 22 May 2024, parties to money claims up to £10,000 must take part in a free one-hour mediation appointment [SECONDARY via search snippet: https://www.gov.uk/government/news/faster-resolution-for-small-claims-as-mediation-baked-into-courts-process].
- CONFLICT FLAG: the unmodified r26.6 on the main Part 26 page (updated 6 April 2024) still says that automatic referral does not apply "where a party does not agree to referral". The pilot version in PD 51ZE removes that consent requirement for in-scope claims. Both are current. The pilot modifies the rule for pilot claims, so in-scope specified money claims follow PD 51ZE. [VERIFIED 2026-10-31: both pages above]

#### Layer 2: decision trees
TREE P-LIMITATION
- Q1. Is the claim for personal injury?
  - Yes → the period is 3 years from accrual or the date of knowledge, if later (s11(4)). The court has a discretion to disapply it (s33, STD).
  - Otherwise → Q2.
- Q2. Is the claim in simple contract?
  - Yes → 6 years from breach (s5).
  - Otherwise → Q3.
- Q3. Is it in tort (not PI)?
  - Yes → 6 years from damage (s2), with a latent-damage extension in negligence (s14A).
- Q4. Was the claim issued within the period?
  - Yes → Y = IN TIME.
  - Otherwise → Y = TIME-BARRED. Limitation must be pleaded as a defence; it bars the remedy.

TREE P-TRACK (as of 31 October 2026)
- Q1. Is it a mandatory multi-track type (mesothelioma, most clinical negligence, abuse claims, etc.)?
  - Yes → MULTI-TRACK.
- Q2. Is it a PI claim?
  - Yes → if the value is ≤ £10,000 AND PSLA is ≤ £1,500 (non-RTA) or ≤ £5,000 (RTA; £1,000 in r26.10 cases) → SMALL CLAIMS. Otherwise → Q4.
- Q3. Is it a housing disrepair claim by a tenant?
  - Yes → if repairs are ≤ £1,000 AND other damages are ≤ £1,000 → SMALL CLAIMS. Otherwise → Q4.
- Q4. Is the value ≤ £10,000?
  - Yes → SMALL CLAIMS.
- Q5. Is the value ≤ £25,000, with a trial of ≤ 1 day and limited experts?
  - Yes → FAST TRACK.
- Q6. Is the value ≤ £100,000, with a trial of ≤ 3 days, ≤ 2 experts per party, and simple party structure?
  - Yes → INTERMEDIATE TRACK.
- Otherwise → MULTI-TRACK.
- Note: the court allocates by considering all r26.13 factors (STD). Value is the normal rule, not an absolute one.

TREE P-ADR
- Q1. Before issue, did the parties follow the relevant pre-action protocol, or PD-PAC (letter before claim, reply in a reasonable time, consider ADR)?
  - Otherwise → the court may stay the claim, or impose costs or interest sanctions (PD-PAC paras 13–16).
- Q2. Is the claim a small-claims specified money claim (not RTA/PI) within PD 51ZE or PD 51R?
  - Yes → automatic referral to a free one-hour HMCTS mediation. Non-attendance → the court must consider sanctions (modified r27.8(7)).
- Q3. In any track, did a party unreasonably refuse ADR or breach an ADR order?
  - Yes → costs consequences are possible (PD-PAC para 11; CPR as amended October 2024). The court may also order ADR (Churchill).
  - Otherwise → no ADR sanction.

#### Layers 3 & 4: fact patterns and outcomes [AUTHORED, fictional]
- FP-34. Text: "A builder failed to finish an extension by the agreed date of 1 March 2019. The homeowner issues a contract claim on 1 September 2026." Path: P-LIMITATION Q2 yes → Q4 no. Y: TIME-BARRED, if the defendant pleads limitation, because a simple contract claim must be brought within six years of breach, which here was by 1 March 2025 (Limitation Act 1980 s5).
- FP-35. Text: "Yara was exposed to a hazard at work in 2021, but she only learned in 2024 that her illness was caused by it and was attributable to her employer. She issues a claim in 2026." Path: P-LIMITATION Q1 yes. Y: LIKELY IN TIME, because for personal injury the three years run from the date of knowledge if that is later than accrual (Limitation Act 1980 s11(4)(b), s14).
- FP-36. Text: "A sole trader sues a customer for an unpaid invoice of £8,000 and claims only that sum. Both parties return directions questionnaires." Path: P-TRACK Q4 → small claims; P-ADR Q2 yes. Y: SMALL CLAIMS TRACK, WITH AUTOMATIC REFERRAL TO A FREE ONE-HOUR HMCTS MEDIATION, because the claim is a specified money claim of no more than £10,000 (CPR r26.9(4); PD 51ZE modified r26.6). If a party fails to attend, the court must consider sanctions (modified r27.8(7)).
- FP-37. Text: "Zane is injured as a pedestrian in a road accident. His PSLA is valued at £3,000 and his total claim at £4,000." Path: P-TRACK Q2: an RTA claim within r26.10 (pedestrian), PSLA £3,000 > £1,000. Y: NOT SMALL CLAIMS; LIKELY FAST TRACK, because the £1,000 PSLA limit applies to pedestrians in RTA claims (r26.9(1)(a), r26.10), and the value is ≤ £25,000 (r26.9(5)). Contrast: a car occupant with PSLA of £3,000 would fall within the £5,000 RTA small-claims limit. PI is also excluded from mandatory mediation.
- FP-38. Text: "A company claims £18,000 for defective machinery, with a half-day trial expected and one expert each." Path: P-TRACK Q5. Y: FAST TRACK, because the value is no more than £25,000 and the trial will take no more than a day (CPR r26.9(5)–(6)).
- FP-39. Text: "A software supplier claims £60,000 from one customer. The trial is expected to take two days, with one expert per side." Path: P-TRACK Q6. Y: INTERMEDIATE TRACK, because the claim is over £25,000, no more than £100,000, the trial is within three days, and it involves one claimant against one defendant (CPR r26.9(7)–(9)).
- FP-40. Text: "In a fast-track claim, the claimant twice proposes mediation. The defendant ignores both letters and later wins at trial." Path: P-ADR Q3 yes. Y: THE WINNING DEFENDANT MAY STILL FACE A COSTS PENALTY, because ignoring an ADR invitation can be unreasonable conduct and the court can take it into account on costs (PD-PAC paras 11, 14, 16; CPR Part 44 as amended from 1 October 2024; Churchill).
- FP-41. Text: "A homeowner sues the council for nuisance, without first using the council's internal complaints procedure. The council asks the court to pause the claim." Y: THE COURT MAY STAY THE CLAIM FOR, OR ORDER, A NON-COURT DISPUTE RESOLUTION PROCESS, because Churchill confirms that it may do so if this does not impair the essence of the right to a judicial hearing and is proportionate (Churchill v Merthyr Tydfil [2023] EWCA Civ 1416). These are close to the facts of Churchill itself.

### Inferences
- Procedure is where the corpus is most exposed to change. Since 2023 the figures have moved three times: intermediate track (October 2023), mandatory mediation (May 2024, then November 2024 for OCMC), and the ADR rule amendments (October 2024). The PD 51ZE end date has also changed (21 May 2026 → 6 April 2027). Every procedural fact in the corpus should carry an "as of" date and a source version. This matches the paper's E11 point that knowledge graphs "are easy to update".
- PD-PAC (updated 2022) predates Churchill. The ADR "otherwise" branch should therefore cite both PD-PAC and Churchill/SI 2024/839, not PD-PAC alone.

### Gaps
- The primary Churchill judgment text could not be fetched (BAILII 403; the judiciary.uk URL guessed returned 404). The quoted test, date and panel are [STD] and need verification on https://caselaw.nationalarchives.gov.uk/.
- The SI 2024/839 rule text was not fetched, so the exact new rule numbers are unverified.
- The 1 October 2023 start date for the intermediate track is not stated on the fetched CPR page. It is [STD] (from the Civil Procedure (Amendment No. 2) Rules 2023 and the extension of fixed recoverable costs).
- s2 of the Limitation Act was not displayed on the fetched page.
- Whether a revised PD-PAC or new pre-action protocols have been issued since April 2022 was not confirmed.
- The specific protocols (e.g. Debt Claims, Personal Injury, Professional Negligence) were not summarised.

---

## Other common dispute types: tenancy deposits and neighbour nuisance (brief)

### Takeaway
In England & Wales, a landlord must protect a tenant's deposit in a government-backed scheme within 30 days. If the landlord fails to do so, the court must order repayment or payment into a scheme, and must order a penalty of between 1× and 3× the deposit (Housing Act 2004 s214). Assured periodic tenancies replaced assured shorthold tenancies on 1 May 2026 under the Renters' Rights Act 2025. Private nuisance is an unreasonable interference with the use or enjoyment of land, and only a person with an interest in the land can sue.

### Cited Findings

#### Layer 1: definitions
- DEP-30DAYS: A deposit must be "put in the scheme within 30 days of getting it". The approved schemes in England and Wales are the Deposit Protection Service, MyDeposits and the Tenancy Deposit Scheme. The deposit must be returned within 10 days of the parties agreeing the amount. While a dispute is unresolved, the deposit stays protected. Scotland and Northern Ireland have separate schemes. Assured periodic tenancies replaced assured shorthold tenancies on 1 May 2026. [VERIFIED 2026-10-31: https://www.gov.uk/tenancy-deposit-protection, OGL v3.0]
- DEP-S214: If the requirements are not complied with, the court must order the person holding the deposit to repay it, or to pay it into a custodial scheme, within 14 days (s214(3)). It must also order the landlord to pay the applicant "a sum of money not less than the amount of the deposit and not more than three times the amount of the deposit" within 14 days (s214(4)). The Renters' Rights Act 2025 amended s214(1), inserted (1ZA)–(1ZB) and amended (5) from 1 May 2026 for specified purposes. No RRA change to (3), (3A) or (4) is shown. [VERIFIED 2026-10-31: https://www.legislation.gov.uk/ukpga/2004/34/section/214, up to date to 27 October 2026]
- NUIS-PRIVATE: Private nuisance is an unreasonable interference with a person's use or enjoyment of land, or of a right over it. [STD: Fearn v Board of Trustees of the Tate Gallery [2023] UKSC 4]
- NUIS-STANDING: Only a person with a proprietary interest in the affected land, such as an owner or tenant, can sue in private nuisance. [STD: Hunter v Canary Wharf [1997] AC 655]
- NUIS-FACTORS: Reasonableness is judged by factors such as duration, frequency, time of day, and the character of the locality. It is no defence that the claimant "came to the nuisance". [STD: Sturges v Bridgman (1879) 11 Ch D 852; Coventry v Lawrence [2014] UKSC 13]

#### Layer 2: decision trees
TREE DEP
- Q1. Was the deposit protected in an approved scheme within 30 days, with the prescribed information given?
  - Yes → disputes go to the scheme's ADR or the court on the merits.
  - Otherwise → Y = THE COURT MUST ORDER REPAYMENT OR PROTECTION, PLUS A PENALTY OF 1–3× THE DEPOSIT (s214(3)–(4)).

TREE NUIS
- Q1. Does the claimant have an interest in the land?
  - Otherwise → Y = NO CLAIM IN PRIVATE NUISANCE (Hunter).
- Q2. Is the interference substantial and unreasonable, given its duration, timing and locality?
  - Yes → Y = NUISANCE: injunction and/or damages.
  - Otherwise → Y = NO NUISANCE.

#### Layers 3 & 4: fact patterns and outcomes [AUTHORED, fictional]
- FP-42. Text: "Abi pays a £1,200 deposit in January. Her landlord never protects it. She applies to the county court." Path: DEP Q1 = no. Y: THE COURT MUST ORDER REPAYMENT OR PROTECTION, AND A PAYMENT OF £1,200–£3,600 TO ABI, because the deposit was not protected within 30 days (Housing Act 2004 s214(3)–(4)).
- FP-43. Text: "Bilal, a homeowner, endures his neighbour's amplified music until 3 a.m. most nights for six months in a quiet residential street." Path: NUIS Q1 yes → Q2 yes. Y: PRIVATE NUISANCE, because frequent late-night noise in a quiet residential area is a substantial and unreasonable interference with his enjoyment of his land (Fearn v Tate; Sturges v Bridgman).
- FP-44. Text: "Bilal's adult houseguest, who has no tenancy or ownership, sues the neighbour in private nuisance." Path: NUIS Q1 = no. Y: NO CLAIM, because only a person with an interest in the land can sue in private nuisance (Hunter v Canary Wharf).

### Inferences
- The deposit rule is the cleanest "symbolic" rule in the corpus: a numeric deadline, a mandatory consequence, and a bounded numeric range. It is good for testing whether the model outputs the 1×–3× range rather than a fixed figure.
- Because of the 1 May 2026 Renters' Rights Act transition, any corpus item that mentions "assured shorthold tenancy" or "section 21" as current law in England is now outdated.

### Gaps
- The prescribed-information requirement and the effect of non-protection on possession notices after the Renters' Rights Act were not checked.
- The Welsh position under the Renting Homes (Wales) Act 2016 (occupation contracts) differs and was not covered. The fetched CPR page refers to Welsh "contract-holders".
- The nuisance case law was not re-fetched this session.
- Citizens Advice pages were not fetched this session, so none of its content is quoted.
- LegalBench and COLIEE were not fetched. They are mentioned only as format analogues: rule + facts → label (LegalBench), and statute retrieval + entailment (COLIEE).

Unit count: 44 fact-pattern units (FP-01 to FP-44), each with concepts, decision path, outcome Y and a because-explanation.
