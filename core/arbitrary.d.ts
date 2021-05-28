
export type scale = (value: string) => bigint;
export type unscale = (value: bigint) => string;
export type fix = (value: string, decimal_places: number) => string;
export type add = (...values: string[]) => string;
export type sub = (...values: string[]) => string;
export type mul = (...values: string[]) => string;
export type div = (...values: string[]) => string;

export type gt = (first: string, second: string) => boolean;
export type lt = (first: string, second: string) => boolean;
export type gte = (first: string, second: string) => boolean;
export type lte = (first: string, second: string) => boolean;
export type eq = (first: string, second: string) => boolean;
export type neq = (first: string, second: string) => boolean;

export const fix: fix;
export const add: add;
export const sub: sub;
export const mul: mul;
export const div: div;
export const gt: gt;
export const lt: lt;
export const gte: gte;
export const lte: lte;
export const eq: eq;
export const neq: neq;
