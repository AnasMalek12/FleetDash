import { useEffect, useRef } from 'react';

interface FleetVehicle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const VEHICLE_COLORS = ['#3ecf9e', '#378ADD', '#EF9F27'];

const createVehicles = (count: number, width: number, height: number): FleetVehicle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    color: VEHICLE_COLORS[i % VEHICLE_COLORS.length],
  }));
};

const FleetCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const vehiclesRef = useRef<FleetVehicle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      if (vehiclesRef.current.length === 0) {
        vehiclesRef.current = createVehicles(15, width, height);
      }
    };

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, width, height);

      for (const vehicle of vehiclesRef.current) {
        vehicle.x += vehicle.vx;
        vehicle.y += vehicle.vy;

        if (vehicle.x < 0 || vehicle.x > width) vehicle.vx *= -1;
        if (vehicle.y < 0 || vehicle.y > height) vehicle.vy *= -1;

        ctx.fillStyle = vehicle.color;
        ctx.beginPath();
        ctx.arc(vehicle.x, vehicle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FleetCanvas;
