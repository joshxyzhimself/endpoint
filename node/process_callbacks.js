
const process = require('process');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

/**
 * @type {Map<string, Function>}
 */
const process_callbacks = new Map();

rl.on('line', async (input) => {
  if (process_callbacks.has(input) === true) {
    const callback = process_callbacks.get(input);
    await callback();
    if (input === 'exit') {
      process.exit(0);
    }
  }
});

// https://nodejs.org/api/os.html#os_signal_constants
// https://nodejs.org/api/process.html#process_signal_events
// https://nodejs.org/api/process.html#process_exit_codes

const signals = [
  'SIGINT', // Sent to indicate when a user wishes to interrupt a process (Ctrl+C).
  'SIGTERM', // Sent to a process to request termination.
  'SIGHUP', // Sent to indicate when a controlling terminal is closed or a parent process exits.
  'SIGQUIT', // Sent to indicate when a user wishes to terminate a process and perform a core dump.
];

signals.forEach((signal) => {
  process.on(signal, () => {
    if (process_callbacks.has('exit') === true) {
      const exit_callback = process_callbacks.get('exit');
      exit_callback();
    }
    process.exit(0);
  });
});

process.on('exit', () => {
  if (process_callbacks.has('exit') === true) {
    const exit_callback = process_callbacks.get('exit');
    exit_callback();
  }
});

module.exports = process_callbacks;