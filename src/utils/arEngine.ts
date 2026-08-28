import { ARSettings, QuadCorners, Point2D } from '../types';

// Helper: Grid mesh subdivide warp using Canvas 2D context
// Divides rect (0,0, srcW, srcH) into rows x cols triangles and transforms onto QuadCorners
export function drawWarpedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  corners: QuadCorners,
  gridCols = 12,
  gridRows = 16
) {
  const srcW = img.width || 250;
  const srcH = img.height || 350;

  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = corners;

  // Bilinear interpolation point on quad
  function getQuadPoint(u: number, v: number): Point2D {
    const topX = p0.x + (p1.x - p0.x) * u;
    const topY = p0.y + (p1.y - p0.y) * u;
    const botX = p3.x + (p2.x - p3.x) * u;
    const botY = p3.y + (p2.y - p3.y) * u;
    return {
      x: topX + (botX - topX) * v,
      y: topY + (botY - topY) * v,
    };
  }

  // Draw triangle (u0,v0)-(u1,v1)-(u2,v2)
  function drawTriangle(
    u0: number, v0: number,
    u1: number, v1: number,
    u2: number, v2: number
  ) {
    const pA = getQuadPoint(u0, v0);
    const pB = getQuadPoint(u1, v1);
    const pC = getQuadPoint(u2, v2);

    const sx0 = u0 * srcW;
    const sy0 = v0 * srcH;
    const sx1 = u1 * srcW;
    const sy1 = v1 * srcH;
    const sx2 = u2 * srcW;
    const sy2 = v2 * srcH;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.clip();

    // Compute affine transform matrix mapping (sx0,sy0),(sx1,sy1),(sx2,sy2) -> (pA.x,pA.y),(pB.x,pB.y),(pC.x,pC.y)
    const denom = sx0 * (sy1 - sy2) - sx1 * (sy0 - sy2) + sx2 * (sy0 - sy1);
    if (Math.abs(denom) < 0.0001) {
      ctx.restore();
      return;
    }

    const m11 = (pA.x * (sy1 - sy2) - pB.x * (sy0 - sy2) + pC.x * (sy0 - sy1)) / denom;
    const m12 = (pA.y * (sy1 - sy2) - pB.y * (sy0 - sy2) + pC.y * (sy0 - sy1)) / denom;
    const m21 = (pA.x * (sx2 - sx1) - pB.x * (sx2 - sx0) + pC.x * (sx1 - sx0)) / denom;
    const m22 = (pA.y * (sx2 - sx1) - pB.y * (sx2 - sx0) + pC.y * (sx1 - sx0)) / denom;
    const dx = (pA.x * (sx1 * sy2 - sx2 * sy1) - pB.x * (sx0 * sy2 - sx2 * sy0) + pC.x * (sx0 * sy1 - sx1 * sy0)) / denom;
    const dy = (pA.y * (sx1 * sy2 - sx2 * sy1) - pB.y * (sx0 * sy2 - sx2 * sy0) + pC.y * (sx0 * sy1 - sx1 * sy0)) / denom;

    ctx.transform(m11, m12, m21, m22, dx, dy);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  for (let c = 0; c < gridCols; c++) {
    for (let r = 0; r < gridRows; r++) {
      const u0 = c / gridCols;
      const v0 = r / gridRows;
      const u1 = (c + 1) / gridCols;
      const v1 = (r + 1) / gridRows;

      // Triangle 1: (u0,v0), (u1,v0), (u0,v1)
      drawTriangle(u0, v0, u1, v0, u0, v1);
      // Triangle 2: (u1,v0), (u1,v1), (u0,v1)
      drawTriangle(u1, v0, u1, v1, u0, v1);
    }
  }
}

// Main AR composite renderer blending video frame + card graphic with light/shadow map
export function processARFrame(
  videoCanvasCtx: CanvasRenderingContext2D,
  videoWidth: number,
  videoHeight: number,
  cardImg: HTMLImageElement,
  corners: QuadCorners,
  settings: ARSettings
) {
  // 1. Create an offscreen buffer canvas for the warped card image
  const cardWarpCanvas = document.createElement('canvas');
  cardWarpCanvas.width = videoWidth;
  cardWarpCanvas.height = videoHeight;
  const cardWarpCtx = cardWarpCanvas.getContext('2d', { willReadFrequently: true });
  if (!cardWarpCtx) return;

  // Draw warped card on cardWarpCanvas
  drawWarpedImage(cardWarpCtx, cardImg, corners, 12, 16);

  // 2. Obtain bounding box of corners for pixel manipulation
  const minX = Math.max(0, Math.floor(Math.min(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x)) - 10);
  const maxX = Math.min(videoWidth, Math.ceil(Math.max(corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x)) + 10);
  const minY = Math.max(0, Math.floor(Math.min(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y)) - 10);
  const maxY = Math.min(videoHeight, Math.ceil(Math.max(corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y)) + 10);

  const regionW = maxX - minX;
  const regionH = maxY - minY;
  if (regionW <= 0 || regionH <= 0) return;

  // 3. Get pixel data from camera video canvas and warped card canvas
  const videoImgData = videoCanvasCtx.getImageData(minX, minY, regionW, regionH);
  const cardImgData = cardWarpCtx.getImageData(minX, minY, regionW, regionH);

  const videoPix = videoImgData.data;
  const cardPix = cardImgData.data;

  // Sample ambient color around boundary for tinting if enabled
  let avgR = 255, avgG = 255, avgB = 255;
  if (settings.ambientColorMatch) {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    // Sample top and bottom edge pixels of region
    for (let x = 0; x < regionW; x += 4) {
      const idx1 = (0 * regionW + x) * 4;
      const idx2 = ((regionH - 1) * regionW + x) * 4;
      rSum += videoPix[idx1] + videoPix[idx2];
      gSum += videoPix[idx1 + 1] + videoPix[idx2 + 1];
      bSum += videoPix[idx1 + 2] + videoPix[idx2 + 2];
      count += 2;
    }
    if (count > 0) {
      avgR = rSum / count;
      avgG = gSum / count;
      avgB = bSum / count;
    }
  }

  // 4. Pixel-by-pixel photorealistic light & shadow blending
  const shadowIntensity = settings.shadowIntensity;
  const highlightPreserve = settings.highlightPreserve;
  const contrastBoost = settings.contrastBoost;
  const mode = settings.blendMode;

  for (let i = 0; i < videoPix.length; i += 4) {
    const cardAlpha = cardPix[i + 3];
    if (cardAlpha === 0) continue; // Outside card boundary

    // Physical webcam pixel underneath
    const camR = videoPix[i];
    const camG = videoPix[i + 1];
    const camB = videoPix[i + 2];

    // Card pixel
    const cr = cardPix[i];
    const cg = cardPix[i + 1];
    const cb = cardPix[i + 2];

    // Calculate Luminance of physical card in camera frame
    let lum = (0.299 * camR + 0.587 * camG + 0.114 * camB) / 255;
    
    // Contrast boost on shadow map
    lum = Math.pow(lum, contrastBoost);

    // Light/shadow scaling factor
    const shadowFactor = 1 - (1 - lum) * shadowIntensity;

    let outR = cr;
    let outG = cg;
    let outB = cb;

    if (mode === 'multiply') {
      outR = (cr * shadowFactor * (settings.ambientColorMatch ? avgR / 255 : 1));
      outG = (cg * shadowFactor * (settings.ambientColorMatch ? avgG / 255 : 1));
      outB = (cb * shadowFactor * (settings.ambientColorMatch ? avgB / 255 : 1));
    } else if (mode === 'overlay') {
      outR = cr < 128 ? (2 * cr * camR) / 255 : 255 - (2 * (255 - cr) * (255 - camR)) / 255;
      outG = cg < 128 ? (2 * cg * camG) / 255 : 255 - (2 * (255 - cg) * (255 - camG)) / 255;
      outB = cb < 128 ? (2 * cb * camB) / 255 : 255 - (2 * (255 - cb) * (255 - camB)) / 255;
    } else if (mode === 'soft-light') {
      outR = camR < 128 ? camR + (cr / 255) * (128 - camR) : camR + (cr / 255) * (camR - 128);
      outG = camG < 128 ? camG + (cg / 255) * (128 - camG) : camG + (cg / 255) * (camG - 128);
      outB = camB < 128 ? camB + (cb / 255) * (128 - camB) : camB + (cb / 255) * (camB - 128);
    } else if (mode === 'hard-light') {
      outR = camR < 128 ? (2 * camR * cr) / 255 : 255 - (2 * (255 - camR) * (255 - cr)) / 255;
      outG = camG < 128 ? (2 * camG * cg) / 255 : 255 - (2 * (255 - camG) * (255 - cg)) / 255;
      outB = camB < 128 ? (2 * camB * cb) / 255 : 255 - (2 * (255 - camB) * (255 - cb)) / 255;
    } else {
      // Direct placement
      outR = cr;
      outG = cg;
      outB = cb;
    }

    // Preserve glossy specular highlights
    if (lum > 0.85 && highlightPreserve > 0) {
      const spec = (lum - 0.85) * 6.6 * 255 * highlightPreserve;
      outR = Math.min(255, outR + spec);
      outG = Math.min(255, outG + spec);
      outB = Math.min(255, outB + spec);
    }

    // Alpha blending with edge opacity
    const normAlpha = cardAlpha / 255;
    videoPix[i] = Math.round(outR * normAlpha + camR * (1 - normAlpha));
    videoPix[i + 1] = Math.round(outG * normAlpha + camG * (1 - normAlpha));
    videoPix[i + 2] = Math.round(outB * normAlpha + camB * (1 - normAlpha));
  }

  // 5. Put composite pixels back to video canvas
  videoCanvasCtx.putImageData(videoImgData, minX, minY);
}
