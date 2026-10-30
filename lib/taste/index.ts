import { createMockProvider } from "./mockProvider";
import { createQlooProvider } from "./qlooProvider";
import { TasteProviderError, type TasteProvider } from "./types";

export type { TasteProvider } from "./types";

type Env = Record<string, string | undefined>;

/** Picks the provider from TASTE_PROVIDER. The only place that knows which one is active. */
export function getTasteProvider(env: Env = process.env): TasteProvider {
  const choice = (env.TASTE_PROVIDER ?? "mock").trim().toLowerCase();
  if (choice === "mock") return createMockProvider();
  if (choice === "qloo") {
    if (!env.QLOO_API_KEY) {
      throw new TasteProviderError("TASTE_PROVIDER=qloo needs QLOO_API_KEY to be set");
    }
    return createQlooProvider({
      apiKey: env.QLOO_API_KEY,
      host: env.QLOO_API_HOST ?? "https://hackathon.api.qloo.com",
    });
  }
  throw new TasteProviderError(`Unknown TASTE_PROVIDER "${env.TASTE_PROVIDER}" (use mock or qloo)`);
}
