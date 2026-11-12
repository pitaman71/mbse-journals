/**
 * Journals: a store's history, kept as data in a store, its journal transactions in order, each holding the changes
 * one transaction made ([CAP-199: journals as queryable stores (mbse-journals)](mbse:mbse-basis/docs/capabilities/CAP-199.md),
 * [CAP-288: the journal storage interface](mbse:mbse-basis/docs/capabilities/README.md#CAP-288)).
 *
 * Normal schemas, installed before use: `store.transaction(Journals.install)`. A journal is kept in any store, through the
 * one store interface ([FEA-028: one Store interface, lazy by default](mbse:mbse-basis/docs/features/FEA-028.md)), so that a store in memory, a store over a database
 * and a store over REST each keep one alike; a store over a database runs each of its transactions within a database
 * transaction, which orders them.
 *
 * - The singleton `Journals.Directory` owns each journal, a `Journals.OfJournal`, by its `name` (`Journals.Owns`).
 * - A journal is a sequenced container of its journal transactions, each a `Journals.OfTransaction`, which it owns,
 *   each by a `name` unique in it, an identity and no order (`Journals.Contains`): a writer gives each a name of its own
 *   where others append too, since two writers counting alike would name two transactions alike. Its
 *   order is relations, never an order of entries, as
 *   [FEA-058: parametric schema templates](mbse:mbse-basis/docs/features/FEA-058.md#decided) has it: its `First` and its `Last` (`Journals.First`,
 *   `Journals.Last`), each transaction's immediate successor (`Journals.Before`, read from the earlier as `next` and
 *   from the later as `previous`), and, held where they say what is known, `Journals.Precedes`, never inferred.
 * - A journal transaction holds its changes, in the journal language: a store reports the changes each transaction
 *   made, downstream of the interpreter of the mutation transactions it is given, in the form of a transaction expression
 *   ([CAP-270: a transaction's changes observed at its commit](mbse:mbse-basis/docs/capabilities/README.md#CAP-270)), and the journal records them as data of its own. Each object they name
 *   is a binding (`Journals.OfBinding`), held in an indexed container, its index an entry property (`Journals.Binds`):
 *   the `reference` of one the store held, or the `schema` of one it made, each as its plain form. Each change is held in
 *   another (`Journals.Has`), in order: an entry inserted or removed (`Journals.OfEntryChange`), on its holder's
 *   adjacency, with its other links' bindings (`Journals.Links`) and its properties' plain values; or a property set or
 *   cleared (`Journals.OfPropertyChange`), with its value's plain form. Plain forms are carried as written, so that a
 *   journal store holds the journal's schemas alone.
 *
 * `journal(store, name)` gives a journal, made where the store holds none; `append(journal, changes)` appends a journal
 * transaction holding `changes` after the last, `insert(journal, after, changes)` one after the transaction `after`,
 * each in a transaction of its own; `transactions(journal, after)` reads them in order, from the first or after a
 * transaction; `changes(transaction)` gives what one holds, as the plain form of a transaction expression;
 * `follow(journal, observer, after)` gives `observer` each transaction, in order, from the first or after one, then each
 * appended, and returns a function that ends it;
 * `record(source, journal)` appends the changes of each transaction `source` commits, and returns a function that ends
 * it; `replay(journal, target)` applies each transaction's changes, in order, to `target`. Where changes are given, they
 * are a transaction expression a store reported, or its plain form.
 *
 * An append removes `Last(journal, a)` and inserts `Last(journal, b)` and `Before(journal, a, b)` in one transaction;
 * written from a view another append has overtaken, its removal removes nothing and its insertion breaks the clause
 * that keeps one last, so that mbse-schemas refuses it, alike in every store
 * ([CAP-293: an entry inserted against a unique clause refuses its transaction](mbse:mbse-basis/docs/capabilities/README.md#CAP-293)).
 */

import { Changes, JSON as Json, Plain, Proxies } from "@mbse/schemas/Framework";

