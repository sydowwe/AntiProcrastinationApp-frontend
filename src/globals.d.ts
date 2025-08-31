import { AxiosInstance } from 'axios';
import { VueI18n } from 'vue-i18n';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: typeof VueI18n.prototype.t;
  }
}