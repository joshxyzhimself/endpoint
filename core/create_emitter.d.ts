
export type on = (id: string|number, listener: Function) => void;
export type off = (id: string|number, listener: Function) => void;
export type emit = (id: string|number, ...args: any[]) => void;

export interface emitter {
  on: on
  off: off
  emit: emit
}

const create_emitter: () => emitter;

export = create_emitter;