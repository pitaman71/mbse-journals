<!-- nav -->
[← TypeScript tutorial](../typescript5/tutorials/README.md) · [Home](../README.md) · [Python package →](../python3/README.md)

# Equivalence

The Python (`mbse.Journals`) and TypeScript (`@mbse/journals`) implementations are one library in two languages: the same
modules, names, error classes and messages, and the same test cases in the same order, as mbse-basis
[PRI-028: both implementations change together](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md#PRI-028) asks.

## Coverage

| | Python | TypeScript |
|---|---|---|
| Command | `uv run coverage run -m pytest && uv run coverage combine && uv run coverage report` | `npm run coverage` |
| Required | 100% of statements and branches | 100% of statements, branches, functions and lines |

## Deliberate differences

Each difference a language forces is listed here, as mbse-basis
[PRI-040: deliberate differences listed](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md#PRI-040) asks; any other difference is a bug. There are none yet. A difference is
added as a row of a table: its concern, each language's way, why, and the cases that assert it.

## Cases in one language only

Every case, a tutorial step's or a test's, has a twin in the other language with the same ID and anchor, except those
listed here, which test what only one language has. The skill may link them in that language alone; SKL-03 accepts each
listed here as having no twin, and no other, and SKL-04 counts each for that language alone. There are none yet. A case
added in one language alone is listed here, in a table of its cases (each in backticks), its language and why.

---

<!-- nav -->
[← TypeScript tutorial](../typescript5/tutorials/README.md) · [Home](../README.md) · [Python package →](../python3/README.md)
