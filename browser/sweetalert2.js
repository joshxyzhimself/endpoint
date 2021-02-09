
// updated: 01-13-2021

import Swal from 'sweetalert2/src/sweetalert2.js';
import AssertionError from './AssertionError';

const default_properties = {
  customClass: {
    popup: 'swal2-popup-class',
    confirmButton: 'swal2-confirm-class',
    cancelButton: 'swal2-cancel-class',
  },
  showClass: {
    popup: 'swal2-noanimation',
    backdrop: 'swal2-noanimation',
  },
  hideClass: {
    popup: '',
    backdrop: '',
  },
  timerProgressBar: true,
};

const restricted_properties = {
  ...default_properties,
  allowEscapeKey: false,
  allowOutsideClick: false,
};

Swal.close();

const sweetalert2 = {
  close: Swal.close.bind(Swal),
  overlay: async (text) => {
    AssertionError.assert(typeof text === 'string');
    return Swal.fire({
      text,
      showConfirmButton: false,
      willOpen: () => Swal.showLoading(),
      ...restricted_properties,
    });
  },
  info: (text, timer) => {
    AssertionError.assert(typeof text === 'string');
    AssertionError.assert(typeof timer === 'number' || timer === undefined);
    return Swal.fire({ text, timer, icon: 'info', ...default_properties });
  },
  error: (text, timer) => {
    AssertionError.assert(typeof text === 'string');
    AssertionError.assert(typeof timer === 'number' || timer === undefined);
    return Swal.fire({ text, timer, icon: 'error', ...default_properties });
  },
  success: (text, timer) => {
    AssertionError.assert(typeof text === 'string');
    AssertionError.assert(typeof timer === 'number' || timer === undefined);
    return Swal.fire({ text, timer, icon: 'success', ...default_properties });
  },
  warning: async (text) => {
    AssertionError.assert(typeof text === 'string');
    const response = await Swal.fire({
      text,
      icon: 'warning',
      showConfirmButton: true,
      showCancelButton: true,
      ...restricted_properties,
    });
    return response.value === true;
  },
  question: async (text) => {
    AssertionError.assert(typeof text === 'string');
    const response = await Swal.fire({
      text,
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      ...restricted_properties,
    });
    return response.value === true;
  },
  prompt_text: async (text, input_value) => {
    AssertionError.assert(typeof text === 'string');
    AssertionError.assert(typeof input_value === 'string');
    const response = await Swal.fire({
      text,
      input: 'text',
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      inputValidator: (value) => {
        if (value === '') {
          return 'Value cannot be empty.';
        }
        return undefined;
      },
      inputValue: input_value,
      didOpen: () => {
        const swal_input = Swal.getInput();
        swal_input.setSelectionRange(0, swal_input.value.length);
      },
      ...restricted_properties,
    });
    return response.value;
  },
  prompt_select: async (text, input_value, input_options) => {
    AssertionError.assert(typeof text === 'string');
    AssertionError.assert(typeof input_value === 'string');
    AssertionError.assert(input_options instanceof Object);
    const response = await Swal.fire({
      text,
      input: 'select',
      icon: 'question',
      showConfirmButton: true,
      showCancelButton: true,
      inputValidator: (value) => {
        if (value === '') {
          return 'Value cannot be empty.';
        }
        return undefined;
      },
      inputValue: input_value,
      inputOptions: input_options,
      ...restricted_properties,
    });
    return response.value;
  },
};

export default sweetalert2;
