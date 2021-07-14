
// @ts-check


const fs = require('fs');
const path = require('path');
const process = require('process');
const undici2 = require('./undici2');


const image_file_path = path.join(process.cwd(), '/node/undici2.test.jpg');


process.nextTick(async () => {


  const json_get_response = await undici2.json_get(
    'https://ipinfo.io/json?token=24685cdbd4a1ac',
    {},
  );
  console.log(json_get_response);


  const json_post_response = await undici2.json_post(
    'https://ipinfo.io/batch?token=24685cdbd4a1ac',
    {},
    ['8.8.8.8/country', '8.8.4.4/country'],
  );
  console.log(json_post_response);


  const form_post_response = await undici2.form_post(
    'https://api.imgur.com/3/upload',
    {
      authorization: 'Client-ID 09fac1ab310235c',
    },
    [
      {
        name: 'title',
        value: 'test_title',
      },
      {
        name: 'description',
        value: 'test_description',
      },
      {
        name: 'type',
        value: 'file',
      },
      {
        name: 'name',
        value: 'undici2.test.jpg',
      },
      {
        name: 'image',
        value: fs.readFileSync(image_file_path),
        filename: 'undici2.test.jpg',
      },
    ],
  );
  console.log(form_post_response);


});