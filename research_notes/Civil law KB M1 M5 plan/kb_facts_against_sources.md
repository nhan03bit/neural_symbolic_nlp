# Candidate civil-law KB facts checked against corpus.ts and public UK sources

Scope: England and Wales, educational project, not legal advice. Sources checked 2026-11-03. Corpus line numbers refer to `src/routes/train-embed/corpus.ts` as it stood on that date. `CORPUS` is `CIVIL_LAW_DEFINITIONS` plus `STORIES` sentences (line 352), so lines 23-268 and 289-336 are training text. `CIVIL_LAW_CORPUS` (from line 642, for example lines 704, 710, 752) is the separate expert-domain text, which the comment at lines 432-433 says is "not wired into training".

## Is each defined_by fact a fair simplification in UK civil law?

### Takeaway
All eight exact sentences are in the corpus. Claimant matches the legal definition closely, and creditor and debtor match the ordinary meaning. Defendant, tenant, trader and consumer are fair simplifications that read wrongly as general law. "The landlord is the person who owns the home" is the weakest: it describes the typical case only, and sources directly show landlords who are not the owner.

### Cited Findings

#### Fact-by-fact table

| Fact | Exact corpus line | What the sources say | Verdict |
|---|---|---|---|
| defined_by(claimant, brings a claim) | L23 `"the claimant is the person who brings a claim"` | "'claimant' means a person who makes a claim" (CPR r2.3(1)) | **Supported.** "Brings" = "makes". Role is relative to a particular claim (see next section). |
| defined_by(defendant, answers a claim) | L24 `"the defendant is the person who answers a claim"` | "'defendant' means a person against whom a claim is made" (CPR r2.3(1)). Nothing in the definition requires an answer. | **Simplified.** Describes what a defendant is expected to do, not what makes one a defendant. The corpus shows this itself: L80 `"if the defendant does not respond the claimant can ask for judgment"`. |
| defined_by(landlord, owns the home) | L27 `"the landlord is the person who owns the home"` | "Your immediate landlord is the person you rent from" for a subtenant (Shelter). HA 1988 s45(1): "landlord" includes any person deriving title under the original landlord. | **False as a general claim, fair for the typical case.** Simplified on purpose for the housing stories. |
| defined_by(tenant, rents the home) | L28 `"the tenant is the person who rents the home"` | Fits assured tenancies, where the dwelling is occupied "as his only or principal home" (HA 1988 s1(1)(b)). Not all tenancies are of homes: LTA 1954 s23(1) covers premises occupied "for the purposes of a business". | **Fair inside the corpus's housing scope, false as general law.** See commercial, lodger and Wales notes below. |
| defined_by(trader, sells goods), frame "is a business that" | L31 `"the trader is a business that sells goods"` | "a person acting for purposes relating to that person's trade, business, craft or profession" (CRA 2015 s2(2)). Part 1 covers supply of "goods, digital content or services" (s1(1)). | **Fair for the goods chapter, too narrow generally.** Selling is neither required nor enough. |
| defined_by(consumer, buys goods), frame "is a person who" | L32 `"the consumer is a person who buys goods"` | "an individual acting for purposes that are wholly or mainly outside that individual's trade, business, craft or profession" (CRA 2015 s2(3)). | **Fair for the typical case, and both too wide and too narrow.** See below. |
| defined_by(creditor, is owed money) | L37 `"the creditor is the person who is owed money"` | No general statutory definition found. Statute-specific: CCA 1974 s189(1) "the person providing credit under a consumer credit agreement" or an assignee; CPR r70.1(2) "judgment creditor" is "a person who has obtained or is entitled to enforce a judgment or order". | **Fair ordinary-language meaning.** Consistent with both, but narrower or wider than each in places. |
| defined_by(debtor, owes money) | L38 `"the debtor is the person who owes money"` | CCA 1974 s189(1): "the individual receiving credit under a consumer credit agreement" or an assignee; CPR r70.1(2) "judgment debtor" is "a person against whom a judgment or order was given or made". | **Fair ordinary-language meaning.** Same caveat. Supporting lines L68, L107. |
| is_a(claimant, defendant; court_party) | No line. Nearest: L103 `"a judge can order the parties to try mediation"`, L40 `"the mediator helps both sides agree"` | CPR uses "party" for these roles: r19.1 "joined as parties to a claim"; r20.2(2)(b) "a party bringing or defending an additional claim". | **Sound label, supported by CPR usage,** but not stated in the corpus. |
| is_a(landlord, tenant; housing_party) | No line | "housing party" is not a legal term in any source checked. | **Modelling label only.** Fine if not presented as law. Note landlords and tenants also exist outside housing (LTA 1954 s23). |
| is_a(trader, consumer; trade_party) | No line | CRA 2015 s1(1) "an agreement between a trader and a consumer" supports the grouping, not the term. | **Modelling label only.** |
| is_a(creditor, debtor; debt_party) | No line | No source uses this term. | **Modelling label only.** |
| counterpart(claimant, defendant) | L23-24; code comments L5-6, L17-18; analogies L373-374 | CPR r2.3(1) defines each against the same claim. | **Supported per claim.** Not one-to-one: r19.1 "any number of claimants or defendants". |
| counterpart(landlord, tenant) | L27-30, L292 `"if the neighbour is a tenant you can contact their landlord"`; analogies L371-372 | HA 1988 s45(1): tenant "includes a sub-tenant"; Shelter on chains of landlords. | **Supported per tenancy.** Joint tenants break one-to-one (s1(1)(a)). |
| counterpart(trader, consumer) | L31-32, L149, L157-158; analogies L371-372 | CRA 2015 s1(1). | **Supported within the CRA only.** A trader may instead deal with another business (L334). |
| counterpart(creditor, debtor) | L37-38; analogies L373-374 | CPR r70.1(2) pairs judgment creditor and debtor; CCA s189(1) pairs creditor and debtor. | **Supported per debt.** |
| disjoint(four classes) | No line | See next section. | **Fine for role labels, false for people.** |
| not_defined_by(x, v) | No line (derived) | See next section. | **Safe with fixes** to the frame wording and to which verbs it covers. |

