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

/**
 * Downscales student canvas to maximum dimension for fast network transfer
 * 768px for periodic live coaching checks, 1024px for faculty grading
 */
export function getDownscaledCanvasDataUrl(
  canvas: HTMLCanvasElement | null,
  maxDimension: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.82
): string {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return '';
  }

  const { width, height } = canvas;
  const maxSide = Math.max(width, height);

  if (maxSide <= maxDimension) {
    return canvas.toDataURL(format, quality);
  }

  const scale = maxDimension / maxSide;
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const offscreen = document.createElement('canvas');
  offscreen.width = targetW;
  offscreen.height = targetH;
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    return canvas.toDataURL(format, quality);
  }

  // Ensure solid white background before drawing
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(canvas, 0, 0, targetW, targetH);

  return offscreen.toDataURL(format, quality);
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
