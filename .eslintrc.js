module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "standard",
    "plugin:flowtype/recommended"
  ],
  "plugins": [
    "no-only-tests",
    "flowtype"
  ],
  "rules": {
    "comma-dangle": ["error", "always-multiline"],
    "no-only-tests/no-only-tests": "error",
    "func-call-spacing": ["error", "always"],
    "no-multi-spaces": ["error", { "ignoreEOLComments": true }]
  },
}
