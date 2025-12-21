module.exports = {
  root: true,
  extends: ["./packages/config/eslint.base.cjs"],
  ignorePatterns: ["dist", ".next", "node_modules"],
  overrides: [
    {
      files: ["apps/web/**/*.{ts,tsx}", "apps/admin/**/*.{ts,tsx}"],
      settings: { next: { rootDir: ["apps/web/", "apps/admin/"] } }
    }
  ]
};
