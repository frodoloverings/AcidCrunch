import React, { useRef, useEffect, useCallback } from 'react';

// Базовая конфигурация (дефолты)
const CONFIG_BASE = {
  cell: 35,
  dotSize: 2,
  radius: 120,
  heatForce: 1.0,
  fadePerSec: 1.75,
  spawnJitter: 0.2,
  hoverStart: '#ffffff',
  hoverEnd: '#383838',
  dotsColor: '#404040',
  fontScale: 0.31,
  charset: "/@[]?".split(""),

  // --- NEW: физика притяжения ---
  attractStrength: 500,   // сила притяжения к курсору (px/s^2)
  springK: 100,             // возврат к базовой позиции (пружина)
  damping: 9,              // демпфирование (1/с)
  maxOffsetFactor: 0.6     // максимум смещения в долях от cellPx
};

// Ядро Х/У/Й
const HUY = ['Х', 'У', 'Й'];
const pickHUY = () => HUY[(Math.random() * HUY.length) | 0];

// helpers
function hexToRgb(hex: string) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return { r: 64, g: 64, b: 64 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function mixRGB(a: { r: number, g: number, b: number }, b: { r: number, g: number, b: number }, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t)
  };
}
const rgbToCss = (c: { r: number, g: number, b: number }) => `rgb(${c.r},${c.g},${c.b})`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

interface AsciiBackgroundProps {
  viewTransform: {
    panX: number;
    panY: number;
    scale: number;
  };
  /** Расстояние между символами (px, до DPR). Если не указано — дефолт из CONFIG_BASE. */
  cell?: number;
  /** Размер букв как доля от cell. Если не указано — дефолт из CONFIG_BASE. */
  fontScale?: number;
}

// --- NEW: тип ячейки с физикой ---
type Cell = {
  heat: number;
  ch: string;
  ox: number; oy: number; // смещение от базовой позиции
  vx: number; vy: number; // скорость
};

