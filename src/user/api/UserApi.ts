import { API } from '@/_common/axiosConfig.ts'
import { User } from '@/core/user/dto/User.ts'
import { LoggedInUser } from '@/core/user/dto/UserModel.ts'

export async function fetchAfterLogin(): Promise<LoggedInUser> {
	const response = await API.get('/user/after-login', {})
	return LoggedInUser.fromJson(response.data)
}

export async function fetchUserData(): Promise<User> {
	const response = await API.post('/user/data', {})
	return User.fromJson(response.data)
}

export async function getTwoFactorAuthStatus(): Promise<boolean> {
	const response = await API.post('/user/get-2fa-status', {})
	return response.data
}

export async function changeEmail(newEmail: string, password: string, twoFactorAuthToken: string): Promise<void> {
	await API.post('/user/change-email', { newEmail, password, twoFactorAuthToken })
}

export async function changePassword(
	currentPassword: string | null,
	newPassword: string | null,
	twoFactorAuthToken: string | undefined,
): Promise<void> {
	await API.post('/user/change-password', { currentPassword, newPassword, twoFactorAuthToken })
}

export async function verifyUser(
	url: string,
	password: string | null,
	twoFactorAuthToken: string | undefined,
): Promise<unknown> {
	const response = await API.post(url, { password, twoFactorAuthToken })
	return response.data
}

export async function getQrCode(): Promise<string> {
	const response = await API.post('/user/get-2fa-qr-code', {})
	return response.data.qrCode
}

export interface ScratchCodeResponse {
	scratchCode?: string | string[]
	new2FAQrCode?: boolean
}

export async function getScratchCode(): Promise<ScratchCodeResponse> {
	const response = await API.post('/user/get-2fa-scratch-code', {})
	return response.data
}

export async function resendConfirmationEmail(email: string): Promise<void> {
	await API.post('/auth/resend-confirmation-email', { email })
}
