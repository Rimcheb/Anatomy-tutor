/**
 * Utility helpers for Anatomy Tutor Canvas
 */

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
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

// Draw a sample starter sketch for immediate testing/demo
export function drawSampleAnatomySketch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  structureId: string
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (structureId === 'heart-anterior') {
    // Charcoal body
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Rough heart contour with tilted apex
    ctx.moveTo(width * 0.35, height * 0.3);
    ctx.bezierCurveTo(width * 0.2, height * 0.4, width * 0.22, height * 0.7, width * 0.45, height * 0.85); // apex
    ctx.bezierCurveTo(width * 0.65, height * 0.75, width * 0.8, height * 0.55, width * 0.7, height * 0.35);
    ctx.bezierCurveTo(width * 0.6, height * 0.25, width * 0.45, height * 0.25, width * 0.35, height * 0.3);
    ctx.stroke();

    // Interventricular groove
    ctx.beginPath();
    ctx.moveTo(width * 0.45, height * 0.45);
    ctx.quadraticCurveTo(width * 0.48, height * 0.65, width * 0.45, height * 0.85);
    ctx.stroke();

    // Red Aorta
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.48, height * 0.4);
    ctx.lineTo(width * 0.5, height * 0.2);
    ctx.bezierCurveTo(width * 0.52, height * 0.12, width * 0.68, height * 0.12, width * 0.7, height * 0.22);
    ctx.stroke();

    // Aortic branches
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.54, height * 0.15);
    ctx.lineTo(width * 0.52, height * 0.08);
    ctx.moveTo(width * 0.59, height * 0.13);
    ctx.lineTo(width * 0.59, height * 0.07);
    ctx.moveTo(width * 0.64, height * 0.14);
    ctx.lineTo(width * 0.66, height * 0.08);
    ctx.stroke();

    // Blue Pulmonary trunk & SVC
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 5;
    // Pulmonary trunk crossing anteriorly
    ctx.beginPath();
    ctx.moveTo(width * 0.4, height * 0.42);
    ctx.bezierCurveTo(width * 0.42, height * 0.3, width * 0.46, height * 0.24, width * 0.48, height * 0.18);
    ctx.stroke();
    // SVC
    ctx.beginPath();
    ctx.moveTo(width * 0.32, height * 0.12);
    ctx.lineTo(width * 0.32, height * 0.28);
    ctx.stroke();

    // Text labels
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('Right Atrium', width * 0.12, height * 0.42);
    ctx.fillText('Right Ventricle', width * 0.25, height * 0.65);
    ctx.fillText('Left Ventricle', width * 0.55, height * 0.65);
    ctx.fillText('Apex', width * 0.42, height * 0.92);
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Aortic Arch', width * 0.72, height * 0.18);
    ctx.fillStyle = '#2563EB';
    ctx.fillText('Pulmonary Trunk', width * 0.15, height * 0.22);
    ctx.fillText('SVC', width * 0.24, height * 0.12);
  } else if (structureId === 'nephron') {
    // Nephron demo
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(width * 0.05, height * 0.45);
    ctx.lineTo(width * 0.95, height * 0.45);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748B';
    ctx.font = '11px system-ui';
    ctx.fillText('CORTEX', width * 0.08, height * 0.42);
    ctx.fillText('MEDULLA', width * 0.08, height * 0.49);

    // Bowman's capsule & Glomerulus
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.25, 30, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // Red glomerulus knot
    ctx.strokeStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.25, 16, 0, 2 * Math.PI);
    ctx.stroke();

    // PCT
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.28, height * 0.25);
    ctx.bezierCurveTo(width * 0.35, height * 0.15, width * 0.32, height * 0.38, width * 0.4, height * 0.3);
    ctx.bezierCurveTo(width * 0.45, height * 0.22, width * 0.42, height * 0.42, width * 0.48, height * 0.45);
    // Loop of Henle descending
    ctx.lineTo(width * 0.48, height * 0.82);
    ctx.bezierCurveTo(width * 0.48, height * 0.88, width * 0.58, height * 0.88, width * 0.58, height * 0.82);
    // Ascending limb
    ctx.lineTo(width * 0.58, height * 0.45);
    ctx.stroke();

    // Thick ascending & DCT
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.58, height * 0.45);
    ctx.lineTo(width * 0.58, height * 0.35);
    ctx.bezierCurveTo(width * 0.62, height * 0.2, width * 0.72, height * 0.35, width * 0.78, height * 0.28);
    ctx.stroke();

    // Collecting duct
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width * 0.85, height * 0.12);
    ctx.lineTo(width * 0.85, height * 0.9);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('Glomerulus & Capsule', width * 0.12, height * 0.18);
    ctx.fillText('PCT', width * 0.34, height * 0.12);
    ctx.fillText('Loop of Henle', width * 0.46, height * 0.92);
    ctx.fillText('DCT', width * 0.68, height * 0.18);
    ctx.fillStyle = '#2563EB';
    ctx.fillText('Collecting Duct', width * 0.78, height * 0.94);
  } else if (structureId === 'neuron') {
    // Neuron demo
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    // Soma
    ctx.beginPath();
    ctx.arc(width * 0.22, height * 0.5, 36, 0, 2 * Math.PI);
    ctx.stroke();
    // Nucleus
    ctx.beginPath();
    ctx.arc(width * 0.22, height * 0.5, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#E2E8F0';
    ctx.fill();
    ctx.stroke();

    // Dendrites
    const dendriteAngles = [-2.2, -1.6, -1.0, 1.2, 1.8, 2.4];
    dendriteAngles.forEach((ang) => {
      const sx = width * 0.22 + Math.cos(ang) * 36;
      const sy = height * 0.5 + Math.sin(ang) * 36;
      const ex = width * 0.22 + Math.cos(ang) * 90;
      const ey = height * 0.5 + Math.sin(ang) * 90;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    });

    // Axon hillock & shaft
    ctx.beginPath();
    ctx.moveTo(width * 0.22 + 36, height * 0.47);
    ctx.lineTo(width * 0.34, height * 0.5);
    ctx.lineTo(width * 0.82, height * 0.5);
    ctx.stroke();

    // Myelin sheaths
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const mx = width * 0.38 + i * (width * 0.1);
      ctx.beginPath();
      ctx.roundRect(mx, height * 0.44, width * 0.075, height * 0.12, 8);
      ctx.fill();
      ctx.stroke();
    }

    // Telodendria
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.82, height * 0.5);
    ctx.lineTo(width * 0.9, height * 0.35);
    ctx.moveTo(width * 0.82, height * 0.5);
    ctx.lineTo(width * 0.92, height * 0.5);
    ctx.moveTo(width * 0.82, height * 0.5);
    ctx.lineTo(width * 0.9, height * 0.65);
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('Soma (Cell Body)', width * 0.12, height * 0.36);
    ctx.fillText('Dendrites', width * 0.05, height * 0.5);
    ctx.fillText('Axon Hillock', width * 0.28, height * 0.42);
    ctx.fillStyle = '#0284C7';
    ctx.fillText('Myelin Sheath', width * 0.46, height * 0.38);
    ctx.fillText('Node of Ranvier', width * 0.53, height * 0.64);
    ctx.fillStyle = '#1E293B';
    ctx.fillText('Axon Terminals', width * 0.82, height * 0.72);
  } else {
    // Generic clinical schematic outline
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.5, width * 0.25, height * 0.25, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#0D9488';
    ctx.font = 'bold 16px system-ui';
    ctx.fillText('Sketch your diagram here', width * 0.35, height * 0.5);
  }

  ctx.restore();
}
