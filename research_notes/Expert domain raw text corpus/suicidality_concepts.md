# Suicidality concepts and expert decision structures: raw domain-knowledge text for the Fig. 4 (Sheth et al.) neurosymbolic corpus

Status and scope (read first):
- This is research and annotation material for a reasoning/explanation corpus. It is not diagnostic advice, not a screening tool and not a risk-prediction instrument. Applying the C-SSRS to real people needs trained administrators and clinical judgment; the scale's own disclaimer says so (cited below).
- Safety constraints applied throughout: no method, means or lethality detail. Where an official definition contains method examples, they are left out and replaced with "[method examples omitted]". All example cases are abstract third-person clinical paraphrases written for this file. No Reddit posts are reproduced, including the Fig. 4 post.
- Every label at "ideation" or above carries a professional-support constraint (R-OUT rules, Key Question 4).
- Tags: **[SOURCED]** paraphrases a cited public source. **[AUTHORED]** is corpus text written here and derived from the cited material; it is not quoted from any source.
- Privacy: the only local file read was the Fig. 4 transcription (`research_notes/Neurosymbolic reasoning corpus from paper/paper_text_examples.md`, section E10). No local project content was sent to any external service. Web queries used only public terms (C-SSRS, NICE NG225, ICD-11 codes and similar).
- Tool budget: about 20 calls. NICE (403), the WHO PDF (404), the Samaritans sub-page (404) and the SNOMED browser API (403) could not be fetched. Content from those sources that could not be verified this session is listed under Gaps and is not presented as fact.

---

## 1. C-SSRS screener items, severity levels and official definitions (Columbia Lighthouse Project)

### Takeaway
The C-SSRS has five suicidal-ideation items, ordered from least to most severe (1 wish to be dead; 2 non-specific active thoughts; 3 active ideation with any methods, no plan and no intent; 4 active ideation with some intent, no specific plan; 5 active ideation with specific plan and intent). It also has a separate suicidal-behaviour section (actual attempt, interrupted attempt, aborted/self-interrupted attempt, preparatory acts, plus non-suicidal self-injurious behaviour). The scale has built-in skip logic: items 3–5 are asked only if item 2 is "yes". The Fig. 4 tree is a simplified, three-question version of this logic.

