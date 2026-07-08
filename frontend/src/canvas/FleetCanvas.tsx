import { useEffect, useRef } from 'react';

const FleetCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // temporary test draw — confirms canvas is working
      ctx.fillStyle = '#0b0d10';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#3ecf9e';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 20, 0, Math.PI * 2);
      ctx.fill();
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FleetCanvas;
