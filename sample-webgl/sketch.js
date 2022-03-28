const { sketchWebgl } = require('p5-holoplay');

let font;

const preload = p => {
  font = p.loadFont('./SquadaOne-Regular.ttf');
};

const setup = (p, err, meta) => {
  if (err) console.error(`Error getting HoloCore started: ${err}`);
  else {
    const { hardwareVersion, hwid } = meta.device;
    console.log('Started HoloCore for', hardwareVersion, hwid);
    p.mouseClicked = () => meta.quilt.save();
  }
};

const setupEach = (p, err, meta) => {
  if (!err) {
    const { width, height } = meta.p;
    p.textFont(font);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.sqrt(width * height) / 15);
    p.strokeWeight(2);
  }
};

let lightPos = [0, 0];

const preDraw = (p, meta) => {
  const { mouseX, mouseY, width, height } = meta.p;
  lightPos = [mouseX - width / 2, mouseY - height / 2];
};

const draw = (p, meta) => {
  const { previewFrame } = meta;
  const { width, height } = meta.p;
  p.background(0);
  p.ambientLight(60, 60, 80);
  p.pointLight(255, 200, 150, ...lightPos, 120);

  p.noStroke();
  p.specularMaterial(250);
  p.shininess(50);
  p.push();
  p.rotateY(previewFrame / 10);
  p.torus(width / 6, width / 10, 100, 100);
  p.pop();

  p.stroke(100, 255, 255);
  p.emissiveMaterial(250, 250, 250, 0);
  p.push();
  p.rotateY(-previewFrame / 30);
  p.box(width / 2.2, height / 2, width / 2.2);
  p.pop();

  p.fill(255, 255, 100);
  p.text('Hello', 0, -height / 2.7, 0);
  p.text('World', 0, height / 2.7, 0);
};

webglSketch({
  setup,
  setupEach,
  preDraw,
  draw,
  preload
});
