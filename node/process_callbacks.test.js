
/**
 * Notes
 * - 'exit' listener must be a sync function
 * - All other listeners can be async or sync functions
 */

const fs = require('fs');
const path = require('path');
const process_callbacks = require('./process_callbacks');

process_callbacks.set('exit', () => {
  fs.mkdirSync(path.join(process.cwd(), 'temp'), { recursive: true });
  fs.writeFileSync(path.join(process.cwd(), 'temp', 'exit.txt'), 'exit');
});