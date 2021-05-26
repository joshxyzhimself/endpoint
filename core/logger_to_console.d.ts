
export type listener = (id: string|number, severity_type: string, message: string, data?: object) => void;
export type enable = (id: string) => void;
export type disable = (id: string) => void;
export interface logger_to_console {
  enable: enable
  disable: disable
}
export const logger_to_console: logger_to_console;
export = logger_to_console;