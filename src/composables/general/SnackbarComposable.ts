import {readonly, ref} from 'vue'
import {useLoading} from './LoadingComposable'

export interface ErrorSnackBarConfig {
	timeout?: number
	closable?: boolean
	dontHideFullScreenLoading?: boolean
}

export interface SnackBarConfig extends ErrorSnackBarConfig {
	color?: string
	actionLabel?: string
	actionCallback?: () => void
}

const snackbar = ref(false)
const color = ref('primary')
const message = ref('Done')
const timeout = ref(3000)
const closable = ref(false)
const actionLabel = ref<string | null>(null)
const actionCallback = ref<(() => void) | null>(null)

export const useSnackbar = () => {
	const {hideFullScreenLoading} = useLoading()

	const showErrorSnackbar = (customMessage: string, config?: ErrorSnackBarConfig) => {
		showSnackbar(customMessage || 'Error', {
			...config,
			color: 'errorDark',
			closable: config?.closable || false
		})
	}

	const showSuccessSnackbar = (customMessage: string, config?: ErrorSnackBarConfig) => {
		showSnackbar(customMessage || 'Success', {
			...config,
			color: 'successDark',
			closable: config?.closable || true
		})
	}

	const showSnackbar = (customMessage?: string, config?: SnackBarConfig) => {
		if (!config?.dontHideFullScreenLoading) {
			hideFullScreenLoading()
		}
		snackbar.value = false
		message.value = customMessage || message.value
		timeout.value = config?.timeout ?? 3000
		color.value = config?.color || color.value
		closable.value = config?.closable || true
		actionLabel.value = config?.actionLabel ?? null
		actionCallback.value = config?.actionCallback ?? null
		snackbar.value = true
	}


	const hideSnackbar = () => {
		snackbar.value = false
	}

	return {
		snackbar: snackbar,
		color: readonly(color),
		message: readonly(message),
		timeout: readonly(timeout),
		closable: readonly(closable),
		actionLabel: readonly(actionLabel),
		actionCallback: readonly(actionCallback),
		showErrorSnackbar,
		showSuccessSnackbar,
		showSnackbar,
		hideSnackbar
	}
}