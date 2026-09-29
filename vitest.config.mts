import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    passWithNoTests: true,
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
