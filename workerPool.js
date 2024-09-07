//This class offers many methods for higher granularity

//This class offers two approaches:
//1. limit workers to 1:1 ratio with available cpu cores -1: functionality offered by launchMachineMaxWorkers()
//2. Allow no upper boundary to number of workers requested, implement worker rotation, which will increase overheads due to increased memory
//   required to store each worker instance and increased execution time due to having to switch between workers and contexts.

class WorkerPool {
  #availableWorkers = [];
  #activeWorkers = [];
  #idleWorkers = [];
  #taskData = [];
  #numWorkers;
  #workerScript;
  #localCores_CPU = navigator.hardwareConcurrency - 1;

  constructor(workerScript, numWorkers) {
    if (numWorkers < 1)
      throw new Error(
        "Illegal Argument Exception: Please enter a value greater than zero."
      );
    this.#workerScript = workerScript;
    this.#numWorkers = numWorkers;
    this.#initWorkers();
  }
  //Creates workers based on the worker script passed in to the object instance, adds these workers to available workers array.
  //NOTE: Available workers = number of workers specified during instantiation
  //      Active workers = number of workers chosen to utilise during running tasks
  //You can create more workers than you aim to use
  #initWorkers() {
    const onComplete = (workerStatus, worker) => {
      if (workerStatus === "done" || workerStatus === "error") {
        this.#idleWorkers.push(worker);
      }
    };

    for (let i = 0; i < this.#numWorkers; i++) {
      const worker = new Worker(this.#workerScript);
      worker.onmessage = function (event) {
        const { status } = event.data;
        onComplete(status, worker);
      };
      worker.onerror = function (error) {
        const { status, cause } = error.data;
        console.error("Error occurred in worker:");
        console.error("Message:", error.message);
        console.error("Filename:", error.filename);
        console.error("Line number:", error.lineno);
        console.log("Error message from worker: " + cause);
        onComplete(status, worker);
      };
      this.#availableWorkers.push(worker);
    }
  }
  //Add tasks to a task queue where they await execution
  #initTasks(taskData) {
    this.#taskData.push(taskData);
  }
  //Choose the number of workers that were initialised that you would like to make use of
  #launchWorkers(launchNumWorkers = this.#numWorkers) {
    for (let i = 0; i < launchNumWorkers; i++) {
      const launch = this.#availableWorkers[i];
      this.#activeWorkers.push(launch);
    }
  }
  //Only adds the maximum amount of workers your CPU can run in parallel to the active workers queue. This is a 1:1 ratio, one CPU core = one web worker,
  //so max webworkers are local machine cores -1 (main thread requires its own core)
  #launchMachineMaxWorkers() {
    this.#launchWorkers(this.#localCores_CPU);
  }

  //runTasks() should:
  //1. if tasks > available workers:
  //      post a task to each available worker, wait for 'done' signal, upon 'done' add to idle tasks.
  //      if idle workers>0 and left over tasks>0, distribute remaining tasks amongst idle workers and repeat
  //      when left over tasks = 0: terminate all workers
  //2. if available workers >= tasks:
  //      distribute all tasks
  //      then terminate all workers when done
  #runTasks() {
    const activeWorkers = this.#activeWorkers;
    const idleWorkers = this.#idleWorkers;
    const taskData = this.#taskData;
    const numTasks = this.#taskData.length;
    const numActiveWorkers = this.#activeWorkers.length;

    function addTasks(workers, integer) {
      for (let i = 0; i < integer; i++) {
        try {
          workers[i].postMessage(taskData.pop());
        } catch (error) {
          console.error(`Error posting task to worker ${i}: `, error);
          taskData.push(task); // push task back to task queue
        }
      }
    }
    const intervalId = setInterval(() => {
      if (taskData.length != 0 && idleWorkers.length != 0)
        addTasks(idleWorkers, idleWorkers.length);
      if (taskData.length === 0 && idleWorkers.length === numActiveWorkers) {
        this.#terminateAll();
        clearInterval(intervalId);
      }
    }, 100);

    if (numTasks > numActiveWorkers) {
      addTasks(activeWorkers, numActiveWorkers);
      intervalId();
    } else {
      addTasks(activeWorkers, numTasks);
      intervalId();
    }
  }
  //Must terminate workers to prevent memory leaks
  //This clears all worker queues so after calling terminate() the #initWorkers method needs to be manually invoked.
  #terminateAll() {
    this.#availableWorkers.forEach((worker) => worker.terminate());
    this.#availableWorkers = [];
    this.#activeWorkers = [];
    this.#idleWorkers = [];
    this.#taskData = [];
  }
}
