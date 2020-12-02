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
    "comma-dangle": ["error", "only-multiline"],
    "no-only-tests/no-only-tests": "error",
    "func-call-spacing": ["error", "always"],
    "no-multi-spaces": ["error", { "ignoreEOLComments": true }],
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error",
    "func-call-spacing": ["error", "always", {"allowNewlines": true}],
    "no-unexpected-multiline": ["off"],
    "indent": ["off"],
    "operator-linebreak": ["error", "after"]
  },
  "env": {
    "jest/globals": true
  }
}
