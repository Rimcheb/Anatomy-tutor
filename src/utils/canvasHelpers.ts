/**
 * Anatomy Tutor Canvas & Geometric Drawing Helpers
 * Supports precision tools, shape previews, and realistic demonstration sketches.
 */

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

// Convert Gemini box_2d [ymin, xmin, ymax, xmax] (0-1000) to actual canvas pixel coordinates
export function convertBoxToPixels(
  box: [number, number, number, number],
  canvasWidth: number,
  canvasHeight: number
): { top: number; left: number; width: number; height: number } {
  const [ymin, xmin, ymax, xmax] = box;
  const top = (ymin / 1000) * canvasHeight;
  const left = (xmin / 1000) * canvasWidth;
  const width = Math.max(20, ((xmax - xmin) / 1000) * canvasWidth);
  const height = Math.max(20, ((ymax - ymin) / 1000) * canvasHeight);

  return { top, left, width, height };
}

// Draw shape preview or commit to canvas
export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: 'line' | 'arrow' | 'rectangle' | 'circle' | 'curve',
  start: Point,
  end: Point,
  color: string,
  width: number,
  controlPoint?: Point
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  } else if (tool === 'arrow') {
    // Draw leader line with arrow head
    const headLength = Math.max(12, width * 3.5);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLength * Math.cos(angle - Math.PI / 6),
      end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - headLength * Math.cos(angle + Math.PI / 6),
      end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  } else if (tool === 'rectangle') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
  } else if (tool === 'circle') {
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    const cx = Math.min(start.x, end.x) + rx;
    const cy = Math.min(start.y, end.y) + ry;

    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === 'curve') {
    const ctrl = controlPoint || {
      x: (start.x + end.x) / 2 - (end.y - start.y) * 0.25,
      y: (start.y + end.y) / 2 + (end.x - start.x) * 0.25,
    };
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Demo Drawings:
 * 1. Mostly correct heart with mistakes (transposed vessels, atria small)
 * 2. Unlabeled heart
 * 3. A cat (for testing urgent intervention & playful tease mode)
 */

export function drawSampleHeartWithMistakes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ventricles Body (tilted pear)
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width * 0.38, height * 0.32);
  ctx.bezierCurveTo(width * 0.22, height * 0.42, width * 0.24, height * 0.72, width * 0.48, height * 0.86); // apex
  ctx.bezierCurveTo(width * 0.68, height * 0.74, width * 0.78, height * 0.54, width * 0.68, height * 0.36);
  ctx.bezierCurveTo(width * 0.58, height * 0.28, width * 0.46, height * 0.28, width * 0.38, height * 0.32);
  ctx.stroke();

  // Interventricular groove (sulcus)
  ctx.beginPath();
  ctx.moveTo(width * 0.46, height * 0.46);
  ctx.quadraticCurveTo(width * 0.48, height * 0.66, width * 0.47, height * 0.85);
  ctx.stroke();

  // Too-small Atria (Subtle mistake 1)
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  // Right atrium (drawn intentionally small)
  ctx.beginPath();
  ctx.arc(width * 0.31, height * 0.36, width * 0.045, 0.5 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();

  // Transposed Great Vessels (Mistake 2: Aorta drawn anterior to pulmonary trunk)
  ctx.strokeStyle = '#DC2626'; // Aorta
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(width * 0.46, height * 0.44);
  ctx.lineTo(width * 0.48, height * 0.2);
  ctx.bezierCurveTo(width * 0.5, height * 0.12, width * 0.66, height * 0.12, width * 0.68, height * 0.22);
  ctx.stroke();

  // 3 Aortic branches
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.52, height * 0.14);
  ctx.lineTo(width * 0.5, height * 0.08);
  ctx.moveTo(width * 0.57, height * 0.13);
  ctx.lineTo(width * 0.57, height * 0.07);
  ctx.moveTo(width * 0.62, height * 0.14);
  ctx.lineTo(width * 0.64, height * 0.08);
  ctx.stroke();

  // Blue Pulmonary trunk tucked behind (transposed)
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width * 0.42, height * 0.38);
  ctx.lineTo(width * 0.38, height * 0.22);
  ctx.stroke();

  // SVC
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.16);
  ctx.lineTo(width * 0.3, height * 0.32);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Right Ventricle', width * 0.26, height * 0.64);
  ctx.fillText('Left Ventricle', width * 0.54, height * 0.64);
  ctx.fillText('Apex', width * 0.51, height * 0.88);
  ctx.fillText('Aortic Arch', width * 0.7, height * 0.16);
  ctx.fillText('SVC', width * 0.24, height * 0.18);

  ctx.restore();
}

