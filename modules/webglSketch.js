const p5 = require('p5');

const { getClient, showQuilt } = require('./holoHelpers.js');

const depthMult = 4;

const drawView = ({ graph, draw, viewProp, cam, meta }) => {
  graph.noLights();
  graph.clear();
  if (draw) {
    cam.setPosition(cam.eyeY + viewProp, cam.eyeY, cam.eyeZ);
    draw(graph, meta);
    cam.setPosition(cam.eyeY - viewProp, cam.eyeY, cam.eyeZ);
  }
};

const drawQuilt = ({
  p,
  draw,
  specs,
  quilt,
  preQuilt,
  preview,
  renderers,
  frameCount,
  millis,
  depth,
  wigglePreview,
  previewQuilt,
  viewerFrame,
  device,
  preDraw
}) => {
  const { vx, vtotal } = specs;
  for (const { graph, cam } of renderers) {
    const i = frameCount % vtotal;
    const x = i % vx;
    const y = Math.floor(i / vx);
    const viewProp = (i / vtotal - 0.5) * depth * depthMult;
    const previewFrame = Math.floor(frameCount / vtotal);
    const meta = {
      previewFrame,
      viewerFrame,
      cam,
      millis,
      device,
      quilt,
      p,
      preview
    };
    if (i === 0) {
      millis = p.millis();
      meta.millis = millis;
      if (preDraw) preDraw(p, meta);
    }
    drawView({ graph, draw, viewProp, cam, meta });
    const quiltX = x * p.width;
    const quiltY = quilt.height - (y + 1) * p.height;
    const offset = depth * depthMult * 0.5 - viewProp;
    preQuilt.image(
      graph,
      quiltX,
      quiltY,
      p.width,
      p.height,
      offset,
      0,
      p.width,
      p.height
    );
    if (!previewQuilt) {
      let wantedI = Math.floor(vtotal / 2);
      if (wigglePreview) {
        wantedI += Math.round(previewFrame / 2) % 2 === 0 ? 2 : -2;
      }
      if (i === wantedI) {
        preview.image(
          graph,
          offset,
          0,
          p.width,
          p.height,
          0,
          0,
          p.width,
          p.height
        );
      }
    }
    if (i + 1 === vtotal) quilt.image(preQuilt, 0, 0);

    frameCount++;
  }

  return [frameCount, millis];
};

module.exports = async ({
  preload,
  setupEach,
  setup,
  draw,
  preDraw,
  options
}) => {
  const {
    wigglePreview = false,
    previewQuilt = false,
    depth = 100
  } = options || {};
  try {
    const [client, device] = await getClient();

    let { defaultQuilt } = device;
    if (typeof defaultQuilt === 'string') {
      defaultQuilt = JSON.parse(defaultQuilt);
    }
    const {
      quiltAspect: aspect,
      quiltX: w,
      quiltY: h,
      tileX: vx,
      tileY: vy
    } = defaultQuilt;

    const specs = { vx, vy, vtotal: vx * vy, aspect };
    const s = p => {
      let preview, preQuilt, quilt;
      let frameCount = 0;
      let millis = 0;
      let viewerFrame = 0;
      const renderers = [];

      if (preload) p.preload = () => preload(p);

      p.setup = () => {
        preview = p.createCanvas(w / vx, h / vy);
        quilt = p.createGraphics(w, h);
        preQuilt = p.createGraphics(w, h);
        const meta = {
          previewFrame: 0,
          viewerFrame,
          millis,
          device,
          quilt,
          p,
          preview
        };
        if (setup) setup(p, null, meta);
        for (let i = 0; i < 10; i++) {
          const graph = p.createGraphics(
            w / vx + depth * depthMult,
            h / vy,
            p.WEBGL
          );
          const cam = graph.createCamera();
          renderers.push({ graph, cam });
          if (setupEach) {
            meta.cam = cam;
            setupEach(graph, null, meta);
          }
        }
        const updateViewerFrame = () => viewerFrame++;

        showQuilt({ quilt, client, specs, updateViewerFrame });
        if (previewQuilt) {
          preview.hide();
          quilt.show();
        }
      };

      p.draw = () => {
        [frameCount, millis] = drawQuilt({
          p,
          draw,
          client,
          specs,
          depth,
          quilt,
          preQuilt,
          preview,
          renderers,
          frameCount,
          millis,
          wigglePreview,
          previewQuilt,
          viewerFrame,
          device,
          preDraw
        });
      };
    };

    new p5(s);
  } catch (err) {
    if (setupEach) setupEach(null, err, {});
    if (setup) setup(null, err, {});
  }
};
