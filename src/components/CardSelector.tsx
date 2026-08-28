import React, { useState } from 'react';
import { PlayingCard, Suit } from '../types';
import { Upload, Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface CardSelectorProps {
  cards: PlayingCard[];
  selectedCard: PlayingCard;
  onSelectCard: (card: PlayingCard) => void;
  onCustomImageUpload: (dataUrl: string, name: string) => void;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  selectedCard,
  onSelectCard,
  onCustomImageUpload,
}) => {
  const [activeTab, setActiveTab] = useState<Suit | 'all' | 'custom'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const filteredCards = cards.filter((card) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'custom') return card.isCustom;
    return card.suit === activeTab;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCustomImageUpload(event.target.result as string, file.name.replace(/\.[^/.]+$/, ''));
          setActiveTab('custom');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-3 transition-all duration-300 font-sans">
      {/* Control Strip & Drawer Header */}
      <div className="flex items-center justify-between mb-2 bg-[#0a0a0a]/95 backdrop-blur-md px-4 py-2.5 rounded-sm border border-white/10 text-[#e0e0e0] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-white/10 border border-white/20 flex items-center justify-center font-serif-display text-white font-bold text-base">
            {selectedCard.suitSymbol || '🂠'}
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] font-mono-hud text-white/40">CURRENT SELECTION</div>
            <div className="text-xs font-mono-hud font-bold text-white tracking-wider">{selectedCard.name}</div>
          </div>
        </div>

        {/* Suit Quick Filter Tabs */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#050505] p-1 rounded-sm border border-white/10 font-mono-hud text-[10px]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            ALL (52)
          </button>
          <button
            onClick={() => setActiveTab('spades')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'spades'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            ♠ SPADES
          </button>
          <button
            onClick={() => setActiveTab('hearts')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'hearts'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            ♥ HEARTS
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'clubs'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            ♣ CLUBS
          </button>
          <button
            onClick={() => setActiveTab('diamonds')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'diamonds'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            ♦ DIAMONDS
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 rounded-sm transition-all tracking-wider ${
              activeTab === 'custom'
                ? 'bg-white text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            CUSTOM
          </button>
        </div>

        {/* Expand / Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono-hud tracking-wider uppercase rounded-sm bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          {isExpanded ? 'COLLAPSE DECK' : 'EXPAND DECK'}
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-0.5" /> : <ChevronUp className="w-3.5 h-3.5 ml-0.5" />}
        </button>
      </div>

      {/* Mobile Suit Tabs */}
      {isExpanded && (
        <div className="flex sm:hidden items-center justify-around gap-1 bg-[#0a0a0a] p-1.5 rounded-sm border border-white/10 mb-2 overflow-x-auto font-mono-hud text-[10px]">
          {(['all', 'spades', 'hearts', 'clubs', 'diamonds', 'custom'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 rounded-sm whitespace-nowrap uppercase tracking-wider ${
                activeTab === tab ? 'bg-white text-black font-bold' : 'text-white/60'
              }`}
            >
              {tab === 'all' && 'ALL'}
              {tab === 'spades' && '♠ SPADES'}
              {tab === 'hearts' && '♥ HEARTS'}
              {tab === 'clubs' && '♣ CLUBS'}
              {tab === 'diamonds' && '♦ DIAMONDS'}
              {tab === 'custom' && 'CUSTOM'}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal Scrollable Card Deck Carousel */}
      {isExpanded && (
        <div className="relative bg-[#0a0a0a]/95 backdrop-blur-md p-3 rounded-sm border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center px-1 pb-2 border-b border-white/10 mb-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono-hud text-white/40">
              DECK SELECTION [ {filteredCards.length} PATTERNS LOADED ]
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono-hud text-white/40">
              CURRENT: {selectedCard.name}
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto py-1 px-1 scrollbar-thin">
            {/* Custom Image Upload Card Slot */}
            <label className="flex-shrink-0 w-18 h-24 rounded-sm border border-dashed border-white/30 hover:border-white bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-white/70 cursor-pointer transition-all group">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[9px] font-mono-hud uppercase tracking-wider text-center leading-tight">UPLOAD</span>
            </label>

            {/* Render Deck Cards */}
            {filteredCards.map((card) => {
              const isSelected = selectedCard.id === card.id;
              return (
                <button
                  key={card.id}
                  onClick={() => onSelectCard(card)}
                  className={`relative flex-shrink-0 w-18 h-24 rounded-sm overflow-hidden border transition-all transform ${
                    isSelected
                      ? 'border-2 border-white bg-white/20 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      : 'border-white/10 hover:border-white/40 opacity-50 hover:opacity-100 bg-[#050505]'
                  }`}
                >
                  <img
                    src={card.dataUrl}
                    alt={card.name}
                    className="w-full h-full object-cover bg-white"
                  />
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Card Label Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-[#0a0a0a]/90 backdrop-blur-sm text-[9px] font-mono-hud font-bold text-white text-center py-0.5 border-t border-white/10 truncate px-0.5">
                    {card.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
