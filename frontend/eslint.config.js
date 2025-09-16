import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierPlugin from "eslint-plugin-prettier";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "@typescript-eslint": tsPlugin,
      prettier: prettierPlugin,
      "react-refresh": pluginReactRefresh,
    },
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, ...globals.node },
      sourceType: "module",
    },
    extends: [
      js.configs.recommended,
      pluginReact.configs.flat.recommended,
      pluginReactHooks.configs.recommended,
      "@typescript-eslint/recommended",
      prettierPlugin.configs.recommended,
      pluginReactRefresh.configs.recommended,
    ],
    rules: {
      "prettier/prettier": "error",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
]);