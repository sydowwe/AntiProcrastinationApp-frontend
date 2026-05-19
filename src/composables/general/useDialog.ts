import { inject, markRaw, reactive, shallowRef, type Component, type InjectionKey } from 'vue'

export interface DialogProps {
	title?: string
	text?: string
	persistent?: boolean
	eager?: boolean
	hasHeader?: boolean
	hasFooter?: boolean
	hasCloseBtn?: boolean
	closeBtnColor?: string
	closeBtnVariant?: 'text' | 'outlined' | 'tonal'
	closeBtnText?: string
	hasConfirmBtn?: boolean
	confirmBtnLabel?: string
	confirmBtnColor?: string
	confirmBtnDisabled?: boolean
	loading?: boolean
	isSmall?: boolean
}

export interface DialogApi<TResult = unknown> {
	close: (result?: TResult | null) => void
	onConfirm: (handler: () => void | Promise<void>) => void
	setLoading: (loading: boolean) => void
	setDialogProps: (patch: Partial<DialogProps>) => void
}

export const DIALOG_API_KEY: InjectionKey<DialogApi> = Symbol('DialogApi')

export interface DialogEntry {
	id: number
	component: Component | null
	componentProps: Record<string, unknown>
	dialogProps: DialogProps
	open: boolean
	confirmHandler: (() => void | Promise<void>) | null
	resolve: (result: unknown) => void
	resolved: boolean
}

export interface OpenDialogOptions<TProps = Record<string, unknown>> {
	component?: Component
	componentProps?: TProps
	dialogProps?: DialogProps
}

const stack = shallowRef<DialogEntry[]>([])
let nextId = 0
const CLOSE_ANIMATION_MS = 300

function removeEntry(id: number) {
	stack.value = stack.value.filter(e => e.id !== id)
}

function settleEntry(entry: DialogEntry, result: unknown) {
	if (entry.resolved) return
	entry.resolved = true
	entry.resolve(result)
	entry.open = false
	setTimeout(() => removeEntry(entry.id), CLOSE_ANIMATION_MS)
}

export function useDialog() {
	function openDialog<TResult = unknown, TProps = Record<string, unknown>>(
		options: OpenDialogOptions<TProps>,
	): Promise<TResult | null> {
		return new Promise<TResult | null>(resolve => {
			const entry = reactive<DialogEntry>({
				id: ++nextId,
				component: options.component ? markRaw(options.component) : null,
				componentProps: (options.componentProps ?? {}) as Record<string, unknown>,
				dialogProps: { ...options.dialogProps },
				open: true,
				confirmHandler: null,
				resolve: resolve as (v: unknown) => void,
				resolved: false,
			})
			stack.value = [...stack.value, entry]
		})
	}

	function confirm(options: {
		title?: string
		text: string
		confirmBtnLabel?: string
		confirmBtnColor?: string
	}): Promise<boolean> {
		return openDialog<boolean>({
			dialogProps: {
				title: options.title,
				text: options.text,
				confirmBtnLabel: options.confirmBtnLabel,
				confirmBtnColor: options.confirmBtnColor,
				isSmall: true,
			},
		}).then(result => result === true)
	}

	return {
		openDialog,
		confirm,
		_stack: stack,
		_settleEntry: settleEntry,
	}
}

export function useDialogApi<T = unknown>(): DialogApi<T> {
	const api = inject(DIALOG_API_KEY)
	if (!api) {
		throw new Error('useDialogApi() must be called inside a component opened via useDialog().openDialog()')
	}
	return api as DialogApi<T>
}
