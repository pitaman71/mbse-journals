<!-- nav -->
[← Why the mbse repositories exist](../../MBSE.md) · [Home](../../README.md) · [TypeScript tutorial →](../../typescript5/tutorials/README.md)

# Tutorial: mbse-journals

How to keep a store's history as a journal, and work from it, one case study per notebook, for developers of
mbse-schemas models. No case study yet: each is added with the first capability that has something to teach. A
TypeScript port with the same case studies is [the TypeScript tutorial](../../typescript5/tutorials/README.md).

Each step's markdown cell starts with `<a id="Tnn.k"></a>` and its `## nn.k · title` heading, the same in both
languages, so that the skill links it ([the basis](https://github.com/pitaman71/mbse-basis/blob/main/docs/README.md#the-doc-spec), What, why and how). The notebooks run
as tests and are committed with their outputs, as mbse-basis
[PRI-034: tutorials run as tests, committed with their outputs](https://github.com/pitaman71/mbse-basis/blob/main/docs/PRINCIPLES.md#PRI-034) has it.

## Running the notebooks

```sh
cd python3
uv sync
uv run --with jupyterlab jupyter lab tutorials/   # or open them in VS Code with the project's .venv as the kernel
uv run pytest tutorials                           # runs them all as tests
```

## The case studies

None yet: the first is added with the first capability that has something to teach.

---

<!-- nav -->
[← Why the mbse repositories exist](../../MBSE.md) · [Home](../../README.md) · [TypeScript tutorial →](../../typescript5/tutorials/README.md)
