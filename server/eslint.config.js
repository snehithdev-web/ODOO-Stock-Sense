import js from '@eslint/js';
import globals from 'globals';

/**
 * Lint rules for the API.
 *
 * Mirrors the client config so both halves of the project are checked the same
 * way. eslint:recommended is worth having on the server in particular: its
 * no-dupe-keys rule catches a repeated method name in an object literal, where the
 * later one silently wins. The operation service is built from an object of
 * handlers, so a repeated key there would be a live bug rather than a cosmetic
 * one, and it is invisible at runtime until that code path executes.
 */
export default [
  { ignores: ['node_modules/**'] },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Catch a handler that returns nothing, which reads as "worked" to a
      // caller that only checks the absence of a thrown error.
      'no-useless-return': 'error',
      'no-else-return': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
