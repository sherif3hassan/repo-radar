import reactHooks from 'eslint-plugin-react-hooks'

export default [
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
]