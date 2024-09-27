let soloWebWorker;
let memoryGraphCtx;
let memoryUsageChart;
let intervalId = null;

const ImportConstants = async () => {
  const CONSTANTS = await import("./mandelBrotConfig.js");
  return { CONSTANTS: CONSTANTS.default };
};

let time = 0;
const timeStamps = [];
let totalHeapSize = performance.memory.jsHeapSizeLimit;
const usedHeapMemory = [];
const allocatedHeapMemory = []; //Changes throughout runtime as garbage collection occurs
const percentageOfTotalHeapMemory = [];

function calculatePercentageOfTotalHeapMemory() {
  percentageOfTotalHeapMemory.length = 0;
  for (let i = 0; i < usedHeapMemory.length; i++) {
    let percentageUsed = (usedHeapMemory[i] / allocatedHeapMemory[i]) * 100;
    percentageOfTotalHeapMemory.push(percentageUsed);
  }
}

function clearUsageData() {
  time = 0;
  timeStamps.length = 0;
  usedHeapMemory.length = 0;
  allocatedHeapMemory.length = 0;
  percentageOfTotalHeapMemory.length = 0;
}

if (performance.memory) {
  memoryGraphCtx = document.getElementById("memory-graph-chart");
  let data = {
    labels: timeStamps,
    datasets: [
      {
        label: "Used Heap Memory",
        data: usedHeapMemory,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
      {
        label: "Allocated Heap Memory",
        data: allocatedHeapMemory,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
      {
        label: "Used Heap Memory as a Percentage of Allocated Heap Memory",
        data: percentageOfTotalHeapMemory,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  };
  let config = {
    type: "line",
    data: data,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top", color: "black" },
        title: {
          color: "black",
          display: true,
          text: `Memory Usage (by JS Engine heap) of App against number of tasks created, web workers created and web workers utilised as a function of time:`,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "time (ms)", color: "black" },
          ticks: {
            color: "black", // Set tick labels color to black
          },
        },
        y: {
          ticks: {
            color: "black", // Set tick labels color to black
          },
          title: {
            display: true,
            text: "Memory Usage (MB)",
            color: "black",
          },
          beginAtZero: true,
        },
      },
    },
  };

  memoryUsageChart = new Chart(memoryGraphCtx, config);
} else {
  memoryGraphCtx.remove();
  const notAvailable = document.createElement("div");
  notAvailable.style.width = "500px";
  notAvailable.style.height = "500px";
  notAvailable.style.display = "flex";
  notAvailable.style.justifyContent = "center";
  notAvailable.style.alignItems = "center";
  notAvailable.style.margin = "20%";
  notAvailable.textContent =
    "This function is not available in certain browsers including Firefox and Safari. Please open this site in Chrome. ";
  const errorMessage = document
    .getElementById("memory-graph")
    .appendChild(notAvailable);
}

function logMemoryUsage() {
  if (performance.memory) {
    const memoryInfo = performance.memory;
    const usedMB = (memoryInfo.usedJSHeapSize / 1048576).toFixed(2); // Convert to MB
    const totalMB = (memoryInfo.totalJSHeapSize / 1048576).toFixed(2); // Convert to MB
    usedHeapMemory.push(usedMB);
    allocatedHeapMemory.push(totalMB);
    time += 100;
    timeStamps.push(time);
    calculatePercentageOfTotalHeapMemory();
    memoryUsageChart.update();
  }
}

export default async function main() {
  const startTime = Date.now();
  const executionTimeElement = document.getElementById("render-time-value");
  const { CONSTANTS } = await ImportConstants();
  let offscreen;

  // Terminate the existing worker if it exists
  if (soloWebWorker) {
    clearInterval(intervalId);
    soloWebWorker.terminate();
    console.log("Terminated existing worker.");

    // Remove the old canvas if it exists
    const oldCanvas = document.getElementById("main-canvas");
    if (oldCanvas) {
      oldCanvas.remove();
      console.log("Removed old canvas.");
    }

    // Create a new canvas element and append it to the DOM
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "main-canvas";
    newCanvas.width = 500;
    newCanvas.height = 500;
    document.getElementsByClassName("main-panel")[0].appendChild(newCanvas);
    console.log("Created new canvas.");
    // Transfer control to an offscreen canvas
    offscreen = newCanvas.transferControlToOffscreen();
  } else {
    const htmlCanvas = document.getElementById("main-canvas");
    offscreen = htmlCanvas.transferControlToOffscreen();
  }

  if (window.Worker) {
    // Reuse the global soloWebWorker variable
    soloWebWorker = new Worker("mainWorker.js"); // Reassign to global variable

    // Pass the offscreen canvas to the worker
    soloWebWorker.postMessage({ canvas: offscreen, constants: CONSTANTS }, [
      offscreen,
    ]);
    // clearUsageData();
    // Log memory usage every 5 seconds
    intervalId = setInterval(logMemoryUsage, 100);

    soloWebWorker.onmessage = (event) => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Interval cleared.");
        console.log(usedHeapMemory);
      }
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      executionTimeElement.textContent = executionTime + " ms";

      clearUsageData();
      CONSTANTS.ERROR_COUNT = event.data.errorCount;
      console.log("hi: " + event.data);
    };
  }
}
main();
