/**
 * Journals: journals as values outside any store, `Changes.Journal` as plain data, for the follow of the stores built
 * over backends: positions, streams and files ([the journals proposal](mbse:mbse-basis/proposals/JOURNALS.md#decided),
 * [CAP-273: journals in memory and in local files](mbse:mbse-basis/docs/capabilities/README.md#CAP-273),
 * [CAP-274: journals sent and received](mbse:mbse-basis/docs/capabilities/README.md#CAP-274)).
 *
 * A journal is mbse-schemas' `Changes.Journal`, held here as its plain form, as a store's `follow` gives it: an array
 * of its transactions, in order, each a `Changes.Transaction`'s plain form, a map whose `id` is unique. It is data:
 * built, joined, sliced, sent, written and read with no store, its transactions read by iterating it, compared as plain
 * data is, and read as a value in a store holding the schemas its objects are of, where `Changes.apply` applies it
 * (`Plain.FromPlain(store)(store.registered("Changes.Journal"), journal)`). mbse-journals defines no schemas, and reads
 * of a transaction its `id` alone, carrying the rest as written
 * ([PRI-024: the plain form, carried as written](mbse:mbse-basis/docs/PRINCIPLES.md#PRI-024)). Each function gives a
 * journal of its own and changes none it is given, but `collect`, whose journal is the one a follow fills.
 *
 * - Positions: a transaction's `id` is a position. `after(journal, position, until)` gives the whole transactions after
 *   the one of id `position` (from the first, where null), up to and including the one of id `until` (to the last,
 *   where null); a position the journal lacks is refused.
 * - Joining: `join(...journals)` gives one journal of their transactions, in order; `insert(journal, position,
 *   inserted)` gives `journal` with the transactions of `inserted` after the one of id `position` (before the first,
 *   where null). A transaction is held once by its id: one arriving again replaces the one held, in its place.
 * - Streams: `split(journal)` gives its one-transaction journals, in order, as a follow gives them, to send; `join`
 *   rebuilds a journal from them; `collect(journal)` gives a follower, for a store's `follow`, that joins each journal
 *   it is given into `journal`.
 * - Files: a file holds a journal as JSON lines, each one transaction's plain form, as mbse-schemas' `JSON.dumps` writes
 *   it, in order, so that whole transactions are appended to it. `write(path, journal)` writes a journal to a file,
 *   `append(path, journal)` appends its transactions to one, made where there is none, and `read(path, position)` reads
 *   the journal a file holds (joined, as `join` joins), or the part after a position.
 */

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { JSON as Json } from "@mbse/schemas/Framework";
import { LookupError, ValueError } from "@mbse/schemas/Framework/Errors";
import type { PlainData, PlainMap } from "@mbse/schemas/Framework/Plain";

/** A `Changes.Journal`, as plain data: its transactions, in order. */
export type Journal = PlainMap[];

/** `journal`, refused where it is not a journal as plain data: an array of its transactions, each with its id. */
function checked(journal: unknown): Journal {
  if (!Array.isArray(journal) || !journal.every((t) => t instanceof Map && typeof t.get("id") === "string")) {
    throw new ValueError("a journal, as plain data, is a list of its transactions, each with its id");
  }
  return journal as Journal;
}

/** Where the transaction of id `position` is in `journal`; refused where it holds none. */
function index(journal: Journal, position: string): number {
  const found = journal.findIndex((transaction) => transaction.get("id") === position);
  if (found < 0) throw new LookupError(`the journal holds no transaction ${Json.dumps(position)}`);
  return found;
}

/** The whole transactions of `journal` after the one of id `position`, from the first where null, up to and including
 * the one of id `until`, to the last where null: a journal. A position it lacks, after `position` for `until`, is
 * refused. */
export function after(journal: Journal, position: string | null = null, until: string | null = null): Journal {
  const rest = checked(journal).slice(position === null ? 0 : index(journal, position) + 1);
  return until === null ? rest : rest.slice(0, index(rest, until) + 1);
}

/** One journal of the transactions of `journals`, in order, each held once by its id: one arriving again replaces the
 * one held, in its place, as a client accepts a frame arriving again. */
export function join(...journals: Journal[]): Journal {
  const held = new Map<string, PlainMap>();
  for (const journal of journals) {
    for (const transaction of checked(journal)) held.set(transaction.get("id") as string, transaction);
  }
  return [...held.values()];
}

/** `journal` with the transactions of `inserted` after the one of id `position`, before the first where null, joined
 * (`join`); a position it lacks is refused. */
export function insert(journal: Journal, position: string | null, inserted: Journal): Journal {
  checked(journal);
  const at = position === null ? 0 : index(journal, position) + 1;
  return join(journal.slice(0, at), inserted, journal.slice(at));
}

/** The one-transaction journals of `journal`, in order, as a store's follow gives them; `join` rebuilds it. */
export function split(journal: Journal): Journal[] {
  return checked(journal).map((transaction) => [transaction]);
}

/** A follower, for a store's `follow`, that joins each journal it is given into `journal`, as `join` does:
 * `store.follow(Journals.collect(journal))`. */
export function collect(journal: Journal): (given: unknown) => void {
  checked(journal);
  return (given: unknown) => {
    journal.splice(0, journal.length, ...join(journal, given as Journal));
  };
}

function lines(journal: Journal): string {
  return checked(journal).map((transaction) => Json.dumps(transaction) + "\n").join("");
}

/** Writes `journal` to the file at `path`, replacing what it held: each transaction one line, as plain JSON. */
export function write(path: string, journal: Journal): void {
  writeFileSync(path, lines(journal), "utf8");
}

/** Appends the transactions of `journal` to the file at `path`, in one write, each one line; the file is made where
 * there is none. */
export function append(path: string, journal: Journal): void {
  appendFileSync(path, lines(journal), "utf8");
}

/** The journal the file at `path` holds, its lines joined (`join`), or its whole transactions after the one of id
 * `position` (`after`); a line that is no transaction, a position it lacks, is refused. */
export function read(path: string, position: string | null = null): Journal {
  const text = readFileSync(path, "utf8");
  const given = text.split("\n").filter((line, i, all) => line !== "" || i < all.length - 1);
  return after(join(...given.map((line): Journal => [Json.loads(line) as PlainData as PlainMap])), position);
}
