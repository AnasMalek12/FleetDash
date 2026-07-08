# Canvas Architecture Notes (Day 6 - Mid-Review Prep)

## Current State
- FleetCanvas.tsx owns a single <canvas> element sized to its container via ResizeObserver.
- Vehicle data lives in a useRef (vehiclesRef), NOT React state — this avoids re-renders on every position update.
- Render loop uses requestAnimationFrame, reading directly from vehiclesRef each frame.
- FPS counter is built in for performance visibility.

## Integration Plan for Real Data (Week 2)
- Replace createVehicles() mock data with data received from Socket.io.
- Incoming socket data will need mapping: backend lat/lng -> canvas x/y coordinates.
- Socket updates should mutate vehiclesRef.current directly (via a useSocket hook),
  keeping the render loop fully decoupled from React's render cycle.
- Binary ArrayBuffer payloads (per Day 7-8) will need a parser before updating vehiclesRef.

## Open Questions for Team Sync
- What's the exact shape of the vehicle payload from the backend?
- Coordinate system: raw lat/lng or pre-projected x/y?
