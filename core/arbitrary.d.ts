
export type scale = (value: string|number) => bigint;
export type unscale = (value: bigint) => string;
export type fix = (value: string|number, decimal_places: number) => string;
export type add = (...values: (string|number)[]) => string;
export type subtract = (...values: (string|number)[]) => string;
export type multiply = (...values: (string|number)[]) => string;
export type divide = (...values: (string|number)[]) => string;

export const fix: fix;
export const add: add;
export const subtract: subtract;
export const multiply: multiply;
export const divide: divide;
