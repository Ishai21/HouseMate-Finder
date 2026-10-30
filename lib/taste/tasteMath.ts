import type { CompareResult, TasteEntity, TasteTag } from "./types";

type TaggedEntity = TasteEntity & { tags: { id: string; name: string }[] };

/** Weight of a tag = share of the entities that carry it. Strongest first. */
export function tagProfile(entities: TaggedEntity[]): TasteTag[] {
  if (entities.length === 0) return [];
  const counts = new Map<string, { name: string; count: number }>();
  for (const e of entities) {
    for (const t of new Map(e.tags.map((x) => [x.id, x])).values()) {
      const c = counts.get(t.id);
      if (c) c.count += 1;
      else counts.set(t.id, { name: t.name, count: 1 });
    }
  }
  return [...counts]
    .map(([id, { name, count }]) => ({ id, name, weight: count / entities.length }))
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));
}

/**
 * Cosine similarity of two tag profiles. Shared tags carry the weaker of the two
 * weights, so a tag only ranks high when it matters to both people.
 */
export function compareProfiles(a: TaggedEntity[], b: TaggedEntity[]): CompareResult {
  if (a.length === 0 || b.length === 0) return { score: 0, sharedTags: [], sharedEntities: [] };

  const ta = tagProfile(a);
  const tb = new Map(tagProfile(b).map((t) => [t.id, t]));
  let dot = 0;
  const sharedTags: TasteTag[] = [];
  for (const t of ta) {
    const other = tb.get(t.id);
    if (!other) continue;
    dot += t.weight * other.weight;
    sharedTags.push({ id: t.id, name: t.name, weight: Math.min(t.weight, other.weight) });
  }
  const norm = (ts: Iterable<TasteTag>) => Math.sqrt([...ts].reduce((s, t) => s + t.weight ** 2, 0));
  const denom = norm(ta) * norm(tb.values());
  const score = denom === 0 ? 0 : Math.min(1, dot / denom);

  const idsB = new Set(b.map((e) => e.id));
  const sharedEntities = a
    .filter((e) => idsB.has(e.id))
    .map(({ id, name, type }) => ({ id, name, type }));

  sharedTags.sort((x, y) => y.weight - x.weight || x.id.localeCompare(y.id));
  return { score, sharedTags, sharedEntities };
}
