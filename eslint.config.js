const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    ignores: ['node_modules/**', 'frontend/dist/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      camelcase: ['error', { properties: 'never' }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]
