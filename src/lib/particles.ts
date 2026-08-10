import { useEffect, useRef, useCallback } from "react";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  shape: "circle" | "star" | "square";
  rotation: number;
  rotationSpeed: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  size: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export function useParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const wavesRef = useRef<Shockwave[]>([]);
  const rafRef = useRef<number>(0);

  const burst = useCallback(
    (
      x: number,
      y: number,
      count: number,
      color: string,
      opts?: {
        speed?: number;
        size?: number;
        gravity?: number;
        shape?: "circle" | "star" | "square";
        spread?: number;
      },
    ) => {
      const speed = opts?.speed ?? 4;
      const size = opts?.size ?? 4;
      const gravity = opts?.gravity ?? 0.15;
      const shape = opts?.shape ?? "circle";
      const spread = opts?.spread ?? Math.PI * 2;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * spread - spread / 2 + (Math.PI * 2 - spread) / 2;
        const s = speed * (0.5 + Math.random() * 0.8);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - speed * 0.3,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.6,
          color,
          size: size * (0.6 + Math.random() * 0.8),
          gravity,
          shape,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.3,
        });
      }
    },
    [],
  );

  const floatText = useCallback(
    (x: number, y: number, text: string, color: string, size = 28) => {
      textsRef.current.push({
        x,
        y,
        text,
        color,
        life: 1,
        maxLife: 1.2,
        vy: -1.5,
        size,
      });
    },
    [],
  );

  const shockwave = useCallback(
    (x: number, y: number, maxRadius: number, color: string) => {
      wavesRef.current.push({
        x,
        y,
        radius: 0,
        maxRadius,
        life: 1,
        maxLife: 0.5,
        color,
      });
    },
    [],
  );

  const drawStar = useCallback(
    (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(cx, cy - outer);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outer;
        y = cy + Math.sin(rot) * outer;
        ctx.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * inner;
        y = cy + Math.sin(rot) * inner;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outer);
      ctx.closePath();
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const dpr = window.devicePixelRatio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt / p.maxLife;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        if (p.shape === "star") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          drawStar(ctx, 0, 0, 5, p.size, p.size * 0.4);
          ctx.fill();
          ctx.restore();
        } else if (p.shape === "square") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Shockwaves
      const waves = wavesRef.current;
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i];
        w.life -= dt / w.maxLife;
        if (w.life <= 0) {
          waves.splice(i, 1);
          continue;
        }
        w.radius = w.maxRadius * (1 - w.life);
        ctx.globalAlpha = w.life * 0.6;
        ctx.strokeStyle = w.color;
        ctx.lineWidth = 3 * w.life;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Floating texts
      const texts = textsRef.current;
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life -= dt / t.maxLife;
        if (t.life <= 0) {
          texts.splice(i, 1);
          continue;
        }
        t.y += t.vy;
        t.vy *= 0.97;
        ctx.globalAlpha = Math.min(1, t.life * 1.5);
        ctx.font = `900 ${t.size}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 12;
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [drawStar]);

  return { canvasRef, burst, floatText, shockwave };
}
