
const buffer = new Uint8Array(32);

function buffer2 (length) {
  const buffer = new Uint8Array(length);
}

const text_encoder = new TextEncoder();
const text_decoder = new TextDecoder();

// 1 byte, type
// N byte, length
// N byte, data

// arrays
// 1 byte, data type, as array
// N byte, array length
// N byte, array item type
// N byte, array item length
// N byte, array item data

// objects
// 1 byte, data type, as object
// N byte, item key type
// N byte, item key length
// N byte, item key data
// N byte, item value type
// N byte, item value length
// N byte, item value data

const encode = () => {

};
const decode = () => {

};

const readInt8 = () => {

};

const writeInt8 = () => {

};

console.log({ buffer });

process.nextTick(async () => {
  console.log(encoder.encode('asd'));
});