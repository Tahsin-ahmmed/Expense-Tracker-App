// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // Turns off ESLint rules that conflict with Prettier formatting. Must come last.
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*'],
  },
]);
