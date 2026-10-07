# Practice builder: UX decision

Date: 2026-10-06. Branch: `dmitrij/feature/practice-builder-selection`.
Scope: existing custom-practice selection UI only. Public primary documentation was read independently by root and UX reviewer; no competitor accounts, paid flows or human usability study.

## Evidence and application

| Primary source / observation                                                                                                                                                                                                 | StudySpace application (our inference)                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Quizlet ordinary Test](https://help.quizlet.com/hc/en-us/articles/360030642972-Studying-with-Test): set question number/types, then start; optional starred-term restriction.                                               | Preserve direct setup→start and editable presets. Do not copy its documented lack of saved progress.                  |
| [Khan Academy course/unit mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery): courses and units contain individual skills.                                            | Group related topics by existing subject, make chosen scope explicit. Do not change our mastery algorithms.           |
| [Brilliant learning paths](https://brilliant.org/help/features/what-are-learning-paths/): related courses grouped into subject paths with recommended order and practice checkpoints.                                        | Show curriculum structure instead of an undifferentiated mixed list. No new learning-path product or forced sequence. |
| [NN/G progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): expose core choices first, specialized controls on request with a clear label; interdependent choices may not suit a linear wizard. | One page and one advanced disclosure; active restrictions remain in the summary. No multi-step wizard.                |

## Current product and alternatives

- Existing: working native controls, useful presets, correct availability, saved sessions and idempotent start. Keep these.
- Problems confirmed in source: up to64 ungrouped topic chips in a220px scroller, no search/selected-topic overview, all advanced controls always shown, availability/start only after the long form.
- Keep unchanged: safest but does not address finding topics or visual overload.
- Multi-step wizard/custom dropdowns: unnecessary navigation/custom keyboard complexity; master specification requires short single-page setup. Rejected.
- Chosen: editable intent cards, subject-grouped searchable native topic checkboxes, removable selected-topic chips, level/count controls, visible summary and one advanced disclosure. Desktop sticky summary; mobile normal flow (no fixed overlay over controls/keyboard).

Typical full-subject setup: subject→preset→start (three selections); search→specific topic adds two. This is an interaction-count example, not measured completion time or a globally-best claim.

## Safety and verification

Search is presentation only. Global select-all keeps its original whole-subject scope; a separately named found-results control uses scoped selection and preserves hidden selections. Empty explicit topic selection retains established all-topics semantics and visibly says so. Topic chips can be removed even when hidden by search. No automatic count/level adjustment. Advanced categories/types/preferences remain editable; saved configuration opens their section; summary shows restrictions and unavailable selected categories have explicit removal. Preset highlight is derived from its four settings, not stale state. All controls respect an in-flight start.

Keep the existing POST payload/request-key/start handler. No API, auth, schema, content or scoring changes. Isolated authenticated browser fixtures verify saved DB configurations, first question, refresh and duplicate/retry regression tests. Screenshots check desktop/mobile/dark layouts and no overflow; automated behavior checks cannot replace eventual feedback from the human learner.
