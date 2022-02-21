const HoloPlayCore = require('holoplay-core');
const p5 = require('p5');

const errors = require('./modules/errors.js');

const blob = new Blob(
  [
    `
  const canvas = new OffscreenCanvas(300, 300);
  const ctx = canvas.getContext('bitmaprenderer');
  
  const saveFrame = async ({ bitmap }) => {
    ctx.transferFromImageBitmap(bitmap);
    const blob = await canvas.convertToBlob();
    const arrBuf = await blob.arrayBuffer();
    self.postMessage({ action: 'success', payload: arrBuf }, [arrBuf]);
  };
  
  onmessage = ({ data }) => {
    const { action, payload } = data;
    if (action === 'setSize') {
      const { size } = payload;
      canvas.width = size[0];
      canvas.height = size[1];
    } else if (action === 'saveFrame') saveFrame(payload);
  };`
  ],
  { type: 'text/javascript' }
);

const worker = new Worker(window.URL.createObjectURL(blob));

const drawView = ({ p, i, vtotal, shapes, adaptSize }) => {
  const viewProp = i / vtotal - 0.5;
  for (const shape of shapes) {
    const maxDepthOff = 1 / 1 - -shape.depth;
    const depthOff = maxDepthOff * viewProp;
    p.push();
    if (!isNaN(maxDepthOff)) {
      if (adaptSize && shape.depth !== 0) {
        const scaleAdjust = 1 / 2 ** (shape.depth / 400);
        p.translate(p.width / 2, p.height / 2);
        p.scale(scaleAdjust);
        p.translate(-p.width / 2, -p.height / 2);
      }
      p.translate(depthOff, 0);
    }
    shape.action();
    p.pop();
  }
};

const showQuilt = async ({ p, quilt, client, specs }) => {
  worker.onmessage = ({ data }) => {
    p.draw();
    client
      .sendMessage(
        new HoloPlayCore.ShowMessage(specs, new Uint8Array(data.payload))
      )
      .catch(e =>
        console.error(`HoloPlayCore Error code ${e.error}: ${errors[e.error]}`)
      );
  };

  const bitmap = await createImageBitmap(quilt.elt);

  worker.postMessage({ action: 'saveFrame', payload: { bitmap } }, [bitmap]);
};

const drawQuilt = ({
  p,
  client,
  shapes,
  specs,
  quilt,
  preview,
  frameCount,
  adaptSize,
  wigglePreview,
  previewQuilt
}) => {
  shapes = shapes
    .map(s => (s.depth === null ? { ...s, depth: Infinity } : s))
    .sort((a, b) => b.depth - a.depth);
  const { vx, vy, vtotal } = specs;
  for (let y = 0; y < vy; y++) {
    for (let x = 0; x < vx; x++) {
      const i = y * vx + x;
      drawView({ p, i, vtotal, shapes, adaptSize });
      const quiltX = x * p.width;
      const quiltY = p.height * vy - (y + 1) * p.height;
      quilt.image(preview, quiltX, quiltY);
    }
  }

  showQuilt({ p, quilt, client, specs });

  if (!previewQuilt) {
    let i = Math.floor(vtotal / 2);
    if (wigglePreview) i += frameCount % 2 === 0 ? 1 : -1;
    drawView({ p, i, vtotal, shapes, adaptSize });
  }
};

const promiseHoloPlayCore = () =>
  new Promise((resolve, reject) => {
    const client = new HoloPlayCore.Client(
      ({ devices }) => {
        const device = devices[0];
        if (!device) return reject('Device not found');
        if (!device.defaultQuilt) return reject('Device calibration not found');

        worker.postMessage({
          action: 'setSize',
          payload: {
            size: [device.defaultQuilt.quiltX, device.defaultQuilt.quiltY]
          }
        });

        resolve([client, device]);
      },
      e => reject(`Error code ${e.error} (${errors[e.error]})`)
    );
  });

module.exports = async ({ preload, setup, draw, options }) => {
  const {
    adaptSize = true,
    wigglePreview = true,
    previewQuilt = false
  } = options || {};
  try {
    const [client, device] = await promiseHoloPlayCore();

    const {
      quiltAspect: aspect,
      quiltX: w,
      quiltY: h,
      tileX: vx,
      tileY: vy
    } = device.defaultQuilt;
    const specs = { vx, vy, vtotal: vx * vy, aspect };
    const s = p => {
      let preview, quilt;
      let frameCount = 0;

      if (preload) p.preload = () => preload(p);

      p.setup = () => {
        p.noLoop();
        preview = p.createCanvas(w / vx, h / vy);
        quilt = p.createGraphics(w, h);
        if (previewQuilt) {
          preview.hide();
          quilt.show();
        }
        setup(p, device);
      };

      p.draw = () => {
        const shapes = [];
        const add = (action, depth) => shapes.push({ action, depth });
        draw(p, add);
        drawQuilt({
          p,
          client,
          shapes,
          specs,
          quilt,
          preview,
          frameCount,
          adaptSize,
          wigglePreview,
          previewQuilt
        });
        frameCount++;
      };
    };

    new p5(s);
  } catch (err) {
    setup(null, null, err);
  }
};
