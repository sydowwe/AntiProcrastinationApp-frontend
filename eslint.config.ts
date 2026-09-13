import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import vuePrettierConfig from '@vue/eslint-config-prettier'
// Pinned to the v3 line: v4 requires `vue-eslint-parser@^10`, and this repo is on 9.4.3 via
// `@vue/eslint-config-typescript@14.7.0` → `eslint-plugin-vue@9`. v3 ships no type declarations
// (v4 does), hence the suppression — when the toolchain moves to v4, this line starts failing as an
// *unused* expect-error, which is the reminder to delete it.
// @ts-expect-error -- no bundled types on the v3 line
import vueI18n from '@intlify/eslint-plugin-vue-i18n'

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

	// Hardcoded user-facing strings. This is a *static* check on purpose: an un-localized literal is
	// invisible in the language it was hardcoded in, so an English browser pass cannot tell a fixed
	// string from a broken one — only a Slovak one can, and a locale sweep per unit is far more
	// expensive than a lint rule. It earns its keep: the first run found five hardcoded strings in
	// `todoList`, a module two browser passes had already swept, because the drag-and-drop
	// placeholders only render mid-drag and nobody was dragging.
	//
	// `attributes` is the half that matters most here — `label="Length in days"` is the shape every
	// i18n finding so far has taken. `/.+/` means "on any element".
	{
		files: ['src/**/*.vue'],
		plugins: { '@intlify/vue-i18n': vueI18n },
		rules: {
			'@intlify/vue-i18n/no-raw-text': [
				'error',
				{
					attributes: {
						'/.+/': ['label', 'title', 'hint', 'placeholder', 'text', 'subtitle', 'confirmBtnLabel'],
					},
					// Punctuation, separators, digits and one/two-letter unit suffixes (`d`, `h`, `m`)
					// are not translatable text and read the same in both locales.
					ignorePattern: '^[-–—·/|:%#*+@.,()\\[\\]{}~\\d\\s]*$|^[a-z]{1,2}$',
				},
			],
		},
	},

	vuePrettierConfig,
)
