
#### supported

- primitives: null, boolean, numbers, strings
- special primitives: nan, -infinity, +infinity
- containers: arrays, objects
- special containers: sets, maps
- raw data: binary

#### not supported

- dates, bigints, typedarrays, buffers, arraybuffers
- extensions, timestamps

#### goals

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
- https://github.com/msgpack/msgpack/blob/master/spec.md
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