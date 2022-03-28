const HoloPlayCore = require('holoplay-core');

const errors = require('./errors.js');
const workerCode = require('./workerCode.js');

const blob = new Blob([workerCode], { type: 'text/javascript' });

const worker = new Worker(window.URL.createObjectURL(blob));

const getClient = () =>
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

const showQuilt = async input => {
  const { quilt, client, specs, updateViewerFrame } = input;
  worker.onmessage = ({ data }) => {
    showQuilt(input);
    updateViewerFrame();
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

module.exports = { getClient, showQuilt };
