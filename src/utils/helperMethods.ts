export function capitalizeString(str: string): string {
	if (!str) return str; // Handle empty strings
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function uncapitalizeString(str: string): string {
	if (!str) return str; // Handle empty strings
	return str.charAt(0).toLowerCase() + str.slice(1);
}

export function openInNewTab(url: string): void {
	const link = document.createElement('a');
	link.href = url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

export function hasObjectChanged<T>(original: T, modified: T): boolean {
	return JSON.stringify(original) !== JSON.stringify(modified);
}
