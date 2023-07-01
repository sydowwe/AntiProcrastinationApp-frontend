import { Field, Form, ErrorMessage, useField,useForm } from 'vee-validate';
import { defineRule, configure } from 'vee-validate';
import { required } from '@vee-validate/rules';
import { localize } from '@vee-validate/i18n';



defineRule('required', required);
configure({
  // Generates an English message locale generator
  generateMessage: localize('en', {
    messages: {
      required: 'This field is required',
    },
  }),
});