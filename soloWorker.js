self.onmessage = (event) => {
  const canvas = event.data.canvas;
  try {
    const ctx = canvas.getContext("2d");
    //   ctx.fillRect(100, 100, 100, 100);
    run(ctx);
  } catch (error) {
    self.postMessage({ status: "error", cause: error });
  }

  self.postMessage({ status: "done" });
};
//Changing the Mandelbrot size affects the zoom level of the
//fractal and the area of the complex plane that you're viewing
// on the canvas
const CONSTANTS = {
  X_CENTRE: 0,
  Y_CENTRE: 0.75,
  MANDELBROT_SIZE: 0.006,
  ITERATION_MAX: 255,
  IMAGE_SIZE: 500,
  BLOCKSIZE: 1,
};

CONSTANTS.X_START = CONSTANTS.X_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
CONSTANTS.Y_START = CONSTANTS.Y_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
CONSTANTS.SCALE = CONSTANTS.MANDELBROT_SIZE / CONSTANTS.IMAGE_SIZE;
Object.freeze(CONSTANTS);

function mandelbrot(x0, y0, maxIterations) {
  try {
    let zx = x0,
      zy = y0,
      iteration = 0;

    while (zx * zx + zy * zy < 4.0 && iteration < maxIterations) {
      let tmp = zx * zx - zy * zy + x0;
      zy = 2.0 * zx * zy + y0;
      zx = tmp;
      iteration++;
    }

    return iteration;
  } catch (error) {
    throw new Error(
      `Error in mandelbrot function in soloWorker.js:\n ${error}`
    );
  }
}

function plotBlock(xStart, yStart, blockSize, scale, iterationMax, ctx) {
  try {
    for (let i = xStart; i < xStart + blockSize; i++) {
      for (let j = yStart; j < yStart + blockSize; j++) {
        const x0 = CONSTANTS.X_START + scale * i;
        const y0 = CONSTANTS.Y_START + scale * j;

        // Calculate how many iterations it took for this point to escape
        const iterations = mandelbrot(x0, y0, iterationMax);

        // Assign a color based on the number of iterations
        const colorValue = Math.floor((iterations / iterationMax) * 255);
        ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`; // Shades of gray

        // Plot the point
        ctx.fillRect(i, j, 1, 1);
      }
    }
  } catch (error) {
    throw new Error(
      `Error in plotBlock function in soloWorker.js:\n  ${error}`
    );
  }
}

function run(ctx) {
  try {
    for (let i = 0; i < CONSTANTS.IMAGE_SIZE; i += CONSTANTS.BLOCKSIZE) {
      for (let j = 0; j < CONSTANTS.IMAGE_SIZE; j += CONSTANTS.BLOCKSIZE) {
        plotBlock(
          i,
          j,
          CONSTANTS.BLOCKSIZE,
          CONSTANTS.SCALE,
          CONSTANTS.ITERATION_MAX,
          ctx
        );
      }
    }
  } catch (error) {
    throw new Error(`Error in run function in soloWorker.js:\n ${error}`);
  }
}
