'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface ChartData {
  time: number;
  value: number;
}

interface EnergyChartProps {
  data: ChartData[];
  title: string;
  color: string;
  unit: string;
  currentValue?: number;
  targetValue?: number;
  minValue?: number;
  maxValue?: number;
  type?: 'line' | 'area' | 'bar';
  showGrid?: boolean;
  height?: number;
}

export default function EnergyChart({
  data,
  title,
  color,
  unit,
  currentValue,
  targetValue,
  minValue,
  maxValue,
  type = 'line',
  showGrid = true,
  height = 300
}: EnergyChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const draw = useCallback(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for crisp rendering
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const padding = { top: 40, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    bgGradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (data.length < 2) return;

    // Calculate data range
    const values = data.map(d => d.value);
    const dataMin = minValue !== undefined ? minValue : Math.min(...values);
    const dataMax = maxValue !== undefined ? maxValue : Math.max(...values);
    const range = dataMax - dataMin || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding.left + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // Draw target line if provided
    if (targetValue !== undefined) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      const targetY = padding.top + chartHeight - ((targetValue - dataMin) / range) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, targetY);
      ctx.lineTo(width - padding.right, targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw chart based on type
    if (type === 'area') {
      // Draw area fill
      const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      areaGradient.addColorStop(0, `${color}40`);
      areaGradient.addColorStop(1, `${color}05`);
      ctx.fillStyle = areaGradient;

      ctx.beginPath();
      data.forEach((point, index) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * index;
        const y = padding.top + chartHeight - ((point.value - dataMin) / range) * chartHeight;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.closePath();
      ctx.fill();
    }

    // Draw main line
    const lineGradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
    lineGradient.addColorStop(0, `${color}cc`);
    lineGradient.addColorStop(0.5, color);
    lineGradient.addColorStop(1, `${color}cc`);

    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    data.forEach((point, index) => {
      const x = padding.left + (chartWidth / (data.length - 1)) * index;
      const y = padding.top + chartHeight - ((point.value - dataMin) / range) * chartHeight;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';

    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = dataMin + (range / 5) * (5 - i);
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(1), padding.left - 10, y + 4);
    }

    // Title
    ctx.font = '600 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(title, padding.left, 25);

    // Current value
    if (currentValue !== undefined) {
      ctx.font = '700 16px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = color;
      ctx.fillText(`${currentValue.toFixed(2)} ${unit}`, width - padding.right, 25);
    }
  }, [data, title, color, unit, currentValue, targetValue, minValue, maxValue, type, showGrid, height, isClient]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50"
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}