const AsciiBackground: React.FC<AsciiBackgroundProps> = ({ viewTransform, cell, fontScale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef(new Map<string, Cell>());
  const hotCellsRef = useRef(new Set<string>());
  const dimensionsRef = useRef({ W: 0, H: 0, DPR: 1 });
  const mouseRef = useRef({ x: -1e9, y: -1e9, active: false });
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(0);

  // Текущая конфигурация (дефолты + пропсы)
  const configRef = useRef({ ...CONFIG_BASE });
  configRef.current = {
    ...CONFIG_BASE,
    cell: cell ?? CONFIG_BASE.cell,
    fontScale: fontScale ?? CONFIG_BASE.fontScale,
  };

  const pickChar = () => {
    const s = configRef.current.charset;
    return s[(Math.random() * s.length) | 0];
  };

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.max(1, Math.min(3, (window.devicePixelRatio || 1)));
    const { innerWidth: w, innerHeight: h } = window;
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);

    dimensionsRef.current.DPR = DPR;
    dimensionsRef.current.W = canvas.width;
    dimensionsRef.current.H = canvas.height;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }, []);

  const tick = useCallback((now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const cfg = configRef.current;

    const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
    lastTimeRef.current = now;

    const { W, H, DPR } = dimensionsRef.current;
    const { panX, panY } = viewTransform;
    const grid = gridRef.current;
    const hotCells = hotCellsRef.current;
    const mouse = mouseRef.current;

    const worldMouseX = mouse.x - panX;
    const worldMouseY = mouse.y - panY;

    const cellPx = cfg.cell * DPR;
    const halfCell = cellPx * 0.5;
    const rad = cfg.radius * DPR;
    const rad2 = rad * rad;
    const innerR2 = (rad * 0.33) * (rad * 0.33);
    const fontPx = Math.round(cellPx * cfg.fontScale);
    const fade = Math.exp(-cfg.fadePerSec * dt);
    const hoverStartRGB = hexToRgb(cfg.hoverStart);
    const hoverEndRGB = hexToRgb(cfg.hoverEnd);
    const dotsRGB = hexToRgb(cfg.dotsColor);

    const maxOffset = cellPx * cfg.maxOffsetFactor;
    const damp = Math.exp(-cfg.damping * dt); // экспоненциальное демпфирование

    // удалить остывшие (для оптимизации)
    const cellsToRemove: string[] = [];
    for (const key of hotCells) {
      const cell = grid.get(key);
      if (cell) {
        cell.heat *= fade;
        if (cell.heat < 0.01) cellsToRemove.push(key);
      } else {
        cellsToRemove.push(key);
      }
    }
    cellsToRemove.forEach(key => hotCells.delete(key));

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.font = `${fontPx}px system-mono, ui-monospace, Menlo, Consolas, monospace`;

    const cMin = Math.floor(-panX / cellPx);
    const cMax = Math.ceil((W - panX) / cellPx);
    const rMin = Math.floor(-panY / cellPx);
    const rMax = Math.ceil((H - panY) / cellPx);

    for (let r = rMin; r < rMax; r++) {
      for (let c = cMin; c < cMax; c++) {
        const key = `${c},${r}`;
        let data = grid.get(key);
        if (!data) {
          data = { heat: 0, ch: pickChar(), ox: 0, oy: 0, vx: 0, vy: 0 };
          grid.set(key, data);
        }

        const baseX = c * cellPx + halfCell;
        const baseY = r * cellPx + halfCell;

        // текущая смещённая позиция
        let { ox, oy, vx, vy } = data;
        let px = baseX + ox, py = baseY + oy;

        // Силы: пружина к базе + притяжение к курсору (в зоне радиуса)
        let ax = -cfg.springK * ox;
        let ay = -cfg.springK * oy;

        if (mouse.active) {
          const dxm = worldMouseX - px;
          const dym = worldMouseY - py;
          const d2m = dxm * dxm + dym * dym;
          if (d2m < rad2) {
            const d = Math.sqrt(d2m) || 1e-6;
            const fall = 1 - d / rad; // 0..1, сильнее у центра
            const s = cfg.attractStrength * fall;
            ax += (dxm / d) * s;
            ay += (dym / d) * s;

            // heat/символы считаем по базовой точке ячейки (как раньше)
            const dx = baseX - worldMouseX;
            const dy = baseY - worldMouseY;
            const d2 = dx * dx + dy * dy;
            if (d2 < rad2) {
              const fallHeat = 1 - Math.sqrt(d2) / rad;
              if (d2 < innerR2) {
                if (Math.random() > cfg.spawnJitter * 0.5) data.ch = pickHUY();
              } else if (Math.random() > cfg.spawnJitter) {
                if (data.heat < 0.25 || Math.random() < 0.05) data.ch = pickChar();
              }
              data.heat = Math.min(1, Math.max(data.heat, fallHeat * cfg.heatForce));
              hotCells.add(key);
            }
          }
        }

        // Интегрируем скорость/позицию с демпфом
        vx = (vx + ax * dt) * damp;
        vy = (vy + ay * dt) * damp;
        ox = ox + vx * dt;
        oy = oy + vy * dt;

        // Ограничим смещение, чтобы сетка не «разваливалась»
        const mag2 = ox * ox + oy * oy;
        const max2 = maxOffset * maxOffset;
        if (mag2 > max2) {
          const mag = Math.sqrt(mag2);
          const k = maxOffset / (mag || 1e-6);
          ox *= k; oy *= k;
        }

        // Сохраняем состояние
        data.ox = ox; data.oy = oy;
        data.vx = vx; data.vy = vy;

        // Позиция для рисования
        px = baseX + ox; py = baseY + oy;

        // Затухание «тепла»
        data.heat *= fade;

        if (data.heat > 0.12) {
          const t = clamp01(data.heat);
          const eased = t * t;
          const col = mixRGB(hoverEndRGB, hoverStartRGB, eased);
          ctx.fillStyle = rgbToCss(col);
          ctx.fillText(data.ch, px, py + (DPR * 0.15));
        } else {
          const nearLift = data.heat * 30;
          const col = mixRGB(dotsRGB, { r: 255, g: 255, b: 255 }, clamp01(nearLift / 60));
          ctx.fillStyle = rgbToCss(col);
          const s = cfg.dotSize;
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
    }

    ctx.restore();
    rafIdRef.current = requestAnimationFrame(tick);
  }, [viewTransform]);

  useEffect(() => {
    // первичная инициализация
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (x: number, y: number) => {
      mouseRef.current.x = x * dimensionsRef.current.DPR;
      mouseRef.current.y = y * dimensionsRef.current.DPR;
      mouseRef.current.active = true;
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseLeave = () => { mouseRef.current.active = false; };
    const handleTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => { mouseRef.current.active = false; };

    const resizeHandler = () => resize();

    resize();
    rafIdRef.current = requestAnimationFrame(tick);

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resize, tick]);

  // Если меняется cell — очистим сетку (чтобы пересоздать базовые позиции)
  useEffect(() => {
    gridRef.current.clear();
    hotCellsRef.current.clear();
  }, [cell]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    />
  );
};

export default AsciiBackground;
