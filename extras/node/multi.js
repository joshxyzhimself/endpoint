
const os = require('os');
const assert = require('assert');
const cluster = require('cluster');

const MessageTypes = {
  Initialize: 0,
  Request: 1,
  Response: 2,
  Exit: 3,
};

function multi() {

  this.concurrency = os.cpus().length;
  this.concurrency2 = 1;

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
      assert(typeof this.concurrency === 'number' && Number.isFinite(this.concurrency) === true && this.concurrency > 0);
      assert(typeof this.concurrency2 === 'number' && Number.isFinite(this.concurrency2) === true && this.concurrency2 > 0);

      const init_data = await this.on_main_init();

      const workers = [];

      for (let i = 0, l = this.concurrency; i < l; i += 1) {
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
          const { type } = message;

          switch (type) {
            case MessageTypes.Request: {
              let task;
              try {
                task = await this.on_task_request();
              } catch (e) {
                console.error(e);
              }
              if (task === undefined) {
                worker.send({ type: MessageTypes.Exit });
              } else {
                worker.send({ type: MessageTypes.Response, task });
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
        type: MessageTypes.Initialize,
        worker_id,
        init_data,
      }));
    } else if (cluster.isWorker === true) {
      let worker_id = null;
      let concurrent = 0;
      process.on('message', async (message) => {
        const { type } = message;
        switch (type) {
          case MessageTypes.Initialize: {
            const { init_data } = message;

            worker_id = message.worker_id;

            try {
              await this.on_worker_init(init_data, worker_id);
            } catch (e) {
              console.error(e);
            }

            for (let i = 0, l = this.concurrency2; i < l; i += 1) {
              concurrent += 1;
              process.send({ type: MessageTypes.Request });
            }

            break;
          }
          case MessageTypes.Response: {
            const { task } = message;
            try {
              if (typeof global.gc === 'function') {
                global.gc();
              }
              await this.on_task_response(task, worker_id);
            } catch (e) {
              console.error(e);
            }
            process.send({ type: MessageTypes.Request });
            break;
          }
          case MessageTypes.Exit: {
            concurrent -= 1;
            if (concurrent === 0) {
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