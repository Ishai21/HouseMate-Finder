/*
 * QLOO HACKATHON API REFERENCE
 * Source: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
 *
 * Base URL:  https://hackathon.api.qloo.com
 * Auth:      header X-Api-Key: <QLOO_API_KEY>   (not Bearer, not a query param)
 * Method:    GET only, parameters in the query string (POST with JSON body fails)
 * Key:       arrives by email after registration; server-side only, never in the browser
 * Do NOT use: /recs or /recommendations (legacy, unsupported)
 *
 * resolveEntities(names)  ->  GET /search?query=<name>
 *     Turns "Interstellar" into a Qloo entity_id. One call per favourite.
 *
 * getTasteTags(ids)       ->  GET /v2/insights?filter.type=urn:tag
 *                                 &signal.interests.entities=<id1>,<id2>
 *     Tags most associated with a person's favourites.
 *
 * findTags(keyword)       ->  GET /v2/tags?filter.query=<keyword>&take=<n>
 *     Keyword to tag URN, e.g. acoustic -> urn:tag:genre:music:acoustic
 *
 * related(ids, type)      ->  GET /v2/insights?filter.type=urn:entity:<movie|artist|place|...>
 *                                 &signal.interests.entities=<ids>&take=<n>
 *     Related entities ranked by results.entities[].query.affinity (cold start).
 *     Optional: feature.explainability=true to get why an item matched.
 *
 * compare(idsA, idsB)     ->  GET /v2/insights/compare  (Analysis Compare)
 *     Exact params and response fields NOT confirmed. Probe first, save raw JSON
 *     to data/qloo-samples/compare.json, then implement.
 *
 * Errors: 403 "You do not have permission to access urn:entity:..." = that entity
 * type is not enabled for the key. Retry once on 429 and 5xx. Cache every response.
 */
import { TasteProviderError, type TasteProvider } from "./types";

export interface QlooProviderOptions {
  apiKey: string;
  host: string;
}

// Real calls are written once the key arrives and each endpoint has been probed
// (raw responses saved to data/qloo-samples/). Until then every method refuses.
export function createQlooProvider(options: QlooProviderOptions): TasteProvider {
  if (!options.apiKey) throw new TasteProviderError("QLOO_API_KEY is required for the qloo provider");
  const notYet = (method: string) =>
    Promise.reject(new TasteProviderError(`qlooProvider.${method} is not implemented yet`));

  return {
    name: "qloo",
    // GET /search?query=<name>
    resolveEntities: () => notYet("resolveEntities"),
    // GET /v2/insights?filter.type=urn:tag&signal.interests.entities=<ids>
    getTasteTags: () => notYet("getTasteTags"),
    // GET /v2/insights/compare
    compare: () => notYet("compare"),
  };
}
