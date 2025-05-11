import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier, { rules } from '@electron-toolkit/eslint-config-prettier'

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
  }
)
