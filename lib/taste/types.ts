// The only taste-data contract the rest of the app may depend on.
// Nothing outside lib/taste knows whether the mock or the real Qloo API is behind it.

export interface TasteEntity {
  id: string;
  name: string;
  /** Qloo entity subtype, e.g. urn:entity:movie */
  type: string;
}

export interface TasteTag {
  /** Qloo tag URN, e.g. urn:tag:genre:media:western */
  id: string;
  name: string;
  /** Relative strength for this set of favourites, in (0, 1] */
  weight: number;
}

export interface ResolveResult {
  /** In input order, without duplicates */
  resolved: TasteEntity[];
  /** Input names that matched nothing, as typed */
  unresolved: string[];
}

export interface CompareResult {
  /** Taste similarity in [0, 1] */
  score: number;
  sharedTags: TasteTag[];
  sharedEntities: TasteEntity[];
}

export interface TasteProvider {
  readonly name: "mock" | "qloo";
  resolveEntities(names: string[]): Promise<ResolveResult>;
  getTasteTags(entityIds: string[]): Promise<TasteTag[]>;
  compare(entityIdsA: string[], entityIdsB: string[]): Promise<CompareResult>;
}

export class TasteProviderError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TasteProviderError";
  }
}
