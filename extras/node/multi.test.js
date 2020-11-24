const cluster = require('cluster');
const multi = require('./multi');

/**
 * - if --expose-gc passed, clears garbage collector
 * - "concurrency" for amount of processes
 * - "concurrency2" for amount of concurrent tasks per process
 * - main hooks: on_main_init, on_task_request, on_task_complete
 * - worker hooks: on_worker_init, on_task_response, on_worker_exit
 */

const instance = new multi();

if (cluster.isMaster === true) {
  // instance.concurrency = 100;
  // instance.concurrency2 = 100;

  let i = 0;

  // takes nothing; returns init_data
  instance.on_main_init = async () => {
    console.log('on_main_init');
    return { foo: 'bar' };
  };

  // takes nothing; returns task or nothing
  instance.on_task_request = async () => {
    console.log('on_task_request');
    if (i < 50) {
      console.log(`returning task, ${50 - i} tasks left.`);
      i += 1;
      return {};
    }
    return undefined;
  };

  // takes nothing; returns nothing
  instance.on_task_complete = async () => {
    console.log('on_task_complete');
  };
} else if (cluster.isWorker === true) {
  const worker_context = {};

  // takes init_data; returns nothing
  instance.on_worker_init = async (init_data, worker_id) => {
    console.log(worker_id, 'on_worker_init');
    console.log(worker_id, JSON.stringify({ init_data, worker_id }));
    Object.assign(worker_context, init_data);
  };

  // takes task; returns nothing
  instance.on_task_response = async (task, worker_id) => {
    console.log(worker_id, 'on_task_response');
    console.log(worker_id, JSON.stringify({ task, worker_context }));
    await new Promise((resolve) => setTimeout(resolve, 1000 * Math.random()));
  };

  // takes nothing; returns nothing
  instance.on_worker_exit = async (worker_id) => {
    console.log(worker_id, 'on_worker_exit');
  };

}

instance.initialize();