### Cited Findings
- Disclaimer [SOURCED]: the scale is meant for people trained in administering it. Its questions are suggested probes, and whether ideation or behaviour is present is ultimately the administering person's judgment. Copyright © 2008 The Research Foundation for Mental Hygiene, Inc. Authors: Posner, Brent, Lucas, Gould, Stanley, Brown, Fisher, Zelazny, Burke, Oquendo, Mann. Behavioural definitions are based on the Columbia Suicide History Form (Mann and Oquendo). — [C-SSRS Pediatric Since-Last-Contact, version 6/23/10](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Skip logic [SOURCED]: ask items 1 and 2. If both are negative, go to the Suicidal Behavior section. If item 2 is "yes", ask items 3, 4 and 5. If item 1 and/or 2 is "yes", complete the Intensity of Ideation section, which is rated on the most severe ideation type (1 = least severe, 5 = most severe). — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Item 1, Wish to be Dead [SOURCED, paraphrased]: the person endorses thoughts of wishing to be dead or no longer alive, or wishing to fall asleep and not wake up. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Item 2, Non-Specific Active Suicidal Thoughts [SOURCED, paraphrased]: general, non-specific thoughts of wanting to end one's life, without thoughts of ways or methods, intent, or plan during the assessment period. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Item 3, Active Suicidal Ideation with Any Methods (Not Plan) without Intent to Act [SOURCED, paraphrased]: the person endorses suicidal thoughts and has thought of at least one method during the assessment period. This differs from a specific plan with time, place or method details worked out. It includes someone who has thought of a method, has no specific plan and says they would not act. [method examples omitted] — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Item 4, Active Suicidal Ideation with Some Intent to Act, without Specific Plan [SOURCED, paraphrased]: active suicidal thoughts, and the person reports some intent to act on them. This contrasts with having the thoughts while being clear they will not act. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Item 5, Active Suicidal Ideation with Specific Plan and Intent [SOURCED, paraphrased]: suicidal thoughts with plan details fully or partly worked out, and the person has some intent to carry it out. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Intensity of ideation, frequency sub-item [SOURCED]: rated as only one time, a few times, a lot, all the time, or don't know / not applicable. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
- Suicidal behaviour section [SOURCED, paraphrased, method and lethality examples removed]. Raters check every type that applies, as long as the events are separate, and must ask about all types. — [C-SSRS PDF](https://cssrs.columbia.edu/wp-content/uploads/C-SSRS_Pediatric-SLC_11.14.16.pdf)
  - Actual attempt: a potentially self-injurious act done with at least some wish to die as a result of the act. Intent does not have to be 100%. No injury needs to occur; potential for harm is enough. Intent may be inferred clinically from behaviour or circumstances even if the person denies it. [examples omitted]
  - Non-suicidal self-injurious behaviour: self-injury done purely for reasons other than ending one's life. It is recorded separately, as is "self-injurious behaviour, intent unknown".
  - Interrupted attempt: an outside circumstance stops the person from starting a potentially self-injurious act that would otherwise have become an actual attempt. [examples omitted]
  - Aborted or self-interrupted attempt: the person starts taking steps toward an attempt but stops themselves before any self-destructive behaviour.
  - Preparatory acts or behaviour: acts or preparation toward an imminent attempt that go beyond a verbalisation or thought. [examples omitted]
  - Suicide: death by suicide occurred since the last assessment.
- Licence and use terms [SOURCED]: the Lighthouse Project says community and healthcare settings need no special permission to use the Columbia Protocol tools, write their own triage steps or build the protocol into EHRs. — [Columbia Protocol for Communities and Healthcare](https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-communities-and-healthcare/). Clinical trials need a licensing agreement, and the copyright holder is The Research Foundation for Mental Hygiene, Inc. — [Pharmaceutical-funded research page](https://cssrs.columbia.edu/pharmaceutical-funded-research/). For other research, the project asks researchers to contact it to find out whether their use qualifies as free. — [Columbia Protocol for Research](https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/cssrs-for-research/)

### Inferences
- **Layer 1: concept definitions [AUTHORED, from the C-SSRS definitions above].** One concept per sentence:
  - "Wish to be dead is a concept in which a person reports wishing they were dead or no longer alive, without thoughts of ending their own life."
  - "Non-specific active suicidal thoughts is a concept in which a person reports general thoughts of wanting to end their life, with no method, intent or plan."
  - "Active suicidal ideation with any methods but without intent is a concept in which a person reports suicidal thoughts and has considered a method, but has no specific plan and no intent to act."
  - "Active suicidal ideation with some intent but without a specific plan is a concept in which a person reports suicidal thoughts and some intent to act on them, but no worked-out plan."
  - "Active suicidal ideation with specific plan and intent is a concept in which a person reports suicidal thoughts, a fully or partly worked-out plan, and some intent to carry it out."
  - "Suicidal behaviour is a concept covering an actual, interrupted or aborted suicide attempt, or preparatory acts toward one."
  - "Non-suicidal self-injury is a concept covering self-injury done for reasons other than ending one's life; the C-SSRS records it separately from suicidal behaviour."
- **Layer 2: C-SSRS skip logic as rules [AUTHORED].**
  - "if wish to be dead is false and non-specific active suicidal thoughts is false then skip the ideation severity items and ask about suicidal behaviour."
  - "if non-specific active suicidal thoughts is true then ask about methods, about intent, and about plan with intent."
  - "otherwise, if non-specific active suicidal thoughts is false, the methods, intent and plan items are not asked."
  - "if wish to be dead is true or non-specific active suicidal thoughts is true then rate the intensity of the most severe ideation type."
  - "ideation severity is the highest-numbered ideation item endorsed, from 1 (wish to be dead) to 5 (specific plan and intent)."
  - "the suicidal behaviour items are always asked, whatever the ideation answers."
- The full C-SSRS asks about behaviour unconditionally. The Fig. 4 tree reaches "Suicidal Behavior or Attempt" only through the ideation chain, so it cannot represent a person with past behaviour and no current ideation. This simplification should be stated in any explanation the model gives.

### Gaps
- The definitions above come from the Pediatric Since-Last-Contact version (6/23/10). The adult Screener and Lifetime/Recent versions use different probe wording, but the item names and definitions appear to be the same. I did not fetch them to compare.
- The Lighthouse pages do not clearly say whether quoting definitions in a published ML research corpus counts as "research" needing contact. To be safe, paraphrase (as done here) and cite the copyright holder, or ask the project.

---

## 2. The Gaur et al. Reddit C-SSRS label set, definitions, licence and access

### Takeaway
The WWW 2019 dataset uses five user-level labels: **Supportive, Suicide Indication (Indicator), Suicide Ideation, Suicide Behavior, Suicide Attempt**. Supportive and Indication were added to the C-SSRS for social media. The 2021 v2 release drops Indication, leaving 448 users with four labels. PK-iL (arXiv 2204.12560) collapses the labels further to **Indication / Ideation / Behavior-or-Attempt**, the set the Fig. 4 leaves follow. The Zenodo v2 dataset is open under **CC BY 4.0**, and the PK-iL paper is CC BY 4.0 on arXiv.

### Cited Findings
- Paper: Gaur et al., "Knowledge-aware Assessment of Severity of Suicide Risk for Early Intervention", WWW 2019, pp. 514–525, DOI 10.1145/3308558.3313698. Four practising psychiatrists built a gold-standard set of 500 Redditors (out of 2,181) following C-SSRS guidelines, with pairwise agreement of 0.79. The five-label C-SSRS-based scheme separates supportive users from users showing different severities of suicidality, and is compared with the older four-level no/low/moderate/high risk scheme. — [Webis anthology record](https://ir.webis.de/anthology/2019.wwwconf_conference-2019.50/)
- The two extra categories, "Supportive" and "Suicidal Indicator", were added to the C-SSRS because a user can show ideation and also be supportive toward others. — [Gaur et al. 2021, arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Supportive [SOURCED, paraphrased]: support providers who share experiences of resilience. Their posts often come from people not currently struggling with suicidal thoughts and behaviours, who may have had treatment and now share what helped. Because these posts describe past struggles and coping, they are ambiguous and a source of false positives. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Suicide Indication [SOURCED, paraphrased]: separates users who use at-risk language from users actively experiencing general or acute symptoms. Such users may mention risk indicators listed on the C-SSRS, such as divorce, chronic illness, bereavement or a loved one's suicide, but in empathy with others rather than as a personal wish to self-harm. They are flagged so that their known risk factors can be monitored without counting them as active ideation or behaviour (which would be false positives). These users were removed in the 2021 study because annotators disagreed strongly at post level. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Ideation, Behavior and Attempt follow the clinical C-SSRS categories. The 2021 paper describes the C-SSRS as sorting suicidal thinking into Suicidal Behaviors, including Ideations and Attempts. It does not give its own social-media definitions for these three. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Counts in v2: 448 users. Throwaway accounts: 37 Supportive, 63 Ideation, 23 Behavior, 17 Attempt (past experience of an attempt). Non-throwaway accounts: 85 S, 115 I, 76 B, 33 A. Post-level agreement among the same four psychiatrists was 0.88 pairwise and 0.76 group-wise. User-level agreement was 0.79 pairwise and 0.69 group-wise. Data come from r/SuicideWatch and related mental-health subreddits. The paper normalises text against DSM-5, SNOMED-CT, ICD-10, DataMed and the Drug Abuse Ontology. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Ethics [SOURCED]: the 2021 study had an IRB waiver from the University of South Carolina (Pro00094464). Released datasets leave out Reddit screen names, and example posts in the paper were modified for anonymity. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)
- Licence and access [SOURCED]: Zenodo record 4543776 (v2, 16 Feb 2021) has open access under "Creative Commons Attribution 4.0 International", DOI 10.5281/zenodo.4543776. It lists four labels: Supportive (new, social-media-specific), Suicide Ideation, Suicide Behavior, Suicide Attempt. v1 is record 2667859 (May 2019) and has no post-level annotation. — [Zenodo 4543776](https://zenodo.org/records/4543776); [Zenodo 2667859](https://zenodo.org/records/2667859). A third-party Kaggle mirror lists CC0, which conflicts with Zenodo; the Zenodo licence takes precedence. — [Baselight/Kaggle mirror](https://baselight.app/u/kaggle/dataset/thedevastator_c_ssrs_labeled_suicidality_in_500_anonymized_red)
- PK-iL: Roy, Gaur, Zhang, Sheth, "Process Knowledge-infused Learning for Suicidality Assessment on Social Media", arXiv 2204.12560 (26 Apr 2022), licence CC BY 4.0. — [arXiv abs](https://arxiv.org/abs/2204.12560)
- PK-iL uses the Gaur et al. data. Experts annotated 448 users for Suicide Ideation, Suicide Behavior and Suicide Attempt, with inter-rater agreement reported as 0.84. The authors added the C-SSRS question or sub-question that each post answers ("process knowledge"). The tree's outputs are Indication, Ideation and "Behavior or Attempt". Leaf probability is the share of annotators who chose that path; for example, two of three annotators on a path gives 0.66. Two tree paths lead to Ideation. Qualitative expert agreement on explanations was 0.7–0.72. — [arXiv 2204.12560](https://arxiv.org/pdf/2204.12560)
- PK-iL explanations take the form of tree paths, for example "1. Wish to be dead (no) → indication", and "Wish to be dead (yes) → Non-Specific Active Suicidal Thoughts (yes) → Active Suicidal Ideation with Some Intent to Act, without Specific Plan (yes) → Behavior or Attempt". — [arXiv 2204.12560](https://arxiv.org/pdf/2204.12560)

### Inferences
- **Inconsistency to note in the corpus.** In Sheth et al. Fig. 4 the third node is "Active Suicidal Ideation with Any Methods", and the highlighted leaf is Suicidal Ideation (local transcription, E10). In PK-iL Table 5, an example whose word2vec highlights match the Fig. 4 post leads through "Some Intent to Act, without Specific Plan (yes)" to **Behavior or Attempt**. The same post therefore seems to get different labels and different third nodes in the two papers. Treat Fig. 4 as a schematic, not ground truth.
- Agreement figures differ between sources: 0.79 / 0.69 (user level), 0.88 / 0.76 (post level), 0.76 (Zenodo v2 text), 0.84 (PK-iL). Cite the specific figure with its source, not a single number.
- **Layer 1: label concepts [AUTHORED].**
  - "Supportive is a label for a person who writes to support others and describes past struggles or coping, without describing current personal suicidal thoughts."
  - "Suicidal indication is a label for a person who mentions known risk factors or at-risk language but does not report a personal wish to die."
  - "Suicidal ideation is a label for a person who reports a wish to be dead or thoughts of ending their life, with no reported suicidal behaviour."
  - "Suicidal behaviour is a label for a person who reports intent, planning or preparatory acts, or an interrupted or aborted attempt."
  - "Suicidal attempt is a label for a person who reports a past suicide attempt."
  - Caveat: the Behaviour vs Attempt boundaries here are inferred from the C-SSRS behaviour section and the PK-iL path. The source papers do not define them for social media; see Gaps.

### Gaps
- I did not obtain the full WWW 2019 text, so the paper's own definitions of Ideation, Behavior and Attempt for social media are not verified. Read the ACM DOI version before treating the Layer 1 label sentences above as faithful to the source.
- It is not known whether PK-iL's process-knowledge-annotated dataset (Table 1) was released, or under what licence.
- Reddit's own terms for redistributing derived post text were not checked. In any case, this corpus does not reproduce posts.

---

## 3. SNOMED CT / ICD-11 / UMLS concept names and related clinical concepts

### Takeaway
ICD-11 gives clean, citable anchors: **MB26.A Suicidal ideation**, **MB23.R Suicide attempt**, **MB23.S Suicidal behaviour**, **MB23.E Non-suicidal self-injury**. The SNOMED concept names in Fig. 4 ("Health related behavior finding", "Intrusive thoughts") come from the paper. Their SNOMED IDs could not be verified this session, because the SNOMED browser API returned 403. DSM-5 must be paraphrased.

### Cited Findings
- ICD-11 MB26.A "Suicidal ideation" [SOURCED, paraphrased]: thoughts, ideas or ruminations about the possibility of ending one's life, ranging from thinking one would be better off dead to forming elaborate plans. Excludes suicide attempt and personal history of self-harm. Parent is MB26, "Symptoms or signs involving content of thought". Source is ICD-11 MMS 2024-01; licence CC BY-ND 3.0 IGO. — [World of Taxonomy mirror of ICD-11 MB26.A](https://worldoftaxonomy.com/system/icd_11/node/MB26.A) (a third-party mirror that disclaims completeness; check against icd.who.int)
- ICD-11 MB23.R "Suicide attempt" [SOURCED, paraphrased]: a specific episode of self-harming behaviour carried out with the conscious intention of ending one's life. — [findacode MB23.R](https://www.findacode.com/icd-11/code-179322472.html)
- ICD-11 MB23.S "Suicidal behaviour" [SOURCED, paraphrased]: concrete preparatory actions toward ending one's life that do not amount to an actual attempt. [the source's method examples omitted] — [findacode MB23.S](https://www.findacode.com/icd-11/code-322139749.html). A search summary flagged one mirror with a mismatched description, so verify on icd.who.int.
- ICD-11 MB23.E is listed as "Non-suicidal self-injury" among the MB23 child codes. — [autoicdapi MB23 listing](https://autoicdapi.com/icd11/MB23) (third party)
- Concept names used in Fig. 4, exact: "Snomed Concept: Health Related Behavior Finding", "Snomed Concept: Intrusive Thoughts", a DSM-5 paraphrase of obsessive-compulsive disorder (obsessive, intrusive thoughts, ideas or sensations that make people feel driven to do something repetitively), and "Suicidality Concept: Non-specific active suicidal thoughts". — local transcription E10 of Sheth et al. (`paper_text_examples.md`, lines 97–110)
- The Gaur et al. lexicon links medical knowledge sources (SNOMED-CT, ICD-10, Drug Abuse Ontology, DSM-5) as graphs with relations such as TypeOf, CriteriaOf, SubdivisionOf and InclusionCriteria. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)

### Inferences
- **Layer 1: clinical concept sentences [AUTHORED, paraphrased; not quoted from DSM-5 or SNOMED].**
  - "Suicidal ideation (ICD-11 MB26.A) is a concept covering thoughts about ending one's life, from feeling better off dead to forming a plan."
  - "Suicide attempt (ICD-11 MB23.R) is a concept for an episode of self-harm carried out with the intention of ending one's life."
  - "Suicidal behaviour (ICD-11 MB23.S) is a concept for preparatory actions toward ending one's life that fall short of an attempt."
  - "Non-suicidal self-injury (ICD-11 MB23.E) is a concept for deliberate self-injury without the intention of ending one's life."
  - "Intrusive thoughts is a concept for unwanted thoughts, images or urges that enter the mind repeatedly and cause distress."
  - "Obsessive-compulsive disorder is a concept for a condition with recurrent unwanted intrusive thoughts (obsessions) and repetitive acts done to reduce the distress they cause (compulsions)." (Own paraphrase; the Fig. 4 callout paraphrases DSM-5 in a similar way.)
  - "Health related behaviour finding is a concept for an observed or reported behaviour that is relevant to health."
  - "Hopelessness is a concept for a persistent expectation that things will not improve."
  - "Protective factor is a concept for a circumstance or strength that supports a person's safety, such as connection to others or engagement with care."
- **Annotation hazard [AUTHORED].** "Intrusive thoughts" in OCD are typically unwanted and resisted. An intrusive thought with suicidal content is not automatically the same as a wish to die. A rule chain mapping "Intrusive Thoughts" straight to "Non-specific active suicidal thoughts", as Fig. 4 implies, should be explained with that caveat, and the case should be deferred to clinical judgment.

### Gaps
- SNOMED CT concept IDs and FSNs for "Suicidal thoughts", "Intrusive thoughts", "Health related behavior finding", "Hopelessness", "Self-harm" and "Protective factor" were **not verified** (SNOMED browser returned 403). Do not add numeric IDs to the corpus until they are checked on browser.ihtsdotools.org.
- SNOMED CT and UMLS licence terms were not fetched. From prior knowledge (unverified this session): SNOMED CT needs an affiliate licence, which is free in member countries such as the UK through NHS TRUD, and the UMLS Metathesaurus needs a UMLS licence agreement. Check both before publishing concept names together with IDs.
- No public SNOMED or ICD definitions were found for hopelessness or protective factors. The sentences above are authored and should be labelled as such.

---

## 4. Safe-messaging guidance (Samaritans, WHO media resource, NICE NG225) as response-constraint rules

### Takeaway
Of the safe-messaging sources, the only content fetched in full this session was the index of the Samaritans media guidelines and summaries of the WHO 2023 resource. The common core is: avoid method detail, report sensitively, include sources of support, emphasise hope and recovery, and take extra care online and with young people. The rules below follow that core and the Fig. 4 constraint. The full WHO Dos and Don'ts list could not be fetched; it is listed under Gaps for verification.

### Cited Findings
- Samaritans [SOURCED, paraphrased from the guideline index]: the guidelines support industry codes of practice. Naming novel suicide methods has been linked to increased use of those methods. Celebrity deaths need extra care because people identify with the person. Young people are especially vulnerable to coverage. Documentaries can teach warning signs and encourage help-seeking. When covering online content, minimise harm, for example by not directing vulnerable people to sites or forums that may hold dangerous material. A separate guide covers safe suicide-prevention messaging for communications and campaigns. — [Samaritans media guidelines](https://www.samaritans.org/about-samaritans/media-guidelines/)
- WHO/IASP, "Preventing suicide: a resource for media professionals", update 2023 (4th edition), ISBN 9789240076846, released 12 Sep 2023. It covers online, digital and social media as well as traditional media. It has a quick-reference section and a "Responsible reporting on suicide: Dos and Don'ts" section, with emphasis on hope, recovery and help-seeking, and on caution when interviewing bereaved people or people with lived experience. — [WHO publication page](https://who.int/publications/i/item/9789240076846); [WHO news release](https://www.who.int/news/item/12-09-2023-who-launches-new-resources-on-prevention-and-decriminalization-of-suicide)
- NICE NG225 (via committee members' commentary): use a compassionate, collaborative approach, and move from a risk-focused to a safety-focused approach. — [Mughal et al. 2023, BJPsych, PMC7615272, CC BY 4.0](https://pmc.ncbi.nlm.nih.gov/articles/PMC7615272/)
- Fig. 4's own constraint: if Y is in {Ideation, Behavior, Attempt}, the output must direct the person to a mental health professional and to emergency services if in immediate danger, and give a crisis line. — local transcription E10

### Inferences
- **Layer 2: response-constraint rules [AUTHORED]. These are design rules for an annotation/explanation system, not clinical protocol.**
  - R-OUT-1: "if the label is suicidal ideation, suicidal behaviour or suicidal attempt then the response must include signposting to professional support, such as a doctor, therapist or counsellor."
  - R-OUT-2: "if the label is suicidal behaviour or suicidal attempt, or the text suggests immediate danger, then the response must also direct the person to local emergency services or a crisis line."
  - R-OUT-3: "if the label is suicidal indication then the response should acknowledge the stressor and offer information about support services; otherwise, if the label is supportive, no crisis signposting is required, but support information may be offered."
  - R-OUT-4: "the response must never include method, means or lethality information, whatever the label."
  - R-OUT-5: "the response must not describe suicide as a solution, as inevitable, or as caused by a single simple reason."
  - R-OUT-6: "the response must not use sensational or stigmatising language; prefer 'died by suicide' and 'ended their life' to criminalising phrasing."
  - R-OUT-7: "the response should include a message of hope that recovery and support are possible."
  - R-OUT-8: "the response must not direct a person to websites or forums that may contain harmful material." (Samaritans online guidance)
  - R-OUT-9: "the response must not state a numeric risk score or a low, medium or high risk level as a prediction." (NICE, Key Question 5)
  - R-OUT-10: "if the system is uncertain about the label then it must take the more cautious branch and include signposting." [AUTHORED design choice]
- The crisis line in Fig. 4 (1-800-273-8255) is the pre-2022 US National Suicide Prevention Lifeline number. To my knowledge the US moved to 988 in July 2022, but I did not verify this in-session. Phone numbers are region-specific. In the corpus, write "a local crisis line" and do not hard-code numbers.

### Gaps
- The full WHO 2023 Dos and Don'ts list was not retrieved (HSE PDF mirror 404). From prior knowledge, not verified: do give accurate information on where to seek help; do report stories of coping and recovery; don't describe methods; don't use sensational headlines or place stories prominently; don't present suicide as a solution; take care with images and social-media links. Check against the WHO PDF before citing.
- WHO licence: WHO publications are usually CC BY-NC-SA 3.0 IGO, but I did not read the copyright page.
- Detailed Samaritans language guidance (the "commit suicide" wording, imagery, headline placement) sits on sub-pages that returned 404. Samaritans terms of use were not shown.
- NICE NG225 text itself was not fetched (NICE 403; the cpcab mirror 404).

---

## 5. Risk and protective factors in public guidance, phrased as non-deterministic rule sentences

### Takeaway
NICE NG225 says not to use risk assessment tools and scales, or global low/medium/high stratification, to predict future suicide or repeat self-harm, or to decide who gets treatment or is discharged. It recommends a psychosocial assessment of needs and strengths, an individual risk formulation, and collaborative safety planning. In the corpus, risk and protective factors should therefore be written as "context to explore with a professional", never as a score or a forecast.

### Cited Findings
- NG225 (2022) [SOURCED via commentary by guideline committee members]: do not use risk assessment tools or scales. Their positive predictive values are poor, so they give false reassurance and can exclude low- and medium-risk people from care. They should not decide discharge or treatment. Do not stratify people into low/medium/high risk to predict repeat self-harm or suicide. Everyone who has self-harmed should get a psychosocial assessment "at the earliest opportunity" from a trained mental health professional, identifying the circumstances, strengths and needs. Clinicians should build an individual risk formulation from the person's circumstances, strengths and needs, and it should guide care. Safety plans should be "considered" because RCT evidence is limited; they should be made collaboratively, shared with relevant others, reviewed, and treated as "dynamic documents". — [Mughal et al. 2023, BJPsych 223(5):501–503, doi:10.1192/bjp.2023.113, CC BY 4.0](https://pmc.ncbi.nlm.nih.gov/articles/PMC7615272/)
- Guideline wording quoted in a secondary source: "Do not use risk assessment tools and scales to predict future suicide or repetition of self-harm." The same source cites an HQIP figure that the positive predictive value of risk tools is below 5%. — [University of Nottingham risk-assessment note](https://www.nottingham.ac.uk/education/documents/pce-cfd/risk-assessment.pdf). The companion recommendation not to use global low/medium/high stratification to predict future suicide or repeat self-harm is quoted by an NHS trust. — [RDaSH NHS](https://www.rdash.nhs.uk/?p=1138). Recommendation numbering differs between secondary sources (cited as 1.6.1 and 1.6.2 in one, and as a section 5.4.3 in another). — search summary of [BJPsych/PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7615272/) and RDaSH
- C-SSRS-listed risk indicators named by Gaur et al.: divorce, chronic illness, death in the family, and suicide of a loved one. — [arXiv 2104.04140](https://arxiv.org/pdf/2104.04140)

### Inferences
- **Layer 2: risk/protective factor rules, non-deterministic [AUTHORED].**
  - R-RF-1: "if a person mentions a recent loss, relationship breakdown, chronic illness or bereavement by suicide then note it as context to explore; it does not by itself change the label."
  - R-RF-2: "if a person mentions only risk factors and no personal wish to die then the label is suicidal indication, not suicidal ideation."
  - R-RF-3: "if a person mentions protective factors, such as supportive relationships, engagement with care or reasons for living, then note them as strengths; they do not lower the label." [AUTHORED; follows NICE's emphasis on strengths without making them a score]
  - R-RF-4: "the count of risk or protective factors must never be turned into a score, a probability, or a low, medium or high risk level."
  - R-RF-5: "a label from this tree describes what the text expresses; it is not a prediction of what the person will do."
  - R-RF-6: "the decision about care belongs to a professional's assessment of needs, strengths and safety, not to this label."
- The PK-iL leaf probability (annotator path share) measures annotator agreement, not the person's risk. Any explanation that reports it must say "annotator agreement", not "risk".

### Gaps
- No WHO risk/protective factor list was retrieved this session. Commonly cited WHO examples (prior knowledge, unverified) include prior attempt, mental health and substance-use conditions, and social isolation as risks, and strong personal relationships as protective. Verify against WHO "Preventing suicide: a global imperative" or LIVE LIFE (2021) before citing.
- The NG225 self-harm definition was not fetched. From prior knowledge, it is roughly "intentional self-poisoning or injury, irrespective of the apparent purpose". Verify on nice.org.uk.
- NICE content licence/reuse terms not checked; NICE content is usually reusable with attribution under NICE's own terms, but not checked this session.

---

## 6. Assembled four-layer corpus text (concept → rule → case → label), Fig. 4 tree

### Takeaway
The Fig. 4 tree can be written as three ordered yes/no questions with explicit "otherwise" branches, a three-way label (Indication / Ideation / Behavior-or-Attempt, matching PK-iL), and a response constraint fired by the label. All text below is [AUTHORED] and derived from the sources cited in sections 1–5. Leaf labels follow the Sheth Fig. 4 arrows as drawn (local transcription E10).

### Cited Findings
- Fig. 4 tree, as drawn: Wish to be Dead, True → Non-Specific Active Suicidal Thoughts, False → Suicidal Indication. Non-Specific Active Suicidal Thoughts, True → Active Suicidal Ideation with Any Methods, False → Suicidal Ideation. Active Suicidal Ideation with Any Methods, True → Suicidal Behavior or Attempt, False → Suicidal Ideation. — local transcription E10, lines 101–105
- PK-iL leaf set and path-style explanations. — [arXiv 2204.12560](https://arxiv.org/pdf/2204.12560)

### Inferences
**Layer 2: Fig. 4 decision rules with "otherwise" branches [AUTHORED]**
- T1: "if wish to be dead is false then the label is suicidal indication; otherwise go to question two."
- T2: "if wish to be dead is true and non-specific active suicidal thoughts is false then the label is suicidal ideation; otherwise go to question three."
- T3: "if non-specific active suicidal thoughts is true and active suicidal ideation with any methods is false then the label is suicidal ideation."
- T4: "if non-specific active suicidal thoughts is true and active suicidal ideation with any methods is true then the label is suicidal behaviour or attempt."
- T5: "if the text describes support for others and no personal suicidal thoughts then the label is supportive, and the tree is not applied." (Gaur et al. label; outside the Fig. 4 tree)
- T6: "if the label is suicidal ideation or suicidal behaviour or attempt then rule R-OUT-1 fires: the response must include signposting to professional support."
- T7: "if the label is suicidal behaviour or attempt then rule R-OUT-2 also fires: the response must direct the person to emergency services or a crisis line."
- Note: in the source C-SSRS, behaviour items are asked separately (see section 1). T1–T4 reproduce only the Fig. 4 simplification.

**Layers 3 and 4: abstract cases and expected labels [AUTHORED; third-person clinical paraphrase; fictional]**

- C1. Case: "The person writes in support of another user and describes having coped with a hard period in the past. They report no current thoughts of death."
  Label: supportive.
  Because: rule T5 applies; the concept "supportive" covers support given to others without current personal suicidal thoughts. No crisis signposting is required (R-OUT-3), but support information may be offered.

- C2. Case: "The person describes a recent bereavement and a relationship ending, and says they feel low. They report no wish to be dead."
  Label: suicidal indication.
  Because: rule T1 applies (wish to be dead is false). The concept "suicidal indication" covers risk factors without a personal wish to die, and R-RF-2 confirms it. The response should acknowledge the stressors and offer support information (R-OUT-3). The risk factors are context, not a score (R-RF-4).

- C3. Case: "The person reports persistent intrusive, unwanted thoughts that cause distress. They report no wish to be dead."
  Label: suicidal indication.
  Because: rule T1 applies. The concept "intrusive thoughts" is distressing but is not the same as a wish to die (section 3 annotation hazard). A professional assessment is still advisable because of the distress.

- C4. Case: "The person reports thoughts that life is not worth living and a wish not to wake up, with no thoughts of ending their life."
  Label: suicidal ideation.
  Because: rule T2 applies. The concept "wish to be dead" is present and "non-specific active suicidal thoughts" is absent. Rule T6 fires: the response must include signposting to professional support (R-OUT-1).

- C5. Case: "The person reports general thoughts of wanting to end their life. They describe no method, no plan and no intent to act."
  Label: suicidal ideation.
  Because: rule T3 applies. The concept "non-specific active suicidal thoughts" is present and "active ideation with any methods" is absent. Rule T6 fires: signposting to professional support is required (R-OUT-1).

- C6. Case: "The person reports suicidal thoughts, says they have considered how they might act, and also says they have some intent. Details are not given."
  Label: suicidal behaviour or attempt.
  Because: rule T4 applies. The concepts "non-specific active suicidal thoughts" and "active ideation with any methods" are both present. Rules T6 and T7 fire: the response must include professional support and emergency or crisis-line signposting (R-OUT-1, R-OUT-2), and must contain no method information (R-OUT-4).

- C7. Case: "The person says that in the past they made an attempt to end their life, and that they are now receiving care."
  Label: suicidal attempt (Gaur label) / behaviour or attempt (PK-iL leaf).
  Because: the C-SSRS concept "actual attempt" is reported. In the full C-SSRS, behaviour is assessed separately from ideation (section 1). The Fig. 4 tree cannot reach this leaf without the ideation answers, so explain this with the tree-limitation caveat. Rule R-OUT-1 fires. The engagement with care is noted as a strength (R-RF-3) and does not lower the label.

- C8 (contrast case for the explainer). Case: "Two annotators chose the path wish to be dead yes, then non-specific thoughts yes, then methods no; one chose methods yes."
  Label: suicidal ideation, with annotator agreement 0.66 at that leaf.
  Because: PK-iL computes a leaf's probability as the share of annotators who chose that path. The 0.66 is annotator agreement, not the person's risk (section 5 inference). Rule T6 fires.

**Explanation template [AUTHORED]**
- "Path: wish to be dead = true → non-specific active suicidal thoughts = true → active ideation with any methods = false. Leaf: suicidal ideation (rule T3). Concepts matched: non-specific active suicidal thoughts. Constraint fired: R-OUT-1 (professional support signposting). This label describes the text, not a risk prediction (R-RF-5)."

### Gaps
- The Fig. 4 example post's own path is not stated in the paper; only the highlighted leaf (Ideation) is shown, and it appears to conflict with the PK-iL Table 5 label (section 2). Corpus cases above are fictional, and none corresponds to that post.
- No source validates that these fictional cases would be labelled the same way by clinicians. Treat them as illustrative, not gold-standard.

---

### Source licence summary
| Source | Licence / terms (as found) |
|---|---|
| C-SSRS (Columbia Lighthouse Project) | © 2008 Research Foundation for Mental Hygiene. Free for community/healthcare use without permission; clinical trials need a licence; other research: contact the project. Paraphrased here. |
| Gaur et al. 2021, arXiv 2104.04140 | arXiv; licence not checked |
| Reddit C-SSRS dataset, Zenodo v2 (4543776) | CC BY 4.0, open access (a Kaggle mirror claims CC0; conflicts with Zenodo) |
| Gaur et al. WWW 2019 (ACM) | ACM copyright; full text not read |
| PK-iL, arXiv 2204.12560 | CC BY 4.0 |
| Mughal et al. 2023 BJPsych (NG225 commentary) | CC BY 4.0 |
| NICE NG225 | Not fetched; NICE reuse terms not checked |
| WHO media resource 2023 | Not fetched; WHO usually uses CC BY-NC-SA 3.0 IGO (unverified) |
| Samaritans media guidelines | No licence shown on the index page |
| ICD-11 MMS | CC BY-ND 3.0 IGO (via mirror; verify on icd.who.int) |
| SNOMED CT / UMLS | Not checked; affiliate/UMLS licences believed required (unverified) |
| DSM-5 | Copyright APA; paraphrased only, never quoted |
