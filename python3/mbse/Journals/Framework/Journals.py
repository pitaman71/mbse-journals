"""Journals: journals as values outside any store, `Changes.Journal` as plain data, for the follow of the stores built
over backends: positions, streams and files ([the journals proposal](mbse:mbse-basis/proposals/JOURNALS.md#decided),
[CAP-273: journals in memory and in local files](mbse:mbse-basis/docs/capabilities/README.md#CAP-273),
[CAP-274: journals sent and received](mbse:mbse-basis/docs/capabilities/README.md#CAP-274)).

A journal is mbse-schemas' `Changes.Journal`, held here as its plain form, as a store's `follow` gives it: a list of
its transactions, in order, each a `Changes.Transaction`'s plain form, a dict whose `id` is unique. It is data: built,
joined, sliced, sent, written and read with no store, its transactions read by iterating it, compared as plain data is,
and read as a value in a store holding the schemas its objects are of, where `Changes.apply` applies it
(`Plain.FromPlain(store)(store.registered("Changes.Journal"), journal)`). mbse-journals defines no schemas, and reads
of a transaction its `id` alone, carrying the rest as written
([PRI-024: the plain form, carried as written](mbse:mbse-basis/docs/PRINCIPLES.md#PRI-024)). Each function gives a
journal of its own and changes none it is given, but `collect`, whose journal is the one a follow fills.

- Positions: a transaction's `id` is a position. `after(journal, position, until)` gives the whole transactions after
  the one of id `position` (from the first, where None), up to and including the one of id `until` (to the last, where
  None); a position the journal lacks is refused.
- Joining: `join(*journals)` gives one journal of their transactions, in order; `insert(journal, position, inserted)`
  gives `journal` with the transactions of `inserted` after the one of id `position` (before the first, where None).
  A transaction is held once by its id: one arriving again replaces the one held, in its place.
- Streams: `split(journal)` gives its one-transaction journals, in order, as a follow gives them, to send; `join`
  rebuilds a journal from them; `collect(journal)` gives a follower, for a store's `follow`, that joins each journal it
  is given into `journal`.
- Files: a file holds a journal as JSON lines, each one transaction's plain form, as mbse-schemas' `JSON.dumps` writes
  it, in order, so that whole transactions are appended to it. `write(path, journal)` writes a journal to a file,
  `append(path, journal)` appends its transactions to one, made where there is none, and `read(path, position)` reads
  the journal a file holds (joined, as `join` joins), or the part after a position.
"""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from mbse.Schemas.Framework import JSON

__all__ = ["after", "join", "insert", "split", "collect", "write", "append", "read"]

Journal = list[dict[str, Any]]
"""A `Changes.Journal`, as plain data: its transactions, in order."""


def _checked(journal: Any) -> Journal:
    """`journal`, refused where it is not a journal as plain data: a list of its transactions, each with its id."""
    if not isinstance(journal, list) or not all(isinstance(t, dict) and isinstance(t.get("id"), str) for t in journal):
        raise ValueError("a journal, as plain data, is a list of its transactions, each with its id")
    return journal


def _index(journal: Journal, position: str) -> int:
    """Where the transaction of id `position` is in `journal`; refused where it holds none."""
    for i, transaction in enumerate(journal):
        if transaction["id"] == position:
            return i
    raise LookupError(f"the journal holds no transaction {JSON.dumps(position)}")


def after(journal: Journal, position: str | None = None, until: str | None = None) -> Journal:
    """The whole transactions of `journal` after the one of id `position`, from the first where None, up to and
    including the one of id `until`, to the last where None: a journal. A position it lacks, after `position` for
    `until`, is refused."""
    rest = _checked(journal)[0 if position is None else _index(journal, position) + 1:]
    return rest if until is None else rest[:_index(rest, until) + 1]


def join(*journals: Journal) -> Journal:
    """One journal of the transactions of `journals`, in order, each held once by its id: one arriving again replaces
    the one held, in its place, as a client accepts a frame arriving again."""
    held: dict[str, dict[str, Any]] = {}
    for journal in journals:
        held.update((transaction["id"], transaction) for transaction in _checked(journal))
    return list(held.values())


def insert(journal: Journal, position: str | None, inserted: Journal) -> Journal:
    """`journal` with the transactions of `inserted` after the one of id `position`, before the first where None,
    joined (`join`); a position it lacks is refused."""
    _checked(journal)
    at = 0 if position is None else _index(journal, position) + 1
    return join(journal[:at], inserted, journal[at:])


def split(journal: Journal) -> list[Journal]:
    """The one-transaction journals of `journal`, in order, as a store's follow gives them; `join` rebuilds it."""
    return [[transaction] for transaction in _checked(journal)]


def collect(journal: Journal) -> Callable[[Journal], None]:
    """A follower, for a store's `follow`, that joins each journal it is given into `journal`, as `join` does:
    `store.follow(Journals.collect(journal))`."""
    _checked(journal)

    def follower(given: Journal) -> None:
        journal[:] = join(journal, given)

    return follower


def _lines(journal: Journal) -> str:
    return "".join(JSON.dumps(transaction) + "\n" for transaction in _checked(journal))


def write(path: str | Path, journal: Journal) -> None:
    """Writes `journal` to the file at `path`, replacing what it held: each transaction one line, as plain JSON."""
    Path(path).write_text(_lines(journal), encoding="utf-8")


def append(path: str | Path, journal: Journal) -> None:
    """Appends the transactions of `journal` to the file at `path`, in one write, each one line; the file is made
    where there is none."""
    text = _lines(journal)  # refused before the file is opened
    with Path(path).open("a", encoding="utf-8") as file:
        file.write(text)


def read(path: str | Path, position: str | None = None) -> Journal:
    """The journal the file at `path` holds, its lines joined (`join`), or its whole transactions after the one of id
    `position` (`after`); a line that is no transaction, a position it lacks, is refused."""
    *lines, last = Path(path).read_text(encoding="utf-8").split("\n")  # a last line not ended is read too
    return after(join(*([JSON.loads(line)] for line in [*lines, *([last] if last else [])])), position)
