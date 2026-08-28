import { QuadCorners, Point2D } from '../types';

/**
 * Detects a white card quadrilateral within the camera image frame
 */
export function detectWhiteCardCorners(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentCorners: QuadCorners
): QuadCorners | null {
  try {
    // Sample region around current target box center
    const cx = (currentCorners.topLeft.x + currentCorners.bottomRight.x) / 2;
    const cy = (currentCorners.topLeft.y + currentCorners.bottomRight.y) / 2;
    
    const boxW = Math.abs(currentCorners.topRight.x - currentCorners.topLeft.x);
    const boxH = Math.abs(currentCorners.bottomLeft.y - currentCorners.topLeft.y);

    const marginX = boxW * 0.4;
    const marginY = boxH * 0.4;

    const startX = Math.max(0, Math.floor(cx - boxW / 2 - marginX));
    const startY = Math.max(0, Math.floor(cy - boxH / 2 - marginY));
    const scanW = Math.min(width - startX, Math.floor(boxW + marginX * 2));
    const scanH = Math.min(height - startY, Math.floor(boxH + marginY * 2));

    if (scanW <= 20 || scanH <= 20) return null;

    const imgData = ctx.getImageData(startX, startY, scanW, scanH);
    const data = imgData.data;

    // Fast threshold check for white/bright pixels (Luminance > 180 and low color saturation)
    const whitePoints: Point2D[] = [];
    const step = 4; // Sub-sample for 60fps performance

    for (let y = 0; y < scanH; y += step) {
      for (let x = 0; x < scanW; x += step) {
        const idx = (y * scanW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        // Color saturation difference
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC - minC;

        if (lum > 175 && sat < 40) {
          whitePoints.push({ x: startX + x, y: startY + y });
        }
      }
    }

    if (whitePoints.length < 50) return null;

    // Find extreme bounding quad corners among white points
    // Top-left minimizes (x + y), Top-right maximizes (x - y)
    // Bottom-right maximizes (x + y), Bottom-left minimizes (x - y)
    let tl = whitePoints[0];
    let tr = whitePoints[0];
    let br = whitePoints[0];
    let bl = whitePoints[0];

    let minSum = tl.x + tl.y;
    let maxSum = br.x + br.y;
    let maxDiff = tr.x - tr.y;
    let minDiff = bl.x - bl.y;

    for (const p of whitePoints) {
      const sum = p.x + p.y;
      const diff = p.x - p.y;

      if (sum < minSum) {
        minSum = sum;
        tl = p;
      }
      if (sum > maxSum) {
        maxSum = sum;
        br = p;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        tr = p;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bl = p;
      }
    }

    // Smooth transition filter towards detected corners (alpha blending 0.25)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const t = 0.25;

    return {
      topLeft: { x: lerp(currentCorners.topLeft.x, tl.x, t), y: lerp(currentCorners.topLeft.y, tl.y, t) },
      topRight: { x: lerp(currentCorners.topRight.x, tr.x, t), y: lerp(currentCorners.topRight.y, tr.y, t) },
      bottomRight: { x: lerp(currentCorners.bottomRight.x, br.x, t), y: lerp(currentCorners.bottomRight.y, br.y, t) },
      bottomLeft: { x: lerp(currentCorners.bottomLeft.x, bl.x, t), y: lerp(currentCorners.bottomLeft.y, bl.y, t) },
    };
  } catch (err) {
    return null;
  }
}
