// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Export the configuration array directly
export default [
  // Add global ignores at the start
  {
    ignores: [
        "fly-backend/**/*" // Ignore everything inside fly-backend
    ]
  },
  // Spread the existing configurations after the ignores
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];