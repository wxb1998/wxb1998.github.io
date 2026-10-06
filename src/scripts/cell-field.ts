// Hero animation: a slowly rotating 3D "UMAP" of single cells. Points form clusters (and a few
// trajectory-shaped arcs), labelled like annotated cell types, and drift away from the cursor.

const PALETTE = ['#38e1ff', '#a78bfa', '#ff5cc8', '#4ade80', '#fbbf24', '#60a5fa', '#fb7185', '#2dd4bf', '#c084fc', '#a3e635'];

interface Cluster {
  x: number;
  y: number;
  z: number;
  color: string;
  label: string;
  sprite: HTMLCanvasElement;
}

interface Cell {
  x: number;
  y: number;
  z: number;
  cluster: number;
  size: number;
  delay: number;
  dx: number;
  dy: number;
}

/** Deterministic random numbers so the cloud looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A soft glowing dot, pre-rendered once per cluster color. */
function makeSprite(color: string): HTMLCanvasElement {
  const s = 32;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.18, color);
  grad.addColorStop(0.45, color + '55');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export interface CellFieldOptions {
  labels: string[];
  onCount?: (n: number) => void;
}

export function initCellField(canvas: HTMLCanvasElement, { labels, onCount }: CellFieldOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = mulberry32(20261006);
  const gauss = () => {
    const u = 1 - rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // ---- Build clusters on a flattened sphere (Fibonacci spiral keeps them evenly spread) ----
  const clusters: Cluster[] = labels.map((label, i) => {
    const k = labels.length;
    const yy = 1 - (2 * (i + 0.5)) / k;
    const r = Math.sqrt(1 - yy * yy);
    const theta = i * 2.399963;
    const color = PALETTE[i % PALETTE.length];
    return {
      x: Math.cos(theta) * r * 0.85 + gauss() * 0.08,
      y: yy * 0.62 + gauss() * 0.06,
      z: Math.sin(theta) * r * 0.55,
      color,
      label,
      sprite: makeSprite(color),
    };
  });

  // ---- Scatter cells around the clusters ----
  let cells: Cell[] = [];

  function buildCells(total: number) {
    cells = [];
    const weights = clusters.map(() => 0.6 + rand() * 0.9);
    const sum = weights.reduce((a, b) => a + b, 0);
    clusters.forEach((c, ci) => {
      const n = Math.round((weights[ci] / sum) * total);
      const spread = [0.07 + rand() * 0.09, 0.05 + rand() * 0.07, 0.05 + rand() * 0.07];
      // Every third cluster is a differentiation "trajectory": an arc toward the next cluster
      const next = clusters[(ci + 1) % clusters.length];
      const isTrajectory = ci % 3 === 1;
      for (let j = 0; j < n; j++) {
        let x = c.x + gauss() * spread[0];
        let y = c.y + gauss() * spread[1];
        let z = c.z + gauss() * spread[2];
        if (isTrajectory && rand() < 0.45) {
          const t = rand() * 0.75;
          const bend = Math.sin(t * Math.PI) * 0.18;
          x = c.x + (next.x - c.x) * t + gauss() * 0.025;
          y = c.y + (next.y - c.y) * t + bend + gauss() * 0.025;
          z = c.z + (next.z - c.z) * t + gauss() * 0.025;
        }
        cells.push({ x, y, z, cluster: ci, size: 0.7 + rand() * 0.9, delay: rand() * 0.35 + ci * 0.03, dx: 0, dy: 0 });
      }
    });
    onCount?.(cells.length);
  }

  // ---- Sizing ----
  let width = 0;
  let height = 0;
  let dpr = 1;
  let wide = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    wide = width >= 900;
    const target = Math.round(Math.min(2600, Math.max(900, (width * height) / 520)));
    if (Math.abs(target - cells.length) > 200) buildCells(target);
    if (!running) draw(performance.now());
  }

  // ---- Pointer (smoothed) ----
  const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, sx: 0, sy: 0 };
  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.nx = (pointer.x / rect.width) * 2 - 1;
    pointer.ny = (pointer.y / rect.height) * 2 - 1;
  }
  function onPointerLeave() {
    pointer.x = pointer.y = -9999;
    pointer.nx = pointer.ny = 0;
  }

  // ---- Render ----
  const start = performance.now();
  const INTRO_MS = 2200;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

  function draw(now: number) {
    const elapsed = reduceMotion ? 1e9 : now - start;
    pointer.sx += (pointer.nx - pointer.sx) * 0.04;
    pointer.sy += (pointer.ny - pointer.sy) * 0.04;

    const ry = elapsed * 0.00008 + pointer.sx * 0.35;
    const rx = 0.32 + pointer.sy * 0.18;
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);

    const cx = wide ? width * 0.68 : width * 0.5;
    const cy = wide ? height * 0.5 : height * 0.3;
    const scale = Math.min(wide ? width * 0.3 : width * 0.5, height * 0.42);
    const fov = 2.6;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const f = fov / (fov + z2);
      return { px: cx + x1 * scale * f, py: cy + y1 * scale * f, f, depth: z2 };
    };

    ctx!.clearRect(0, 0, width, height);
    ctx!.globalCompositeOperation = 'lighter';

    const repelRadius = 110;
    for (const cell of cells) {
      const t = Math.min(1, Math.max(0, (elapsed / INTRO_MS - cell.delay) / 0.65));
      const e = easeOut(t);
      if (e <= 0) continue;
      const { px, py, f, depth } = project(cell.x * e, cell.y * e, cell.z * e);

      // Push cells away from the cursor, then let them spring back
      let tx = 0;
      let ty = 0;
      const ddx = px - pointer.x;
      const ddy = py - pointer.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist < repelRadius && dist > 0.01) {
        const push = Math.pow(1 - dist / repelRadius, 2) * 34;
        tx = (ddx / dist) * push;
        ty = (ddy / dist) * push;
      }
      cell.dx += (tx - cell.dx) * 0.12;
      cell.dy += (ty - cell.dy) * 0.12;

      const size = cell.size * f * (wide ? 7 : 6);
      ctx!.globalAlpha = Math.min(1, (0.35 + 0.65 * (1 - (depth + 1) / 2)) * e);
      ctx!.drawImage(clusters[cell.cluster].sprite, px + cell.dx - size / 2, py + cell.dy - size / 2, size, size);
    }

    // Cluster annotations, as on a labelled UMAP
    ctx!.globalCompositeOperation = 'source-over';
    const labelAlpha = Math.max(0, Math.min(1, (elapsed - INTRO_MS * 0.8) / 800));
    if (wide && labelAlpha > 0) {
      ctx!.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
      ctx!.textBaseline = 'middle';
      for (const c of clusters) {
        const { px, py, depth } = project(c.x, c.y, c.z);
        const front = 1 - (depth + 1) / 2;
        const lx = px + 30;
        const ly = py - 26;
        const w = ctx!.measureText(c.label).width + 14;
        ctx!.globalAlpha = labelAlpha * (0.45 + 0.55 * front);
        ctx!.strokeStyle = c.color;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(px + 4, py - 4);
        ctx!.lineTo(lx - 6, ly);
        ctx!.lineTo(lx, ly);
        ctx!.stroke();
        ctx!.fillStyle = 'rgba(5, 7, 12, 0.78)';
        ctx!.beginPath();
        ctx!.roundRect(lx, ly - 10, w, 20, 4);
        ctx!.fill();
        ctx!.stroke();
        ctx!.fillStyle = '#e2e8f0';
        ctx!.fillText(c.label, lx + 7, ly + 0.5);
      }
      // UMAP axes in the lower-left of the cloud
      const ax = cx - scale * 0.95;
      const ay = cy + scale * 0.85;
      ctx!.globalAlpha = labelAlpha * 0.5;
      ctx!.strokeStyle = '#94a3b8';
      ctx!.beginPath();
      ctx!.moveTo(ax, ay - 40);
      ctx!.lineTo(ax, ay);
      ctx!.lineTo(ax + 40, ay);
      ctx!.stroke();
      ctx!.fillStyle = '#94a3b8';
      ctx!.fillText('UMAP_1', ax + 46, ay);
      ctx!.save();
      ctx!.translate(ax, ay - 46);
      ctx!.rotate(-Math.PI / 2);
      ctx!.fillText('UMAP_2', 0, 0);
      ctx!.restore();
    }
    ctx!.globalAlpha = 1;
  }

  // ---- Loop: only runs while the hero is on screen and the tab is visible ----
  let running = false;
  let visible = true;
  let frame = 0;

  function loop(now: number) {
    draw(now);
    frame = requestAnimationFrame(loop);
  }
  function update() {
    const shouldRun = !reduceMotion && visible && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(loop);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  if (!reduceMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerleave', onPointerLeave);
  }

  resize();
  update();
}
