import React, { useEffect, useRef } from 'react';
import { SystemSettings } from '../types';

interface BackgroundCanvasProps {
  settings: SystemSettings;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.min(60, Math.floor(canvas.width / 25));
      const colors = ['#00F0FF', '#B6FF00', '#FF007A', '#7A22FF', '#FFFFFF'];
      const p: Particle[] = [];
      for (let i = 0; i < count; i++) {
        p.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4 - 0.1,
          size: Math.random() * 2 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.6 + 0.2,
        });
      }
      particlesRef.current = p;
    };

    resize();
    window.addEventListener('resize', resize);

    // Shockwave click handler
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const colors = ['#00F0FF', '#B6FF00', '#FF007A'];
      ripplesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.max(120, Math.min(canvas.width, canvas.height) * 0.35),
        alpha: 0.9,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    window.addEventListener('pointerdown', handleClick);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 5;
        r.alpha -= 0.022;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = r.color;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.save();
            ctx.strokeStyle = '#00F0FF';
            ctx.globalAlpha = (1 - dist / 85) * 0.15;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handleClick);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background Image / Video Layer */}
      {settings.bgType === 'custom' && settings.customBgUrl ? (
        settings.customBgIsVideo ? (
          <video
            src={settings.customBgUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 transition-all duration-700"
            style={{ backgroundImage: `url(${settings.customBgUrl})` }}
          />
        )
      ) : settings.bgType === 'planet' ? (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 mix-blend-screen scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url('/assets/aistudio/planet_d7a019fc.jpg')` }}
        />
      ) : null}

      {/* World SVG / Nebula Ambient Lighting Layer */}
      {settings.worldBg === 'aurora' ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#051A18]/80 via-[#07241F]/40 to-[#0A3D2F]/20 opacity-70" />
      ) : settings.worldBg === 'dawn' ? (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1E0B18]/80 via-[#260F1A]/40 to-[#3D1426]/20 opacity-70" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0C0F22]/80 via-[#101432]/40 to-[#19163F]/20 opacity-70" />
      )}

      {/* Cyber Grid Lines Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30" />

      {/* Radial Obsidian Vignette Gradient */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#07080E]/60 to-[#07080E]/95" />

      {/* Dynamic Interactive Fluid Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
