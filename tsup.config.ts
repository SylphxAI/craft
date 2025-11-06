import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
});