No corpus sentence states an is_a, counterpart or disjoint fact. The pairing comes only from the parallel sentence shape, the code comments and the analogy list.

#### Landlord: is a landlord always the owner?
- No. A head tenant who sublets is the subtenant's landlord: "If you're a subtenant, your immediate landlord is the person you rent from", while "The head landlord is the person who owns the property" — [Shelter England, subtenants, updated 1 May 2026](https://england.shelter.org.uk/housing_advice/private_renting/subtenants).
- Statute does not tie "landlord" to ownership. It "includes any person from time to time deriving title under the original landlord" and any person other than a tenant who is, or but for an assured tenancy would be, entitled to possession — [Housing Act 1988 s45(1)](https://www.legislation.gov.uk/ukpga/1988/50/section/45).
- A landlord can hold no estate at all. In Bruton, a housing trust that held only a licence from the council was held to have granted a tenancy — [Wikipedia summary](https://en.wikipedia.org/wiki/Bruton_v_London_and_Quadrant_Housing_Trust); [Cambridge Law Journal commentary](https://www.cambridge.org/core/journals/cambridge-law-journal/article/nonproprietary-lease-the-rise-of-the-feudal-phoenix/B07F4FBF16718B1CCF4ECEE944C4BEBD). Secondary sources seen through search results only. "Bruton tenancies" are described as controversial.

#### Tenant: is a tenant always someone who rents a home?
- No, commercial tenancies exist. LTA 1954 Part II applies to "any tenancy" of premises "occupied by the tenant and ... so occupied for the purposes of a business carried on by him" — [LTA 1954 s23](https://www.legislation.gov.uk/ukpga/Eliz2/2-3/56/section/23).
- A tenant need not be an individual in general, though an assured tenancy requires "the tenant or, as the case may be, each of the joint tenants is an individual" — [Housing Act 1988 s1(1)](https://www.legislation.gov.uk/ukpga/1988/50/section/1). LTA 1954 s23(2) contemplates a business carried on by "a body of persons, whether corporate or unincorporate".
- Renting is not enough to be a tenant. "You are a lodger if you rent a room in your landlord's home and your landlord lives there too", and a lodger may have a tenancy or a licence — [GOV.UK lodgers](https://www.gov.uk/renting-a-room-in-someones-home-lodgers).
- A leaseholder is a landlord's counterpart and is described as owning: "You only own a leasehold property for a fixed period of time", with ownership returning "to the landlord" at the end — [GOV.UK leasehold property](https://www.gov.uk/leasehold-property).
- Wales differs. "tenants and licencees are now known as 'contract-holders'" and "Tenancy agreements have been replaced with 'occupation contracts'" from 1 December 2022 — [Welsh Government](https://www.gov.wales/housing-law-changed-renting-homes). The revised HA 1988 s1(1) now refers to a dwelling-house "in England" — [Housing Act 1988 s1](https://www.legislation.gov.uk/ukpga/1988/50/section/1).

#### Trader: is a trader always a business?
- In function yes, in form no. A trader is "a person" acting for purposes relating to "trade, business, craft or profession", personally or through someone acting in their name or on their behalf — [CRA 2015 s2(2)](https://www.legislation.gov.uk/ukpga/2015/15/section/2). So a sole trader or craftsperson counts.
- "Business" includes "the activities of any government department or local or public authority" — [CRA 2015 s2(7), as enacted](https://www.legislation.gov.uk/ukpga/2015/15/section/2/enacted).
- Selling goods is not required. Part 1 covers "goods, digital content or services" — [CRA 2015 s1(1)](https://www.legislation.gov.uk/ukpga/2015/15/section/1). Goods contracts include sale, hire, hire-purchase and transfer — [CRA 2015 s3(2)](https://www.legislation.gov.uk/ukpga/2015/15/section/3).
- The corpus itself has a non-selling trader: L314 `"a trader who provides a service must perform it with reasonable care and skill"`, about a plumber.

#### Consumer: is a consumer always a person?
- Yes, and more narrowly an individual: "an individual acting for purposes that are wholly or mainly outside that individual's trade, business, craft or profession" — [CRA 2015 s2(3)](https://www.legislation.gov.uk/ukpga/2015/15/section/2).
- "Person" alone is wider than that. In Acts of Parliament, "'Person' includes a body of persons corporate or unincorporate" — [Interpretation Act 1978 Sch 1](https://www.legislation.gov.uk/ukpga/1978/30/schedule/1). L32 is plain English, but a company buying goods is not a CRA consumer.
- Someone buying goods for business purposes is not a consumer. A trader who disputes consumer status "must prove it" — [CRA 2015 s2(4)](https://www.legislation.gov.uk/ukpga/2015/15/section/2).
- Buying is not required: hire, hire-purchase and transfer also count — [CRA 2015 s3(2)](https://www.legislation.gov.uk/ukpga/2015/15/section/3). There is also a partial exclusion for second-hand goods at public auction — [CRA 2015 s2(5)-(6), as enacted](https://www.legislation.gov.uk/ukpga/2015/15/section/2/enacted).

#### Corpus statements the sources do not support
1. **L27 landlord owns.** See above. Simplified on purpose, wrong as general law.
2. **L63 `"a claim is a request to the court for money"` and L25 `"the claimant asks the court for money"`.** A claim form must "specify the remedy which the claimant seeks", and needs a statement of value only "where the claimant is making a claim for money", so non-money claims exist — [CPR r16.2(1)](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part16). The corpus itself has a possession claim at L329. These lines matter because defined_by(claimant) depends on what "a claim" means.
3. **L24 defendant answers.** See table.
4. **L31 and L32 trader and consumer.** See above. L145 `"the consumer rights act protects people who buy goods"` carries the same narrowing. The expert-domain text gets this right at L710: "an individual acting wholly or mainly outside their trade" (not in training).
5. **L28, L204, L205 home-only tenancy.** `"rent is money paid to live in a home"` and `"a tenancy is the agreement to rent a home"` carry the same housing scope. Deliberate, but false for commercial lets.
6. **Internal conflict, L32 against L175 and L317.** L175 `"a manufacturer owes a duty of care to the consumer"` and story L317 use "consumer" for a woman whose drink was "bought for her by a friend". She did not buy, so she does not satisfy L32. This follows the case's "ultimate consumer" usage, as secondary summaries describe it — [The Legal Quorum](https://thelegalquorum.com/donoghue-v-stevenson-1932-ac-562-house-of-lords/) (search result, not opened). It is a tort sense, different from the CRA sense.

### Inferences
- L27 is the fact most worth a caveat in any KB write-up, since it is the only one where a source directly names a counter-example in the same housing scope.
- These lines read as deliberate teaching simplifications: the header at L15-19 says "educational text", and the housing and goods stories all sit inside the simplified scope. I would treat them as scope choices, not errors, but the KB should record the scope of each fact (for example housing lets, CRA goods contracts) so it is not exported as law.
- Tighter glosses, for the notes and not as corpus edits: defendant = "a claim is made against them"; landlord = "lets the home to the tenant"; tenant = "holds the home under a tenancy"; trader = "acts for business purposes"; consumer = "an individual acting outside their business".

### Gaps
- I found no general statutory definition of "creditor" or "debtor" in England and Wales law. Only statute-specific ones were checked, so the ordinary-language reading rests on those and on the corpus.
- The Bruton House of Lords judgment and Donoghue v Stevenson were not read in primary form. A Brodies article on Donoghue returned 403.
- Whether rent is legally essential to a tenancy was not checked. I recall case law saying it is not, but did not source it.

## Is any disjoint or counterpart claim misleading, and does the narrow frame-scoped wording avoid the problem?

### Takeaway
Yes, at the level of people, every class boundary can be crossed, and the corpus's own stories cross them. Disjointness holds only for role labels within one legal relationship. The frame-scoped wording avoids the legal problem, but it has three defects as written: it does not match the trader and consumer frames, it must be limited to the eight defining verbs, and "a claim" needs to mean the same claim.

### Cited Findings

#### One person, two roles
- **Claimant and defendant.** "A defendant may make a counterclaim against a claimant", an additional claim is "treated as if it were a claim", and "references to a claimant or defendant include a party bringing or defending an additional claim" — [CPR rr20.2-20.4](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part20). GOV.UK tells recipients of a claim: "You can also make a claim against them ('counterclaim') if you think they owe you money" — [GOV.UK respond to a money claim](https://www.gov.uk/respond-money-claim).
- **Landlord and tenant.** "tenant" includes a sub-tenant — [HA 1988 s45(1)](https://www.legislation.gov.uk/ukpga/1988/50/section/45). A head tenant is tenant upward and landlord downward — [Shelter England](https://england.shelter.org.uk/housing_advice/private_renting/subtenants).
- **Landlord and trader, tenant and consumer.** "an unfair term is not binding on a consumer (including a tenant)", and the law applies to social and private landlords. For licences, whether a landlord is a trader "will depend on the circumstances in each case" — [Shelter legal, updated 16 January 2023](https://england.shelter.org.uk/professional_resources/legal/housing_options/private_renting/unfair_terms_and_implied_conditions_in_tenancy_agreements). So housing and trade classes overlap for the same contract.
- **Creditor or debtor and everything else.** Corpus lines cross these directly (no external source needed for what the corpus says):
  - L295 eve "was owed money by a business and made a claim": claimant and creditor.
  - L299 iris "won her case but the debtor still did not pay": claimant and creditor.
  - L326 yara, a tenant, applies to court and "the court ordered the landlord to repay": tenant is claimant, landlord is defendant and owes money.
  - L229 `"arrears are rent that is owed and not paid"`: tenant is a debtor, landlord a creditor.
  - L78 `"to admit a claim means to agree that you owe the money"`: defendant is a debtor.
  - L329 a landlord who "could sell" his flat: a landlord who sells.
  - L292 `"if the neighbour is a tenant"`: tenant and neighbour.
- **Not one-to-one.** "Any number of claimants or defendants may be joined as parties to a claim" — [CPR r19.1](https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part19). Joint tenants are expressly contemplated — [HA 1988 s1(1)(a)](https://www.legislation.gov.uk/ukpga/1988/50/section/1).
- **Trader's counterpart is not always a consumer.** L334 `"a small firm supplied goods to another business"`, which falls outside the CRA. The repo's L710 routes those contracts to the Sale of Goods Act 1979.

#### Does not_defined_by hold in the frame? The direct-counterpart cases

| Rejected sentence | True in the world when | Does the frame wording cover it? |
|---|---|---|
| the defendant is the person who brings a claim | Counterclaim (CPR r20.2(2)(b)) | Yes, if "a claim" means the same claim |
| the claimant is the person who answers a claim | Defending a counterclaim | Yes, same condition |
| the landlord is the person who rents the home | Head tenant (Shelter). Also ordinary English: the landlord "rents out" | Yes, but this is the riskiest. See below |
| the tenant is the person who owns the home | Long leaseholder (GOV.UK leasehold) | Yes |
| the trader is a business that buys goods | Any business buying stock | Yes, once the frame is corrected |
| the consumer is a person who sells goods | A private person reselling | Yes, once the frame is corrected |
| the creditor is the person who owes money | Mutual debts | Yes |
| the debtor is the person who is owed money | Mutual debts | Yes |

### Inferences
- **Frame-scoped wording works legally.** Saying "v is not what defines role x" does not claim that x can never do v, so all the cases above stay consistent with it. The counterclaim case is the clearest: r20.2(2)(b) relabels the party for the additional claim, so the role word still attaches to who brings and who answers that claim.
- **Defect 1, frame mismatch.** The stated scope is "the x is the person who ___", but L31 is "the trader is a business that" and L32 is "the consumer is a person who". Read strictly, the wording does not cover those two roles, and "the trader is the person who" has no corpus line. The KB should store the frame per role.
- **Defect 2, verb set.** The derived negative should be limited to the eight defining verbs, with their objects. As an open complement it would reject true corpus-style lines such as L29 `"the landlord gets the rent"` and L30 `"the tenant pays the rent"` if rewritten into the frame.
- **Defect 3, same claim, same tenancy, same debt.** Counterpart and disjoint should be relative to one relationship. "A claim" in L23-24 hides this.
- **"Rents" is a real language trap.** Bare "rents" runs in both directions. GOV.UK's landlord guidance is titled [Renting out your property](https://www.gov.uk/renting-out-a-property), and L27-28 rely on the unstated "out". A reader could take "the landlord is the person who rents the home" as true English, so it is a weak negative example for evaluating the model. It is still fine within the corpus's own usage, since L28 uses "rents" only for the tenant.
- **Disjoint should apply to role labels, never to named entities.** If the system ever types story entities, L295, L299 and L326 would conflict with a person-level disjoint. Cross-class pairs such as not_defined_by(creditor, brings) are the same: true only as definitions, since creditors routinely bring claims.
- A generated sentence from the frame can still be read as a general claim by a user, so this scoping belongs in user-facing docs as well as in the KB.

### Gaps
- Shelter's statement on landlords as traders is partly from the licence section and depends on circumstances. I did not read the tenancy sections of the CMA's current unfair terms guidance (CMA37, [republished guidance PDF](https://assets.publishing.service.gov.uk/media/6a5f5e60929d28e5cd7604f3/unfair_contract_terms_guidance.pdf), found through search and not opened). A landlord letting one home occasionally may or may not be a trader, and I did not settle this.
- Mutual debts and set-off were not checked against a source. They are stated as ordinary logic.

## Are there further definitional facts in the corpus, in the same frame style, that could safely be added?

### Takeaway
Strictly, no: the "is the person who / is a business that / is a person who" frame occurs only on the eight lines already in the KB (L23, 24, 27, 28, 31, 32, 37, 38). In the looser "the role verb object" shape, seller and buyer are the best additions because they have direct statutory support, and a few others are low risk but unchecked. Several role lines should not be added as definitions.

### Cited Findings

#### Best candidates (source-checked)
| Candidate | Corpus line | Source | Note |
|---|---|---|---|
| seller → supplies goods | L33 `"the seller supplies the goods"` | "'seller' means a person who sells or agrees to sell goods" — [SGA 1979 s61(1)](https://www.legislation.gov.uk/ukpga/1979/54/section/61); duty "to deliver the goods" — [SGA 1979 s27](https://www.legislation.gov.uk/ukpga/1979/54/section/27) | Safe as a duty, not the strict definition. Needs a new frame. Good, since it covers business-to-business sales that trader/consumer does not. |
| buyer → pays the price | L34 `"the buyer pays the price"` | "'buyer' means a person who buys or agrees to buy goods" — [SGA 1979 s61(1)](https://www.legislation.gov.uk/ukpga/1979/54/section/61); duty "to accept and pay for them" — [SGA 1979 s27](https://www.legislation.gov.uk/ukpga/1979/54/section/27) | Same. A natural fifth counterpart pair. |

#### Low risk, not source-checked in this pass
These are ordinary descriptions of a role. Treat them as plain-language facts, not legal definitions.
- L39 `"the judge decides the case in court"`
- L40 `"the mediator helps both sides agree"` (also L96)
- L46 `"the homeowner owns the house"`: tautological and safe, but must not be declared disjoint from landlord, since a homeowner can let.
- L49 `"the carrier delivers goods"`
- L50 `"the auditor checks the accounts of a company"`
- L53 `"the manufacturer makes the product"`
- L57 `"the lawyer gives legal advice"`
- L35 `"the supplier sends the invoice"` and L36 `"the customer pays the invoice"`: a usable pair, but they describe billing practice. L124 `"the customer makes the offer at the till"` shows customer has a wider use.

#### Do not add as defining facts
| Line | Reason |
|---|---|
| L29 `"the landlord gets the rent"`, L30 `"the tenant pays the rent"` | True and useful, but secondary. A second defining verb would blur the single defined_by per role. Could be a separate typical-action relation. |
| L41 `"the bailiff collects goods to pay a debt"` | L299 says bailiffs first ask for payment and "may then take goods". Narrower than the corpus's own story. |
| L42 council, L43 police | L42 `"the council deals with nuisance and high hedges"` and L43 `"the police deal with violence and harassment"` are single duties within wide remits. |
| L44 `"the tribunal decides disputes about rent"` | One jurisdiction, not a definition of a tribunal. |
| L45 `"the neighbour lives next door"` | Internal conflict with L173 `"your neighbour in law is anyone your acts closely affect"`. Legal sense differs. |
| L47 plumber, L48 builder | L47 `"the plumber fits a boiler"` and L48 `"the builder builds a patio"` are story-specific instances. |
| L51 `"the investor buys shares in a company"` | Too narrow as a general definition. |
| L52 `"the shareholders own the company"` | Legally loose. A company is a separate legal person. Not source-checked here. |
| L54 driver, L56 pedestrian | L54 `"the driver must drive with care"` is a duty. L56 `"the pedestrian walks on the road"` is an odd definition. |

#### Different frame, if a defined_as relation is ever added
These define things, not roles, in "a x is ..." form: L64 dispute, L67 judgment, L100 settlement, L116 contract, L137 term, L138 breach, L139 damages, L155 refund, L229 arrears, L250 invoice, L171 tort, L170 negligence. The full list is much longer and I did not source-check them individually. Exclude or caveat L63 claim (money only; see first section), L204 rent and L205 tenancy (home only), and L216 `"possession means getting the home back"` (housing only).

### Inferences
- Adding seller/buyer gives the KB a pair that holds outside the consumer context, which also reduces pressure on the over-narrow trader/consumer facts. It would need its own frame, for example "the x is the person who ___" with verbs from L33-34, and those exact sentences are not in the corpus. So it would be a KB paraphrase or need new corpus text, which is out of scope here.
- L55 `"the learner is a new driver"` is the only other role line with an "is a" shape and would fit is_a, not defined_by. I would not add it unchecked (see Gaps).

### Gaps
- "New driver" may have a specific statutory meaning (a recently qualified driver) that differs from a learner. From memory only, the Road Traffic (New Drivers) Act 1995. Not fetched, so L55 is flagged for checking, not called wrong.
- Quotes from legislation.gov.uk and justice.gov.uk were extracted by a fetch tool that returns fragments, so check the exact wording on the page before quoting elsewhere. CRA s2(5)-(7) came from the as-enacted page, while s2(2)-(4) and (8) came from the current text (up to date to 3 November 2026; two s278 DMCC Act changes pending, listed as affecting ss12 and 37).
- Stated page dates for CPR Parts vary: Part 2 and Part 16 show 1 October 2023, Part 19 shows 6 April 2024, and Part 70 shows 6 April 2021. The Part 20 date was not captured. Later amendments were not checked, and no judiciary.uk page was used.
- The earlier notes (`research_notes/Expert domain raw text corpus/uk_civil_disputes.md`) do not define these eight roles directly. The closest is the trader/consumer test at Q0, line 221, which matches CRA s2(3).
