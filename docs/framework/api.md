# `src/_common/api/` — Reusable API Helpers Reference

Location: `src/_common/api/`. Per-file reference for the base API composables. Each entity gets its
own composable **co-located with its feature** (e.g. `src/core/inventory/api/StockItemApi.ts`) that
**composes** these base helpers and passes its DTO classes + entity route segment. Always import the
axios instance from `@/_common/axiosConfig.ts` (`API`); never use global `axios`.

**Conventions**

- `entityName` is the route segment (e.g. `'stock-item'`), used to build REST paths.
- `responseClass` is a DTO class exposing `static fromJson(json): T` (and usually
  `listFromObjects`). Table-row response DTOs implement `IIdResponse` (`{ id: number }`).
- Every helper returns reactive `loading: Ref<boolean>` and `error: Ref<string | null>`.
- **Every method takes an optional trailing `requestConfig?: AxiosRequestConfig`** that is
  spread into the underlying axios call — use it for per-call headers, `signal` (cancellation),
  `params`, etc.
- On error, helpers set `error` and re-throw — they do **not** show snackbars. The axios
  response interceptor (`axiosConfig.ts`) is the single owner of error snackbars: it maps the
  status to a localized message and handles auth refresh/redirect. Passing `disableErrorHandling`
  threads `{ _silent: true }` into the request so the interceptor stays quiet for that call; the
  caller then owns messaging (optionally via `handleHttpCodes`).

### Shared config shape

All read helpers (`useEntityQuery` and the four `useFetch*` helpers) take a **single
`QueryConfig<TResponse>` object** — they share one constructor shape:

```ts
interface QueryConfig<TResponse> {
	entityName: string
	responseClass: { fromJson(json: any): TResponse }
	disableErrorHandling?: boolean
	sharedState?: RequestState   // see "Sharing loading/error" below
}
```

---

## `useEntityQuery<TResponse>(config: QueryConfig<TResponse>)` — `useEntityQuery.ts`

Read operations for a single entity type.

| Method                                                 | HTTP | Path                                                   | Returns          |
|--------------------------------------------------------|------|--------------------------------------------------------|------------------|
| `fetchById(id, requestConfig?)`                        | GET  | `{entity}/{id}`                                        | `TResponse`      |
| `fetchByField(fieldTitle, fieldValue, requestConfig?)` | GET  | `{entity}/by-{fieldTitle}/{value}` (value URL-encoded) | `TResponse`      |
| `fetchAll(requestConfig?)`                             | GET  | `{entity}`                                             | `TResponse[]`    |
| `fetchSelectOptions(requestConfig?)`                   | GET  | `{entity}/all-options`                                 | `SelectOption[]` |

Returns `{ loading, error, fetchById, fetchByField, fetchAll, fetchSelectOptions }`.

---

## `useEntityCommand<TResponse, TCreateRequest, TUpdateRequest>(config)` — `useEntityCommand.ts`