export function drawSampleUnlabeledHeart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Heart contour
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width * 0.36, height * 0.32);
  ctx.bezierCurveTo(width * 0.2, height * 0.44, width * 0.22, height * 0.74, width * 0.47, height * 0.86);
  ctx.bezierCurveTo(width * 0.68, height * 0.74, width * 0.78, height * 0.54, width * 0.68, height * 0.36);
  ctx.bezierCurveTo(width * 0.58, height * 0.28, width * 0.46, height * 0.28, width * 0.36, height * 0.32);
  ctx.stroke();

  // Sulcus
  ctx.beginPath();
  ctx.moveTo(width * 0.44, height * 0.46);
  ctx.quadraticCurveTo(width * 0.47, height * 0.66, width * 0.46, height * 0.85);
  ctx.stroke();

  // Full Right Atrium
  ctx.beginPath();
  ctx.bezierCurveTo(width * 0.28, height * 0.3, width * 0.22, height * 0.36, width * 0.24, height * 0.48);
  ctx.stroke();

  // Aorta
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(width * 0.48, height * 0.4);
  ctx.lineTo(width * 0.5, height * 0.2);
  ctx.bezierCurveTo(width * 0.52, height * 0.12, width * 0.68, height * 0.12, width * 0.7, height * 0.22);
  ctx.stroke();

  // Arch branches
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width * 0.54, height * 0.14);
  ctx.lineTo(width * 0.52, height * 0.08);
  ctx.moveTo(width * 0.59, height * 0.13);
  ctx.lineTo(width * 0.59, height * 0.07);
  ctx.moveTo(width * 0.64, height * 0.14);
  ctx.lineTo(width * 0.66, height * 0.08);
  ctx.stroke();

  // Pulmonary trunk anterior crossing
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(width * 0.4, height * 0.44);
  ctx.bezierCurveTo(width * 0.42, height * 0.3, width * 0.46, height * 0.24, width * 0.48, height * 0.18);
  ctx.stroke();

  // SVC
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.14);
  ctx.lineTo(width * 0.3, height * 0.3);
  ctx.stroke();

  // NOTE: Intentionally zero text labels!
  ctx.restore();
}

export function drawSampleCat(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 4;

  const cx = width * 0.5;
  const cy = height * 0.42;
  const headR = Math.min(width, height) * 0.18;

  // Cat Head
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Left Pointy Ear
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.8, cy - headR * 0.5);
  ctx.lineTo(cx - headR * 0.9, cy - headR * 1.3);
  ctx.lineTo(cx - headR * 0.2, cy - headR * 0.9);
  ctx.stroke();

  // Right Pointy Ear
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.2, cy - headR * 0.9);
  ctx.lineTo(cx + headR * 0.9, cy - headR * 1.3);
  ctx.lineTo(cx + headR * 0.8, cy - headR * 0.5);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.ellipse(cx - headR * 0.4, cy - headR * 0.15, headR * 0.12, headR * 0.18, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + headR * 0.4, cy - headR * 0.15, headR * 0.12, headR * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Little Triangle Nose
  ctx.beginPath();
  ctx.moveTo(cx, cy + headR * 0.1);
  ctx.lineTo(cx - headR * 0.12, cy + headR * 0.2);
  ctx.lineTo(cx + headR * 0.12, cy + headR * 0.2);
  ctx.closePath();
  ctx.fill();

  // Mouth (W shape)
  ctx.beginPath();
  ctx.arc(cx - headR * 0.15, cy + headR * 0.32, headR * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + headR * 0.15, cy + headR * 0.32, headR * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // Whiskers Left
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.4, cy + headR * 0.15);
  ctx.lineTo(cx - headR * 1.3, cy + headR * 0.05);
  ctx.moveTo(cx - headR * 0.4, cy + headR * 0.25);
  ctx.lineTo(cx - headR * 1.3, cy + headR * 0.25);
  ctx.moveTo(cx - headR * 0.4, cy + headR * 0.35);
  ctx.lineTo(cx - headR * 1.25, cy + headR * 0.45);
  ctx.stroke();

  // Whiskers Right
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.4, cy + headR * 0.15);
  ctx.lineTo(cx + headR * 1.3, cy + headR * 0.05);
  ctx.moveTo(cx + headR * 0.4, cy + headR * 0.25);
  ctx.lineTo(cx + headR * 1.3, cy + headR * 0.25);
  ctx.moveTo(cx + headR * 0.4, cy + headR * 0.35);
  ctx.lineTo(cx + headR * 1.25, cy + headR * 0.45);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.ellipse(cx, cy + headR * 1.8, headR * 0.9, headR * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Curved Tail
  ctx.beginPath();
  ctx.moveTo(cx + headR * 0.8, cy + headR * 2.2);
  ctx.bezierCurveTo(
    cx + headR * 1.6, cy + headR * 2.2,
    cx + headR * 1.8, cy + headR * 1.2,
    cx + headR * 1.4, cy + headR * 0.9
  );
  ctx.stroke();

  // Front Paws
  ctx.beginPath();
  ctx.ellipse(cx - headR * 0.35, cy + headR * 2.8, headR * 0.18, headR * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + headR * 0.35, cy + headR * 2.8, headR * 0.18, headR * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Text label: "Mittens :3"
  ctx.fillStyle = '#64748B';
  ctx.font = 'italic 14px system-ui, sans-serif';
  ctx.fillText('Mittens (=^･ω･^=)', cx - 55, cy + headR * 3.3);

  ctx.restore();
}

// Fallback legacy call
export function drawSampleAnatomySketch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  structureId: string
) {
  drawSampleHeartWithMistakes(ctx, width, height);
}
