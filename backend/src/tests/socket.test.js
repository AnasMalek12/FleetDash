import http from "http";
import { io as Client } from "socket.io-client";
import app from "../app.js";
import {
  initSocketServer,
  getIO,
  emitToFleet,
  emitToVehicle,
  closeSocketServer,
} from "../socket/socketServer.js";

describe("Socket.io Server & Redis Adapter Integration Tests", () => {
  let server;
  let clientSocket;
  let serverPort;

  beforeAll(async () => {
    server = http.createServer(app);
    await initSocketServer(server);

    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await closeSocketServer();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${serverPort}`, {
      transports: ["websocket"],
      forceNew: true,
    });
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("should successfully connect a client to Socket.io server", () => {
    expect(clientSocket.connected).toBe(true);
    expect(getIO()).toBeDefined();
  });

  it("should allow a client to subscribe and unsubscribe from fleet updates", (done) => {
    clientSocket.emit("subscribe:fleet");

    clientSocket.once("subscribed", (data) => {
      expect(data.room).toBe("fleet");
      expect(data.status).toBe("success");

      clientSocket.emit("unsubscribe:fleet");
      clientSocket.once("unsubscribed", (unsubData) => {
        expect(unsubData.room).toBe("fleet");
        expect(unsubData.status).toBe("success");
        done();
      });
    });
  });

  it("should allow a client to subscribe and unsubscribe from vehicle-specific updates", (done) => {
    const vehicleId = "vehicle-999";
    clientSocket.emit("subscribe:vehicle", vehicleId);

    clientSocket.once("subscribed", (data) => {
      expect(data.room).toBe(`vehicle:${vehicleId}`);
      expect(data.status).toBe("success");

      clientSocket.emit("unsubscribe:vehicle", vehicleId);
      clientSocket.once("unsubscribed", (unsubData) => {
        expect(unsubData.room).toBe(`vehicle:${vehicleId}`);
        expect(unsubData.status).toBe("success");
        done();
      });
    });
  });

  it("should broadcast telemetry data via emitToFleet helper to subscribed clients", (done) => {
    const mockTelemetry = { id: "truck-10", latitude: 37.7749, longitude: -122.4194, speed: 60 };

    clientSocket.emit("subscribe:fleet");
    clientSocket.once("subscribed", () => {
      clientSocket.once("telemetry:fleet_broadcast", (data) => {
        expect(data).toEqual(mockTelemetry);
        done();
      });

      emitToFleet("telemetry:fleet_broadcast", mockTelemetry);
    });
  });

  it("should broadcast telemetry data via emitToVehicle helper to subscribed clients", (done) => {
    const vehicleId = "van-42";
    const mockTelemetry = { id: vehicleId, latitude: 40.7128, longitude: -74.006, speed: 40 };

    clientSocket.emit("subscribe:vehicle", vehicleId);
    clientSocket.once("subscribed", () => {
      clientSocket.once("telemetry:vehicle_broadcast", (data) => {
        expect(data).toEqual(mockTelemetry);
        done();
      });

      emitToVehicle(vehicleId, "telemetry:vehicle_broadcast", mockTelemetry);
    });
  });

  it("should handle client telemetry:update emission and broadcast to fleet and vehicle rooms", (done) => {
    const vehicleId = "truck-77";
    const telemetryPayload = { vehicleId, latitude: 51.5074, longitude: -0.1278, speed: 50 };

    clientSocket.emit("subscribe:vehicle", vehicleId);
    clientSocket.once("subscribed", () => {
      clientSocket.once("telemetry:update", (receivedData) => {
        expect(receivedData).toEqual(telemetryPayload);
        done();
      });

      clientSocket.emit("telemetry:update", telemetryPayload);
    });
  });
});
