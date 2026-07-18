export interface ParsedVehicle {
  id: number;
  x: number;
  y: number;
}

// Assumed binary layout per vehicle (16 bytes):
// [0-3]   id   (Uint32)
// [4-7]   x    (Float32)
// [8-11]  y    (Float32)
// [12-15] reserved / padding
// NOTE: This layout is a placeholder until confirmed with Rachit/Anas's
// actual Socket.io binary payload structure (see ARCHITECTURE.md).
const BYTES_PER_VEHICLE = 16;

export function parseVehicleBuffer(buffer: ArrayBuffer): ParsedVehicle[] {
  const view = new DataView(buffer);
  const vehicleCount = buffer.byteLength / BYTES_PER_VEHICLE;
  const vehicles: ParsedVehicle[] = [];

  for (let i = 0; i < vehicleCount; i++) {
    const offset = i * BYTES_PER_VEHICLE;
    const id = view.getUint32(offset, true);
    const x = view.getFloat32(offset + 4, true);
    const y = view.getFloat32(offset + 8, true);
    vehicles.push({ id, x, y });
  }

  return vehicles;
}
