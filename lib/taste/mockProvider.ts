import defaultGraph from "@/data/taste-graph.json";
import { normaliseName, parseEntitiesResponse, toTasteEntity, type QlooEntity } from "./qlooShape";
import { compareProfiles, tagProfile } from "./tasteMath";
import { TasteProviderError, type TasteProvider } from "./types";

export interface MockGraph {
  entities: QlooEntity[];
}

/** Offline TasteProvider backed by data/taste-graph.json, in Qloo's response shape. */
export function createMockProvider(options: { graph?: MockGraph } = {}): TasteProvider {
  const graph = options.graph ?? (defaultGraph as MockGraph);
  // Same parser the real provider uses, so malformed data fails the same way.
  const entities = parseEntitiesResponse({ success: true, results: { entities: graph.entities } });
  const byName = new Map(entities.map((e) => [normaliseName(e.name), e]));
  const byId = new Map(entities.map((e) => [e.entity_id, e]));

  const lookup = (ids: string[]) =>
    [...new Set(ids)].flatMap((id) => {
      const e = byId.get(id);
      return e ? [{ ...toTasteEntity(e), tags: e.tags }] : [];
    });

  return {
    name: "mock",

    async resolveEntities(names) {
      const resolved = new Map<string, ReturnType<typeof toTasteEntity>>();
      const unresolved: string[] = [];
      for (const raw of names) {
        if (typeof raw !== "string") {
          throw new TasteProviderError(`Favourite names must be strings, got ${typeof raw}`);
        }
        const key = normaliseName(raw);
        if (key === "") continue;
        const hit = byName.get(key);
        if (hit) resolved.set(hit.entity_id, toTasteEntity(hit));
        else unresolved.push(raw);
      }
      return { resolved: [...resolved.values()], unresolved };
    },

    async getTasteTags(entityIds) {
      return tagProfile(lookup(entityIds));
    },

    async compare(entityIdsA, entityIdsB) {
      return compareProfiles(lookup(entityIdsA), lookup(entityIdsB));
    },
  };
}
