import { ref } from 'vue';

const showFullScreenLoading = () => {
  state.loading.value = true;
};
const hideFullScreenLoading = () => {
  state.loading.value = false;
};
const state = {
  loading: ref(false),
  showFullScreenLoading,
  hideFullScreenLoading,
};
export function useFullScreenLoading() {
  return {
    ...state
  };
}