Write operations. Runs on a single `useRequestState` pair, so the returned `loading`/`error` react
to both the write and the follow-up GET. The `*WithResponse` variants do the re-fetch with an inline
`API.get({entity}/{id})` (the write's abort `signal` is stripped from that GET so a committed write
isn't cancelled), then hydrate via `responseClass.fromJson`.

`config: CommandConfig` = `{ entityName, responseClass, createRequestClass?, updateRequestClass?, disableErrorHandling? }`

| Method                                          | HTTP        | Path                            | Body                      | Returns           |
|-------------------------------------------------|-------------|---------------------------------|---------------------------|-------------------|
| `create(data, requestConfig?)`                  | POST        | `{entity}`                      | `TCreateRequest`          | `number` (new id) |
| `createWithResponse(data, requestConfig?)`      | POST + GET  | `{entity}` then `{entity}/{id}` | `TCreateRequest`          | `TResponse`       |
| `update(id, data, requestConfig?)`              | PUT         | `{entity}/{id}`                 | `TUpdateRequest`          | `void`            |
| `updateWithResponse(id, data, requestConfig?)`  | PUT + GET   | `{entity}/{id}`                 | `TUpdateRequest`          | `TResponse`       |
| `patch(id, data, requestConfig?)`               | PATCH       | `{entity}/{id}`                 | `Partial<TUpdateRequest>` | `void`            |
| `patchWithResponse(id, data, requestConfig?)`   | PATCH + GET | `{entity}/{id}`                 | `Partial<TUpdateRequest>` | `TResponse`       |
| `batchedToggle(fieldName, ids, requestConfig?)` | PATCH       | `{entity}/toggle-{fieldName}`   | `{ ids }`                 | `void`            |
| `deleteEntity(id, requestConfig?)`              | DELETE      | `{entity}/{id}`                 | —                         | `void`            |
| `batchDelete(ids, requestConfig?)`              | POST        | `{entity}/batch-delete`         | `{ ids }`                 | `void`            |

Returns `{ loading, error, create, createWithResponse, update, updateWithResponse, patch, patchWithResponse, batchedToggle, deleteEntity, batchDelete }`.

> `*WithResponse` variants make **two** round trips (write then GET-by-id). Use the plain
> variant when you don't need the entity back.

---

## `useFetchFiltered<TResponse, TFilter>(config: QueryConfig<TResponse>)` — `useFetchFiltered.ts`

POST a filter, get an unpaged list back.

| Method                                  | HTTP | Path               | Body      | Returns       |
|-----------------------------------------|------|--------------------|-----------|---------------|
| `fetchFiltered(filter, requestConfig?)` | POST | `/{entity}/filter` | `TFilter` | `TResponse[]` |

Returns `{ loading, error, fetchFiltered }`.

---

## `useFetchFilteredSorted<TResponse, TFilter>(config: QueryConfig<TResponse>)` — `useFetchFilteredSorted.ts`

POST a filter **+ sort**, get an unpaged list back.

| Method                                         | HTTP | Path                    | Body                         | Returns       |
|------------------------------------------------|------|-------------------------|------------------------------|---------------|
| `fetchFilteredSorted(request, requestConfig?)` | POST | `/{entity}/filter-sort` | `FilterSortRequest<TFilter>` | `TResponse[]` |

Returns `{ loading, error, fetchFilteredSorted }`.

---

## `useFetchSorted<TResponse>(config: QueryConfig<TResponse>)` — `useFetchSorted.ts`

POST a sort spec (no filter), get an unpaged list back.

| Method                                 | HTTP | Path             | Body          | Returns       |
|----------------------------------------|------|------------------|---------------|---------------|
| `fetchSorted(request, requestConfig?)` | POST | `/{entity}/sort` | `SortRequest` | `TResponse[]` |

Returns `{ loading, error, fetchSorted }`.

---

## `useFetchFilteredTable<TTableResponse, TFilter>(config: QueryConfig<TTableResponse>)` — `useFetchFilteredTable.ts`

Server-side paginated table fetch (filter + sort + paging).

| Method                                        | HTTP | Path                       | Body                            | Returns                                           |
|-----------------------------------------------|------|----------------------------|---------------------------------|---------------------------------------------------|
| `fetchFilteredTable(request, requestConfig?)` | POST | `/{entity}/filtered-table` | `FilteredTableRequest<TFilter>` | `{ items: TTableResponse[]; itemsCount: number }` |

Returns `{ loading, error, fetchFilteredTable }`.

---

## `useAttachmentUpload<TAttachment>(config: AttachmentUploadConfig)` — `useAttachmentUpload.ts`

Multipart file upload for an entity.

`config: AttachmentUploadConfig` = `{ entityName, disableErrorHandling?, sharedState? }`

| Method                                             | HTTP | Path                               | Body                           | Returns       |
|----------------------------------------------------|------|------------------------------------|--------------------------------|---------------|
| `uploadAttachment(entityId, file, requestConfig?)` | POST | `/{entity}/{entityId}/attachments` | `multipart/form-data` (`file`) | `TAttachment` |

Returns `{ loading, error, uploadAttachment }`. The `Content-Type` header is **not** set
manually — axios/the browser sets `multipart/form-data` with the correct boundary.

---

## Sharing `loading`/`error` across merged helpers — `useRequestState.ts`

When an entity-API composable merges two base helpers, each helper allocates its own
`loading`/`error` pair by default, so the pair you spread **last** wins and the other becomes
unobservable. To make one `loading` react to every method, create a shared state pair and pass
it via `sharedState`:

```ts
import {createRequestState} from '@/_common/api/useRequestState.ts'

export function useStockItemQuery() {
	const sharedState = createRequestState()
	const {fetchFilteredTable} =
		useFetchFilteredTable<StockItemGridResponse, StockItemFilter>({
			entityName: 'stock-item', responseClass: StockItemGridResponse, sharedState,
		})
	const query = useEntityQuery<StockItemResponse>({
		entityName: 'stock-item', responseClass: StockItemResponse, sharedState,
	})
	return {...query, fetchFilteredTable, loading: sharedState.loading, error: sharedState.error}
}
```

`useEntityCommand` already does this internally for its `*WithResponse` re-fetch.

---

## Request DTOs used by the helpers (`src/_common/dto/request/base/`)

- `BaseTableRequest { itemsPerPage, page, sortBy: SortByRequest[] }`
- `FilteredTableRequest<TFilter>` extends `BaseTableRequest` — adds `useFilter`, `filter`. Maps Vuetify `VSortItem[]` → `SortByRequest[]`.
- `FilterSortRequest<TFilter>` extends `FilterRequest<TFilter>` — adds `sortBy: SortByRequest[]`.
- `SortRequest`, `SortByRequest`, `FilterRequest<TFilter>`.

## Typical entity-API composable shape

```ts
// src/core/inventory/api/StockItemApi.ts
export function useStockItemQuery() {
	const sharedState = createRequestState()
	const {fetchFilteredTable} =
		useFetchFilteredTable<StockItemGridResponse, StockItemFilter>({
			entityName: 'stock-item', responseClass: StockItemGridResponse, sharedState,
		})
	const query = useEntityQuery<StockItemResponse>({
		entityName: 'stock-item', responseClass: StockItemResponse, sharedState,
	})
	return {...query, fetchFilteredTable, loading: sharedState.loading, error: sharedState.error}
}

export function useStockItemCommand() {
	return useEntityCommand<StockItemResponse, StockItemCreateRequest, StockItemUpdateRequest>({
		entityName: 'stock-item', responseClass: StockItemResponse,
	})
}
```

> When merging two helpers, pass a shared `sharedState` (above) so the returned `loading`/`error`
> reflect every method — otherwise only the last-spread pair is observable.

## Endpoint conventions the backend (FastEndpoints) must follow

| FE helper call                           | Expected route                                           |
|------------------------------------------|----------------------------------------------------------|
| `fetchById`                              | `GET {entity}/{id}`                                      |
| `fetchByField`                           | `GET {entity}/by-{field}/{value}`                        |
| `fetchAll`                               | `GET {entity}`                                           |
| `fetchSelectOptions`                     | `GET {entity}/all-options`                               |
| `create` / `update` / `patch` / `delete` | `POST {entity}` / `PUT                                   |PATCH|DELETE {entity}/{id}` |
| `batchedToggle`                          | `PATCH {entity}/toggle-{field}` body `{ ids }`           |
| `batchDelete`                            | `POST {entity}/batch-delete` body `{ ids }`              |
| `fetchFiltered`                          | `POST {entity}/filter`                                   |
| `fetchFilteredSorted`                    | `POST {entity}/filter-sort`                              |
| `fetchSorted`                            | `POST {entity}/sort`                                     |
| `fetchFilteredTable`                     | `POST {entity}/filtered-table` → `{ items, itemsCount }` |
| `uploadAttachment`                       | `POST {entity}/{id}/attachments` (multipart)             |

## The axios instance — `src/_common/axiosConfig.ts`

- Exports **`API`** (the main instance — use this everywhere) and **`extractServerMessage`** (pull a
  human message out of an error response). A second instance, **`refreshClient`**, exists **only** for
  the token-refresh call and has no interceptors — never import it outside the auth logic.
- Request/response interceptors own cross-cutting concerns: full-screen loading, and on `401` /
  `x-token-expired` they POST `/auth/refresh`, queue + replay the failed requests, and on failure
  redirect to `login`.
- The response interceptor is the **single owner of error snackbars** — see the `disableErrorHandling`
  / `{ _silent: true }` note at the top of this doc.
