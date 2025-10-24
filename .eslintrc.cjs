module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  ignorePatterns: ["dist", "node_modules", ".next", "coverage"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off"
  }
};
