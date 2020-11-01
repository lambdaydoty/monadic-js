module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "standard",
    "plugin:flowtype/recommended"
  ],
  "plugins": [
    "no-only-tests",
    "flowtype",
    "jest"
  ],
  "rules": {
    "comma-dangle": ["error", "always-multiline"],
    "no-only-tests/no-only-tests": "error",
    "func-call-spacing": ["error", "always"],
    "no-multi-spaces": ["error", { "ignoreEOLComments": true }],
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error"
  },
  "env": {
    "jest/globals": true
  }
}
