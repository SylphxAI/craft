import { defineConfig } from "bunup";

export default defineConfig({
  // Package manager to use
  packageManager: "bun",

  // Dependencies to exclude from updates
  exclude: [],

  // Dependencies to include (if empty, all will be included)
  include: [],

  // Update strategy: "latest" | "minor" | "patch"
  strategy: "latest",

  // Git options
  git: {
    // Create commits for updates
    commit: true,
    // Commit message template
    commitMessage: "chore(deps): update {package} to {version}",
  },
});
