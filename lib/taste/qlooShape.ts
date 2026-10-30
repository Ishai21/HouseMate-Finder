import { TasteProviderError, type TasteEntity } from "./types";

// Raw Qloo entity, as returned under results.entities by /search and /v2/insights.
// The mock stores its data in this shape and parses it with the same code the
// real provider uses, so the two cannot drift apart.
export interface QlooEntity {
  name: string;
  entity_id: string;
  type: string;
  subtype: string;
  properties?: Record<string, unknown>;
  tags: { id: string; name: string }[];
  query?: { affinity?: number };
}

export interface QlooEntitiesResponse {
  success: boolean;
  results: { entities: QlooEntity[] };
}

function isTag(t: unknown): t is { id: string; name: string } {
  if (typeof t !== "object" || t === null) return false;
  const { id, name } = t as Record<string, unknown>;
  return typeof id === "string" && id.startsWith("urn:tag:") && typeof name === "string";
}

export function parseQlooEntity(raw: unknown): QlooEntity {
  if (typeof raw !== "object" || raw === null) {
    throw new TasteProviderError("Qloo entity is not an object");
  }
  const e = raw as Record<string, unknown>;
  if (typeof e.entity_id !== "string" || e.entity_id === "") {
    throw new TasteProviderError(`Qloo entity is missing entity_id: ${JSON.stringify(raw).slice(0, 120)}`);
  }
  if (typeof e.name !== "string" || typeof e.subtype !== "string" || !e.subtype.startsWith("urn:entity:")) {
    throw new TasteProviderError(`Qloo entity ${e.entity_id} has a bad name or subtype`);
  }
  const tags = Array.isArray(e.tags) ? e.tags.filter(isTag) : [];
  return {
    name: e.name,
    entity_id: e.entity_id,
    type: typeof e.type === "string" ? e.type : "urn:entity",
    subtype: e.subtype,
    properties: (e.properties as Record<string, unknown>) ?? {},
    tags: tags.map(({ id, name }) => ({ id, name })),
    query: e.query as QlooEntity["query"],
  };
}

export function parseEntitiesResponse(raw: unknown): QlooEntity[] {
  const body = raw as Partial<QlooEntitiesResponse> | null;
  if (!body || body.success === false || !Array.isArray(body.results?.entities)) {
    throw new TasteProviderError("Unexpected Qloo response: no results.entities array");
  }
  return body.results.entities.map(parseQlooEntity);
}

export function toTasteEntity(e: QlooEntity): TasteEntity {
  return { id: e.entity_id, name: e.name, type: e.subtype };
}

/** Case-, accent- and whitespace-insensitive key for matching typed names. */
export function normaliseName(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
}
