# p5-holoplay-2d

Allows to create holographic [p5js](https://p5js.org) sketches (2D layers in 3D space) and shows them to [Looking Glass](https://lookingglassfactory.com/) holographic displays.

See a [quick video test here](https://youtu.be/Bb5oi7Y_aos).

## Prerequisites

- A [Looking Glass](https://lookingglassfactory.com/) holographic display
- Install [HoloPlay Service](https://lookingglassfactory.com/software#holoplay-service) to communicate with the device
- Plug the device to your computer both by USB and HDMI
- Install [node](https://nodejs.org) on your computer

## Getting started

You can create your own project by modifying the included _sample-project_. See instructions on how to get it running in its own _README.md_.

Or you can integrate this in your own projects by installing the module

```shell
npm i p5-holoplay-2d
```

and including it in your javascript as a CommonsJS module (it will need bundling to run on the browser)

```js
const P5Holoplay2d = require('p5-holoplay-2d');
```

Then prepare your _setup_, _draw_, etc. functions and pass them to the _P5Holoplay2d_ function.

## How to create p5 holograms

This project integrates p5js in [instance mode](https://p5js.org/reference/#/p5/p5). This means the usual p5 methods and properties are not in the global namespace (available everywhere), but bundled in a variable.

The **p5-holoplay-2d** module receives an object with three functions named after the typical p5js functions (_preload_, _setup_, _draw_) and an options object.

```js
P5Holoplay2d({ preload, setup, draw, options });
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

- **preload** receives _p_ (p5 variable). Useful for loading things like images before running the p5 sketch. Wrapper of [preload()](https://p5js.org/reference/#/p5/preload).
- **setup** receives _p_, _device_ (device data from [holoplay-core](https://www.npmjs.com/package/holoplay-core)). Creates a canvas of the necessary dimensions (you don't need to create it yourself) and stops the usual p5 loop so frames are only drawn when possible. Wrapper of [setup()](https://p5js.org/reference/#/p5/setup).
- **draw** receives _p_, _add_ (function to add layers). Runs every frame. Allows to add layers in the form of a function and its depth. Other p5 work commonly done in p5 draw() should work here. Layer functions are run multiple times (on for every camera view, 48 in the case of the Looking Glass Portrait, for example), while the rest of the code is only ran once per frame. So take that into account when deciding what to put inside of a layer function. Wrapper of [draw()](https://p5js.org/reference/#/p5/draw).

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

This syntax can get complicated quickly, but is an alternative to thoroughly modifying p5 to make it generate the "quilt".

For more p5 methods and properties, see the [reference](https://p5js.org/reference/).

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

### Options

An _options_ object can also be passed to _p5-holoplay-2d_.

```js
const options = { adaptSize: false, wigglePreview: false, previewQuilt: true };
```

- **adaptSize** default _true_: Adapts the size of layers to increase perceived depth with some conic perspective. This is not geometrically accurate. Disabling it increases precision when drawing elements. For example, if _adaptSize_ is enabled and you draw a dot at the coordinates 0,0 of a layer with negative depth, the dot will be outside of the screen due to the conical perspective.
- **wigglePreview** default _true_: The preview in the browser window switches between displaying two of the camera perspectives to convey a sense of depth even if you are not looking at the holographic display.
- **previewQuilt** deafult _false_: See the entire quilt with multiple camera views in your browser, instead of the simplified preview.

## How does this work?

The code generates a [Quilt](https://docs.lookingglassfactory.com/keyconcepts/quilts) for each frame. That is, a series of camera perspectives (48 in the case of the Looking Glass Portrait) to be sent to the holographic display.

A similar project could be created for the 3D renderers of p5 (webgl). You will probably need to create one camera for each view, or move the camera to generate all the views. An exciting project to take on if you want to make it happen!

## Notes

- Currently frame rates are very low. The canvas (which is large due to all the hidden camera views) takes time to convert to PNG so it can be sent to the device.
- Since the p5 loop is stopped, some p5 methods and properties like _frameRate_ or _frameCount_ do not work as expected.
- Multiple hacky and experimental JavaScript features are used. This will not work on all browsers.

## TODO

- Add webgl mode
  - Copy webgl version and modularise
  - Slow down wiggle?
  - Rename package and deprecate old
  - Update docs
- Optimise fps somehow? Converting the canvas takes time, and HoloPlay Core takes time to receive it and confirm https://github.com/Looking-Glass/HoloPlayJS_Issues/issues/19
- See if holoplay-core can be updated so "message" is not always printed https://github.com/Looking-Glass/HoloPlayJS_Issues/issues/18
- Maybe check if last message was confirmed by holo before sending the next?
- See how we can use p5 frameCount, frameRate, etc.
- Test on multiple devices, browsers, etc.
- Use mathematically correct formula for _adaptSize_

## About

If you liked this you might like some of my [other projects](https://prototyping.barcelona).
