<template>
	<div class="d-flex flex-column">
		<div class="d-flex flex-column flex-md-row ga-3">
			<div
				v-if="showFromToDoListField"
				class="flex-1-1 d-flex flex-column flex-md-row ga-3"
			>
				<NullFalseTrueCheckbox
					v-model="formData.isFromToDoList"
					:label="t('activities.fromToDoList')"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData?.isFromToDoList"
					v-model="formData.taskPriorityId"
					class="flex-1-1"
					:items="filteredOptions.taskPriorityOptions"
					hideDetails
					density="compact"
				></VIdSelect>
			</div>
			<div
				v-if="showFromToDoListField"
				class="flex-1-1 d-flex flex-column flex-md-row ga-3"
			>
				<NullFalseTrueCheckbox
					v-model="formData.isFromRoutineToDoList"
					:label="t('activities.fromRoutineToDoList')"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData.isFromRoutineToDoList"
					v-model="formData.routineTimePeriodId"
					class="flex-1-1"
					:items="filteredOptions.routineTimePeriodOptions"
					hideDetails
					density="compact"
				></VIdSelect>
			</div>
		</div>
		<VRow class="my-0">
			<VCol
				cols="12"
				:lg="lookupColumns"
				class="py-4"
			>
				<VIdAutocomplete
					v-model="formData.roleId"
					:label="t('activities.role')"
					:items="filteredOptions.roleOptions"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></VIdAutocomplete>
			</VCol>
			<VCol
				cols="12"
				:lg="lookupColumns"
				class="py-4"
			>
				<VIdAutocomplete
					v-model="formData.categoryId"
					:label="t('activities.category')"
					:items="filteredOptions.categoryOptions"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></VIdAutocomplete>
			</VCol>
			<VCol
				:cols="isRow ? 6 : 12"
				class="pt-4 pb-0"
			>
				<!--
					In the narrow embeddings the role and category fields are off to the side or wrapped
					out of view, so a short activity list looks like a bug rather than a filter. These
					chips name the narrowing that caused it, and clear it.
				-->
				<div
					v-if="narrowingChips.length > 0"
					v-auto-animate
					class="d-flex flex-wrap align-center ga-2 mb-2"
				>
					<span class="text-caption text-textMuted">{{ t('activities.narrowedBy') }}</span>
					<ChipWithIcon
						v-for="chip in narrowingChips"
						:key="chip.key"
						:icon="chip.icon"
						size="small"
						link
						:title="t('activities.clearNarrowing', { name: chip.label })"
						@click="chip.clear()"
					>
						{{ chip.label }}
						<VIcon
							icon="xmark"
							size="10"
							class="ml-2"
						/>
					</ChipWithIcon>
				</div>
				<InputWithButton
					:showBtn="activityRequired"
					icon="plus"
					color="success"
					:label="t('activities.createNewActivity')"
					:density="fieldDensity"
					@create="createNewActivity()"
				>
					<VIdAutocomplete
						ref="activityField"
						v-model="activityIdModel"
						:label="activityRequired ? t('activities.activityRequired') : t('activities.activity')"
						:items="activityPickerItems"
						:disabled="formDisabled"
						:density="fieldDensity"
						:hideDetails="isRow"
						:required="activityRequired"
						:rules="activityRequired ? [requiredRule] : []"
						@update:search="activitySearch = $event ?? ''"
						@update:menu="onMenuToggle"
						@update:modelValue="commitActivitySelection"
					>
						<template #no-data>
							<VListItem>
								<VListItemTitle class="text-wrap text-body-2 text-textMuted">
									{{ noDataText }}
								</VListItemTitle>
							</VListItem>
							<VListItem
								v-if="canCreateTypedActivity"
								prependIcon="plus"
								:title="t('activities.createNamedActivity', { name: trimmedSearch })"
								@click="createNewActivity(trimmedSearch)"
							></VListItem>
						</template>
					</VIdAutocomplete>
				</InputWithButton>
			</VCol>
		</VRow>
	</div>
</template>

