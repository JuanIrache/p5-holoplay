import * as HoloPlayCore from './node_modules/holoplay-core/dist/holoplaycore.module.js';
// import * as p5x from './node_modules/p5/lib/p5.js';

import errors from './modules/errors.js';

const worker = new Worker('./modules/quiltToPNG.worker.js');

let client, specs, p, quilt, p5canvas, frameCount;
let shapes = [];

const create = async p5 => {
  client = specs = quilt = p5canvas = null;
  frameCount = 0;
  shapes = [];
  p = p5;
  p.noLoop();
  return new Promise((resolve, reject) => {
    client = new HoloPlayCore.Client(
      ({ devices }) => {
        const device = devices[0];
        if (!device) return reject('Device not found');
        const {
          quiltAspect: aspect,
          quiltX: w,
          quiltY: h,
          tileX: vx,
          tileY: vy
        } = device.defaultQuilt;
        specs = { vx, vy, vtotal: vx * vy, aspect };
        p5canvas = p.createCanvas(w / vx, h / vy);
        quilt = p.createGraphics(w, h);
        worker.postMessage({
          action: 'setSize',
          payload: { size: [w, h] }
        });
        resolve(device);
        p.draw();
      },
      e => reject(`HoloPlayCore Error code ${e.error}: ${errors[e.error]}`)
    );
  });
};

const add = (action, depth, options) => shapes.push({ action, depth, options });

const drawView = ({ p, i, vtotal, shapes }) => {
  const viewProp = i / vtotal - 0.5;
  for (const shape of shapes) {
    const maxDepthOff = 1 / 1 - -shape.depth;
    const depthOff = maxDepthOff * viewProp;
    p.push();
    if (!isNaN(depthOff)) p.translate(depthOff, 0);
    shape.action();
    p.pop();
  }
};

const draw = async () => {
  if (specs) {
    shapes = shapes
      .map(s => (s.depth === null ? { ...s, depth: Infinity } : s))
      .sort((a, b) => b.depth - a.depth);
    const { vx, vy, vtotal } = specs;
    for (let y = 0; y < vy; y++) {
      for (let x = 0; x < vx; x++) {
        const i = y * vx + x;
        drawView({ p, i, vtotal, shapes });
        const quiltX = x * p.width;
        const quiltY = p.height * vy - (y + 1) * p.height;
        quilt.image(p5canvas, quiltX, quiltY);
      }
    }

    worker.onmessage = ({ data }) => {
      shapes = [];
      p.draw();
      client
        .sendMessage(
          new HoloPlayCore.ShowMessage(specs, new Uint8Array(data.payload))
        )
        .catch(e =>
          console.error(
            `HoloPlayCore Error code ${e.error}: ${errors[e.error]}`
          )
        );
    };

    const bitmap = await createImageBitmap(quilt.elt);

    worker.postMessage({ action: 'saveFrame', payload: { bitmap } }, [bitmap]);
    const i = Math.floor(vtotal / 2) + (frameCount % 2 === 0 ? 1 : -1);
    drawView({ p, i, vtotal, shapes });
    frameCount++;
  }
};

export default {
  create,
  add,
  draw
};
