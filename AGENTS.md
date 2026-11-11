# Guide for AI agents

mbse-journals keeps the history of [mbse-schemas](https://github.com/pitaman71/mbse-schemas) stores as journals: each
transaction's exact effect, written in a journal language, applied idempotently, read from any position and inserted at
one, sent and received. Two
equivalent implementations exist: `python3/` (`mbse.Journals`) and `typescript5/` (`@mbse/journals`).

## Start here

| You want to | Read |
|---|---|
| Know why the mbse repositories exist, and this one's part in them | [Why the mbse repositories exist](MBSE.md) |
| Use the library | The skill, written once: [its source](skills/mbse-journals/SKILL.md), packaged in each language as [the Python copy](python3/mbse/Journals/skill/SKILL.md) and [the TypeScript copy](typescript5/skill/SKILL.md). Each practice links its case in each language's tutorials or tests |
| Learn it by example | [The Python tutorial](python3/tutorials/README.md); the same in [the TypeScript tutorial](typescript5/tutorials/README.md) |
| Understand the design, a capability not yet built or a decision | mbse-basis [INI-013: journals framework](https://github.com/pitaman71/mbse-basis/blob/main/proposals/PRIORITIES.md#ini-013--journals-framework), [the journals proposal](https://github.com/pitaman71/mbse-basis/blob/main/proposals/JOURNALS.md), and its capabilities, from [CAP-271: the journal language](https://github.com/pitaman71/mbse-basis/blob/main/docs/capabilities/README.md#CAP-271) |
| Change the package | this file, then [Equivalence](docs/EQUIVALENCE.md) |
| Find or add a test case | [Test plan](python3/tests/TestPlan.md) (TypeScript's plan lists only its differences) |

## Read before any work

Agents must read these mbse-basis documents before doing any work:

- [The mbse basis](https://github.com/pitaman71/mbse-basis/blob/main/docs/README.md)
- [Principles](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md)
- [Features](https://github.com/pitaman71/mbse-basis/blob/main/docs/features/README.md)
- [Capabilities](https://github.com/pitaman71/mbse-basis/blob/main/docs/capabilities/README.md)

These may be read selectively, on demand: [Vocabulary](https://github.com/pitaman71/mbse-basis/blob/main/docs/VOCABULARY.md) and
[Qualities](https://github.com/pitaman71/mbse-basis/blob/main/docs/QUALITIES.md).

Never write to `~/.claude/projects/*/memory/` or any hidden memory: what is worth keeping goes in the repository.

Resolve a link written `mbse:<repo>/<path>`, as skills and source comments write a link into another mbse
repository, to the first of these that exists: in a polyrepo checkout, `<repo root>/../<repo>/<path>`, where `<repo
root>` is this repository's root; for a link into the installed package's own repository, `<path>` without its
language directory (`python3/` or `typescript5/`), under the installed package's root (Python: the `site-packages`
directory that holds `mbse/`; npm: the package's directory), where the package ships that file; otherwise
`https://github.com/pitaman71/<repo>/blob/main/<path>`.

## Commands

```sh
python3 ../mbse-basis/scripts/polyrepo.py clone # the siblings in siblings.json, beside this repository, pinned
python3 ../mbse-basis/scripts/polyrepo.py check # the siblings are present and compatible with siblings.json
cd python3 && uv sync                           # Python: use uv, never pip
uv run coverage run -m pytest && uv run coverage combine && uv run coverage report

cd typescript5 && nvm use && npm install        # TypeScript: Node 22 or later
npm run coverage                                # type-checks, runs every notebook, gates at 100%

sh skills/sync.sh                               # after changing the skill: copies it into both packages
python3 ../mbse-basis/scripts/update_doc_links.py  # after adding, renaming or retitling a document
```

The skill is written once, in `skills/mbse-journals/`, mostly language-independent (mbse-basis
[PRI-016: guidance written once](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md#PRI-016)): each practice says why, when and how, links the items for what, and links each how
to its case in both languages, as `mbse:` links with a `#Tnn.k` anchor (a tutorial step) or a test's case ID. It holds
no programs. `skills/sync.sh` copies it byte for byte into `python3/mbse/Journals/skill/` and `typescript5/skill/`;
SKL-01 checks the copies in both suites, and SKL-03 that every case it links has its `<a id>` in both languages, but
those [Equivalence](docs/EQUIVALENCE.md#cases-in-one-language-only) lists as one language's only. Each tutorial step's
markdown cell starts with `<a id="Tnn.k"></a>`, and each test case's with `<a id="ID"></a>`, the same in both
languages. A how the skill teaches with no case is a bug, since it is untested
([the basis](https://github.com/pitaman71/mbse-basis/blob/main/docs/README.md#the-doc-spec)): write the case, in both languages, before linking it.
SKL-04 finds such gaps: each section of the skill (a `##` or `###` heading and its text) links a case in each
language, or, where it teaches no how (an introduction, a routing table, links to go deeper), says why on the line
after its heading, as `<!-- no case: reason -->`; a section whose subsections each pass passes.

## Related repositories

- [mbse-basis](https://github.com/pitaman71/mbse-basis): what every mbse repository shares, and the tools each runs
  from it. A sibling checkout, `../mbse-basis`, pinned by commit in `siblings.json` (see its `scripts/polyrepo.py`).
