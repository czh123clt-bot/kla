export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface PlayingCard {
  id: string;
  suit?: Suit;
  rank?: Rank;
  name: string; // e.g., "黑桃 A", "红桃 K", "自定义图片 1"
  suitSymbol?: string;
  color?: 'red' | 'black';
  dataUrl?: string; // Pre-rendered SVG or custom image data URL
  isCustom?: boolean;
}

export type BlendModeOption = 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'direct';

export interface ARSettings {
  blendMode: BlendModeOption;
  shadowIntensity: number; // 0.0 to 1.5
  highlightPreserve: number; // 0.0 to 1.0
  ambientColorMatch: boolean; // Auto sample surrounding ambient tint
  edgeFeather: number; // 0 to 10 px
  contrastBoost: number; // 0.8 to 1.5
  autoDetectWhiteCard: boolean; // Auto snap to white rectangular object
  showCornerHandles: boolean;
  lockAspectRatio: boolean; // 1:1.4 (Standard Playing Card ratio)
  cardScale: number; // scale ratio inside frame
}

export interface Point2D {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

export interface CapturedPhoto {
  id: string;
  timestamp: number;
  originalDataUrl: string;
  compositeDataUrl: string;
  cardName: string;
  corners: QuadCorners;
  blendSettings: ARSettings;
}
