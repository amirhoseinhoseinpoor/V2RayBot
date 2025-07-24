import antfu from "@antfu/eslint-config"

export default antfu(
  {
    stylistic: {
      indent: 2,
      quotes: "double",
    },
  },
  {
    files: ["**/*.js", "**/*.ts"],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:security/recommended",
    ],
    rules: {
      "node/prefer-global/process": "off",
      "no-console": "off",
      "antfu/no-top-level-await": "off",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
)
