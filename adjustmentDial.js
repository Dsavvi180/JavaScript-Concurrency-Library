const ImportConstants = async () => {
  const CONSTANTS = await import("./mandelBrotConfig.js");

  return { CONSTANTS: CONSTANTS.default };
};
const ImportMain = async () => {
  const main = await import("./main.js");

  return main;
};

const maxCPU = document.getElementById("max-cpu");
maxCPU.textContent = navigator.hardwareConcurrency
  ? navigator.hardwareConcurrency - 1
  : "not available";

window.addEventListener("DOMContentLoaded", async () => {
  const main = await ImportMain();
  const { CONSTANTS } = await ImportConstants();
  const blocksizeIncrement = document.getElementById("blocksize-increment");
  const blocksizeDecrement = document.getElementById("blocksize-decrement");
  const mandelbrotIncrement = document.getElementById("mandelbrot-increment");
  const mandelbrotDecrement = document.getElementById("mandelbrot-decrement");

  const tasksCreated = document.getElementById("tasks-created");

  const color = document.getElementById("colorful");
  const monotone = document.getElementById("monotone");

  color.addEventListener("click", () => {
    CONSTANTS.COLOR = "colorful";
    console.log("switching color to colorful");
    main.default();
  });
  monotone.addEventListener("click", () => {
    CONSTANTS.COLOR = "monotone";
    console.log("switching color to monotone");
    main.default();
  });

  // Handle increment and decrement with continuous adjustment on holding the button
  setupContinuousAdjustment(blocksizeIncrement, 1, "blocksize", tasksCreated);
  setupContinuousAdjustment(blocksizeDecrement, -1, "blocksize", tasksCreated);
  setupContinuousAdjustment(mandelbrotIncrement, 1, "mandelbrot", undefined);
  setupContinuousAdjustment(mandelbrotDecrement, -1, "mandelbrot", undefined);

  // Initialize the adjustment dials for blocksize and mandelbrot size
  initializeAdjustmentDial(
    "adjustment-dial-1",
    "inner-spectrum-1",
    "num-blocksize",
    "blocksize",
    tasksCreated
  );
  initializeAdjustmentDial(
    "adjustment-dial-2",
    "inner-spectrum-2",
    "mandelbrot-size",
    "mandelbrot",
    undefined
  );
  const createWorkers = document.getElementById("input-1");
  createWorkers.addEventListener("input", () => {
    let floored = Math.floor(createWorkers.value);
    createWorkers.value = floored;
    CONSTANTS.CREATE_WORKERS = Number(createWorkers.value);
    main.default();
  });
  const utiliseWorkers = document.getElementById("input-2");
  utiliseWorkers.addEventListener("input", () => {
    let floored = Math.floor(utiliseWorkers.value);
    utiliseWorkers.value = floored;
    CONSTANTS.LAUNCH_WORKER = Number(utiliseWorkers.value);
    main.default();
  });
});

function setupContinuousAdjustment(
  button,
  increment,
  type,
  tasksCreated = null
) {
  let intervalId;
  button.addEventListener("mousedown", () => {
    adjustValue(increment, type, tasksCreated); // First click increments or decrements once
    intervalId = setInterval(
      () => adjustValue(increment, type, tasksCreated),
      100
    ); // Adjust every 100ms while holding
  });

  button.addEventListener("mouseup", () => clearInterval(intervalId));
  button.addEventListener("mouseleave", () => clearInterval(intervalId)); // Stop when mouse leaves the button
}

