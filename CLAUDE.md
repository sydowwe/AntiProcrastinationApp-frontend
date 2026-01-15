# AntiProcrastinationApp Frontend Rules

## Tech Stack

- **Framework**: Vue 3.5+ (Composition API with `<script setup lang="ts">`)
- **UI**: Vuetify 3
- **ICONS** FontAwesome 7
- **State**: Pinia (Composition API / Setup Stores)
- **Routing**: Vue Router
- **HTTP**: Axios (Custom instance at `@/plugins/axiosConfig.ts`)

## Coding Standards

- **Function Syntax**: Use `function name() {}` declarations instead of `const name = () => {}` for component logic to leverage hoisting and improve readability.
- **Component Naming**: Use PascalCase for filenames and template tags (e.g., `<VBtn>`, `<MyCustomComponent>`).
- use ref mostly only use reactive when its really needed or conventional
- **Props**:
    - Define using: `const props = defineProps<{ foo: string, bar?: number }>()`.
    - Use **camelCase** in BOTH TS and Templates (e.g., `hideDetails` not `hide-details`).
    - use props just as the shorthand :prop instead of :prop="prop" when there is ref with same name
- **Emits**:
    - Define using: `const emit = defineEmits<{ change: [id: number], update: [value: string] }>()`.
- **Two-Way Binding (v-model)**:
    - **Always** use `defineModel()` instead of `defineProps({ modelValue })` + `defineEmits(['update:modelValue'])`.
    - Example: `const model = defineModel<string>()` or `const model = defineModel<string>({ default: 'initial' })`.
    - For multiple models: `const value = defineModel<string>('value')` and `const checked = defineModel<boolean>('checked')`.
- **API Calls**:
    - **Always** import the custom instance: `import { API } from '@/plugins/axiosConfig.ts';`.
    - Do not use global `axios` or create new instances.

## Vuetify Components

- **Styling Priority**:
    1. For Vuetify components: use component props first (`rounded`, `elevation`, `density`, `variant`, `color`, etc.)
    2. For layout/spacing: use Vuetify utility classes (`d-flex`, `pa-2`, `ga-2`, `text-primary`, etc.)
    3. Use custom CSS only when no Vuetify prop or helper class exists
    4. For 1-2 simple property changes on a single element, use inline `style=""` to keep it close to the markup
    - Don't mix Vuetify classes and custom CSS for the same element - pick one approach per element.
- **Number Inputs**: **Always** use `VNumberInput` instead of `VTextField` with `type="number"`.
    - VNumberInput provides built-in increment/decrement buttons and better number handling.
    - No need for `.number` modifier on v-model.
    - Example: `<VNumberInput v-model="quantity" :min="1" :max="100" />`.

## MCP Usage

- **Vuetify MCP**: Before writing Vuetify components, use the `vuetify` MCP to verify the exact API of the component.
- **Rules**: If a Vuetify prop is suggested in kebab-case, convert it to camelCase.

## Commands

- **Dev**: `npm run dev`
- **Typecheck**: `npx vue-tsc --noEmit`
- **Lint**: `npm run lint`