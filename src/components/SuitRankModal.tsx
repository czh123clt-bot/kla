import React, { useState } from 'react';
import { PlayingCard, Suit, Rank } from '../types';
import { ArrowLeft, Sparkles, Upload, X } from 'lucide-react';

interface SuitRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: PlayingCard[];
  selectedCard: PlayingCard;
  onSelectCard: (card: PlayingCard) => void;
  onCustomImageUpload: (dataUrl: string, name: string) => void;
}

const SUITS_CONFIG: {
  key: Suit;
  name: string;
  symbol: string;
  color: 'black' | 'red';
  bgHover: string;
  borderColor: string;
  symbolColor: string;
}[] = [
  {
    key: 'spades',
    name: '黑桃',
    symbol: '♠',
    color: 'black',
    bgHover: 'hover:bg-neutral-800/80',
    borderColor: 'border-white/20 hover:border-white',
    symbolColor: 'text-white',
  },
  {
    key: 'clubs',
    name: '梅花',
    symbol: '♣',
    color: 'black',
    bgHover: 'hover:bg-neutral-800/80',
    borderColor: 'border-white/20 hover:border-white',
    symbolColor: 'text-white',
  },
  {
    key: 'hearts',
    name: '红桃',
    symbol: '♥',
    color: 'red',
    bgHover: 'hover:bg-red-950/40',
    borderColor: 'border-red-500/30 hover:border-red-500',
    symbolColor: 'text-red-500',
  },
  {
    key: 'diamonds',
    name: '方片',
    symbol: '♦',
    color: 'red',
    bgHover: 'hover:bg-red-950/40',
    borderColor: 'border-red-500/30 hover:border-red-500',
    symbolColor: 'text-red-500',
  },
];

export const SuitRankModal: React.FC<SuitRankModalProps> = ({
  isOpen,
  onClose,
  cards,
  selectedCard,
  onSelectCard,
  onCustomImageUpload,
}) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);

  if (!isOpen) return null;

  // Filter cards for the currently chosen suit
  const suitCards = selectedSuit
    ? cards.filter((card) => card.suit === selectedSuit)
    : [];

  const handleSuitSelect = (suit: Suit) => {
    setSelectedSuit(suit);
  };

  const handleCardPick = (card: PlayingCard) => {
    onSelectCard(card);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCustomImageUpload(
            event.target.result as string,
            file.name.replace(/\.[^/.]+$/, '')
          );
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300 font-sans">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-radial from-neutral-900/40 via-black to-black pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono-hud font-bold tracking-[0.25em] text-white/40 uppercase">
            AETHER / SELECTOR
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-serif-display text-white text-lg font-bold tracking-wider">
            扑克牌图案选择器
          </span>
        </div>

        {/* Close button if user already has a card selected */}
        {selectedCard && (
          <button
            onClick={onClose}
            className="p-2 rounded-sm bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10 transition-colors"
            title="关闭并进入相机"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Interactive Stage Container */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0a0a0a] border border-white/15 rounded-sm p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Stage 1: Four Suits Selection */}
        {!selectedSuit && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-serif-display font-bold text-white tracking-widest uppercase">
                第一步：请选择扑克牌花色
              </h2>
              <p className="text-xs font-mono-hud text-white/40">
                CHOOSE SUIT (SPADES, CLUBS, HEARTS, DIAMONDS)
              </p>
            </div>

            {/* 4 Suits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {SUITS_CONFIG.map((suit) => (
                <button
                  key={suit.key}
                  onClick={() => handleSuitSelect(suit.key)}
                  className={`group relative p-6 rounded-sm bg-[#050505] border ${suit.borderColor} ${suit.bgHover} transition-all duration-200 transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3 shadow-lg`}
                >
                  <span className={`text-5xl font-serif-display ${suit.symbolColor} group-hover:scale-110 transition-transform`}>
                    {suit.symbol}
                  </span>
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono-hud text-white tracking-wider">
                      {suit.name}
                    </div>
                    <div className="text-[10px] font-mono-hud text-white/40 uppercase mt-0.5">
                      13张 (A - K)
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Optional Custom Image Upload Option */}
            <div className="pt-2 border-t border-white/10">
              <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white/80 hover:text-white cursor-pointer transition-all font-mono-hud text-xs tracking-wider">
                <Upload className="w-4 h-4 text-white/80" />
                <span>或上传自定义图片/照片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Stage 2: A - K Ranks Selection */}
        {selectedSuit && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
            {/* Stage Title & Back Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <button
                onClick={() => setSelectedSuit(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/5 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 text-xs font-mono-hud transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回花色选择</span>
              </button>

              <div className="flex items-center gap-2 font-mono-hud text-xs font-bold text-white uppercase">
                <span className={`text-xl ${SUITS_CONFIG.find((s) => s.key === selectedSuit)?.symbolColor}`}>
                  {SUITS_CONFIG.find((s) => s.key === selectedSuit)?.symbol}
                </span>
                <span>{SUITS_CONFIG.find((s) => s.key === selectedSuit)?.name} - 请选择点数 (A-K)</span>
              </div>
            </div>

            {/* 13 Cards Grid (A to K) */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 max-h-[55vh] overflow-y-auto p-1 scrollbar-thin">
              {suitCards.map((card) => {
                const isCurrent = selectedCard.id === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardPick(card)}
                    className={`group relative aspect-[1/1.4] rounded-sm overflow-hidden border transition-all duration-200 transform hover:scale-105 ${
                      isCurrent
                        ? 'border-2 border-white ring-2 ring-white/50 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'border-white/15 hover:border-white bg-[#050505] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={card.dataUrl}
                      alt={card.name}
                      className="w-full h-full object-cover bg-white"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-[#0a0a0a]/90 text-[10px] font-mono-hud font-bold text-white text-center py-0.5 border-t border-white/10 truncate">
                      {card.rank}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Helper Footer Note */}
            <div className="text-center font-mono-hud text-[10px] text-white/40 pt-2">
              点击任意点数卡牌，即可将其印制在相机取景框中的白色卡片上
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
