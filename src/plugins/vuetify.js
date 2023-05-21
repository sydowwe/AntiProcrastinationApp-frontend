import { createVuetify} from 'vuetify';

import '@fortawesome/fontawesome-free/css/all.css';
import { i18n } from './main'; 

export default createVuetify({
  theme: {
    dark: true, // Enable dark theme
    themes: {
      dark: {
        primary: '#1976D2',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
      },
    },
  },
  icons: {
    iconfont: 'faSvg', // Use Font Awesome SVG icons
  },
}).use(i18n);
