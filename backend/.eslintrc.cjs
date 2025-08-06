// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // se estiver usando Prettier
  ],
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    // Exemplo: permita props não usados em componentes
    'vue/require-default-prop': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
