import { describe, expect, it } from "vitest";
import type { TasteProvider } from "@/lib/taste/types";

// Shared contract suite. Every TasteProvider (mock and real Qloo) must pass it,
// so swapping TASTE_PROVIDER is proven safe. Fixture names are real-world titles
// so the same suite works against the live Qloo API.
export const KNOWN_FILM = "Interstellar";
export const KNOWN_ARTIST = "Radiohead";
export const UNKNOWN_NAME = "zzqxv not a real thing 8121";

const ENTITY_TYPE = /^urn:entity:[a-z_]+$/;
const TAG_ID = /^urn:tag:/;

export function runTasteProviderContract(
  label: string,
  makeProvider: () => TasteProvider,
) {
  describe(`TasteProvider contract: ${label}`, () => {
    describe("resolveEntities", () => {
      it("resolves known names to entities with id, name and urn type", async () => {
        const p = makeProvider();
        const { resolved, unresolved } = await p.resolveEntities([KNOWN_FILM, KNOWN_ARTIST]);
        expect(unresolved).toEqual([]);
        expect(resolved).toHaveLength(2);
        for (const e of resolved) {
          expect(e.id).toEqual(expect.any(String));
          expect(e.id.length).toBeGreaterThan(0);
          expect(e.name).toEqual(expect.any(String));
          expect(e.type).toMatch(ENTITY_TYPE);
        }
        expect(resolved[0].name.toLowerCase()).toContain("interstellar");
        expect(resolved[0].type).toBe("urn:entity:movie");
        expect(resolved[1].type).toBe("urn:entity:artist");
      });

      it("keeps the input order and matches names case-insensitively, ignoring extra spaces", async () => {
        const p = makeProvider();
        const { resolved } = await p.resolveEntities(["  radiohead ", "INTERSTELLAR"]);
        expect(resolved.map((e) => e.type)).toEqual(["urn:entity:artist", "urn:entity:movie"]);
      });

      it("reports names it cannot resolve instead of throwing", async () => {
        const p = makeProvider();
        const { resolved, unresolved } = await p.resolveEntities([KNOWN_FILM, UNKNOWN_NAME]);
        expect(resolved).toHaveLength(1);
        expect(unresolved).toEqual([UNKNOWN_NAME]);
      });

      it("returns empty results for an empty list or blank names", async () => {
        const p = makeProvider();
        expect(await p.resolveEntities([])).toEqual({ resolved: [], unresolved: [] });
        expect(await p.resolveEntities(["", "   "])).toEqual({ resolved: [], unresolved: [] });
      });

      it("does not return the same entity twice for duplicate names", async () => {
        const p = makeProvider();
        const { resolved } = await p.resolveEntities([KNOWN_FILM, "interstellar"]);
        expect(resolved).toHaveLength(1);
      });
    });

    describe("getTasteTags", () => {
      it("returns urn tags with weights in (0, 1], strongest first", async () => {
        const p = makeProvider();
        const { resolved } = await p.resolveEntities([KNOWN_FILM, KNOWN_ARTIST]);
        const tags = await p.getTasteTags(resolved.map((e) => e.id));
        expect(tags.length).toBeGreaterThan(0);
        for (const t of tags) {
          expect(t.id).toMatch(TAG_ID);
          expect(t.name).toEqual(expect.any(String));
          expect(t.weight).toBeGreaterThan(0);
          expect(t.weight).toBeLessThanOrEqual(1);
        }
        const weights = tags.map((t) => t.weight);
        expect(weights).toEqual([...weights].sort((a, b) => b - a));
        expect(new Set(tags.map((t) => t.id)).size).toBe(tags.length);
      });

      it("returns no tags for no entities", async () => {
        const p = makeProvider();
        expect(await p.getTasteTags([])).toEqual([]);
      });
    });

    describe("compare", () => {
      it("returns a score in [0, 1] with urn shared tags", async () => {
        const p = makeProvider();
        const a = await p.resolveEntities([KNOWN_FILM]);
        const b = await p.resolveEntities([KNOWN_ARTIST]);
        const result = await p.compare(
          a.resolved.map((e) => e.id),
          b.resolved.map((e) => e.id),
        );
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
        for (const t of result.sharedTags) expect(t.id).toMatch(TAG_ID);
        expect(Array.isArray(result.sharedEntities)).toBe(true);
      });

      it("rates a set as at least as similar to itself as to another set", async () => {
        const p = makeProvider();
        const a = (await p.resolveEntities([KNOWN_FILM])).resolved.map((e) => e.id);
        const b = (await p.resolveEntities([KNOWN_ARTIST])).resolved.map((e) => e.id);
        const self = await p.compare(a, a);
        const other = await p.compare(a, b);
        expect(self.score).toBeGreaterThanOrEqual(other.score);
        expect(self.sharedEntities.map((e) => e.id)).toEqual(a);
      });

      it("scores 0 with nothing shared when either side is empty", async () => {
        const p = makeProvider();
        const a = (await p.resolveEntities([KNOWN_FILM])).resolved.map((e) => e.id);
        for (const [x, y] of [[a, []], [[], a], [[], []]] as const) {
          const r = await p.compare([...x], [...y]);
          expect(r).toEqual({ score: 0, sharedTags: [], sharedEntities: [] });
        }
      });
    });
  });
}
