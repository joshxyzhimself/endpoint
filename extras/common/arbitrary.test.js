
const arbitrary = require('./arbitrary');

arbitrary.set_precision(8);
const add = arbitrary.add;
const subtract = arbitrary.subtract;
const multiply = arbitrary.multiply;
const divide = arbitrary.divide;

console.log(add(75, 25, 25)); // 125
console.log(subtract(75, 25, 25)); // 25
console.log(multiply(5, 5)); // 25
console.log(add(5, multiply(5, 5))); // 30
console.log(divide(125, 5, 5)); // 5
console.log(divide(1000, 10, 10)); // 10
console.log(divide(1000, 8.86)); // 112.86681715
console.log(add(Number.MAX_SAFE_INTEGER, 0)); // 9007199254740991
console.log(subtract(Number.MAX_SAFE_INTEGER, 1)); // 9007199254740990
console.log(multiply(Number.MAX_SAFE_INTEGER, 0.5)); // 4503599627370495.5
console.log(divide(Number.MAX_SAFE_INTEGER, 2)); // 4503599627370495.5
console.log(multiply(Math.PI, Math.PI)); // 9.86960437
console.log(divide(Math.PI, Math.PI)); // 1
console.log(divide(1, 12)); // 0.08333333
console.log(add(0.1, 0.2)); // 0.3
console.log(multiply(1.500, 1.3)); // 1.95
console.log(multiply(0, 1)); // 0
console.log(multiply(0, -1)); // 0
console.log(multiply(-1, 1)); // -1
console.log(divide(1.500, 1.3)); // 1.15384615
console.log(divide(0, 1)); // 0
console.log(divide(0, -1)); // 0
console.log(divide(-1, 1)); // -1
console.log(multiply(5, 5, 5, 5)); // 625
console.log(multiply(5, 5, 5, 123, 123, 5)); // 9455625