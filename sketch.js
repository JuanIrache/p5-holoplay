const client = new HoloPlayCore.Client(undefined, console.error);

let canvas, context;
const vx = 8;
const vy = 6;
const vtotal = vx * vy;
const aspect = 0.75;
const specs = { vx, vy, vtotal, aspect };
const screen = 3360;
const w = screen / vx;
const h = screen / vy;

function setup() {
  canvas = createCanvas(screen, screen);
  context = canvas.elt.getContext('2d');
  frameRate(5);
  textAlign(CENTER, CENTER);
  noStroke();
}

const totalPos = vx * vy;
const depth = w / 2;

function draw() {
  background(245);
  for (let y = 0; y < vy; y++) {
    for (let x = 0; x < vx; x++) {
      const i = y * vx + x;
      const cameraProp = i / totalPos - 0.5;
      const maxCameraX = -cameraProp * depth;
      for (let i = 0; i < 5; i++) {
        const copyProp = i / 4 - 0.5;
        const yp = height - (y + 0.5) * h + (copyProp * h) / 2;
        const xp = (x + 0.5) * w + maxCameraX * copyProp;
        textSize(h / 5);
        text('word', xp, yp);
      }
    }
  }

  canvas.elt.toBlob(blob => {
    blob.arrayBuffer().then(arr => {
      const UIA = new Uint8Array(arr);
      client
        .sendMessage(new HoloPlayCore.ShowMessage(specs, UIA))
        .catch(console.error);
    });
  });
  noLoop();
}
