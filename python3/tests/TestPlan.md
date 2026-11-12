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
| `03_Journals.ipynb` | JRN | 8 | [CAP-199: journals as queryable stores (mbse-journals)](https://github.com/pitaman71/mbse-basis/blob/main/docs/capabilities/CAP-199.md) and [CAP-288: the journal storage interface](https://github.com/pitaman71/mbse-basis/blob/main/docs/capabilities/README.md#CAP-288): the journals' schemas, each valid, run again writing nothing, a journal store holding them alone; a journal made once by its name, recording each transaction a store commits as a journal transaction, appended in order, holding its changes; journal transactions read in order from the first or after any one; a property cleared and an entry removed by its owner's key held and given back as written; a journal replayed into a store making it hold what the recorded store does; a follower given each transaction in order, from the first or after one, then each appended, until it ends; a journal transaction inserted after any one, read in its place, its changes applied again changing nothing; two stores following one journal, each appending from what it last saw, the second append refused alike in both |

Total: 12 cases.

---

<!-- nav -->
[← Python package](../README.md) · [Home](../../README.md) · [TypeScript package →](../../typescript5/README.md)