/** The journals' schemas, defined in the store a transaction writes: `store.transaction(Journals.install)`. Run
 * again in a store, it finds each by its name and writes nothing. */
export function install(txn: any): any {
  const S = txn.Schemas;

  const ordered = (name: string, links: string[], uniques: string[][] | null = null): any => (_: any): any => {
    const relation = _[name.split(".")[1] as string].name(name).links(links.map((k) => (t: any) => t.name(k)));
    return uniques !== null ? relation.uniques(uniques) : relation;
  };

  return txn.uid("mbse.Journals/1").mutations([(mu: any) => mu.upsert((u: any) => u.exists([(p: any) => p
    .symbols({
      Owns: S.OfRelation, Directory: S.OfObject, OfJournal: S.OfObject, Contains: S.OfRelation,
      OfTransaction: S.OfObject, First: S.OfRelation, Last: S.OfRelation, Before: S.OfRelation,
      Precedes: S.OfRelation, Binds: S.OfRelation, OfBinding: S.OfObject, Has: S.OfRelation,
      OfEntryChange: S.OfObject, OfPropertyChange: S.OfObject, Holder: S.OfRelation, Links: S.OfRelation,
    })
    .spec([
      (_: any) => _.Owns.name("Journals.Owns").links([(t: any) => t.name("directory"), (t: any) => t.name("journal")])
        .properties({ name: S.OfStr }).uniques([["directory", "name"], ["journal"]]),
      (_: any) => _.Directory.name("Journals.Directory").ref(true).singleton("Journals.Directory").adjacencies([
        (t: any) => t.name("journals").relation([_.Owns]).me("directory"),
      ]),
      (_: any) => _.Contains.name("Journals.Contains").links([
        (t: any) => t.name("journal"), (t: any) => t.name("transaction"),
      ]).properties({ name: S.OfStr })
        .uniques([["journal", "name"], ["transaction"]]), // each of one journal, by a name unique in it
      ordered("Journals.First", ["journal", "transaction"], [["transaction"], ["journal"]]),
      ordered("Journals.Last", ["journal", "transaction"], [["transaction"], ["journal"]]),
      // in a journal, `earlier` immediately before `later`: one successor and one predecessor each
      ordered("Journals.Before", ["journal", "earlier", "later"], [["later"], ["earlier"]]),
      ordered("Journals.Precedes", ["journal", "earlier", "later"]), // `later` no earlier than `earlier`
      // indexed containers: a transaction's bindings, and its changes, each by an index unique in it
      (_: any) => _.Binds.name("Journals.Binds").links([
        (t: any) => t.name("transaction"), (t: any) => t.name("binding"),
      ])
        .properties({ index: S.OfInt }).uniques([["transaction", "index"], ["binding"]]),
      (_: any) => _.Has.name("Journals.Has").links([(t: any) => t.name("transaction"), (t: any) => t.name("change")])
        .properties({ index: S.OfInt }).uniques([["transaction", "index"], ["change"]]),
      ordered("Journals.Holder", ["change", "binding"], [["binding"]]), // the binding a change is on
      (_: any) => _.Links.name("Journals.Links").links([(t: any) => t.name("change"), (t: any) => t.name("binding")])
        .properties({ link: S.OfStr }).uniques([["binding"]]), // an entry change's other links, each by name
      (_: any) => _.OfJournal.name("Journals.OfJournal").ref(true).adjacencies([
        (t: any) => t.name("directory").relation([_.Owns]).me("journal").owner(true),
        (t: any) => t.name("contains").relation([_.Contains]).me("journal"),
        (t: any) => t.name("first").relation([_.First]).me("journal"),
        (t: any) => t.name("last").relation([_.Last]).me("journal"),
        (t: any) => t.name("before").relation([_.Before]).me("journal"),
        (t: any) => t.name("precedes").relation([_.Precedes]).me("journal"),
      ]),
      (_: any) => _.OfTransaction.name("Journals.OfTransaction").ref(true).adjacencies([
        (t: any) => t.name("journal").relation([_.Contains]).me("transaction").owner(true),
        (t: any) => t.name("first_of").relation([_.First]).me("transaction"),
        (t: any) => t.name("last_of").relation([_.Last]).me("transaction"),
        (t: any) => t.name("next").relation([_.Before]).me("earlier"),
        (t: any) => t.name("previous").relation([_.Before]).me("later"),
        (t: any) => t.name("precedes").relation([_.Precedes]).me("earlier"),
        (t: any) => t.name("follows").relation([_.Precedes]).me("later"),
        (t: any) => t.name("bindings").relation([_.Binds]).me("transaction"),
        (t: any) => t.name("changes").relation([_.Has]).me("transaction"),
      ]),
      (_: any) => _.OfBinding.name("Journals.OfBinding").ref(true).properties({
        reference: S.OfStr, // an object the store held: its reference's plain form
        schema: S.OfStr, // an object it made: its schema's path, in plain form
      }).adjacencies([
        (t: any) => t.name("transaction").relation([_.Binds]).me("binding").owner(true),
        (t: any) => t.name("holds").relation([_.Holder]).me("binding"),
        (t: any) => t.name("linked").relation([_.Links]).me("binding"),
      ]),
      (_: any) => _.OfEntryChange.name("Journals.OfEntryChange").ref(true).properties({
        verb: S.OfStr, // "insert" or "remove"
        adjacency: S.OfStr, // the holder's adjacency it is written on
        property_values: S.OfStr, // its properties' values, by name, in plain form
      }).adjacencies([
        (t: any) => t.name("transaction").relation([_.Has]).me("change").owner(true),
        (t: any) => t.name("holder").relation([_.Holder]).me("change"),
        (t: any) => t.name("links").relation([_.Links]).me("change"),
      ]),
      (_: any) => _.OfPropertyChange.name("Journals.OfPropertyChange").ref(true).properties({
        property: S.OfStr,
        verb: S.OfStr, // "set" or "clear"
        value: S.OfStr, // the value set, in plain form
      }).adjacencies([
        (t: any) => t.name("transaction").relation([_.Has]).me("change").owner(true),
        (t: any) => t.name("holder").relation([_.Holder]).me("change"),
      ]),
    ])]))]);
}

