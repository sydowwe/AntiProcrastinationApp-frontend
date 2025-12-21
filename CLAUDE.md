## Tech Stack

- Vue 3 (Composition API with <script setup>)
- Vuetify 3 (UI Framework)
- TypeScript (Strict Mode)
- Vite (Build Tool)

## Component Standards

- **Naming**: Use PascalCase for component filenames and definitions (e.g., `UserCard.vue`).
- **APIs**: Always use the Composition API with `<script setup lang="ts">`.
- **Props**:
    - Define props using `defineProps<{ ... }>()`.
    - Use **camelCase** for prop keys (e.g., `showDetail: boolean`).
    - In templates, pass props using **kebab-case** (e.g., `:show-detail="true"`) as per Vue conventions.
- **Components in Templates**: Always use **PascalCase** for Vuetify and custom components (e.g., `<VBtn>` instead of `<v-btn>`).

## MCP & Documentation

- **Vuetify MCP**: Always use the `vuetify` MCP server to verify props, slots, and events before generating or refactoring UI code.
- **Reference**: If unsure about a Vuetify 3 pattern, call `vuetify.get_component_api`.

## Commands

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type Check**: `npx vue-tsc --noEmit`