import { parseVehicleBuffer } from './parseVehicleData';

// Manually construct a fake binary payload for 2 vehicles to test the parser
function createTestBuffer(): ArrayBuffer {
  const buffer = new ArrayBuffer(32); // 2 vehicles * 16 bytes
  const view = new DataView(buffer);

  // Vehicle 1: id=1, x=100.5, y=200.25
  view.setUint32(0, 1, true);
  view.setFloat32(4, 100.5, true);
  view.setFloat32(8, 200.25, true);

  // Vehicle 2: id=2, x=50.0, y=75.75
  view.setUint32(16, 2, true);
  view.setFloat32(20, 50.0, true);
  view.setFloat32(24, 75.75, true);

  return buffer;
}

const testBuffer = createTestBuffer();
const parsed = parseVehicleBuffer(testBuffer);

console.log('Parsed vehicles:', parsed);
console.log('Test passed:', parsed.length === 2 && parsed[0].id === 1 && parsed[1].x === 50.0);
