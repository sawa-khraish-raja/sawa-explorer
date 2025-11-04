// @ts-check

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
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

  // Base ESLint recommended config
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],

    plugins: {
      'import-x': importPlugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },

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

    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx'],
        },
      },
    },

    rules: {
      // ===== Import Rules =====
      'import-x/order': 'off',
      'import-x/no-duplicates': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-named-as-default': 'warn',
      'import-x/no-named-as-default-member': 'warn',

      // ===== Unused Imports =====
      'no-unused-vars': 'off', // Turned off in favor of unused-imports
      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',

      // ===== React Rules =====
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Not using PropTypes
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/no-unknown-property': 'off',
      'react/no-children-prop': 'off',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'off',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'warn',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-no-useless-fragment': 'off',

      // ===== React Hooks Rules =====
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // ===== React Refresh (for Vite HMR) =====
      'react-refresh/only-export-components': 'off',

      // ===== General JavaScript Rules =====
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-alert': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',
      'require-await': 'off',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      'prefer-template': 'warn',
      'no-useless-concat': 'warn',
      'no-lonely-if': 'warn',
      'prefer-object-spread': 'warn',
      'no-nested-ternary': 'off',
      'no-unneeded-ternary': 'warn',
      'no-else-return': 'warn',
      curly: ['warn', 'all'],
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },

  {
    // Rules for server files (if you have any)
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
      ...js.configs.recommended.rules,
      'no-console': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-unused-vars': 'off',
    },
  },

  // Prettier config (must be last to override other formatting rules)
  eslintConfigPrettier,
];