<script setup lang="ts">
	import { computed, nextTick, reactive, ref } from 'vue'
	import type { Ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import ChipWithIcon from '@/_common/component/feedback/ChipWithIcon.vue'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import type { VAutocomplete } from 'vuetify/components'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import { useActivitySelectionFormState } from '@/core/activity/composable/useActivitySelectionFormState.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const {
		layout = 'stacked',
		mode = 'required',
		formDisabled = false,
		showFromToDoListField = true,
		selectOptionsSource = ActivityOptionsSource.ALL,
	} = defineProps<{
		/**
		 * How the three lookups are arranged. `stacked` is the default two-per-row form, `row` squeezes
		 * them into a single dense toolbar line, `dialog` puts each on its own full-width row.
		 */
		layout?: 'stacked' | 'row' | 'dialog'
		/**
		 * Whether picking an activity is the point of this form (`required`: the field is required and
		 * offers inline activity creation) or merely one way to narrow something down (`optional`: no
		 * rule, no create button). Filter panels and the pomodoro rest activity are `optional`.
		 */
		mode?: 'required' | 'optional'
		formDisabled?: boolean
		showFromToDoListField?: boolean
		selectOptionsSource?: ActivityOptionsSource
	}>()

	const formData = defineModel<ActivityFormRequest>({
		required: false,
		default: () => reactive(new ActivityFormRequest()),
	})
	const selectedActivityId = defineModel<number | null>('activityId', { default: null })
	/**
	 * What is currently selected, names included — null until the option lists have loaded. Bind
	 * `v-model:selection` instead of reaching into this component for a name.
	 */
	const selection = defineModel<ActivitySelection | null>('selection', { default: null })
	const loading = defineModel<boolean>('loading', { default: false })
	const isRow = computed(() => layout === 'row')
	const lookupColumns = computed(() => (layout === 'dialog' ? 12 : layout === 'row' ? 3 : 6))
	const fieldDensity = computed(() => (isRow.value ? 'compact' : 'comfortable'))
	const activityRequired = computed(() => mode === 'required')

	const { t } = useI18n()
	const { requiredRule } = useGeneralRules()
	const { openDialog } = useDialog()
	const activityField = ref<InstanceType<typeof VAutocomplete>>()
	/** What the user has typed into the activity field, mirrored so the empty states can quote it. */
	const activitySearch = ref('')
	const trimmedSearch = computed(() => activitySearch.value.trim())

	const {
		filteredOptions,
		activityIdModel,
		recentActivityCount,
		hasAnyActivities,
		commitActivitySelection,
		onActivityCreated,
	} = useActivitySelectionFormState(
		formData,
		selectedActivityId,
		selection as Ref<ActivitySelection | null>,
		loading,
		selectOptionsSource,
		showFromToDoListField,
	)

	type ActivityPickerItem = SelectOption | { type: 'subheader'; text: string }

	/**
	 * The activity options with the recent block called out. Reordering a list silently is worse than
	 * not reordering it — someone who has learned where an item sits alphabetically reads its absence
	 * from that spot as the item being gone — so the two groups get headings.
	 *
	 * Vuetify keeps `subheader` entries out of the value handling, and its filter holds them back until
	 * something under them survives the search, so a heading never strands itself over an empty group.
	 */
	const activityPickerItems = computed<ActivityPickerItem[]>(() => {
		const options = filteredOptions.value.activityOptions
		const recentCount = recentActivityCount.value
		if (recentCount === 0) return options
		const items: ActivityPickerItem[] = [
			{ type: 'subheader', text: t('activities.recentlyUsed') },
			...options.slice(0, recentCount),
		]
		if (recentCount < options.length) {
			items.push({ type: 'subheader', text: t('activities.allActivities') }, ...options.slice(recentCount))
		}
		return items
	})

	interface NarrowingChip {
		key: string
		icon: string
		label: string
		clear: () => void
	}

	const narrowingChips = computed<NarrowingChip[]>(() => {
		const current = selection.value
		if (!current) return []
		const chips: NarrowingChip[] = []
		if (current.roleId != null && current.roleName) {
			chips.push({
				key: 'role',
				icon: 'user-tag',
				label: current.roleName,
				clear: () => {
					formData.value.roleId = null
				},
			})
		}
		if (current.categoryId != null && current.categoryName) {
			chips.push({
				key: 'category',
				icon: 'folder',
				label: current.categoryName,
				clear: () => {
					formData.value.categoryId = null
				},
			})
		}
		return chips
	})

	/**
	 * Three different reasons the dropdown can be empty, and the user can act on a different thing in
	 * each: nothing exists yet, nothing survives the current narrowing, or nothing matches what was
	 * typed. The generic "no data available" answered none of them.
	 */
	const noDataText = computed(() => {
		// Only the `required` layout carries the '+' button, so only it may point at one.
		const nothingYet = activityRequired.value
			? t('activities.noActivitiesYetCreatable')
			: t('activities.noActivitiesYet')
		if (!hasAnyActivities.value) return nothingYet
		if (trimmedSearch.value) return t('activities.noActivityMatches', { name: trimmedSearch.value })
		if (narrowingChips.value.length > 0) return t('activities.noActivitiesForNarrowing')
		return nothingYet
	})

	/**
	 * Offering to create what was typed only makes sense where creating is on the table at all —
	 * a filter panel narrowing a list of records is not the place to add a new activity.
	 */
	const canCreateTypedActivity = computed(() => activityRequired.value && trimmedSearch.value.length > 0)

	/**
	 * Vuetify seeds the search with the current selection's title when the menu opens, so a closed
	 * field's `search` is not something the user typed. Dropping it on close keeps the empty-state copy
	 * from quoting a name back at the user that they never entered.
	 */
	function onMenuToggle(isOpen: boolean) {
		if (!isOpen) activitySearch.value = ''
	}

	async function validate() {
		return await activityField.value?.validate()
	}

	async function createNewActivity(prefillName?: string) {
		const result = await openDialog<{ request: ActivityRequest; createdId?: number }>({
			component: ActivityForm,
			componentProps: {
				initialRoleId: formData.value.roleId ?? undefined,
				initialCategoryId: formData.value.categoryId ?? undefined,
				initialName: prefillName,
			},
			dialogProps: {
				title: t('activities.createNewActivity'),
				confirmBtnLabel: t('general.create'),
				isSmall: false,
			},
		})
		await restoreFocusToActivityField()
		if (!result?.createdId) return
		onActivityCreated(result.request, result.createdId)
	}

	/**
	 * The dialog returns focus to whatever opened it, which is right for the '+' button but impossible
	 * for the "create '<typed text>'" row — that row lives in the dropdown and is gone by the time the
	 * dialog closes, so focus lands on `<body>` and the keyboard path dead-ends. Only step in when that
	 * has actually happened, and only after the dialog has had its turn.
	 */
	async function restoreFocusToActivityField() {
		await nextTick()
		setTimeout(() => {
			const active = document.activeElement
			if (active && active !== document.body) return
			activityField.value?.focus()
		}, 0)
	}

	// `validate()` is the only thing left that a parent has to reach in for: it is a genuine imperative
	// action with no data-flow equivalent. Everything else this component knows now leaves through a
	// model.
	defineExpose({
		validate,
	})
</script>