async function adjustValue(change, type, tasksCreated = null) {
  const { CONSTANTS } = await ImportConstants();
  const MAX_BLOCKS = 500;
  const MAX_SIZE = 20;
  const MIN_SIZE = 0.001;

  if (type === "blocksize") {
    const blockElementDisplay = document.getElementById("num-blocksize");
    const adjustmentDial = document.getElementById("adjustment-dial-1");
    const parent = document.getElementById("inner-spectrum-1");

    const currentBlocksize = parseInt(blockElementDisplay.textContent, 10);
    let newBlocksize = currentBlocksize + change;

    // Ensure blocksize stays within valid bounds
    if (newBlocksize < 1) newBlocksize = 1;
    if (newBlocksize > MAX_BLOCKS) newBlocksize = MAX_BLOCKS;

    blockElementDisplay.textContent = newBlocksize;
    CONSTANTS.BLOCKSIZE = newBlocksize;

    // Update tasks created
    if (tasksCreated) {
      tasksCreated.textContent = Math.floor(
        (MAX_BLOCKS * MAX_BLOCKS) / (newBlocksize * newBlocksize)
      );
    }

    // Update dial position
    const position = (newBlocksize / MAX_BLOCKS) * 100;
    adjustmentDial.style.left = `${position}%`;
    parent.style.background = `linear-gradient(90deg, rgb(35, 35, 35) 0%, rgb(35, 35, 35) ${
      position + 4
    }%, white ${position + 4}%, white 100%)`;
  } else if (type === "mandelbrot") {
    const mandelbrotElementDisplay = document.getElementById("mandelbrot-size");
    const adjustmentDial = document.getElementById("adjustment-dial-2");
    const parent = document.getElementById("inner-spectrum-2");

    const currentMandelbrotSize = parseFloat(
      mandelbrotElementDisplay.textContent
    );
    let newMandelbrotSize;

    // Adjust based on the current range (between 0.001 and 1 increments by 0.001, then by 1)
    if (currentMandelbrotSize < 1) {
      newMandelbrotSize = currentMandelbrotSize + change * 0.001; // Increments by 0.001
      if (newMandelbrotSize >= 1) newMandelbrotSize = 1; // Stop at 1
    } else {
      newMandelbrotSize = currentMandelbrotSize + change; // Increments by 1 above 1
    }

    // Ensure mandelbrot size stays within the bounds of MIN_SIZE to MAX_SIZE
    if (newMandelbrotSize < MIN_SIZE) newMandelbrotSize = MIN_SIZE;
    if (newMandelbrotSize > MAX_SIZE) newMandelbrotSize = MAX_SIZE;

    // Update the displayed mandelbrot size
    mandelbrotElementDisplay.textContent = newMandelbrotSize.toFixed(3);
    CONSTANTS.MANDELBROT_SIZE = newMandelbrotSize;

    // Calculate the new position for the dial based on mandelbrot size
    let position;
    if (newMandelbrotSize <= 1) {
      // Scale the first 50% from 0.001 to 1
      position = ((newMandelbrotSize - MIN_SIZE) / (1 - MIN_SIZE)) * 50;
    } else {
      // Scale the second 50% from 1 to 20
      position = 50 + ((newMandelbrotSize - 1) / (MAX_SIZE - 1)) * 50;
    }

    // Move the dial to the corresponding position
    adjustmentDial.style.left = `${position}%`;
    parent.style.background = `linear-gradient(90deg, rgb(35, 35, 35) 0%, rgb(35, 35, 35) ${
      position + 4
    }%, white ${position + 4}%, white 100%)`;

    // **Recalculate related CONSTANTS** after adjusting Mandelbrot size
    CONSTANTS.X_START = CONSTANTS.X_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
    CONSTANTS.Y_START = CONSTANTS.Y_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
    CONSTANTS.SCALE = CONSTANTS.MANDELBROT_SIZE / CONSTANTS.IMAGE_SIZE;
  }

  // Reprocess the image
  const main = await ImportMain();
  main.default();
}

async function initializeAdjustmentDial(
  idDial,
  idParent,
  idValue,
  type,
  tasksCreated = null
) {
  const { CONSTANTS } = await ImportConstants();
  const adjustmentDial = document.getElementById(idDial);
  let isDragging = false;

  adjustmentDial.addEventListener("mousedown", () => {
    isDragging = true;
  });

  const onMouseMove = (event) => {
    if (!isDragging) return;
    const mouseXCoordinate = event.clientX;
    const parent = document.getElementById(idParent);
    const parentRect = parent.getBoundingClientRect();
    const parentLeftX = parentRect.left;
    const parentRightX = parentRect.right - 16;
    let position = ((mouseXCoordinate - parentLeftX) / parentRect.width) * 100;
    if (mouseXCoordinate < parentLeftX) position = 0;
    if (mouseXCoordinate > parentRightX) position = 100 - 5;
    parent.style.background = `linear-gradient(90deg, rgb(35, 35, 35) 0%, rgb(35, 35, 35) ${
      position + 4
    }%, white ${position + 4}%, white 100%)`;
    adjustmentDial.style.left = `${position}%`;

    if (type === "blocksize") {
      const blockElementDisplay = document.getElementById(idValue);
      const MAX_BLOCKS = 500;
      let BLOCKSIZE = MAX_BLOCKS * (position / 100);
      if (mouseXCoordinate < parentLeftX) BLOCKSIZE = 1;
      if (mouseXCoordinate > parentRightX) BLOCKSIZE = 500;
      CONSTANTS.BLOCKSIZE = Math.floor(BLOCKSIZE);
      blockElementDisplay.textContent = Math.floor(BLOCKSIZE);

      // Update tasks created when moving the dial
      tasksCreated.textContent = Math.floor(
        (MAX_BLOCKS * MAX_BLOCKS) / (BLOCKSIZE * BLOCKSIZE)
      );
    }

    if (type === "mandelbrot") {
      const mandelbrotElementDisplay = document.getElementById(idValue);
      const MAX_SIZE = 20;
      const MIN_SIZE = 0.001;
      let SIZE;

      // Adjust Mandelbrot size based on dial position
      if (position <= 50) {
        SIZE = MIN_SIZE + (1 - MIN_SIZE) * (position / 50);
      } else {
        SIZE = 1 + (MAX_SIZE - 1) * ((position - 50) / 50);
      }

      CONSTANTS.MANDELBROT_SIZE = SIZE;
      mandelbrotElementDisplay.textContent = SIZE.toFixed(3);
    }

    // Recalculate other values of Mandelbrot Object based on new inputs
    CONSTANTS.X_START = CONSTANTS.X_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
    CONSTANTS.Y_START = CONSTANTS.Y_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
    CONSTANTS.SCALE = CONSTANTS.MANDELBROT_SIZE / CONSTANTS.IMAGE_SIZE;
  };

  const onMouseUp = async () => {
    if (!isDragging) return;
    isDragging = false;

    const main = await ImportMain();
    main.default();
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}
