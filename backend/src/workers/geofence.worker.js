import { parentPort } from "worker_threads";
import * as turf from "@turf/turf";

parentPort.on("message", (payload) => {
  try {
    const { points, geofences } = payload;
    if (!points || !geofences) {
      throw new Error("Missing points or geofences in worker payload");
    }

    const results = [];

    for (const p of points) {
      const pt = turf.point(p.coordinates);
      const insideZones = [];

      for (const g of geofences) {
        const poly = turf.polygon(g.coordinates);
        if (turf.booleanPointInPolygon(pt, poly)) {
          insideZones.push({
            id: g.id,
            name: g.name,
          });
        }
      }

      results.push({
        vehicleId: p.id,
        coordinates: p.coordinates,
        insideZones,
      });
    }

    parentPort.postMessage({ success: true, result: results });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
});
