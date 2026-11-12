"""Journals: a store's history, kept as data in a store, its journal transactions in order, each holding the changes
one transaction made ([CAP-199: journals as queryable stores (mbse-journals)](mbse:mbse-basis/docs/capabilities/CAP-199.md),
[CAP-288: the journal storage interface](mbse:mbse-basis/docs/capabilities/README.md#CAP-288)).

Normal schemas, installed before use: `store.transaction(Journals.install)`. A journal is kept in any store, through the
one store interface ([FEA-028: one Store interface, lazy by default](mbse:mbse-basis/docs/features/FEA-028.md)), so that a store in memory, a store over a database
and a store over REST each keep one alike; a store over a database runs each of its transactions within a database
transaction, which orders them.

- The singleton `Journals.Directory` owns each journal, a `Journals.OfJournal`, by its `name` (`Journals.Owns`).
- A journal is a sequenced container of its journal transactions, each a `Journals.OfTransaction`, which it owns,
  each by a `name` unique in it, an identity and no order (`Journals.Contains`): a writer gives each a name of its own
  where others append too, since two writers counting alike would name two transactions alike. Its
  order is relations, never an order of entries, as
  [FEA-058: parametric schema templates](mbse:mbse-basis/docs/features/FEA-058.md#decided) has it: its `First` and its `Last` (`Journals.First`,
  `Journals.Last`), each transaction's immediate successor (`Journals.Before`, read from the earlier as `next` and
  from the later as `previous`), and, held where they say what is known, `Journals.Precedes`, never inferred.
- A journal transaction holds its changes, in the journal language: a store reports the changes each transaction
  made, downstream of the interpreter of the mutation transactions it is given, in the form of a transaction expression
  ([CAP-270: a transaction's changes observed at its commit](mbse:mbse-basis/docs/capabilities/README.md#CAP-270)), and the journal records them as data of its own. Each object they name
  is a binding (`Journals.OfBinding`), held in an indexed container, its index an entry property (`Journals.Binds`):
  the `reference` of one the store held, or the `schema` of one it made, each as its plain form. Each change is held in
  another (`Journals.Has`), in order: an entry inserted or removed (`Journals.OfEntryChange`), on its holder's
  adjacency, with its other links' bindings (`Journals.Links`) and its properties' plain values; or a property set or
  cleared (`Journals.OfPropertyChange`), with its value's plain form. Plain forms are carried as written, so that a
  journal store holds the journal's schemas alone.

`journal(store, name)` gives a journal, made where the store holds none; `append(journal, changes)` appends a journal
transaction holding `changes` after the last, `insert(journal, after, changes)` one after the transaction `after`,
each in a transaction of its own; `transactions(journal, after)` reads them in order, from the first or after a
transaction; `changes(transaction)` gives what one holds, as the plain form of a transaction expression;
`follow(journal, observer, after)` gives `observer` each transaction, in order, from the first or after one, then each
appended, and returns a function that ends it;
`record(source, journal)` appends the changes of each transaction `source` commits, and returns a function that ends
it; `replay(journal, target)` applies each transaction's changes, in order, to `target`. Where changes are given, they
are a transaction expression a store reported, or its plain form.

An append removes `Last(journal, a)` and inserts `Last(journal, b)` and `Before(journal, a, b)` in one transaction;
written from a view another append has overtaken, its removal removes nothing and its insertion breaks the clause
that keeps one last, so that mbse-schemas refuses it, alike in every store
([CAP-293: an entry inserted against a unique clause refuses its transaction](mbse:mbse-basis/docs/capabilities/README.md#CAP-293)).
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from typing import Any

from mbse.Schemas.Framework import JSON, Changes, Plain, Proxies

__all__ = ["install", "journal", "append", "insert", "transactions", "changes", "follow", "record", "replay"]


def install(txn: Any) -> Any:
    """The journals' schemas, defined in the store a transaction writes: `store.transaction(Journals.install)`. Run
    again in a store, it finds each by its name and writes nothing."""
    S = txn.Schemas

    def ordered(name: str, *links: str, uniques: list[list[str]] | None = None) -> Any:
        def spec(_: Any) -> Any:
            relation = getattr(_, name.split(".")[1]).name(name).links([lambda t, k=k: t.name(k) for k in links])
            return relation.uniques(uniques) if uniques is not None else relation
        return spec

    return txn.uid("mbse.Journals/1").mutations([lambda mu: mu.upsert(lambda u: u.exists([lambda p: p
        .symbols({
            "Owns": S.OfRelation, "Directory": S.OfObject, "OfJournal": S.OfObject, "Contains": S.OfRelation,
            "OfTransaction": S.OfObject, "First": S.OfRelation, "Last": S.OfRelation, "Before": S.OfRelation,
            "Precedes": S.OfRelation, "Binds": S.OfRelation, "OfBinding": S.OfObject, "Has": S.OfRelation,
            "OfEntryChange": S.OfObject, "OfPropertyChange": S.OfObject, "Holder": S.OfRelation, "Links": S.OfRelation,
        })
        .spec([
            lambda _: _.Owns.name("Journals.Owns").links([lambda t: t.name("directory"), lambda t: t.name("journal")])
            .properties({"name": S.OfStr}).uniques([["directory", "name"], ["journal"]]),
            lambda _: _.Directory.name("Journals.Directory").ref(True).singleton("Journals.Directory").adjacencies([
                lambda t: t.name("journals").relation([_.Owns]).me("directory"),
            ]),
            lambda _: _.Contains.name("Journals.Contains").links([
                lambda t: t.name("journal"), lambda t: t.name("transaction"),
            ]).properties({"name": S.OfStr})
            .uniques([["journal", "name"], ["transaction"]]),  # each of one journal, by a name unique in it
            ordered("Journals.First", "journal", "transaction", uniques=[["transaction"], ["journal"]]),
            ordered("Journals.Last", "journal", "transaction", uniques=[["transaction"], ["journal"]]),
            # in a journal, `earlier` immediately before `later`: one successor and one predecessor each
            ordered("Journals.Before", "journal", "earlier", "later", uniques=[["later"], ["earlier"]]),
            ordered("Journals.Precedes", "journal", "earlier", "later"),  # `later` no earlier than `earlier`
            # indexed containers: a transaction's bindings, and its changes, each by an index unique in it
            lambda _: _.Binds.name("Journals.Binds").links([
                lambda t: t.name("transaction"), lambda t: t.name("binding"),
            ])
            .properties({"index": S.OfInt}).uniques([["transaction", "index"], ["binding"]]),
            lambda _: _.Has.name("Journals.Has").links([lambda t: t.name("transaction"), lambda t: t.name("change")])
            .properties({"index": S.OfInt}).uniques([["transaction", "index"], ["change"]]),
            ordered("Journals.Holder", "change", "binding", uniques=[["binding"]]),  # the binding a change is on
            lambda _: _.Links.name("Journals.Links").links([lambda t: t.name("change"), lambda t: t.name("binding")])
            .properties({"link": S.OfStr}).uniques([["binding"]]),  # an entry change's other links, each by name
            lambda _: _.OfJournal.name("Journals.OfJournal").ref(True).adjacencies([
                lambda t: t.name("directory").relation([_.Owns]).me("journal").owner(True),
                lambda t: t.name("contains").relation([_.Contains]).me("journal"),
                lambda t: t.name("first").relation([_.First]).me("journal"),
                lambda t: t.name("last").relation([_.Last]).me("journal"),
                lambda t: t.name("before").relation([_.Before]).me("journal"),
                lambda t: t.name("precedes").relation([_.Precedes]).me("journal"),
            ]),
            lambda _: _.OfTransaction.name("Journals.OfTransaction").ref(True).adjacencies([
                lambda t: t.name("journal").relation([_.Contains]).me("transaction").owner(True),
                lambda t: t.name("first_of").relation([_.First]).me("transaction"),
                lambda t: t.name("last_of").relation([_.Last]).me("transaction"),
                lambda t: t.name("next").relation([_.Before]).me("earlier"),
                lambda t: t.name("previous").relation([_.Before]).me("later"),
                lambda t: t.name("precedes").relation([_.Precedes]).me("earlier"),
                lambda t: t.name("follows").relation([_.Precedes]).me("later"),
                lambda t: t.name("bindings").relation([_.Binds]).me("transaction"),
                lambda t: t.name("changes").relation([_.Has]).me("transaction"),
            ]),
            lambda _: _.OfBinding.name("Journals.OfBinding").ref(True).properties({
                "reference": S.OfStr,  # an object the store held: its reference's plain form
                "schema": S.OfStr,  # an object it made: its schema's path, in plain form
            }).adjacencies([
                lambda t: t.name("transaction").relation([_.Binds]).me("binding").owner(True),
                lambda t: t.name("holds").relation([_.Holder]).me("binding"),
                lambda t: t.name("linked").relation([_.Links]).me("binding"),
            ]),
            lambda _: _.OfEntryChange.name("Journals.OfEntryChange").ref(True).properties({
                "verb": S.OfStr,  # "insert" or "remove"
                "adjacency": S.OfStr,  # the holder's adjacency it is written on
                "property_values": S.OfStr,  # its properties' values, by name, in plain form
            }).adjacencies([
                lambda t: t.name("transaction").relation([_.Has]).me("change").owner(True),
                lambda t: t.name("holder").relation([_.Holder]).me("change"),
                lambda t: t.name("links").relation([_.Links]).me("change"),
            ]),
            lambda _: _.OfPropertyChange.name("Journals.OfPropertyChange").ref(True).properties({
                "property": S.OfStr,
                "verb": S.OfStr,  # "set" or "clear"
                "value": S.OfStr,  # the value set, in plain form
            }).adjacencies([
                lambda t: t.name("transaction").relation([_.Has]).me("change").owner(True),
                lambda t: t.name("holder").relation([_.Holder]).me("change"),
            ]),
        ])]))])


def journal(store: Any, name: str) -> Any:
    """The journal `store` holds as `name`, made where it holds none."""
    directory = store.singleton("Journals.Directory")
    for entry in directory.journals:
        if entry.name.get() == name:
            return entry.journal
    with store.transaction():
        return store.Journals.OfJournal(lambda j: j.directory(lambda a: a.insert(
            lambda e: e.name(name).directory(directory))))


def append(journal: Any, changes: Any, name: str | None = None) -> Any:
    """Appends to `journal` a journal transaction holding `changes`, after its last, in a transaction of its own, named
    `name`, or, for a journal one writer appends to, `t` and the count of its transactions; returns the journal
    transaction."""
    store = _store_of(journal)
    last = _one(journal.last, "transaction")
    with store.transaction():
        made = _made(store, journal, changes, name)
        if last is None:
            store.Journals.OfJournal(journal, lambda j: j.first(lambda a: a.insert(lambda e: e.transaction(made)))
                                     .last(lambda a: a.insert(lambda e: e.transaction(made))))
        else:
            store.Journals.OfJournal(journal, lambda j: j
                                     .last(lambda a: a.remove(lambda e: e.transaction(last))
                                           .insert(lambda e: e.transaction(made)))
                                     .before(lambda a: a.insert(lambda e: e.earlier(last).later(made))))
    return made


def insert(journal: Any, after: Any, changes: Any, name: str | None = None) -> Any:
    """Inserts in `journal` a journal transaction holding `changes` immediately after the journal transaction `after`,
    in a transaction of its own, named as `append` names one; returns the journal transaction."""
    store = _store_of(journal)
    later = _one(after.next, "later")
    if later is None:
        return append(journal, changes, name)
    with store.transaction():
        made = _made(store, journal, changes, name)
        store.Journals.OfJournal(journal, lambda j: j.before(lambda a: a
                                 .remove(lambda e: e.earlier(after).later(later))
                                 .insert(lambda e: e.earlier(after).later(made))
                                 .insert(lambda e: e.earlier(made).later(later))))
    return made


def transactions(journal: Any, after: Any = None) -> Iterator[Any]:
    """`journal`'s journal transactions, in order: from its first, or those after the journal transaction `after`."""
    at = _one(journal.first, "transaction") if after is None else _one(after.next, "later")
    while at is not None:
        yield at
        at = _one(at.next, "later")


