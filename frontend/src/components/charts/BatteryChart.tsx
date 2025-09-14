'use client';

import { useEffect, useRef, useState } from 'react';

interface BatteryData {
  id: string;
  name: string;
  level: number;
  status: 'charging' | 'discharging' | 'idle';
}

interface BatteryChartProps {
  batteries: BatteryData[];
  height?: number;
}

export default function BatteryChart({ batteries, height = 300 }: BatteryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
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
    const padding = { top: 60, right: 40, bottom: 60, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear and draw background
    ctx.clearRect(0, 0, width, height);
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    bgGradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    if (batteries.length === 0) return;

    // Draw grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw batteries
    const barWidth = chartWidth / batteries.length;
    const barPadding = barWidth * 0.2;
    const actualBarWidth = barWidth - barPadding * 2;

    batteries.forEach((battery, index) => {
      const x = padding.left + index * barWidth + barPadding;
      // Ensure battery level is a valid number between 0 and 100
      const safeLevel = Math.max(0, Math.min(100, isNaN(battery.level) ? 0 : battery.level));
      const barHeight = (safeLevel / 100) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Battery container
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, padding.top, actualBarWidth, chartHeight);

      // Battery fill gradient - ensure y is valid
      const gradientY = isFinite(y) ? y : padding.top + chartHeight;
      let fillGradient = ctx.createLinearGradient(0, gradientY, 0, padding.top + chartHeight);
      if (safeLevel < 20) {
        fillGradient.addColorStop(0, '#ef4444');
        fillGradient.addColorStop(1, '#dc2626');
      } else if (safeLevel < 50) {
        fillGradient.addColorStop(0, '#f59e0b');
        fillGradient.addColorStop(1, '#d97706');
      } else {
        fillGradient.addColorStop(0, '#10b981');
        fillGradient.addColorStop(1, '#059669');
      }

      // Draw fill with animation effect - only if there's something to draw
      if (barHeight > 0) {
        ctx.fillStyle = fillGradient;
        ctx.fillRect(x + 2, y, actualBarWidth - 4, Math.max(0, barHeight - 2));
      }

      // Draw charging/discharging indicator
      if (battery.status === 'charging') {
        ctx.fillStyle = '#10b981';
        ctx.font = '700 20px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', x + actualBarWidth / 2, y - 10);
      } else if (battery.status === 'discharging') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '700 20px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('→', x + actualBarWidth / 2, y - 10);
      }

      // Battery percentage
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '700 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${safeLevel.toFixed(0)}%`, x + actualBarWidth / 2, padding.top + chartHeight / 2);

      // Battery name
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(battery.name, x + actualBarWidth / 2, padding.top + chartHeight + 25);
    });

    // Title
    ctx.font = '600 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('Battery Storage Levels', padding.left, 30);

    // Y-axis labels
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    for (let i = 0; i <= 4; i++) {
      const value = 100 - (i * 25);
      const y = padding.top + (chartHeight / 4) * i;
      ctx.fillText(`${value}%`, padding.left - 10, y + 4);
    }
  }, [batteries, height, isClient]);

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