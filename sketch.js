import P5Holoplay2d from './p5-holoplay-2d.js';

const setup = (p, device, err) => {
  if (err) console.error(`Error getting HoloCore started: ${err}`);
  else {
    console.log('Started HoloCore for', device.hardwareVersion, device.hwid);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
  }
};

const draw = (p, add) => {
  add(() => p.background(250));
  add(() => p.text('NEAR', p.width / 2, p.height * 0.75), -100);
  add(() => p.text('CENTER', p.width / 2, p.height * 0.5), 0);
  add(() => p.text('FAR', p.width / 2, p.height * 0.25), 100);
  add(() => {
    p.noStroke();
    p.fill(255, 50, 50);
    p.ellipse(p.width / 2, p.height / 2, 150);
  }, 200 * Math.sin(p.millis() / 600));
};

P5Holoplay2d({ setup, draw });
