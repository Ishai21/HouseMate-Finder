import { describe, expect, it } from "vitest";
import profiles from "@/data/profiles.json";
import { createMockProvider } from "@/lib/taste/mockProvider";
import { TasteProviderError, type TasteProvider } from "@/lib/taste/types";
import type { Profile } from "@/lib/types";
import { runTasteProviderContract } from "./providerContract";

runTasteProviderContract("mock", () => createMockProvider());

const seed = profiles as Profile[];

function allFavourites(p: Profile): string[] {
  return [...p.favourites.film, ...p.favourites.music, ...p.favourites.food, ...p.favourites.places];
}

async function ids(provider: TasteProvider, names: string[]) {
  return (await provider.resolveEntities(names)).resolved.map((e) => e.id);
}

function byId(id: string): Profile {
  const p = seed.find((x) => x.id === id);
  if (!p) throw new Error(`seed profile ${id} missing`);
  return p;
}

describe("mock provider specifics", () => {
  it("returns entities and tags copied from the Qloo response shape", async () => {
    const p = createMockProvider();
    const { resolved } = await p.resolveEntities(["Interstellar"]);
    // Real-looking Qloo entity ids are uppercase UUIDs.
    expect(resolved[0].id).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/);
  });

  it("weights a tag by the share of favourites that carry it", async () => {
    const p = createMockProvider({
      graph: {
        entities: [
          entity("A", "urn:entity:movie", ["urn:tag:x", "urn:tag:y"]),
          entity("B", "urn:entity:movie", ["urn:tag:x"]),
        ],
      },
    });
    const tags = await p.getTasteTags(["ID-A", "ID-B"]);
    expect(tags).toEqual([
      { id: "urn:tag:x", name: "urn:tag:x", weight: 1 },
      { id: "urn:tag:y", name: "urn:tag:y", weight: 0.5 },
    ]);
  });

  it("ignores unknown entity ids when building tags", async () => {
    const p = createMockProvider();
    const known = await ids(p, ["Interstellar"]);
    expect(await p.getTasteTags([...known, "NOT-AN-ID"])).toEqual(await p.getTasteTags(known));
  });

  it("is symmetric and scores identical sets as 1", async () => {
    const p = createMockProvider();
    const a = await ids(p, ["Interstellar", "Radiohead"]);
    const b = await ids(p, ["Arrival", "Bon Iver"]);
    expect((await p.compare(a, b)).score).toBeCloseTo((await p.compare(b, a)).score, 10);
    expect((await p.compare(a, a)).score).toBeCloseTo(1, 10);
  });

  it("rejects non-string names with a TasteProviderError", async () => {
    const p = createMockProvider();
    await expect(p.resolveEntities([42 as unknown as string])).rejects.toBeInstanceOf(TasteProviderError);
  });

  it("rejects a malformed graph at construction", () => {
    expect(() => createMockProvider({ graph: { entities: [{ name: "x" }] } as never })).toThrow(TasteProviderError);
  });
});

describe("hero demo case", () => {
  // Maya and Theo share no favourites, but their tastes overlap through Qloo-style
  // tags. An LLM matching on names alone would miss them; the taste graph does not.
  it("seed hero pair shares zero favourites", () => {
    const maya = allFavourites(byId("maya")).map((n) => n.toLowerCase());
    const theo = allFavourites(byId("theo")).map((n) => n.toLowerCase());
    expect(maya.filter((n) => theo.includes(n))).toEqual([]);
  });

  it("hero pair is a strong taste match with shared tags and no shared entities", async () => {
    const p = createMockProvider();
    const r = await p.compare(await ids(p, allFavourites(byId("maya"))), await ids(p, allFavourites(byId("theo"))));
    expect(r.sharedEntities).toEqual([]);
    expect(r.sharedTags.length).toBeGreaterThanOrEqual(5);
    expect(r.score).toBeGreaterThanOrEqual(0.6);
  });

  it("hero pair beats a contrasting control pair by a wide margin", async () => {
    const p = createMockProvider();
    const maya = await ids(p, allFavourites(byId("maya")));
    const hero = await p.compare(maya, await ids(p, allFavourites(byId("theo"))));
    const control = await p.compare(maya, await ids(p, allFavourites(byId("jordan"))));
    expect(control.score).toBeLessThan(0.25);
    expect(hero.score - control.score).toBeGreaterThan(0.4);
  });
});

function entity(id: string, subtype: string, tagIds: string[]) {
  return {
    name: id,
    entity_id: `ID-${id}`,
    type: "urn:entity",
    subtype,
    properties: {},
    tags: tagIds.map((t) => ({ id: t, name: t })),
  };
}
