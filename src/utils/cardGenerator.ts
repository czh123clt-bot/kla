import { PlayingCard, Suit, Rank } from '../types';

const SUIT_INFO: Record<Suit, { name: string; symbol: string; color: 'red' | 'black' }> = {
  spades: { name: '黑桃', symbol: '♠', color: 'black' },
  hearts: { name: '红桃', symbol: '♥', color: 'red' },
  clubs: { name: '梅花', symbol: '♣', color: 'black' },
  diamonds: { name: '方块', symbol: '♦', color: 'red' },
};

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Helper to render suit symbol SVG path or text
function getSuitSymbolSVG(suit: Suit, x: number, y: number, size: number): string {
  const color = SUIT_INFO[suit].color === 'red' ? '#dc2626' : '#111827';
  if (suit === 'spades') {
    return `<path d="M${x},${y + size * 0.4} C${x - size * 0.4},${y + size * 0.1} ${x - size * 0.55},${y - size * 0.25} ${x},${y - size * 0.55} C${x + size * 0.55},${y - size * 0.25} ${x + size * 0.4},${y + size * 0.1} ${x},${y + size * 0.4} M${x - size * 0.15},${y + size * 0.35} L${x + size * 0.15},${y + size * 0.35} L${x + size * 0.2},${y + size * 0.55} L${x - size * 0.2},${y + size * 0.55} Z" fill="${color}"/>`;
  }
  if (suit === 'hearts') {
    return `<path d="M${x},${y + size * 0.45} C${x - size * 0.55},${y - size * 0.05} ${x - size * 0.55},${y - size * 0.55} ${x},${y - size * 0.2} C${x + size * 0.55},${y - size * 0.55} ${x + size * 0.55},${y - size * 0.05} ${x},${y + size * 0.45} Z" fill="${color}"/>`;
  }
  if (suit === 'clubs') {
    return `<g fill="${color}">
      <circle cx="${x}" cy="${y - size * 0.25}" r="${size * 0.26}"/>
      <circle cx="${x - size * 0.26}" cy="${y + size * 0.1}" r="${size * 0.26}"/>
      <circle cx="${x + size * 0.26}" cy="${y + size * 0.1}" r="${size * 0.26}"/>
      <polygon points="${x - size * 0.12},${y + size * 0.1} ${x + size * 0.12},${y + size * 0.1} ${x + size * 0.18},${y + size * 0.5} ${x - size * 0.18},${y + size * 0.5}"/>
    </g>`;
  }
  // diamonds
  return `<polygon points="${x},${y - size * 0.5} ${x + size * 0.4},${y} ${x},${y + size * 0.5} ${x - size * 0.4},${y}" fill="${color}"/>`;
}

