<!-- nav -->
[← Python package](../README.md) · [Home](../../README.md) · [TypeScript package →](../../typescript5/README.md)

# Test plan

One suite per notebook, with the same case IDs, in the same order, in both implementations, as mbse-basis
[PRI-035: tests are notebooks: one suite each, the same case IDs in the same order in both languages](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md#PRI-035) has it; each case is a markdown cell, `<a id="ID"></a>` then
`## ID · title`, followed by one code cell. TypeScript's plan lists only its differences.

| Notebook | Suite | Cases | Covers |
|---|---|---|---|
| `01_Package.ipynb` | PKG | 1 | Both packages carry one version, and the package loads |
| `02_Skill.ipynb` | SKL | 3 | The packaged copy of the skill is current (SKL-01); every link in the agent guides resolves, anchors included, each case the skill links in both languages but those [Equivalence](../../docs/EQUIVALENCE.md#cases-in-one-language-only) lists as one language's only (SKL-03); every section of the skill links a case in each language, or says why it needs none (SKL-04) |
| `03_Journals.ipynb` | JRN | 7 | Journals as mbse-schemas' `Changes.Journal`, plain data outside any store ([the journals proposal](https://github.com/pitaman71/mbse-basis/blob/main/proposals/JOURNALS.md#decided)): a journal collected from a store's follow, each transaction once, in order, with its id, until the follow ends (JRN-01); the whole transactions after a position, up to one, a position lacking refused (JRN-02); journals joined and one inserted after a position, a transaction arriving again held once, in its place, replaced (JRN-03); a journal split into its one-transaction journals, sent as JSON text and rebuilt, a peer catching up (JRN-04); a journal written to a file of JSON lines, appended to by whole transactions, read back whole or after a position, a line cut short refused (JRN-05); a journal applied to a second store (`Changes.apply`) making it hold the same, and a slice after a position catching one up (JRN-06); what is not a journal refused by each function, nothing written (JRN-07). A store appears only where a journal is given and applied, made in one place, so that the suite runs over any store |

Total: 11 cases.

---

<!-- nav -->
[← Python package](../README.md) · [Home](../../README.md) · [TypeScript package →](../../typescript5/README.md)
