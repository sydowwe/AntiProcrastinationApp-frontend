import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import vuePrettierConfig from '@vue/eslint-config-prettier'

export default defineConfigWithVueTs(
	// `src/_common` is the vue_framework submodule: a shared repo this app must never write to.
	// Without this ignore, `eslint src --fix` reformats it and leaves the submodule dirty.
	{ ignores: ['dist/**', 'node_modules/**', 'public/**', '*.min.js', 'src/assets/**', 'src/_common/**'] },

	vueTsConfigs.recommended,

	{
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/attribute-hyphenation': ['error', 'never'],
			'vue/v-on-event-hyphenation': ['error', 'never'],
			'vue/component-name-in-template-casing': ['error', 'PascalCase'],
			'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
			'vue/define-macros-order': [
				'error',
				{ order: ['defineProps', 'defineEmits', 'defineModel', 'defineSlots'] },
			],
			'vue/no-unused-refs': 'warn',
			'vue/prop-name-casing': ['error', 'camelCase'],
			'vue/define-emits-declaration': ['error', 'type-based'],
			'vue/define-props-declaration': ['error', 'type-based'],
			'vue/no-v-html': 'warn',
			'vue/no-useless-v-bind': 'error',
			'vue/prefer-true-attribute-shorthand': 'error',
			'vue/prefer-separate-static-class': 'error',
			// `smart` mirrors the `eqeqeq` entry below, so templates and script blocks agree: `===` is
			// required everywhere except `== null`, the null/undefined check CLAUDE.md allows.
			'vue/eqeqeq': ['error', 'smart'],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-unused-expressions': 'warn',
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
			'no-console': ['off', { allow: ['error', 'warn'] }],
			'prefer-const': 'warn',
			eqeqeq: ['error', 'smart'],
		},
	},

	vuePrettierConfig,
)
