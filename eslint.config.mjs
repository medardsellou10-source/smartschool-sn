import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler rules — disabled, project does not use React Compiler
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-render": "off",

      // Too strict for a codebase that uses Supabase dynamic queries
      "@typescript-eslint/no-explicit-any": "off",

      // Use <img> is acceptable here (Next Image requires fixed dimensions)
      "@next/next/no-img-element": "off",

      // Unused vars — warn only, don't fail build
      "@typescript-eslint/no-unused-vars": "warn",

      // Allow require() imports (used in server actions)
      "@typescript-eslint/no-require-imports": "off",

      // HTML entities in JSX
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
