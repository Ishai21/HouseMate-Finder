import { describe, expect, it } from "vitest";
import { getTasteProvider } from "@/lib/taste";
import { TasteProviderError } from "@/lib/taste/types";

describe("getTasteProvider", () => {
  it("defaults to the mock provider when TASTE_PROVIDER is unset", async () => {
    const p = getTasteProvider({});
    expect(p.name).toBe("mock");
    expect((await p.resolveEntities(["Interstellar"])).resolved).toHaveLength(1);
  });

  it("uses the mock provider for TASTE_PROVIDER=mock", () => {
    expect(getTasteProvider({ TASTE_PROVIDER: "mock" }).name).toBe("mock");
  });

  it("uses the qloo provider for TASTE_PROVIDER=qloo with a key", () => {
    expect(getTasteProvider({ TASTE_PROVIDER: "qloo", QLOO_API_KEY: "k" }).name).toBe("qloo");
  });

  it("refuses TASTE_PROVIDER=qloo without a key", () => {
    expect(() => getTasteProvider({ TASTE_PROVIDER: "qloo" })).toThrow(TasteProviderError);
    expect(() => getTasteProvider({ TASTE_PROVIDER: "qloo" })).toThrow(/QLOO_API_KEY/);
  });

  it("refuses an unknown provider name", () => {
    expect(() => getTasteProvider({ TASTE_PROVIDER: "spotify" })).toThrow(/spotify/);
  });
});
