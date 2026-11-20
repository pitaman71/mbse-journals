<!-- nav -->
[Why the mbse repositories exist →](MBSE.md)

# mbse-journals

`mbse-journals` works with a model's history as journals: a journal is the sequence of a store's transactions, each
stated as exactly what it changed, never a snapshot, so that humans and agents work on the same history of a design,
each step of it shown, explained and rewound. It is the history layer of the mbse repositories'
[executable specifications](MBSE.md).

A journal is [mbse-schemas](https://github.com/pitaman71/mbse-schemas)' own `Changes.Journal`, as a store's `follow`
gives it: data, kept in no store, which a store holding the same schemas applies (`Changes.apply`). Its packages,
`mbse.Journals` in Python and `@mbse/journals` in TypeScript, are one library in two languages, which define no schemas
of their own and work with a journal as plain data, for the follow of the stores built over backends: positions (the
whole transactions after one, named by its id), joining and inserting whole transactions, streams (a journal as its
one-transaction journals, sent to a peer and rebuilt), and files (a journal kept as JSON lines, appended to by whole
transactions). The design is mbse-basis
[INI-013: journals framework](https://github.com/pitaman71/mbse-basis/blob/main/proposals/PRIORITIES.md#ini-013--define-and-build-journaled-persistence-framework) and
[the journals proposal](https://github.com/pitaman71/mbse-basis/blob/main/proposals/JOURNALS.md).

---

<!-- nav -->
[Why the mbse repositories exist →](MBSE.md)
