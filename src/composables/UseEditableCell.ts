import {nextTick, ref, watch} from "vue";
import {EditableTableCell} from "@/dtos/dto/EditableTableCell";

export type EditableCellEmits = 'editCell' | 'updatedCell' | 'editCellCanceled';

export function useEditableCell(
	props: { cellItem: EditableTableCell },
	emit: (e: EditableCellEmits, ...args: unknown[]) => void
) {
	const input = ref<HTMLInputElement | null>(null);
	const newValue = ref();
	const cellItem = ref<EditableTableCell>(props.cellItem);

	// Watch for props.cellItem changes and update the local state
	watch(
		() => props.cellItem,
		(newVal) => {
			cellItem.value = newVal;
		}
	);

	// Start editing the cell
	function startCellEdit() {
		if (props.cellItem?.column.isReadOnly) return; // Do nothing if readOnly
		cellItem.value.isEdit = true;
		newValue.value = cellItem.value.value;
		emit("editCell");
		nextTick(() => {
			input.value?.focus();
		});
	}

	// Handle cell value updates
	function cellValueUpdated() {
		if (props.cellItem?.column.isReadOnly) return; // Do nothing if readOnly
		cellItem.value.isEdit = false;
		cellItem.value.newValue = newValue.value;
		emit("updatedCell", cellItem.value);
	}

	// Handle canceling cell edits
	function editCellCanceled() {
		cellItem.value.isEdit = false;
		emit("editCellCanceled");
	}

	return {
		input,
		newValue,
		cellItem,
		startCellEdit,
		cellValueUpdated,
		editCellCanceled,
	};
}