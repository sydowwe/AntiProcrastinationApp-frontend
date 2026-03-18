import {useTheme} from 'vuetify/framework';
import {computed} from 'vue';

export interface ColorOption {
	name: string
	label: string
	dark: { bg: string; text: string }
	light: { bg: string; text: string }
}

// dark.bg   — AA with white text (shade 700 or 900 for deep variants)
// dark.text  — AA on #202020 surface (shade 300–400)
// light.bg   — AA with dark text (shade 100–200)
// light.text — AA on #EEE surface (shade 700–900)
export const COLOR_PALETTE: ColorOption[] = [
	// ── Reds ──────────────────────────────────────────────────────────────
	{
		name: 'crimson', label: 'Crimson',
		dark:  {bg: '#7F1D1D', text: '#FCA5A5'},
		light: {bg: '#FEE2E2', text: '#7F1D1D'},
	},
	{
		name: 'red', label: 'Red',
		dark:  {bg: '#B91C1C', text: '#F87171'},
		light: {bg: '#FECACA', text: '#B91C1C'},
	},
	{
		name: 'rose', label: 'Rose',
		dark:  {bg: '#BE123C', text: '#FB7185'},
		light: {bg: '#FECDD3', text: '#BE123C'},
	},
	{
		name: 'burgundy', label: 'Burgundy',
		dark:  {bg: '#881337', text: '#FDA4AF'},
		light: {bg: '#FFE4E6', text: '#881337'},
	},
	// ── Pinks & Purples ───────────────────────────────────────────────────
	{
		name: 'pink', label: 'Pink',
		dark:  {bg: '#BE185D', text: '#F472B6'},
		light: {bg: '#FBCFE8', text: '#BE185D'},
	},
	{
		name: 'fuchsia', label: 'Fuchsia',
		dark:  {bg: '#A21CAF', text: '#E879F9'},
		light: {bg: '#F5D0FE', text: '#A21CAF'},
	},
	{
		name: 'purple', label: 'Purple',
		dark:  {bg: '#7E22CE', text: '#C084FC'},
		light: {bg: '#E9D5FF', text: '#7E22CE'},
	},
	{
		name: 'grape', label: 'Grape',
		dark:  {bg: '#581C87', text: '#D8B4FE'},
		light: {bg: '#F3E8FF', text: '#581C87'},
	},
	{
		name: 'violet', label: 'Violet',
		dark:  {bg: '#6D28D9', text: '#A78BFA'},
		light: {bg: '#DDD6FE', text: '#6D28D9'},
	},
	// ── Blues ─────────────────────────────────────────────────────────────
	{
		name: 'indigo', label: 'Indigo',
		dark:  {bg: '#4338CA', text: '#818CF8'},
		light: {bg: '#C7D2FE', text: '#4338CA'},
	},
	{
		name: 'blue', label: 'Blue',
		dark:  {bg: '#1D4ED8', text: '#60A5FA'},
		light: {bg: '#BFDBFE', text: '#1D4ED8'},
	},
	{
		name: 'navy', label: 'Navy',
		dark:  {bg: '#1E3A8A', text: '#93C5FD'},
		light: {bg: '#DBEAFE', text: '#1E3A8A'},
	},
	{
		name: 'sky', label: 'Sky',
		dark:  {bg: '#0369A1', text: '#38BDF8'},
		light: {bg: '#BAE6FD', text: '#0369A1'},
	},
	// ── Cyans & Teals ─────────────────────────────────────────────────────
	{
		name: 'cyan', label: 'Cyan',
		dark:  {bg: '#0E7490', text: '#22D3EE'},
		light: {bg: '#A5F3FC', text: '#0E7490'},
	},
	{
		name: 'teal', label: 'Teal',
		dark:  {bg: '#0F766E', text: '#2DD4BF'},
		light: {bg: '#99F6E4', text: '#0F766E'},
	},
	{
		name: 'ocean', label: 'Ocean',
		dark:  {bg: '#134E4A', text: '#5EEAD4'},
		light: {bg: '#CCFBF1', text: '#134E4A'},
	},
	// ── Greens ────────────────────────────────────────────────────────────
	{
		name: 'emerald', label: 'Emerald',
		dark:  {bg: '#047857', text: '#34D399'},
		light: {bg: '#A7F3D0', text: '#047857'},
	},
	{
		name: 'green', label: 'Green',
		dark:  {bg: '#15803D', text: '#4ADE80'},
		light: {bg: '#BBF7D0', text: '#15803D'},
	},
	{
		name: 'forest', label: 'Forest',
		dark:  {bg: '#14532D', text: '#86EFAC'},
		light: {bg: '#DCFCE7', text: '#14532D'},
	},
	{
		name: 'lime', label: 'Lime',
		dark:  {bg: '#4D7C0F', text: '#A3E635'},
		light: {bg: '#D9F99D', text: '#3F6212'},
	},
	{
		name: 'olive', label: 'Olive',
		dark:  {bg: '#365314', text: '#BEF264'},
		light: {bg: '#ECFCCB', text: '#365314'},
	},
	// ── Yellows & Oranges ─────────────────────────────────────────────────
	{
		name: 'yellow', label: 'Yellow',
		dark:  {bg: '#A16207', text: '#FACC15'},
		light: {bg: '#FEF08A', text: '#854D0E'},
	},
	{
		name: 'amber', label: 'Amber',
		dark:  {bg: '#B45309', text: '#FBBF24'},
		light: {bg: '#FDE68A', text: '#92400E'},
	},
	{
		name: 'gold', label: 'Gold',
		dark:  {bg: '#78350F', text: '#FCD34D'},
		light: {bg: '#FEF3C7', text: '#78350F'},
	},
	{
		name: 'orange', label: 'Orange',
		dark:  {bg: '#C2410C', text: '#FB923C'},
		light: {bg: '#FED7AA', text: '#C2410C'},
	},
	{
		name: 'brown', label: 'Brown',
		dark:  {bg: '#7C2D12', text: '#FDBA74'},
		light: {bg: '#FFEDD5', text: '#7C2D12'},
	},
	// ── Grays ─────────────────────────────────────────────────────────────
	{
		name: 'stone', label: 'Stone',
		dark:  {bg: '#44403C', text: '#A8A29E'},
		light: {bg: '#E7E5E4', text: '#44403C'},
	},
	{
		name: 'zinc', label: 'Zinc',
		dark:  {bg: '#3F3F46', text: '#A1A1AA'},
		light: {bg: '#E4E4E7', text: '#3F3F46'},
	},
	{
		name: 'slate', label: 'Slate',
		dark:  {bg: '#334155', text: '#94A3B8'},
		light: {bg: '#E2E8F0', text: '#334155'},
	},
] as const

export function resolveColor(name: string | null | undefined, theme: 'dark' | 'light', usage: 'bg' | 'text'): string | undefined {
	if (!name) return undefined
	return COLOR_PALETTE.find(c => c.name === name)?.[theme][usage]
}

export function useColor() {
	const theme = useTheme();
	const themeName = computed(() => theme.global.current.value.dark ? 'dark' : 'light');

	function getBgColor(colorName: string | null | undefined): string {
		return resolveColor(colorName, themeName.value, 'bg') ?? 'neutral-300'
	}

	function getTextColor(colorName: string | null | undefined): string | undefined {
		return resolveColor(colorName, themeName.value, 'text')
	}

	return {getBgColor, getTextColor}
}