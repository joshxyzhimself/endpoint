
import { on, off } from './create_emitter';

interface severity_types {
  DEFAULT: string
  DEBUG: string
  INFO: string
  NOTICE: string
  WARNING: string
  ERROR: string
  CRITICAL: string
  ALERT: string
  EMERGENCY: string
}

interface severity_codes {
  DEFAULT: number
  DEBUG: number
  INFO: number
  NOTICE: number
  WARNING: number
  ERROR: number
  CRITICAL: number
  ALERT: number
  EMERGENCY: number
}

interface error_types {
  ERR_INVALID_PARAMETER_TYPE: string
}


export type log = (id: string|number, severity_type: string, message: string, data?: object) => void;
export type to_console = (id: string) => void;
export type to_file = (id: string) => void;

export const severity_types: severity_types;
export const severity_codes: severity_codes;
export const error_types: error_types;
export const log: log;
export const to_console: to_console;
export const to_file: to_file;

interface logger {
  log: log
  to_console: to_console
  to_file: to_file
  severity_types: severity_types
  severity_codes: severity_codes
  error_types: error_types
  on: on
  off: off
}

const logger: logger;

export = logger;