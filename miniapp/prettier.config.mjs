import sortImportsPlugin from '@trivago/prettier-plugin-sort-imports';

export default {
  printWidth: 100,
  tabWidth: 2,
  trailingComma: 'all',
  arrowParens: 'always',
  singleQuote: true,
  semi: true,
  plugins: [sortImportsPlugin],
  importOrder: [
    '^(?!.*css$)react.*$',
    '^(?!.*css$)[@a-z].*$',
    '^(?!.*css$)[^./].+$',
    '^(?!.*css$)\\.\\./.*$',
    '^(?!.*css$)\\./.*$',
    'css$',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  overrides: [
    {
      files: ['*.json', '*.md', '*.css', '*.yml', '*.yaml'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
