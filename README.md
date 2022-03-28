# p5-holoplay

Allows to create holographic [p5js](https://p5js.org) sketches and shows them to [Looking Glass](https://lookingglassfactory.com/) holographic displays.

See a [quick video test here](https://youtu.be/Bb5oi7Y_aos).

## Prerequisites

- A [Looking Glass](https://lookingglassfactory.com/) holographic display
- Install [HoloPlay Service](https://lookingglassfactory.com/software#holoplay-service) to communicate with the device
- Plug the device to your computer both by USB and HDMI
- Install [node](https://nodejs.org) on your computer

## Getting started

You can create your own project by modifying the included projects _sample-p2d_ and _sample-webgl_. See instructions on how to get them running in their own _README.md_.

Or you can integrate this in your own projects by installing the module

```shell
npm i p5-holoplay
```

and including it in your javascript as a CommonsJS module (it will need bundling to run on the browser)

```js
const { sketchP2d, sketchWebgl } = require('p5-holoplay');
```

Then prepare your _setup_, _draw_, etc. functions as explained below and pass them to the chosen mode, _p2d_ or _webgl_.

## How to create p5 holograms

This project integrates p5js in [instance mode](https://p5js.org/reference/#/p5/p5). This means the usual p5 methods and properties are not in the global namespace (available everywhere), but bundled in a variable.

You have to choose one of two drawing modes.

- **sketchP2d**: Uses p5's [P2D](https://p5js.org/reference/#/p5/P2D) renderer. It draws flat (2D) shapes to 3D space by specifying a depth value for each block of drawing code.
- **sketchWebgl**: uses p5's [WEBGL](https://p5js.org/reference/#/p5/WEBGL) renderer. It draws 3D shapes and uses lights to show volumes.

The basic usage of both modes is similar. The _sketchP2d_ or _sketchWebgl_ function accepts an object with functions named after the typical p5js functions (_preload_, _setup_, _draw_) and an options object.

```js
sketchp2d({ preload, setup, draw, options });
```

These functions will pass the p variable so you can use the p5 methods and properties. So instead of

```js
function setup() {
  background(255);
}
```

You can do

```js
const setup = p => {
  p.background(255);
};
```

The functions you provide to each more are significantly different:

### sketchP2d

- **setup** provides _p_, _error_, _meta_ (additional data for advanced work). Creates a canvas of the necessary dimensions (you don't need to create it yourself). Similar to [setup()](https://p5js.org/reference/#/p5/setup). Runs automatically once at the beginning of the life cycle.
- **draw** provides _p_, _add_ (essential function to add layers), _meta_. Runs every frame. Allows to add layers in the form of a function and its depth. P5 work commonly done in p5 draw() should work here. Layer functions are run multiple times (one for every camera view, 48 in the case of the Looking Glass Portrait), while the rest of the code is only ran once per frame. So take that into account when deciding what to put inside of an "add" function (probably not an incrementing counter). Similar to [draw()](https://p5js.org/reference/#/p5/draw).

"Add" functions must receive a drawing function and a depth value (positive means further from the viewer, negative is closer to them).

```js
const draw = (p, add) => {
  add(() => {
    p.fill(255, 0, 0);
    p.ellipse(0, 0, 100);
  }, 100);
};
```

Depth values between 100 and -100 seem to draw layers with noticeable depth but more or less within the frame of the device. Larger values will produce more impressive effects, but also blurrier graphics (which might be fine, creatively). If depth is omitted, Infinity will be assumed, which is meant for functions that don't rely on depth, like _p.background()_.

Layers are not necessarily drawn in the order your _add_ them. They are drawn from farther to nearer, so don't expect changes you make to things like _stroke_, _fill_ and other to persist between added layers. Set all you need for each layer within its own function. Each added function can be thought of like a mini p5 draw function.

This syntax can get complicated quickly, but is an alternative to thoroughly modifying p5 to make it generate the ['quilt'](https://docs.lookingglassfactory.com/keyconcepts/quilts).

### sketchWebgl

- **setup** provides _p_, _error_, _meta_. Runs automatically once at the beginning of the life cycle, but _p_ here refers to the preview window, not the canvases where the actual shapes are drawn. This means you can include here things that need to happen only once (like lifecycle events, mouse/keyboard interactions...), but not those that affect the drawings directly (like colors, strokes, fills, fonts...). Similar to [setup()](https://p5js.org/reference/#/p5/setup).
- **setupEach** provides _p_, _error_, _meta_. Creates all the necessary canvases to build the 3D images from multiple camera perspectives. Runs multiple times due to the complex underlying structure. Specify permanent drawing settings here, like potentially colors, strokes, fills, fonts... Similar to [setup()](https://p5js.org/reference/#/p5/setup).
- **preDraw** provides _p_, _meta_. Runs once per every new frame of the preview window. It does not affect the final drawn image. You can include code that should run each frame but is not related to each camera view. For example, store mouse positions only once per frame to use in the _draw_ function. Similar to [draw()](https://p5js.org/reference/#/p5/draw).
- **draw** provides _p_, _meta_. Runs multiple times per frame (once for each virtual camera perspective). Place here the geometries you want to draw, camera work, and style data (stroke, colors...) that changes based on other inputs. The frame and lights reset every frame, so don't rely on them being preserved. Similar to [draw()](https://p5js.org/reference/#/p5/draw).

```js
let ballX, ballY;

const preDraw = p => {
  // Store the same mouse positions for all the camera views
  ballX = p.mouseX - p.width / 2;
  ballY = p.mouseY - p.height / 2;
};

const draw = p => {
  normalMaterial();
  sphere(ballX, ballY, 50);
};
```

### Common

Additionally, a preload function can be passed to both modes.

- **preload** receives _p_. Useful for loading things like images or fonts before running the p5 sketch. Similar to [preload()](https://p5js.org/reference/#/p5/preload).

## meta

A _meta_ object is passed with some functions to enable advanced work. The object can include the following (but not always does, so check the data before using it):

- **device**: Hardware data from [holoplay-core](https://www.npmjs.com/package/holoplay-core).
- **viewerFrame**: Frame number of the Looking Glass device. Potential replacement of p5's [frameCount](https://p5js.org/reference/#/p5/frameCount) Useful because it does not update at p5's normal frame rate.
- **previewFrame**: (_webgl_ only) Frame number of the preview canvas. Potential replacement of p5's [frameCount](https://p5js.org/reference/#/p5/frameCount) Useful because it does not update at p5's normal frame rate, nor at the Looking Glass rate.
- **cam**: (_webgl_ only) [p5.Camera](https://p5js.org/reference/#/p5.Camera) of the view that is currently being drawn. It allows camera transformations like position and field of view.
- **millis**: (_webgl_ only) Time since the stetch started running, in milliseconds. Potential replacement of [millis()](https://p5js.org/reference/#/p5/millis), which would change while the multiple views are being drawn, this providing unexpected results.
- **quilt**: Reference to the [p5.Graphics](https://p5js.org/reference/#/p5.Graphics) holding the ['quilt'](https://docs.lookingglassfactory.com/keyconcepts/quilts) being sent to the Looking Glass device. Useful for doing things with that specific canvas, like saving it to a file with [].save()](https://p5js.org/reference/#/p5/save).
- **preview**: Reference to the [p5.Renderer](https://p5js.org/reference/#/p5/createCanvas) holding the preview visualization.
- **p**: Reference to the [p5 sketch](https://p5js.org/reference/#/p5/p5). In _webgl_ mode, it can be more representative than the main _p_ of the _draw_ function, as that refers to the camera perspective being drawn at any given time. So use it for things like sketch width, mouse position...

### Other p5 functions

Other p5 functions that would be normally set globally should be set in the setup once the _p_ variable is available.

For example, instead of

```js
function mouseClicked() {
  console.log(mouseX, mouseY);
}
```

you would do

```js
setup = p => {
  p.mouseClicked = () => {
    console.log(p.mouseX, p.mouseY);
  };
};
```

For more p5 methods and properties, see the [reference](https://p5js.org/reference/).

### Options

An _options_ object can also be passed to the main functions.

```js
const options = { adaptSize: false, wigglePreview: false, previewQuilt: true };
```

- **wigglePreview** default _true_: The preview in the browser window switches between displaying two of the camera perspectives to convey a sense of depth even if you are not looking at the holographic display.
- **previewQuilt** deafult _false_: See the entire ['quilt'](https://docs.lookingglassfactory.com/keyconcepts/quilts) with multiple camera views in your browser, instead of the simplified preview.
- **adaptSize** (_p2d_ only) default _true_: Adapts the size of layers to increase perceived depth with some conic perspective. This is not geometrically accurate. Disabling it increases precision when drawing elements. For example, if _adaptSize_ is enabled and you draw a dot at the coordinates 0,0 of a layer with negative depth, the dot will be outside of the screen due to the conical perspective.
- **depth** (_webgl_ only) default _100_: Increases or decreases the depth perspective by drawing a wider or narrower range of camera positions.

## How does this work?

The code generates a [Quilt](https://docs.lookingglassfactory.com/keyconcepts/quilts) for each frame. That is, a series of camera perspectives (48 in the case of the Looking Glass Portrait) to be sent to the holographic display.

## Notes

- Currently frame rates are very low. The canvas (which is large due to all the hidden camera views) takes time to convert to PNG so it can be sent to the device.
- Some p5 methods and properties like _frameRate_, _frameCount_ and probably more do not work as expected.
- Multiple hacky and experimental JavaScript and P5 features are used. This will not work on all browsers.

## TODO

- Optimise fps somehow? Converting the canvas takes time, and HoloPlay Core takes time to receive it and confirm https://github.com/Looking-Glass/HoloPlayJS_Issues/issues/19
- See if holoplay-core can be updated so "message" is not always printed https://github.com/Looking-Glass/HoloPlayJS_Issues/issues/18
- Test on multiple devices, browsers, etc.
- Use mathematically correct formula for _adaptSize_

## About

If you liked this you might like some of my [other projects](https://prototyping.barcelona).
