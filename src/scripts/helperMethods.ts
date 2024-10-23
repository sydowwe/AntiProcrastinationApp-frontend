export function capitalizeString(str: string): string {
	if (!str) return str; // Handle empty strings
	return str.charAt(0).toUpperCase() + str.slice(1);
}
export function uncapitalizeString(str: string): string {
	if (!str) return str; // Handle empty strings
	return str.charAt(0).toLowerCase() + str.slice(1);
}