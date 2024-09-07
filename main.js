const htmlCanvas = document.getElementById("main-canvas");
const offscreen = htmlCanvas.transferControlToOffscreen();

if (window.Worker) {
    //initialise soloWebWorker
  const soloWebWorker = new Worker("soloWorker.js");
  soloWebWorker.postMessage({ canvas: offscreen }, [offscreen]);
  //initialise pool of webWorkers with workerPool class
  
}
