// plugins/pinia-class-serializer.ts
import type {PiniaPluginContext} from 'pinia'

const classRegistry = new Map<string, new (...args: any[]) => any>()

export function Serializable(constructor: Function) {
	classRegistry.set(constructor.name, constructor as any)
}

function serialize(obj: any): string {
	return JSON.stringify(obj, (key, value) => {
		if (value && typeof value === 'object' && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
			return {__class: value.constructor.name, __data: {...value}}
		}
		return value
	})
}

function deserialize(json: string): any {
	return JSON.parse(json, (key, value) => {
		if (value && value.__class) {
			const Constructor = classRegistry.get(value.__class)
			if (Constructor) {
				// Recursively deserialize nested objects first
				const deserializedData = deserializeNested(value.__data)
				return Object.assign(Object.create(Constructor.prototype), deserializedData)
			}
		}
		return value
	})
}

function deserializeNested(obj: any): any {
	if (!obj || typeof obj !== 'object') {
		return obj
	}

	if (Array.isArray(obj)) {
		return obj.map(item => deserializeNested(item))
	}

	// Check if this object itself needs deserialization
	if (obj.__class) {
		const Constructor = classRegistry.get(obj.__class)
		if (Constructor) {
			const deserializedData = deserializeNested(obj.__data)
			return Object.assign(Object.create(Constructor.prototype), deserializedData)
		}
	}

	// Recursively deserialize all properties
	const result: any = {}
	for (const key in obj) {
		result[key] = deserializeNested(obj[key])
	}
	return result
}

export function piniaClassSerializer({store}: PiniaPluginContext) {
	const key = `pinia-${store.$id}`

	// Rehydrate on init
	const saved = localStorage.getItem(key)
	if (saved) {
		const parsed = JSON.parse(saved)
		console.log('Before deserialization:', parsed)
		const deserialized = deserializeNested(parsed)
		console.log('After deserialization:', deserialized)
		store.$patch(deserialized)
	}

	// Persist on changes
	store.$subscribe(() => {
		localStorage.setItem(key, serialize(store.$state))
	})
}