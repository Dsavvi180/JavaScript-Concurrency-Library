//Changing the Mandelbrot size affects the zoom level of the
//fractal and the area of the complex plane that you're viewing
// on the canvas

//Lowering the blocksize increases the number of tasks created
const CONSTANTS = {
  X_CENTRE: 0,
  Y_CENTRE: 0.75,
  MANDELBROT_SIZE: 0.4, //0.006 //0.4 is sick
  ITERATION_MAX: 255,
  IMAGE_SIZE: 500,
  BLOCKSIZE: 500,
  CREATE_WORKERS: navigator.hardwareConcurrency - 1,
  LAUNCH_WORKER: navigator.hardwareConcurrency - 1,
  ERROR_COUNT: 0,
  COLOR: "colorful",
};

CONSTANTS.X_START = CONSTANTS.X_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
CONSTANTS.Y_START = CONSTANTS.Y_CENTRE - CONSTANTS.MANDELBROT_SIZE / 2;
CONSTANTS.SCALE = CONSTANTS.MANDELBROT_SIZE / CONSTANTS.IMAGE_SIZE;

export default CONSTANTS;
