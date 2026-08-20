module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
      extends: ['plugin:@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
      rules: {
        'react/prop-types': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: [
        'src/allocations-map/Legend.tsx',
        'src/components/ui/*.tsx',
        'src/lib/*.tsx',
        'src/main.jsx',
        'src/projects-browser/Publication.tsx',
        'src/publications/PublicationCitation.tsx',
        'src/publications/PublicationForm.tsx',
        'src/supporting-grants/index.tsx',
      ],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['vite.config.js', 'vitest.config.ts'],
      env: { node: true },
    },
  ],
}
