
#### implementation notes

- good performance, good readability, JSON compatible
- primitives: null, boolean, uint8, uint16, uint32, int8, int16, int32, float, double, bigint, str8, str16, str32
- containers: array8, array16, array32, map8, map16, map32
- binary: bin8, bin16, bin32
- requires bigint, https://caniuse.com/bigint

#### using with websockets

```js
const encoded = bytearray.encode({ foo: 'bar' });
websocket.send(encoded.buffer);
```

#### benchmarks

```
JSON stringify x 2,008,272 ops/sec ±1.26% (86 runs sampled)
bytearray encode x 158,736 ops/sec ±2.03% (80 runs sampled)

JSON stringify test_data_2 x 357,996 ops/sec ±0.81% (90 runs sampled)
bytearray encode test_data_2 x 31,720 ops/sec ±2.51% (79 runs sampled)

JSON stringify parse x 643,944 ops/sec ±1.09% (90 runs sampled)
bytearray encode decode x 50,761 ops/sec ±5.09% (63 runs sampled)
```

#### not supported

- special primitives: nan, -infinity, +infinity
- special containers: sets, maps
- dates, other typedarrays, buffers, arraybuffers
- dictionaries, extensions, timestamps

--- 

#### for streaming (wip)

- runs in browser and nodejs
- encode/decode speed & size
- use of dictionaries
- streamable, unlike json
- easy to implement, unlike messagepack
- covers the most basic use cases
- streaming data compatible
 - e.g. writing / reading to files
 - e.g. write to xyz files until 1gb, then move to next 1gb file
 - e.g. read from xyz files, pause every 1000 items

#### references

- https://github.com/msgpack/msgpack/blob/master/spec.md
- https://developers.google.com/protocol-buffers/docs/proto
- https://nodejs.org/api/stream.html
- https://nodejs.org/api/buffer.html
- https://github.com/fabeuluci/text-coder
- https://github.com/fabeuluci/uint8array-utils
- https://github.com/fabeuluci/buffer-stream-js/
- https://github.com/feross/buffer/blob/master/index.js
- https://github.com/nodejs/node/blob/master/lib/internal/buffer.js
- https://github.com/davalapar/what-the-pack/blob/master/index.js
- https://stackoverflow.com/a/14071518/14051308
- https://stackoverflow.com/a/37902334/14051308
- https://caniuse.com/?search=TextDecoder
- https://github.com/mongodb/js-bson

#### compression

- compress/decompress speed & algorithms, e.g. gzip / brotli
- https://github.com/lz4/lz4
- https://github.com/facebook/zstd
- https://github.com/google/brotli
- https://nodejs.org/api/zlib.html
- https://github.com/nodeca/pako

#### encryption

- encrypt/decrypt speed & algorithms
- scrypt, x25519-chacha20-poly1305, x25519-xsalsa20-poly1305
- https://nodejs.org/api/crypto.html
- https://github.com/dchest/tweetnacl-js
- http://nacl.cr.yp.to/index.html
- https://latacora.micro.blog/2018/04/03/cryptographic-right-answers.html
- https://www.derpturkey.com/chacha20poly1305-aead-with-node-js/
- https://blog.filippo.io/the-scrypt-parameters/
- https://github.com/joshxyzhimself/notes