/** The journal `store` holds as `name`, made where it holds none. */
export function journal(store: any, name: string): any {
  const directory = store.singleton("Journals.Directory");
  for (const entry of directory.journals) {
    if (entry.name.get() === name) return entry.journal;
  }
  return store.transaction(() => store.Journals.OfJournal((j: any) => j.directory((a: any) => a.insert(
    (e: any) => e.name(name).directory(directory)))));
}

/** Appends to `journal` a journal transaction holding `changes`, after its last, in a transaction of its own, named
 * `name`, or, for a journal one writer appends to, `t` and the count of its transactions; returns the journal
 * transaction. */
export function append(journal: any, changes: any, name: string | null = null): any {
  const store = _store_of(journal);
  const last = _one(journal.last, "transaction");
  return store.transaction(() => {
    const made = _made(store, journal, changes, name);
    if (last === null) {
      store.Journals.OfJournal(journal, (j: any) => j.first((a: any) => a.insert((e: any) => e.transaction(made)))
        .last((a: any) => a.insert((e: any) => e.transaction(made))));
    } else {
      store.Journals.OfJournal(journal, (j: any) => j
        .last((a: any) => a.remove((e: any) => e.transaction(last))
          .insert((e: any) => e.transaction(made)))
        .before((a: any) => a.insert((e: any) => e.earlier(last).later(made))));
    }
    return made;
  });
}

/** Inserts in `journal` a journal transaction holding `changes` immediately after the journal transaction `after`,
 * in a transaction of its own, named as `append` names one; returns the journal transaction. */
