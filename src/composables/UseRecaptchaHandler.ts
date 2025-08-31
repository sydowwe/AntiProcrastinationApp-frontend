// src/composables/useRecaptcha.ts
import {ref, onUnmounted, readonly} from 'vue'
import { load } from 'recaptcha-v3'

export function useRecaptcha() {
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const recaptchaInstance = ref<any>(null)

  const loadRecaptcha = async (): Promise<void> => {
    // If already loaded, return immediately
    if (isLoaded.value && recaptchaInstance.value) {
      return
    }

    // If currently loading, wait for it to complete
    if (isLoading.value) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (isLoaded.value) {
            clearInterval(checkLoaded)
            resolve()
          }
        }, 100)
      })
    }

    isLoading.value = true

    try {
      const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
      recaptchaInstance.value = await load(siteKey, {
        useRecaptchaNet: false,
        autoHideBadge: false
      })
      isLoaded.value = true
    } catch (error) {
      throw new Error(`Failed to load reCAPTCHA: ${error}`)
    } finally {
      isLoading.value = false
    }
  }

  const executeRecaptcha = async (action: string): Promise<string> => {
    if (!isLoaded.value) {
      await loadRecaptcha()
    }

    if (!recaptchaInstance.value) {
      throw new Error('reCAPTCHA not loaded properly')
    }

    try {
      const token = await recaptchaInstance.value.execute(action)
      return token
    } catch (error) {
      throw new Error(`reCAPTCHA execution failed: ${error}`)
    }
  }

  const cleanup = () => {
    recaptchaInstance.value = null
    isLoaded.value = false
    isLoading.value = false
  }

  // Cleanup when component unmounts
  onUnmounted(() => {
    cleanup()
  })

  return {
    loadRecaptcha,
    executeRecaptcha,
    cleanup,
    isLoaded: readonly(isLoaded),
    isLoading: readonly(isLoading)
  }
}

