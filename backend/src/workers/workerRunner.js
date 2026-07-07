import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs a worker thread with the given worker file and payload.
 * @param {string} workerName - The name of the worker file in the workers directory (e.g., 'geofence.worker.js').
 * @param {any} payload - The payload to send to the worker.
 * @returns {Promise<any>} Resolves with the result of the worker execution.
 */
export function runWorker(workerName, payload) {
  return new Promise((resolve, reject) => {
    try {
      const workerPath = path.resolve(__dirname, workerName);
      const worker = new Worker(workerPath);

      // Listen for message from the worker
      worker.on("message", (message) => {
        if (message.success) {
          resolve(message.result);
        } else {
          reject(new Error(message.error || "Worker execution failed"));
        }
        worker.terminate();
      });

      // Handle worker runtime errors
      worker.on("error", (err) => {
        reject(err);
        worker.terminate();
      });

      // Handle unexpected worker exits
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });

      // Post the payload to start processing
      worker.postMessage(payload);
    } catch (err) {
      reject(err);
    }
  });
}