export function insert(journal: any, after: any, changes: any, name: string | null = null): any {
  const store = _store_of(journal);
  const later = _one(after.next, "later");
  if (later === null) return append(journal, changes, name);
  return store.transaction(() => {
    const made = _made(store, journal, changes, name);
    store.Journals.OfJournal(journal, (j: any) => j.before((a: any) => a
      .remove((e: any) => e.earlier(after).later(later))
      .insert((e: any) => e.earlier(after).later(made))
      .insert((e: any) => e.earlier(made).later(later))));
    return made;
  });
}

/** `journal`'s journal transactions, in order: from its first, or those after the journal transaction `after`. */
export function* transactions(journal: any, after: any = null): Generator<any> {
  let at = after === null ? _one(journal.first, "transaction") : _one(after.next, "later");
  while (at !== null) {
    yield at;
    at = _one(at.next, "later");
  }
}

/** The changes a journal transaction holds, as the plain form of a transaction expression: one upsert, its symbols
 * its bindings in order, its spec its changes in order. */
export function changes(transaction: any): Plain.PlainData {
  const bindings = [...transaction.bindings].sort(_byIndex);
  const name = new Map<any, string>(bindings.map((e) => [e.binding, `s${e.index.get()}`]));
  const symbols: Record<string, unknown> = {};
  for (const e of bindings) {
    const b = e.binding;
    const held = b.reference.get();
    symbols[name.get(b) as string] = held !== null && held !== undefined ? { reference: Json.loads(held) }
      : { schema: Json.loads(b.schema.get()) };
  }
  const spec: unknown[] = [];
  for (const e of [...transaction.changes].sort(_byIndex)) {
    const c = e.change;
    const holder = name.get(_one(c.holder, "binding")) as string;
    if (c.as_schema().name === "Journals.OfPropertyChange") {
      const verb = c.verb.get();
      const mutation = verb === "set" ? { set: { value: Json.loads(c.value.get()) } } : { clear: {} };
      spec.push({ [holder]: [{ as_property: { name: c.property.get(), mutations: [mutation] } }] });
      continue;
    }
    const parts: unknown[] = [...c.links].sort((x: any, y: any) => x.link.get() < y.link.get() ? -1 : 1) // each differs
      .map((x: any) => ({ as_link: { name: x.link.get(), mutations: [
        { set: { ref: { symbol: name.get(x.binding) } } }] } }));
    for (const [k, v] of Json.loads(c.property_values.get()) as Plain.PlainMap) {
      parts.push({ as_property: { name: k, mutations: [{ set: { value: v } }] } });
    }
    spec.push({ [holder]: [{ as_adjacency: { name: c.adjacency.get(), mutations: [
      { [c.verb.get()]: { entries: [{ mutations: parts }] } }] } }] });
  }
  return _plain({ mutations: [{ upsert: { exists: [{ symbols, spec }] } }] });
}

/** Gives `observer` each of `journal`'s journal transactions, in order, from its first or after `after`, then each
 * appended once its transaction commits; returns a function that ends it. */
export function follow(journal: any, observer: (transaction: any) => void, after: any = null): () => void {
  const at = [after];

  const catch_up = (_: any = null): void => {
    for (const transaction of [...transactions(journal, at[0])]) {
      at[0] = transaction;
      observer(transaction);
    }
  };

  catch_up();
  return Changes.observe(_store_of(journal), catch_up);
}

/** Appends to `journal` the effect of each transaction `source` commits; returns a function that ends it. */
export function record(source: any, journal: any): () => void {
  return Changes.observe(source, (effect) => append(journal, effect));
}

/** Applies each of `journal`'s journal transactions' changes, in order, to `target`, each in a transaction. */
export function replay(journal: any, target: any): void {
  for (const transaction of transactions(journal)) {
    target.transaction(Plain.FromPlain(target).Transaction(changes(transaction)));
  }
}

/** A journal transaction of `journal`, holding `changes`, made in `store`, within a transaction: its bindings and
 * its changes as the journal's own data. */
