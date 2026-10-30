import { describe, expect, it } from "vitest";
import profiles from "@/data/profiles.json";
import graph from "@/data/taste-graph.json";
import { createMockProvider } from "@/lib/taste/mockProvider";
import type { Profile } from "@/lib/types";

const seed = profiles as Profile[];

describe("seed profiles", () => {
  it("has enough profiles to demo matching", () => {
    expect(seed.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique ids", () => {
    expect(new Set(seed.map((p) => p.id)).size).toBe(seed.length);
  });

  it("gives every profile all lifestyle fields and favourite categories", () => {
    for (const p of seed) {
      expect(p.name, p.id).toEqual(expect.any(String));
      expect(typeof p.placed, p.id).toBe("boolean");
      expect(Object.keys(p.lifestyle).sort(), p.id).toEqual(
        ["budget", "cleanliness", "guests", "noise", "pets", "sleep", "smoking"].sort(),
      );
      for (const key of ["film", "music", "food", "places"] as const) {
        expect(Array.isArray(p.favourites[key]), `${p.id}.${key}`).toBe(true);
      }
    }
  });

  it("only uses favourites the mock taste graph can resolve", async () => {
    const provider = createMockProvider();
    for (const p of seed) {
      const names = Object.values(p.favourites).flat();
      const { unresolved } = await provider.resolveEntities(names);
      expect(unresolved, p.id).toEqual([]);
    }
  });

  it("includes at least one already-placed profile for filter tests", () => {
    expect(seed.some((p) => p.placed)).toBe(true);
  });
});

describe("mock taste graph", () => {
  it("uses unique uppercase UUID entity ids and urn tags", () => {
    const ids = graph.entities.map((e) => e.entity_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of graph.entities) {
      expect(e.entity_id).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/);
      expect(e.type).toBe("urn:entity");
      expect(e.subtype).toMatch(/^urn:entity:[a-z_]+$/);
      expect(e.tags.length).toBeGreaterThan(0);
      for (const t of e.tags) expect(t.id).toMatch(/^urn:tag:/);
    }
  });

  it("has unique entity names", () => {
    const names = graph.entities.map((e) => e.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
});
