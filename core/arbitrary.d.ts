
export type scale = (value: string) => bigint;
export type unscale = (value: bigint) => string;
export type fix = (value: string, decimal_places: number) => string;
export type add = (...values: string[]) => string;
export type subtract = (...values: string[]) => string;
export type multiply = (...values: string[]) => string;
export type divide = (...values: string[]) => string;

export const fix: fix;
export const add: add;
export const subtract: subtract;
export const multiply: multiply;
export const divide: divide;
