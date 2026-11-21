import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Tests unitaires du front (npm test).
 * Convention : chaque fichier de test est placé à côté du fichier testé, sous le nom *.test.ts(x).
 */
export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json : import ... from "@/lib/api"
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
