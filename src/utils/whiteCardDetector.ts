import { QuadCorners, Point2D } from '../types';

/**
 * Checks if a pixel at index is considered white/bright (card paper surface)
 */
function isWhitePixel(r: number, g: number, b: number): boolean {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const sat = maxC - minC;
  // White card paper typically has lum > 140 and low saturation
  return lum > 135 && sat < 50;
}

/**
 * Detects a white card quadrilateral given a clicked point on the canvas
 */
export function detectWhiteCardAtPoint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clickX: number,
  clickY: number
): QuadCorners | null {
  try {
    // 1. Search region around click point
    const searchRadiusW = Math.min(width * 0.4, 320);
    const searchRadiusH = Math.min(height * 0.4, 420);

    const startX = Math.max(0, Math.floor(clickX - searchRadiusW));
    const startY = Math.max(0, Math.floor(clickY - searchRadiusH));
    const endX = Math.min(width, Math.floor(clickX + searchRadiusW));
    const endY = Math.min(height, Math.floor(clickY + searchRadiusH));

    const scanW = endX - startX;
    const scanH = endY - startY;

    if (scanW <= 20 || scanH <= 20) return null;

    const imgData = ctx.getImageData(startX, startY, scanW, scanH);
    const data = imgData.data;

    // 2. Find nearest white seed point to click position
    let seedX = Math.floor(clickX - startX);
    let seedY = Math.floor(clickY - startY);
    let seedFound = false;

    // Check click position first
    const clickIdx = (seedY * scanW + seedX) * 4;
    if (seedX >= 0 && seedX < scanW && seedY >= 0 && seedY < scanH && isWhitePixel(data[clickIdx], data[clickIdx + 1], data[clickIdx + 2])) {
      seedFound = true;
    } else {
      // Search in expanding concentric rings around click point for a white pixel
      let minDistSq = Infinity;
      const step = 4;
      for (let y = 0; y < scanH; y += step) {
        for (let x = 0; x < scanW; x += step) {
          const idx = (y * scanW + x) * 4;
          if (isWhitePixel(data[idx], data[idx + 1], data[idx + 2])) {
            const distSq = (x - (clickX - startX)) ** 2 + (y - (clickY - startY)) ** 2;
            if (distSq < minDistSq && distSq < 150 * 150) { // Within 150px
              minDistSq = distSq;
              seedX = x;
              seedY = y;
              seedFound = true;
            }
          }
        }
      }
    }

    // 3. Collect white pixels in the neighborhood around seed
    const whitePoints: Point2D[] = [];
    const step = 3; // Sub-sample for high speed

    for (let y = 0; y < scanH; y += step) {
      for (let x = 0; x < scanW; x += step) {
        const idx = (y * scanW + x) * 4;
        if (isWhitePixel(data[idx], data[idx + 1], data[idx + 2])) {
          // Only include points within reasonable distance of seed or click
          const absX = startX + x;
          const absY = startY + y;
          if (Math.hypot(absX - clickX, absY - clickY) < Math.max(searchRadiusW, searchRadiusH)) {
            whitePoints.push({ x: absX, y: absY });
          }
        }
      }
    }

    if (whitePoints.length < 40) {
      // Fallback: Return standard card quad centered at click point if no distinct white card found
      const defaultW = Math.min(width * 0.35, 220);
      const defaultH = defaultW * 1.4;
      return {
        topLeft: { x: Math.max(10, clickX - defaultW / 2), y: Math.max(10, clickY - defaultH / 2) },
        topRight: { x: Math.min(width - 10, clickX + defaultW / 2), y: Math.max(10, clickY - defaultH / 2) },
        bottomRight: { x: Math.min(width - 10, clickX + defaultW / 2), y: Math.min(height - 10, clickY + defaultH / 2) },
        bottomLeft: { x: Math.max(10, clickX - defaultW / 2), y: Math.min(height - 10, clickY + defaultH / 2) },
      };
    }

    // 4. Find 4 extremal corner vertices using projection scores
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

    return {
      topLeft: tl,
      topRight: tr,
      bottomRight: br,
      bottomLeft: bl,
    };
  } catch (err) {
    console.warn('White card click detection error:', err);
    return null;
  }
}

/**
 * Detects a white card quadrilateral within the camera image frame dynamically
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

    const whitePoints: Point2D[] = [];
    const step = 4; // Sub-sample for 60fps performance

    for (let y = 0; y < scanH; y += step) {
      for (let x = 0; x < scanW; x += step) {
        const idx = (y * scanW + x) * 4;
        if (isWhitePixel(data[idx], data[idx + 1], data[idx + 2])) {
          whitePoints.push({ x: startX + x, y: startY + y });
        }
      }
    }

    if (whitePoints.length < 50) return null;

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

    // Smooth transition filter towards detected corners
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const t = 0.2;

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

