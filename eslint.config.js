// @ts-check

import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    // Ignore patterns
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/vite.config.js',
      '**/tailwind.config.js',
      '**/postcss.config.js',
    ],
  },

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },

    rules: {
      // All rules disabled
    },
  },

  {
    // Rules for server files
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // All rules disabled
    },
  },

  // Prettier config (must be last to override other formatting rules)
  eslintConfigPrettier,
];
