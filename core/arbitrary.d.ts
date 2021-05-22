
export function fix (value: string|number, decimal_places: number) : string;
export function scale (value: string|number) : bigint;
export function unscale (value: bigint) : string;
export function add(...values: (string|number)[]) : string;
export function subtract(...values: (string|number)[]) : string;
export function multiply(...values: (string|number)[]) : string;
export function divide(...values: (string|number)[]) : string;
