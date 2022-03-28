const { p2dSketch } = require('p5-holoplay');

const colors = [
  [255, 50, 50],
  [50, 155, 50],
  [100, 100, 255]
];

let colorIdx = 0;

const setup = (p, err, meta) => {
  if (err) console.error(`Error getting HoloCore started: ${err}`);
  else {
    const { hardwareVersion, hwid } = meta.device;
    console.log('Started HoloCore for', hardwareVersion, hwid);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.mouseClicked = () => {
      colorIdx = (colorIdx + 1) % colors.length;
    };
  }
};

const draw = (p, add, meta) => {
  add(() => p.background(250));
  add(() => p.text('NEAR', p.width / 2, p.height * 0.75), -100);
  add(() => p.text('CENTER', p.width / 2, p.height * 0.5), 0);
  add(() => p.text('FAR', p.width / 2, p.height * 0.25), 100);
  add(() => {
    p.noStroke();
    p.fill(...colors[colorIdx]);
    p.ellipse(p.width / 2, p.height / 2, 150);
  }, 200 * Math.sin(p.millis() / 600));
};

p2dSketch({ setup, draw });
