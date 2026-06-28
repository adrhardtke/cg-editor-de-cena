module.exports = {
  root: true,
  env: {
    browser: true,
    es2023: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-refresh'],
  rules: {
    // Aviso para componentes não exportados corretamente
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    // Obriga uso consistente de aspas simples
    'quotes': ['error', 'single'],
    // Obriga ponto e vírgula
    'semi': ['error', 'always'],
    // Indentação com 2 espaços
    'indent': ['error', 2],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
