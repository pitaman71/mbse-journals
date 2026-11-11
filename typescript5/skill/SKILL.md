---
name: mbse-journals
description: Keeps the history of an mbse-schemas store as a journal of each transaction's exact effect, to replay, read from a position, extend, send and receive. Use when writing code that imports mbse.Journals or @mbse/journals.
---

# mbse-journals

mbse-journals keeps the history of an mbse-schemas store as a journal: the sequence of its transactions, each written as
its effect, exactly what it changed, in the journal language of symbols, relation entries and property mutations, and
applied idempotently. What it can do is the capabilities of
[INI-013: journals framework](mbse:mbse-basis/proposals/PRIORITIES.md#ini-013--journals-framework), under
[FEA-030: clean mutation-based transactional API](mbse:mbse-basis/docs/features/FEA-030.md) and
[FEA-006: persistence](mbse:mbse-basis/docs/features/FEA-006.md).

This skill says why and when to do each thing, and how in general terms, in the names both implementations share. Each
how links its case in the tutorials or tests of each language, where it runs, with its output: read the one for your
language. It holds no programs, as mbse-basis
[PRI-016: guidance written once](mbse:mbse-basis/docs/PRINCIPLES.md#PRI-016) has it.

## When to use it
<!-- no case: says when to use the package, not how -->

- Storing, sending or analyzing a model as its history, never as a snapshot.
- Reading exactly what a transaction changed, without evaluating its expression again.
- Replaying a store's history, from any position, or extending it at one.

## Practices that prevent most mistakes

1. **Use one version in both languages.** *Why*: a journal written by one implementation is read by the other, so both
   must agree. *When*: whenever both languages read the same journals. *How*: install `mbse.Journals` in Python and
   `@mbse/journals` in TypeScript at the same version, one library in two languages.
   - Python: [PKG-01: Both packages carry one version, and the package loads](mbse:mbse-journals/python3/tests/01_Package.ipynb#PKG-01) · TypeScript: [PKG-01: Both packages carry one version, and the package loads](mbse:mbse-journals/typescript5/tests/01_Package.ipynb#PKG-01)

## Learn it by example
<!-- no case: points to the tutorials and the test plan as a whole -->

The [Python tutorial](mbse:mbse-journals/python3/tutorials/README.md) and the
[TypeScript tutorial](mbse:mbse-journals/typescript5/tutorials/README.md) teach by case studies, and the
[test plan](mbse:mbse-journals/python3/tests/TestPlan.md) lists every test case.
