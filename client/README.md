## EndpointClient

#### Usage

```js
const EndpointClient = require('endpoint/client');

await EndpointClient.request({

  // Optional string, abort controller id
  controller_id: String?,

  // Required string, one of HEAD, GET, POST, PUT, DELETE
  method: String,

  // Required string
  url: String,

  // Optional object, will append as url query
  query: Object?,

  // Optional object, will send as "application/json"
  json: Object?,

  // Optional array of files, compatible with "json"
  // Will send as multipart/form-data"
  files: Array?,

  // Optional object, not compatible with "json" or "files"
  // Will send as "application/x-www-form-urlencoded"
  urlencoded: Object?,
});
```


## EndpointClient2

#### Usage

```js
const EndpointClient = require('endpoint/client2');

// sets key_hex and secret_hex in SessionStorage
EndpointClient.auth(username: String, password: String);

// deletes key_hex and secret_hex in SessionStorage
EndpointClient.deauth();

await EndpointClient.request({

  // Required string, one of HEAD, GET, POST, PUT, DELETE
  method: String,

  // Required string
  url: String,

  // Optional object, will append as url query
  query: Object?,

  // Optional object, will send as "application/json"
  json: Object?,

  // Optional array of files, compatible with "json"
  // Will send as multipart/form-data"
  files: Array?,

  // Optional object, not compatible with "json" or "files"
  // Will send as "application/x-www-form-urlencoded"
  urlencoded: Object?,
});
```

#### Testing

```
npx rollup -c ./client2/rollup.config.js
```

```
node ./server/index.demo.js 
```

```
http://localhost:8080/
http://localhost:8080/asd
http://localhost:8080/favicon.ico
http://localhost:8080/images/capoo.jpeg
http://localhost:8080/auth-test
```
