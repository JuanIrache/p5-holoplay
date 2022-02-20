let canvas, context;
const vx = 8;
const vy = 6;
const vtotal = vx * vy;
const aspect = 0.75;
const specs = { vx, vy, vtotal, aspect };
const screen = 3360;
const w = screen / vx;
const h = screen / vy;

const s = p => {
  window = { ...window, ...p5 };
  p.setup = () => {
    P5Holoplay2d.create(p)
      .then(device =>
        console.log(
          'Started HoloCore for device:',
          device.hardwareVersion,
          device.hwid
        )
      )
      .catch(e => console.error('Error getting HoloCore started:', e));
  };

  p.draw = function () {
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    P5Holoplay2d.add(() => p.background(250));
    P5Holoplay2d.add(() => p.text('NEAR', p.width / 2, p.height * 0.75), -100);
    P5Holoplay2d.add(() => p.text('CENTER', p.width / 2, p.height * 0.5), 0);
    P5Holoplay2d.add(() => p.text('FAR', p.width / 2, p.height * 0.25), 100);
    P5Holoplay2d.add(() => {
      p.fill(255, 50, 50);
      p.ellipse(p.width / 2, p.height / 2, 150);
    }, 200 * Math.sin(p.millis() / 1000));
    P5Holoplay2d.draw();
  };
};

new p5(s);