def changes(transaction: Any) -> Any:
    """The changes a journal transaction holds, as the plain form of a transaction expression: one upsert, its symbols
    its bindings in order, its spec its changes in order."""
    bindings = sorted(transaction.bindings, key=lambda e: e.index.get())
    name = {id(e.binding): f"s{e.index.get()}" for e in bindings}
    symbols = {}
    for e in bindings:
        b = e.binding
        held = b.reference.get()
        symbols[name[id(b)]] = {"reference": JSON.loads(held)} if held is not None else {"schema": JSON.loads(
            b.schema.get())}
    spec = []
    for e in sorted(transaction.changes, key=lambda e: e.index.get()):
        c = e.change
        holder = name[id(_one(c.holder, "binding"))]
        if c.as_schema().name == "Journals.OfPropertyChange":
            verb = c.verb.get()
            mutation = {"set": {"value": JSON.loads(c.value.get())}} if verb == "set" else {"clear": {}}
            spec.append({holder: [{"as_property": {"name": c.property.get(), "mutations": [mutation]}}]})
            continue
        parts = [{"as_link": {"name": x.link.get(), "mutations": [{"set": {"ref": {"symbol": name[id(x.binding)]}}}]}}
                 for x in sorted(c.links, key=lambda x: x.link.get())]
        parts += [{"as_property": {"name": k, "mutations": [{"set": {"value": v}}]}}
                  for k, v in JSON.loads(c.property_values.get()).items()]
        spec.append({holder: [{"as_adjacency": {"name": c.adjacency.get(), "mutations": [
            {c.verb.get(): {"entries": [{"mutations": parts}]}}]}}]})
    return {"mutations": [{"upsert": {"exists": [{"symbols": symbols, "spec": spec}]}}]}


