import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import vuePrettierConfig from '@vue/eslint-config-prettier'

export default defineConfigWithVueTs(
	pluginVue.configs['flat/recommended'],
	vueTsConfigs.recommended,

	{
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/attribute-hyphenation': ['error', 'never'],
			'vue/v-on-event-hyphenation': ['error', 'never'],
			'vue/component-name-in-template-casing': ['error', 'PascalCase'],
			'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
			'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits', 'defineModel', 'defineSlots'] }],
			'vue/no-unused-refs': 'warn',
			'vue/prop-name-casing': ['error', 'camelCase'],
			'vue/define-emits-declaration': ['error', 'type-based'],
			'vue/define-props-declaration': ['error', 'type-based'],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-unused-expressions': 'warn',
			'no-console': 'warn',
			'prefer-const': 'warn',
		},
	},

	vuePrettierConfig,
)
