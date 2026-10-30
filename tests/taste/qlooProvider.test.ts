import { describe } from "vitest";
import { createQlooProvider } from "@/lib/taste/qlooProvider";
import { runTasteProviderContract } from "./providerContract";

// Hits the real Qloo API, so it only runs when a key is present.
const apiKey = process.env.QLOO_API_KEY;

describe.skipIf(!apiKey)("qloo provider (live API)", () => {
  runTasteProviderContract("qloo", () =>
    createQlooProvider({
      apiKey: apiKey!,
      host: process.env.QLOO_API_HOST ?? "https://hackathon.api.qloo.com",
    }),
  );
});