// Generate court card pattern for J, Q, K
function getCourtGraphicSVG(rank: Rank, suit: Suit, color: string): string {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const primaryColor = isRed ? '#dc2626' : '#1e3a8a';
  const secondaryColor = '#f59e0b'; // Gold
  const accentColor = isRed ? '#ef4444' : '#3b82f6';

  let titleText = rank === 'J' ? 'JACK' : rank === 'Q' ? 'QUEEN' : 'KING';

  return `
    <g transform="translate(45, 60)">
      <rect x="0" y="0" width="160" height="230" rx="8" fill="#fafafa" stroke="${primaryColor}" stroke-width="2"/>
      <!-- Outer Decorative Border -->
      <rect x="6" y="6" width="148" height="218" rx="4" fill="none" stroke="${secondaryColor}" stroke-width="2" stroke-dasharray="6 3"/>
      
      <!-- Crown / Headpiece -->
      <path d="M 50,45 L 80,20 L 110,45 L 130,30 L 120,65 L 40,65 L 30,30 Z" fill="${secondaryColor}" stroke="${primaryColor}" stroke-width="2"/>
      <circle cx="80" cy="20" r="5" fill="${accentColor}"/>
      <circle cx="30" cy="30" r="4" fill="${primaryColor}"/>
      <circle cx="130" cy="30" r="4" fill="${primaryColor}"/>

      <!-- Face & Robes -->
      <circle cx="80" cy="85" r="24" fill="#ffedd5" stroke="${primaryColor}" stroke-width="2"/>
      <!-- Eyes & Smile -->
      <circle cx="72" cy="82" r="2.5" fill="#111827"/>
      <circle cx="88" cy="82" r="2.5" fill="#111827"/>
      <path d="M 72,94 Q 80,100 88,94" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"/>
      
      <!-- Hair/Beard for K -->
      ${rank === 'K' ? `<path d="M 56,85 Q 80,115 104,85 C 100,118 60,118 56,85 Z" fill="${secondaryColor}" stroke="${primaryColor}"/>` : ''}
      
      <!-- Body & Robe -->
      <path d="M 30,120 Q 80,110 130,120 L 140,210 L 20,210 Z" fill="${primaryColor}"/>
      <path d="M 60,120 L 80,210 L 100,120 Z" fill="${secondaryColor}"/>
      
      <!-- Scepter / Sword / Weapon -->
      <line x1="${rank === 'K' ? 125 : 35}" y1="50" x2="${rank === 'K' ? 125 : 35}" y2="180" stroke="${secondaryColor}" stroke-width="4"/>
      <circle cx="${rank === 'K' ? 125 : 35}" cy="45" r="7" fill="${accentColor}"/>

      <!-- Center Large Suit Emblem -->
      ${getSuitSymbolSVG(suit, 80, 155, 36)}

      <!-- Banner Title -->
      <rect x="40" y="195" width="80" height="20" rx="4" fill="${secondaryColor}"/>
      <text x="80" y="209" font-family="Cinzel, Georgia, serif" font-size="12" font-weight="bold" fill="#111827" text-anchor="middle" letter-spacing="1">${titleText}</text>
    </g>
  `;
}

// Layout suit symbols for numbers 2 - 10 and Ace
function getPipCoordinates(rank: Rank): Array<{ x: number; y: number; flip?: boolean }> {
  // Card canvas space width=250, height=350. Center = 125, 175
  const left = 75;
  const right = 175;
  const cx = 125;
  const top1 = 70;
  const top2 = 110;
  const midY = 175;
  const bot2 = 240;
  const bot1 = 280;

  switch (rank) {
    case 'A':
      return [{ x: cx, y: midY }];
    case '2':
      return [
        { x: cx, y: top1 },
        { x: cx, y: bot1, flip: true },
      ];
    case '3':
      return [
        { x: cx, y: top1 },
        { x: cx, y: midY },
        { x: cx, y: bot1, flip: true },
      ];
    case '4':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '5':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: cx, y: midY },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '6':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: left, y: midY },
        { x: right, y: midY },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '7':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: cx, y: top2 },
        { x: left, y: midY },
        { x: right, y: midY },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '8':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: cx, y: top2 },
        { x: left, y: midY },
        { x: right, y: midY },
        { x: cx, y: bot2, flip: true },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '9':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: left, y: top2 + 10 },
        { x: right, y: top2 + 10 },
        { x: cx, y: midY },
        { x: left, y: bot2 - 10, flip: true },
        { x: right, y: bot2 - 10, flip: true },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    case '10':
      return [
        { x: left, y: top1 },
        { x: right, y: top1 },
        { x: cx, y: top1 + 30 },
        { x: left, y: top2 + 15 },
        { x: right, y: top2 + 15 },
        { x: left, y: bot2 - 15, flip: true },
        { x: right, y: bot2 - 15, flip: true },
        { x: cx, y: bot1 - 30, flip: true },
        { x: left, y: bot1, flip: true },
        { x: right, y: bot1, flip: true },
      ];
    default:
      return [];
  }
}

