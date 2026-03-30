declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$t: typeof VueI18n.prototype.t
	}
}