def follow(journal: Any, observer: Callable[[Any], None], after: Any = None) -> Callable[[], None]:
    """Gives `observer` each of `journal`'s journal transactions, in order, from its first or after `after`, then each
    appended once its transaction commits; returns a function that ends it."""
    at = [after]

    def catch_up(_: Any = None) -> None:
        for transaction in list(transactions(journal, at[0])):
            at[0] = transaction
            observer(transaction)

    catch_up()
    return Changes.observe(_store_of(journal), catch_up)


def record(source: Any, journal: Any) -> Callable[[], None]:
    """Appends to `journal` the effect of each transaction `source` commits; returns a function that ends it."""
    return Changes.observe(source, lambda effect: append(journal, effect))


def replay(journal: Any, target: Any) -> None:
    """Applies each of `journal`'s journal transactions' changes, in order, to `target`, each in a transaction."""
    for transaction in transactions(journal):
        target.transaction(Plain.FromPlain(target).Transaction(changes(transaction)))


def _made(store: Any, journal: Any, changes: Any, name: str | None) -> Any:
    """A journal transaction of `journal`, holding `changes`, made in `store`, within a transaction: its bindings and
    its changes as the journal's own data."""
    plain = changes if isinstance(changes, dict) else JSON.loads(JSON.dumps(
        Plain.ToPlain(Proxies.store_of(changes)).Transaction(changes)))
    (pattern,) = plain["mutations"][0]["upsert"]["exists"]
    if name is None:  # its identity in the journal, never its order
        name = f"t{len(list(journal.contains)) + 1}"
    made = store.Journals.OfTransaction(lambda t: t.journal(lambda a: a.insert(
        lambda e: e.name(name).journal(journal))))
    bindings = {}
    for i, (symbol, bound) in enumerate(pattern["symbols"].items()):
        held, schema = (JSON.dumps(bound["reference"]), None) if "reference" in bound else (None, JSON.dumps(
            bound["schema"]))
        bindings[symbol] = store.Journals.OfBinding(lambda b, i=i, held=held, schema=schema: b
            .transaction(lambda a: a.insert(lambda e: e.index(i).transaction(made))).reference(held).schema(schema))
    index = 0
    for item in pattern["spec"]:
        for symbol, mutations in item.items():
            for m in mutations:
                if "as_property" in m:
                    ((verb, body),) = m["as_property"]["mutations"][0].items()
                    store.Journals.OfPropertyChange(lambda c, n=index, verb=verb, body=body, p=m["as_property"]["name"],
                                                    h=bindings[symbol]: c
                        .transaction(lambda a: a.insert(lambda e: e.index(n).transaction(made)))
                        .holder(lambda a: a.insert(lambda e: e.binding(h)))
                        .property(p).verb(verb).value(JSON.dumps(body["value"]) if verb == "set" else None))
                    index += 1
                    continue
                for v in m["as_adjacency"]["mutations"]:
                    ((verb, body),) = v.items()
                    for entry in body["entries"]:
                        links = {x["as_link"]["name"]: x["as_link"]["mutations"][0]["set"]["ref"]["symbol"]
                                 for x in entry["mutations"] if "as_link" in x}
                        values = {x["as_property"]["name"]: x["as_property"]["mutations"][0]["set"]["value"]
                                  for x in entry["mutations"] if "as_property" in x}
                        store.Journals.OfEntryChange(lambda c, n=index, verb=verb, links=links, values=values,
                                                     a_=m["as_adjacency"]["name"], h=bindings[symbol]: c
                            .transaction(lambda a: a.insert(lambda e: e.index(n).transaction(made)))
                            .holder(lambda a: a.insert(lambda e: e.binding(h)))
                            .links(lambda a, links=links: _linked(a, links, bindings))
                            .verb(verb).adjacency(a_).property_values(JSON.dumps(values)))
                        index += 1
    return made


def _linked(adjacency: Any, links: dict[str, str], bindings: dict[str, Any]) -> Any:
    """An entry change's other links, each inserted by its name, to the binding of its symbol."""
    for link, symbol in links.items():
        adjacency.insert(lambda e, link=link, symbol=symbol: e.link(link).binding(bindings[symbol]))
    return adjacency


def _one(entries: Any, link: str) -> Any:
    """The object one entry links through `link`, or None where there is none."""
    for entry in entries:
        return getattr(entry, link)
    return None


def _store_of(x: Any) -> Any:
    return Proxies.store_of(x)
