
import { ref, onMounted } from 'vue';
import { ToDoListItemRequest } from '../classes/ToDoListItem';
import { ToDoListItemDialogType } from '../classes/types/RefTypeInterfaces';
import { BaseToDoListItemEntity } from '../classes/ToDoListItem';

export function useToDoListItemFunctions(isRoutine: boolean = false,props: { toDoListItem: BaseToDoListItemEntity }, emits: any) {
    const url = '/' + (isRoutine ? 'routine-' : '') + 'to-do-list'

    const toDoListDialog = ref<ToDoListItemDialogType>({} as ToDoListItemDialogType);

    const items = ref([] as BaseToDoListItemEntity[]);
    const selectedItemsIds = ref([] as number[]);
    
    onMounted(() => {
        getAllRecords();
      });
      
      const getAllRecords = () => {
        window.axios
          .post(`${url}/get-all`)
          .then((response) => {
            items.value = BaseToDoListItemEntity.listFromObjects(response.data);
          })
          .catch((error) => {
            console.error(error);
          });
      };
      
      const openDialog = () => {
        toDoListDialog.value.openCreate();
      };
      
      const add = (toDoListItem: ToDoListItemRequest) => {
        window.axios
          .post(`${url}/add`, toDoListItem)
          .then((response) => {
            items.value.push(BaseToDoListItemEntity.fromObject(response.data));

          })
          .catch((error) => {
            console.error(error);
          });
      };
      
      const edit = (id: number, toDoListItemRequest: ToDoListItemRequest) => {
        let urgencyId = toDoListItemRequest.urgencyId;
        window.axios
          .put(`${url}/${id}`, toDoListItemRequest)
          .then((response) => {
            console.log(response.data);
            const index = items.value.findIndex((item) => item.id === id);
            if (urgencyId === response.data.urgencyId) {
              items.value[index] = BaseToDoListItemEntity.fromObject(response.data);
            } else {
              items.value[index] = BaseToDoListItemEntity.fromObject(response.data);
            }
          })
          .catch((error) => {
            console.error(error);
          });
      };
      
      const deleteItem = (id: number) => {
        window.axios
          .delete(`${url}/${id}`)
          .then((response) => {
            console.log(response.data);
            items.value = items.value.filter((item: BaseToDoListItemEntity) => item.id !== id);
          })
          .catch((error) => {
            console.error(error);
          });
      };
      
      const select = (id: number) => {
          if(!selectedItemsIds.value.includes(id)){
              selectedItemsIds.value.push(id);
          }
        console.log(selectedItemsIds.value);
      };
      
      const unSelect = (id: number) => {
          console.log("asdsd");
          selectedItemsIds.value = selectedItemsIds.value.filter((item) => item != id);
      };
      
      const handleIsDoneChanged = (id: number, isDone: boolean) => {
        if (selectedItemsIds.value.length > 1) {
          const batchChangeDone = selectedItemsIds.value.map((item: number) => ({ id: item, isDone }));
          window.axios
            .post(`${url}/batch-change-done`, batchChangeDone)
            .then((response) => {
              console.log(response);
              items.value.forEach((item) => {
                if (selectedItemsIds.value.includes(item.id)) {
                  item.isDone = isDone;
                }
              });
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          window.axios
            .post(`${url}/change-done`, { id, isDone })
            .then((response) => {
              console.log(response);
            })
            .catch((error) => {
              console.error(error);
            });
        }
      };

  return { getAllRecords ,openDialog,edit, deleteItem, select, unSelect, handleIsDoneChanged };
}