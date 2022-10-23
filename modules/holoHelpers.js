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
        if (typeof device.defaultQuilt === 'string') {
          device.defaultQuilt = JSON.parse(device.defaultQuilt);
        }
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
  const { quilt, client, specs, updateViewerFrame, status } = input;
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
  console.log(status);
  if (status.updated) {
    const bitmap = await createImageBitmap(quilt.elt);
    status.updated = false;
    worker.postMessage({ action: 'saveFrame', payload: { bitmap } }, [bitmap]);
  } else setTimeout(() => showQuilt(input), 1);
};

module.exports = { getClient, showQuilt };
