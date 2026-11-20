---
name: mbse-journals
description: Works with journals of mbse-schemas stores as data outside any store, mbse-schemas' Changes.Journal as plain data, as a store's follow gives it - sliced after a position, joined, streamed to a peer and kept in files. Use when writing code that imports mbse.Journals or @mbse/journals.
---

# mbse-journals

A journal is mbse-schemas' `Changes.Journal`: a store's transactions, in order, each its unique `id` and exactly what
it changed, as a store's `follow` gives them, one transaction at a time. It is data, kept in no store and not a
follower: built, sliced, joined, sent and written with no store, and applied by a store holding the same schemas
(`Changes.apply`). mbse-journals works with journals as plain data, for the follow of the stores built over backends:
positions, streams and files. It defines no schemas of its own. What it can do is the capabilities of
[INI-013: journals framework](mbse:mbse-basis/proposals/PRIORITIES.md#ini-013--define-and-build-journaled-persistence-framework), as
[the journals proposal](mbse:mbse-basis/proposals/JOURNALS.md#decided) decides them.

This skill says why and when to do each thing, and how in general terms, in the names both implementations share. Each
how links its case in the tutorials or tests of each language, where it runs, with its output: read the one for your
language. It holds no programs, as mbse-basis
[PRI-016: guidance written once](mbse:mbse-basis/docs/PRINCIPLES.md#PRI-016) has it.

## When to use it
<!-- no case: says when to use the package, not how -->

- Collecting what a store's follow gives into a journal, outside any store.
- Catching up: reading, sending or applying the whole transactions after one a peer or a store already holds.
- Streaming a journal to a peer, one transaction at a time, and rebuilding it there.
- Keeping a journal in a file, appending whole transactions to it, and reading it back.

For what a journal says and how a store gives and applies one, read mbse-schemas' skill
([its practice 16](mbse:mbse-schemas/skills/mbse-schemas/SKILL.md)).

## Practices that prevent most mistakes

1. **Use one version in both languages.** *Why*: a journal written by one implementation is read by the other, so both
   must agree. *When*: whenever both languages read the same journals. *How*: install `mbse.Journals` in Python and
   `@mbse/journals` in TypeScript at the same version, one library in two languages.
   - Python: [PKG-01: Both packages carry one version, and the package loads](mbse:mbse-journals/python3/tests/01_Package.ipynb#PKG-01) · TypeScript: [PKG-01: Both packages carry one version, and the package loads](mbse:mbse-journals/typescript5/tests/01_Package.ipynb#PKG-01)
2. **Hold a journal as plain data, outside any store.** *Why*: a journal is data, and "a store's data knows nothing
   about journals": the plain form is what a follow gives, what a peer and a file carry, as written
   ([PRI-024: the plain form, carried as written](mbse:mbse-basis/docs/PRINCIPLES.md#PRI-024)), and needs no store.
   *When*: recording what a store changes. *How*: give a store's `follow` the follower `Journals.collect(journal)`,
   which joins each one-transaction journal it is given into `journal`, a list; the function `follow` gives back ends
   it. A journal is iterated, compared and serialized as any plain data is.
   - Python: [JRN-01: A store's follow, collected, builds a journal: each transaction the store commits, in order, once, as plain data, each with its id, a position; once the follow ends, none is given](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-01) · TypeScript: [JRN-01: A store's follow, collected, builds a journal: each transaction the store commits, in order, once, as plain data, each with its id, a position; once the follow ends, none is given](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-01)
3. **Apply a journal in a store, at once.** *Why*: a store makes what it changed hold, and applied again changes
   nothing. *When*: replicating, catching a store up. *How*: read the journal, however many transactions it holds, as
   a `Changes.Journal` of the target store's (`Plain.FromPlain(store)` with `store.registered("Changes.Journal")`), and
   apply it in one transaction (`Changes.apply`), which applies its transactions in order, a later one deleting an
   object an earlier one made too.
   - Python: [JRN-06: A journal, as plain data or read from a file, applied to a store holding the same schemas (`Changes.apply`), makes it hold what the followed store does, and applied again changes nothing; the slice after a position, applied to a store holding the journal up to it, makes it the same](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-06) · TypeScript: [JRN-06: A journal, as plain data or read from a file, applied to a store holding the same schemas (`Changes.apply`), makes it hold what the followed store does, and applied again changes nothing; the slice after a position, applied to a store holding the journal up to it, makes it the same](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-06)
4. **Name a position by a transaction's id.** *Why*: a position is a transaction, never a count, so that it holds in
   every copy of the journal. *When*: catching up after the last transaction a peer or a store holds. *How*:
   `Journals.after(journal, position, until)` gives the whole transactions after the one of id `position`, up to and
   including the one of id `until`, each where given; a position the journal lacks is refused (`LookupError`).
   - Python: [JRN-02: The whole transactions after a position are a journal, up to and including one where given, from the first where none is; after the last, none; a position the journal lacks is refused, and the journal sliced is unchanged](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-02) · TypeScript: [JRN-02: The whole transactions after a position are a journal, up to and including one where given, from the first where none is; after the last, none; a position the journal lacks is refused, and the journal sliced is unchanged](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-02)
5. **Join and insert whole transactions.** *Why*: a part of a journal of whole transactions is a journal, and a
   transaction may arrive twice, as a catch-up overlaps a follow. *When*: merging slices, splicing one in after a
   position. *How*: `Journals.join(*journals)` and `Journals.insert(journal, position, inserted)` hold each transaction
   once by its id: one arriving again replaces the one held, in its place.
   - Python: [JRN-03: Journals joined are one journal of their transactions, in order; a transaction arriving again is held once, in its place, the later arrival replacing it; a journal inserted after a position, or before the first, is read in its place; a position the journal lacks is refused](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-03) · TypeScript: [JRN-03: Journals joined are one journal of their transactions, in order; a transaction arriving again is held once, in its place, the later arrival replacing it; a journal inserted after a position, or before the first, is read in its place; a position the journal lacks is refused](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-03)
6. **Stream a journal as its one-transaction journals.** *Why*: a follow gives one transaction at a time, and a peer
   is sent what it lacks, in whatever transport. *When*: sending a journal, or the slice after a position, to a peer.
   *How*: `Journals.split(journal)` gives the one-transaction journals to send, each written as JSON text by
   mbse-schemas' `JSON`; the receiver joins them (`Journals.join`), or gives each to a follower `Journals.collect`
   made.
   - Python: [JRN-04: A journal split into its one-transaction journals, as a follow gives them, each sent as JSON text, is rebuilt by joining them; a peer holding the journal up to a position, sent the slice after an earlier one, catches up, holding each transaction once](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-04) · TypeScript: [JRN-04: A journal split into its one-transaction journals, as a follow gives them, each sent as JSON text, is rebuilt by joining them; a peer holding the journal up to a position, sent the slice after an earlier one, catches up, holding each transaction once](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-04)
7. **Keep a journal in a file of JSON lines.** *Why*: a file grows by whole transactions, appended, never rewritten.
   *When*: keeping a journal locally, or across restarts. *How*: `Journals.write(path, journal)` writes one line per
   transaction, as mbse-schemas' `JSON.dumps` writes it; `Journals.append(path, journal)` appends whole transactions,
   making the file where there is none; `Journals.read(path, position)` reads it back, joined, or the part after a
   position. A line cut short is refused.
   - Python: [JRN-05: A journal written to a file is one line for each transaction, its JSON text; whole transactions are appended to it, or to one made where there is none; read back, it is the journal, or the part after a position, a transaction appended again read once; a last line not ended is read, and one cut short is refused](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-05) · TypeScript: [JRN-05: A journal written to a file is one line for each transaction, its JSON text; whole transactions are appended to it, or to one made where there is none; read back, it is the journal, or the part after a position, a transaction appended again read once; a last line not ended is read, and one cut short is refused](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-05)
8. **Expect what is not a journal to be refused.** *Why*: every function reads a transaction's id. *When*: given plain
   data from elsewhere. *How*: a journal is a list of its transactions, each a map with its `id`, text; anything else
   is refused (`ValueError`), before anything is written.
   - Python: [JRN-07: What is not a journal as plain data, a list of its transactions each with its id, is refused by each function, and nothing is written](mbse:mbse-journals/python3/tests/03_Journals.ipynb#JRN-07) · TypeScript: [JRN-07: What is not a journal as plain data, a list of its transactions each with its id, is refused by each function, and nothing is written](mbse:mbse-journals/typescript5/tests/03_Journals.ipynb#JRN-07)

## Learn it by example
<!-- no case: points to the tutorials and the test plan as a whole -->

The [Python tutorial](mbse:mbse-journals/python3/tutorials/README.md) and the
[TypeScript tutorial](mbse:mbse-journals/typescript5/tutorials/README.md) teach by case studies, and the
[test plan](mbse:mbse-journals/python3/tests/TestPlan.md) lists every test case.