function _made(store: any, journal: any, changes: any, name: string | null): any {
  const plain: any = changes instanceof Map ? changes : Json.loads(Json.dumps(
    Plain.ToPlain(Proxies.store_of(changes)).Transaction(changes)));
  const [pattern] = plain.get("mutations")[0].get("upsert").get("exists");
  if (name === null) name = `t${[...journal.contains].length + 1}`; // its identity in the journal, never its order
  const made = store.Journals.OfTransaction((t: any) => t.journal((a: any) => a.insert(
    (e: any) => e.name(name).journal(journal))));
  const bindings = new Map<string, any>();
  for (const [i, [symbol, bound]] of [...pattern.get("symbols")].entries()) {
    const [held, schema] = bound.has("reference") ? [Json.dumps(bound.get("reference")), null] : [null, Json.dumps(
      bound.get("schema"))];
    bindings.set(symbol, store.Journals.OfBinding((b: any) => b
      .transaction((a: any) => a.insert((e: any) => e.index(BigInt(i)).transaction(made)))
      .reference(held).schema(schema)));
  }
  let index = 0;
  for (const item of pattern.get("spec")) {
    for (const [symbol, mutations] of item) {
      const h = bindings.get(symbol);
      for (const m of mutations) {
        const n = BigInt(index);
        if (m.has("as_property")) {
          const [[verb, body]] = [...m.get("as_property").get("mutations")[0]];
          store.Journals.OfPropertyChange((c: any) => c
            .transaction((a: any) => a.insert((e: any) => e.index(n).transaction(made)))
            .holder((a: any) => a.insert((e: any) => e.binding(h)))
            .property(m.get("as_property").get("name")).verb(verb)
            .value(verb === "set" ? Json.dumps(body.get("value")) : null));
          index += 1;
          continue;
        }
        for (const v of m.get("as_adjacency").get("mutations")) {
          const [[verb, body]] = [...v];
          for (const entry of body.get("entries")) {
            const n = BigInt(index);
            const links = new Map<string, string>(entry.get("mutations").filter((x: any) => x.has("as_link"))
              .map((x: any) => [x.get("as_link").get("name"),
                x.get("as_link").get("mutations")[0].get("set").get("ref").get("symbol")]));
            const values: Plain.PlainMap = new Map(entry.get("mutations").filter((x: any) => x.has("as_property"))
              .map((x: any) => [x.get("as_property").get("name"),
                x.get("as_property").get("mutations")[0].get("set").get("value")]));
            store.Journals.OfEntryChange((c: any) => c
              .transaction((a: any) => a.insert((e: any) => e.index(n).transaction(made)))
              .holder((a: any) => a.insert((e: any) => e.binding(h)))
              .links((a: any) => _linked(a, links, bindings))
              .verb(verb).adjacency(m.get("as_adjacency").get("name")).property_values(Json.dumps(values)));
            index += 1;
          }
        }
      }
    }
  }
  return made;
}

/** An entry change's other links, each inserted by its name, to the binding of its symbol. */
function _linked(adjacency: any, links: Map<string, string>, bindings: Map<string, any>): any {
  for (const [link, symbol] of links) {
    adjacency.insert((e: any) => e.link(link).binding(bindings.get(symbol)));
  }
  return adjacency;
}

/** The object one entry links through `link`, or null where there is none. */
function _one(entries: any, link: string): any {
  for (const entry of entries) return entry[link];
  return null;
}

function _store_of(x: any): any {
  return Proxies.store_of(x);
}

/** Entries in the order of their `index`. */
function _byIndex(a: any, b: any): number {
  return Number(a.index.get() - b.index.get());
}

/** Plain data, its objects written as object literals made maps, as `Plain` reads it; a map is plain already. */
function _plain(x: unknown): Plain.PlainData {
  if (Array.isArray(x)) return x.map(_plain);
  if (x !== null && typeof x === "object" && !(x instanceof Map)) {
    return new Map(Object.entries(x).map(([k, v]) => [k, _plain(v)]));
  }
  return x as Plain.PlainData;
}
