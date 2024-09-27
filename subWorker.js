self.onmessage = async (event) => {
  try {
    let dataAvailable = false;
    let waitingCount = 0;
    if (!event.data.constants) {
      const intervalId = setInterval(() => {
        if (event.data.constants) {
          dataAvailable = true;
          clearInterval(intervalId);
        }
        waitingCount++;
        if (waitingCount > 10) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    const CONSTANTS = event.data.constants;
    const imageBitMap = event.data.bitMap;
    const { i, j } = event.data.coordinates;
    const canvas = new OffscreenCanvas(imageBitMap.width, imageBitMap.height);
    const ctx = canvas.getContext("2d");
    if (imageBitMap != null) ctx.drawImage(imageBitMap, 0, 0);
    plotBlock(
      CONSTANTS,
      i,
      j,
      CONSTANTS.BLOCKSIZE,
      CONSTANTS.SCALE,
      CONSTANTS.ITERATION_MAX,
      ctx
    );
    const imageBitmap = canvas.transferToImageBitmap();
    self.postMessage({ status: "done", bitMap: imageBitmap }, [imageBitmap]);
  } catch (error) {
    self.postMessage({ status: "error", cause: error });
  }
};

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
    throw new Error(`Error in mandelbrot function in subWorker.js:\n ${error}`);
  }
}

function plotBlock(
  CONSTANTS,
  xStart,
  yStart,
  blockSize,
  scale,
  iterationMax,
  ctx
) {
  try {
    for (let i = xStart; i < xStart + blockSize; i++) {
      for (let j = yStart; j < yStart + blockSize; j++) {
        const x0 = CONSTANTS.X_START + scale * i;
        const y0 = CONSTANTS.Y_START + scale * j;

        // Calculate how many iterations it took for this point to escape
        const iterations = mandelbrot(x0, y0, iterationMax);

        if (CONSTANTS.COLOR === "colorful") {
          const hue = Math.floor((iterations / iterationMax) * 360); // Map iterations to hue
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`; //
        } else {
          //monotone
          const colorValue = Math.floor((iterations / iterationMax) * 255);
          ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`; // Shades of gray
        }

        // Plot the point
        ctx.fillRect(i, j, 1, 1);
      }
    }
  } catch (error) {
    throw new Error(`Error in plotBlock function in subWorker.js:\n  ${error}`);
  }
}
