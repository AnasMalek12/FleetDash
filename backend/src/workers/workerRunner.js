import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerPool {
  constructor(workerName, size) {
    this.workerName = workerName;
    this.size = size;
    this.workers = [];      // Track all worker instances
    this.idleWorkers = [];  // Track idle worker instances
    this.queue = [];        // Queue of pending tasks: { payload, resolve, reject }
    this.isClosing = false; // Flag to indicate if pool is shutting down
  }

  // Create a new worker thread
  createWorker() {
    const workerPath = path.resolve(__dirname, this.workerName);
    const worker = new Worker(workerPath);

    worker.isBusy = false;
    worker.currentTask = null;

    const handleMessage = (message) => {
      const task = worker.currentTask;
      worker.currentTask = null;
      worker.isBusy = false;

      if (task) {
        if (message.success) {
          task.resolve(message.result);
        } else {
          task.reject(new Error(message.error || "Worker execution failed"));
        }
      }

      this.releaseWorker(worker);
    };

    const handleError = (err) => {
      const task = worker.currentTask;
      worker.currentTask = null;
      worker.isBusy = false;

      if (task) {
        task.reject(err);
      }

      this.removeWorker(worker);
      if (!this.isClosing) {
        this.createWorker();
      }
    };

    const handleExit = (code) => {
      const task = worker.currentTask;
      worker.currentTask = null;
      worker.isBusy = false;

      if (task && code !== 0) {
        task.reject(new Error(`Worker stopped with exit code ${code}`));
      }

      this.removeWorker(worker);
      // Re-create worker to maintain pool size if not intentionally closed
      if (!this.isClosing && this.workers.length < this.size) {
        this.createWorker();
      }
    };

    worker.on("message", handleMessage);
    worker.on("error", handleError);
    worker.on("exit", handleExit);

    this.workers.push(worker);
    this.idleWorkers.push(worker);
    this.processQueue();
  }

  removeWorker(worker) {
    const idx = this.workers.indexOf(worker);
    if (idx !== -1) {
      this.workers.splice(idx, 1);
    }
    const idleIdx = this.idleWorkers.indexOf(worker);
    if (idleIdx !== -1) {
      this.idleWorkers.splice(idleIdx, 1);
    }
    return worker.terminate();
  }

  releaseWorker(worker) {
    if (this.queue.length > 0) {
      const task = this.queue.shift();
      worker.isBusy = true;
      worker.currentTask = task;
      worker.postMessage(task.payload);
    } else {
      this.idleWorkers.push(worker);
    }
  }

  run(payload) {
    if (this.isClosing) {
      return Promise.reject(new Error("Worker pool is closed"));
    }

    return new Promise((resolve, reject) => {
      const task = { payload, resolve, reject };

      if (this.idleWorkers.length > 0) {
        const worker = this.idleWorkers.pop();
        worker.isBusy = true;
        worker.currentTask = task;
        worker.postMessage(payload);
      } else if (this.workers.length < this.size) {
        this.queue.push(task);
        this.createWorker();
      } else {
        this.queue.push(task);
      }
    });
  }

  processQueue() {
    while (this.queue.length > 0 && this.idleWorkers.length > 0) {
      const task = this.queue.shift();
      const worker = this.idleWorkers.pop();
      worker.isBusy = true;
      worker.currentTask = task;
      worker.postMessage(task.payload);
    }
  }

  async close() {
    this.isClosing = true;
    const promises = [];
    const activeWorkers = [...this.workers];
    for (const worker of activeWorkers) {
      promises.push(this.removeWorker(worker));
    }
    for (const task of this.queue) {
      task.reject(new Error("Worker pool closed"));
    }
    this.queue = [];
    await Promise.all(promises);
  }
}

// Registry to hold pools for different worker files
const pools = new Map();
const POOL_SIZE = os.cpus().length || 4;

/**
 * Runs a worker thread with the given worker file and payload.
 * Uses a worker thread pool to reuse threads.
 * @param {string} workerName - The name of the worker file in the workers directory.
 * @param {any} payload - The payload to send to the worker.
 * @returns {Promise<any>} Resolves with the result of the worker execution.
 */
export function runWorker(workerName, payload) {
  let pool = pools.get(workerName);
  if (!pool) {
    pool = new WorkerPool(workerName, POOL_SIZE);
    pools.set(workerName, pool);
  }
  return pool.run(payload);
}

/**
 * Closes all active worker thread pools.
 * Essential for testing environment to avoid hanging processes.
 */
export async function closeWorkerPools() {
  const promises = [];
  for (const [name, pool] of pools.entries()) {
    promises.push(pool.close());
  }
  await Promise.all(promises);
  pools.clear();
}