// Generate complete SVG String for a playing card
export function generateCardSVG(suit: Suit, rank: Rank): string {
  const info = SUIT_INFO[suit];
  const colorHex = info.color === 'red' ? '#dc2626' : '#111827';
  const width = 250;
  const height = 350;

  let pipsContent = '';
  if (['J', 'Q', 'K'].includes(rank)) {
    pipsContent = getCourtGraphicSVG(rank, suit, colorHex);
  } else {
    const coords = getPipCoordinates(rank);
    const symbolSize = rank === 'A' ? 64 : 32;
    pipsContent = coords
      .map(
        (c) =>
          `<g transform="${c.flip ? `rotate(180 ${c.x} ${c.y})` : ''}">${getSuitSymbolSVG(
            suit,
            c.x,
            c.y,
            symbolSize
          )}</g>`
      )
      .join('\n');
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <!-- Base Card Background -->
    <rect x="0" y="0" width="${width}" height="${height}" rx="14" ry="14" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
    <!-- Subtle Inner Border -->
    <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="11" ry="11" fill="none" stroke="#f3f4f6" stroke-width="1.5"/>

    <!-- Corner Top-Left Rank & Suit -->
    <g transform="translate(14, 16)">
      <text x="0" y="22" font-family="'Times New Roman', Georgia, serif" font-size="26" font-weight="bold" fill="${colorHex}">${rank}</text>
      <g transform="translate(${rank === '10' ? 14 : 6}, 34)">
        ${getSuitSymbolSVG(suit, 0, 0, 16)}
      </g>
    </g>

    <!-- Corner Bottom-Right Rank & Suit (Inverted) -->
    <g transform="rotate(180 ${width / 2} ${height / 2}) translate(14, 16)">
      <text x="0" y="22" font-family="'Times New Roman', Georgia, serif" font-size="26" font-weight="bold" fill="${colorHex}">${rank}</text>
      <g transform="translate(${rank === '10' ? 14 : 6}, 34)">
        ${getSuitSymbolSVG(suit, 0, 0, 16)}
      </g>
    </g>

    <!-- Center Graphics / Pips -->
    ${pipsContent}
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

// Generate full deck of 52 cards using 2x folder HD card assets
export function generateFullDeck(): PlayingCard[] {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  const deck: PlayingCard[] = [];

  for (const suit of suits) {
    for (const rank of RANKS) {
      const info = SUIT_INFO[suit];
      const fileRankStr = rank === 'A' ? 'A' : rank.toLowerCase();
      const imgPath = `/2x/${info.name}${fileRankStr}.png`;

      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        name: `${info.name} ${rank}`,
        suitSymbol: info.symbol,
        color: info.color,
        dataUrl: imgPath,
        isCustom: false,
      });
    }
  }

  return deck;
}

// Wrap an uploaded image in a 250x350 playing card template
export function wrapImageInCardFrame(imageDataUrl: string, title?: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 350;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageDataUrl);
        return;
      }

      // Base card background
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(0, 0, 250, 350, 14);
      } else {
        ctx.rect(0, 0, 250, 350);
      }
      ctx.fill();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Subtle inner border
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(4, 4, 242, 342, 11);
      } else {
        ctx.rect(4, 4, 242, 342);
      }
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top-Left Corner Badge
      ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
      ctx.fillStyle = '#111827';
      ctx.fillText('★', 14, 32);

      // Bottom-Right Corner Badge (Inverted)
      ctx.save();
      ctx.translate(250, 350);
      ctx.rotate(Math.PI);
      ctx.fillText('★', 14, 32);
      ctx.restore();

      // Image Frame area
      const frameX = 20;
      const frameY = 40;
      const frameW = 210;
      const frameH = 270;

      // Fit image aspect ratio inside frame
      const imgRatio = img.width / img.height;
      const frameRatio = frameW / frameH;
      let drawW = frameW;
      let drawH = frameH;
      let drawX = frameX;
      let drawY = frameY;

      if (imgRatio > frameRatio) {
        drawH = frameW / imgRatio;
        drawY = frameY + (frameH - drawH) / 2;
      } else {
        drawW = frameH * imgRatio;
        drawX = frameX + (frameW - drawW) / 2;
      }

      // Draw uploaded image inside frame
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(frameX, frameY, frameW, frameH, 8);
      } else {
        ctx.rect(frameX, frameY, frameW, frameH);
      }
      ctx.clip();

      // Soft background for transparent images
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(frameX, frameY, frameW, frameH);

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      // Frame border
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(frameX, frameY, frameW, frameH, 8);
      } else {
        ctx.rect(frameX, frameY, frameW, frameH);
      }
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.stroke();

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(imageDataUrl);
    };

    img.src = imageDataUrl;
  });
}
