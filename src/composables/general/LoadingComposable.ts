import {readonly, ref} from 'vue'

const fullScreenLoading = ref(false)
const axiosSuccessLoadingHide = ref(true)

export const useLoading = () => {
	const showFullScreenLoading = () => {
		if (!fullScreenLoading.value) {
			fullScreenLoading.value = true
		}
	}

	const hideFullScreenLoading = () => {
		fullScreenLoading.value = false
		axiosSuccessLoadingHide.value = true
	}

	return {
		fullScreenLoading: readonly(fullScreenLoading),
		axiosSuccessLoadingHide,
		showFullScreenLoading,
		hideFullScreenLoading
	}
}
