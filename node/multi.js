
const os = require('os');
const cluster = require('cluster');
const assert = require('../core/assert');

const MessageTypes = {
  WorkerInit: 0,
  TaskRequest: 1,
  TaskResponse: 2,
  WorkerExit: 3,
};

function multi () {

  this.process_concurrency = os.cpus().length;
  this.task_concurrency = 1;

  if (cluster.isMaster === true) {
    this.on_main_init = async () => console.log('on_main_init');
    this.on_task_request = async () => console.log('on_task_request');
    this.on_task_complete = async () => console.log('on_task_complete');
  } else if (cluster.isWorker === true) {
    this.on_worker_init = async () => console.log('on_worker_init');
    this.on_task_response = async () => console.log('on_task_response');
    this.on_worker_exit = async () => console.log('on_worker_exit');
  }

  this.initialize = async () => {
    if (cluster.isMaster === true) {
      assert(typeof this.process_concurrency === 'number' && Number.isFinite(this.process_concurrency) === true && this.process_concurrency > 0);
      assert(typeof this.task_concurrency === 'number' && Number.isFinite(this.task_concurrency) === true && this.task_concurrency > 0);

      const init_data = await this.on_main_init();

      const workers = [];

      for (let i = 0, l = this.process_concurrency; i < l; i += 1) {
        const worker = cluster.fork();
        worker.on('error', console.error);
        worker.on('exit', async () => {
          workers.splice(workers.indexOf(worker), 1);
          if (workers.length === 0) {
            try {
              await this.on_task_complete();
            } catch (e) {
              console.error(e);
            }
          }
        });
        worker.on('message', async (message) => {
          assert(message instanceof Object);
          assert(typeof message.type === 'number');

          const { type } = message;

          switch (type) {
            case MessageTypes.TaskRequest: {
              let task;
              try {
                task = await this.on_task_request();
              } catch (e) {
                console.error(e);
              }
              if (task === undefined) {
                worker.send({ type: MessageTypes.WorkerExit });
              } else {
                worker.send({ type: MessageTypes.TaskResponse, task });
              }
              break;
            }
            default: {
              break;
            }
          }
        });
        workers.push(worker);
      }
      workers.forEach((worker, worker_id) => worker.send({
        type: MessageTypes.WorkerInit,
        worker_id,
        init_data,
      }));
    } else if (cluster.isWorker === true) {
      let worker_id = null;
      let concurrent_tasks = 0;
      process.on('message', async (message) => {
        assert(message instanceof Object);
        assert(typeof message.type === 'number');

        const { type } = message;

        switch (type) {
          case MessageTypes.WorkerInit: {
            assert(message.init_data === undefined || message.init_data instanceof Object);
            assert(typeof message.worker_id === 'number');

            const { init_data } = message;

            worker_id = message.worker_id;

            try {
              await this.on_worker_init(init_data, worker_id);
            } catch (e) {
              console.error(e);
            }

            for (let i = 0, l = this.task_concurrency; i < l; i += 1) {
              concurrent_tasks += 1;
              process.send({ type: MessageTypes.TaskRequest });
            }

            break;
          }
          case MessageTypes.TaskResponse: {
            const { task } = message;
            try {
              if (global.gc instanceof Function) {
                global.gc();
              }
              await this.on_task_response(task, worker_id);
            } catch (e) {
              console.error(e);
            }
            process.send({ type: MessageTypes.TaskRequest });
            break;
          }
          case MessageTypes.WorkerExit: {
            concurrent_tasks -= 1;
            if (concurrent_tasks === 0) {
              try {
                await this.on_worker_exit(worker_id);
              } catch (e) {
                console.error(e);
              }
              process.nextTick(process.exit);
            }
            break;
          }
          default: {
            break;
          }
        }
      });
    }
  };
}

module.exports = multi;