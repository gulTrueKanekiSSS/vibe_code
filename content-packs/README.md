# Content packs (no PDF or database required)

Read `../CONTENT_SCHEMA.md` and only the relevant subject/topic files when authoring.
Packs target an existing subject/module. One pack can add new topics or add questions
to existing topics, without modifying UI, auth, schema or other subjects.

```text
content-packs/
  inbox/ma-lab-6/
    manifest.json
    lessons/trigonometric-identities.mdx
    questions/trigonometric-identities.json
  imported/                 # success receipts, not a second content bank
  failed/                   # optional manual quarantine for rejected packs
```

Example `manifest.json` (lesson/module metadata must match `subjects.json`):

```json
{
  "packId": "ma-lab-6",
  "subjectId": "analysis",
  "sources": ["Mathematical Analysis — Lab 6"],
  "topicIds": ["trigonometric-identities"],
  "lessonFiles": ["lessons/trigonometric-identities.mdx"],
  "questionFiles": ["questions/trigonometric-identities.json"],
  "notes": "Externally curated; identities and domains checked independently."
}
```

`packId` and topic IDs use the stable ID syntax in CONTENT_SCHEMA. `sources` contains
source names, not PDF attachments; `notes` is optional. File arrays enumerate relative
paths under `lessons/` and `questions/`. No traversal, absolute paths or symlinks.
For a questions-only addition to existing topics, use `lessonFiles: []`.
Each new topic needs both a lesson and a nonempty question bank. Do not include secrets
or private student data in source names/notes/files.

```sh
npm run content:validate
npm run content:import -- content-packs/inbox/ma-lab-6
npm run content:report
npm test
git diff -- content content-packs
```

Importer first validates the pack and the entire merged candidate in temporary storage.
Published lesson files are never replaced with changed teaching text: only identical
text (ignoring CRLF) is accepted as a no-op. Existing question IDs must have identical
objects (JSON key ordering ignored); new IDs append to their topic bank. It will not
silently correct old answers. Such corrections require a separate reviewed content edit.
Re-importing the same successful pack is idempotent; changing that pack's payload after
success is rejected. Give an additional batch a new packId, not reused question IDs.

On success, an exact added/changed/unchanged report and
`imported/<packId>.json` receipt mark completion. Source packs stay in place for review.
On validation failure nothing is published or marked imported: fix the inbox pack and
retry, or manually move it into `failed/`. No automatic deletion/quarantine of source files.
Imports serialize with a lock; do not manually edit content during an import. Caught
write failures roll back. An interrupted process may leave a lock/staging files: verify
that the process is dead and inspect its diff/receipt before manual recovery. This is
a local authoring tool, not a transactional CMS or an atomic multi-file deployment.

Import changes **files only**; PostgreSQL and the running site remain unchanged until
the reviewed files are deployed and the existing seed is explicitly run against the
intended DB. The importer never invokes seed, migrations, AI or network services.
