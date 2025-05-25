import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";

export default tseslint.config({
  extends: [
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
  ],
  files: ["**/*.ts"],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.node,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: { tsdoc },
  rules: {
    "tsdoc/syntax": "warn",
    "@typescript-eslint/restrict-template-expressions": [
      "warn",
      { allowNumber: true },
    ],
    "@typescript-eslint/no-empty-function": [
      "warn",
      { allow: ["arrowFunctions"] },
    ],
  },
});
