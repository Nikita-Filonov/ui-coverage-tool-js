import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'submodules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }] } },
  { files: ['tests/fixtures.ts'], rules: { 'no-empty-pattern': 'off' } },
  prettier
);
