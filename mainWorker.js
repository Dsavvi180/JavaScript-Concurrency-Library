const Import = async () => {
  const CONSTANTS = await import("./mandelBrotConfig.js");
  const workerPool = await import("./workerPool.js");
  return { workerPool, CONSTANTS: CONSTANTS.default };
};

//Handles spawning of subworkers
self.onmessage = async (event) => {
  let errorCount;
  const {
    workerPool: { default: WorkerPool },
    oldConst,
  } = await Import();
  const CONSTANTS = event.data.constants;
  const canvas = event.data.canvas;
  const ctx = canvas.getContext("2d");
  const imageBitMap = await canvas.transferToImageBitmap();
  try {
    console.log(CONSTANTS);
    const numWebWorkersToCreate = CONSTANTS.CREATE_WORKERS;
    const pool = new WorkerPool(
      "subWorker.js",
      numWebWorkersToCreate,
      renderBitMaps,
      ctx
    );
    const taskQueue = [];
    for (let i = 0; i < CONSTANTS.IMAGE_SIZE; i += CONSTANTS.BLOCKSIZE) {
      for (let j = 0; j < CONSTANTS.IMAGE_SIZE; j += CONSTANTS.BLOCKSIZE) {
        const transferObject = {
          constants: CONSTANTS,
          bitMap: imageBitMap,
          coordinates: { i, j },
        };

        taskQueue.push(transferObject);
      }
    }

    taskQueue.forEach((task) => {
      pool.initTasks(task);
    });
    console.log("Number of tasks created: " + taskQueue.length);
    console.log("Number of webworkers created: " + numWebWorkersToCreate);
    console.log(
      "Max web workers in parallel possible: " +
        (navigator.hardwareConcurrency - 1)
    );
    // pool.launchMachineMaxWorkers();
    pool.launchWorkers(CONSTANTS.LAUNCH_WORKER);
    pool
      .runTasks()
      .then((result) => {
        errorCount = result;
        console.log("Subworker error count: " + errorCount);
        self.postMessage({ status: "done", errorCount: errorCount });
        pool.terminateAll(); //ensure all workers are terminated to prevent memory leak
        console.log("All Workers Terminated.");
      })
      .catch((error) => {
        console.log("Fatal error running tasks: " + error);
        pool.terminateAll(); //ensure all workers are terminated to prevent memory leak
      });
  } catch (error) {
    // self.postMessage({ status: "error", cause: error });
    // pool.terminateAll(); //ensure all workers are terminated to prevent memory leak
  }
};

const renderBitMaps = (ctx, bitMap) => {
  ctx.drawImage(bitMap, 0, 0);
  console.log("received bitmap from subworker: " + bitMap);
};
