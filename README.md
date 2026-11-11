<!-- nav -->
[Why the mbse repositories exist →](MBSE.md)

# mbse-journals

`mbse-journals` keeps a model's history as the model itself: a model is never snapshotted, but stored, communicated
and analyzed as a journal, the sequence of its transactions, each stated as exactly what it changed. A journal can be
replayed, read from any position, extended at one, sent and received, so that humans and agents work on the same
history of a design, each step of it shown, explained and rewound. It is the history layer of the mbse repositories'
[executable specifications](MBSE.md).

Its packages, `mbse.Journals` in Python and `@mbse/journals` in TypeScript, are one library in two languages, over
[mbse-schemas](https://github.com/pitaman71/mbse-schemas) stores. A journal entry is written in a journal language: a
transaction's symbols, each bound to an object by its reference or to a new object, then its mutations, relation entries
added and removed and properties mutated by mbse-schemas' verbs, applied idempotently. Built so far: nothing; the
design is mbse-basis [INI-013: journals framework](https://github.com/pitaman71/mbse-basis/blob/main/proposals/PRIORITIES.md#ini-013--journals-framework) and
[the journals proposal](https://github.com/pitaman71/mbse-basis/blob/main/proposals/JOURNALS.md).

---

<!-- nav -->
[Why the mbse repositories exist →](MBSE.md)
