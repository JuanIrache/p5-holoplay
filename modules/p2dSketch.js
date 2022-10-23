const p5 = require('p5');

const { getClient, showQuilt } = require('./holoHelpers.js');

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

const status = { updated: false };

const drawQuilt = ({
  p,
  shapes,
  specs,
  quilt,
  preview,
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

  status.updated = true;

  if (!previewQuilt) {
    let i = Math.floor(vtotal / 2);
    if (wigglePreview) {
      i += Math.round(p.frame / 2) % 2 === 0 ? 1 : -1;
    }
    drawView({ p, i, vtotal, shapes, adaptSize });
  }
};

module.exports = async ({ preload, setup, draw, options }) => {
  const {
    adaptSize = true,
    wigglePreview = true,
    previewQuilt = false
  } = options || {};
  try {
    const [client, device] = await getClient();

    let { defaultQuilt } = device;
    const {
      quiltAspect: aspect,
      quiltX: w,
      quiltY: h,
      tileX: vx,
      tileY: vy
    } = defaultQuilt;

    const specs = { vx, vy, vtotal: vx * vy, aspect };
    const s = p => {
      let preview, quilt;
      let viewerFrame = 0;

      if (preload) p.preload = () => preload(p);

      p.setup = () => {
        preview = p.createCanvas(w / vx, h / vy);
        quilt = p.createGraphics(w, h);

        const updateViewerFrame = () => viewerFrame++;

        showQuilt({ quilt, client, specs, updateViewerFrame, status });

        if (previewQuilt) {
          preview.hide();
          quilt.show();
        }
        const meta = {
          viewerFrame,
          device,
          quilt,
          p,
          preview
        };
        if (setup) setup(p, null, meta);
      };

      p.draw = () => {
        const shapes = [];
        const add = (action, depth) => shapes.push({ action, depth });
        const meta = {
          viewerFrame,
          device,
          quilt,
          p,
          preview
        };
        if (draw) draw(p, add, meta);
        drawQuilt({
          p,
          client,
          shapes,
          specs,
          quilt,
          preview,
          adaptSize,
          wigglePreview,
          previewQuilt
        });
      };
    };

    new p5(s);
  } catch (err) {
    if (setup) setup(null, err, {});
  }
};
