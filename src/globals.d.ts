import { AxiosInstance } from 'axios';
declare global {
  var axios: AxiosInstance;  
}
import { ComponentCustomProperties } from 'vue';
import { VueI18n } from 'vue-i18n';

// declare module '@vue/runtime-core' {
//   interface ComponentCustomProperties {
//     $t: typeof VueI18n.prototype.t;
//   }
// }