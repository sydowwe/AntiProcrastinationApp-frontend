import '@fortawesome/fontawesome-svg-core';
import '@fortawesome/free-brands-svg-icons';
import '@fortawesome/free-solid-svg-icons';
import '@fortawesome/free-regular-svg-icons';
import '@fortawesome/vue-fontawesome';

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { fa } from 'vuetify/iconsets/fa-svg'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export const vuetify =  createVuetify({
  components,
  directives,
  
  icons: {
    defaultSet: 'mdi-svg',
    aliases,
    sets: {
      mdi,
      fa
    },
  },
  theme: {
    //defaultTheme: 'dark',
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
  } 
})
