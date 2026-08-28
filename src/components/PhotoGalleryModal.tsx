import React, { useState } from 'react';
import { CapturedPhoto, PlayingCard } from '../types';
import { X, Download, Trash2, Eye, Sliders, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: CapturedPhoto[];
  cards: PlayingCard[];
  onDeletePhoto: (id: string) => void;
  onUpdatePhotoCard: (photoId: string, card: PlayingCard) => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  cards,
  onDeletePhoto,
  onUpdatePhotoCard,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPhoto = photos[selectedIndex];

  const handleDownload = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.compositeDataUrl;
    link.download = `AR_Card_Photo_${new Date(photo.timestamp).toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#0a0a0a] border border-white/20 rounded-sm shadow-2xl overflow-hidden flex flex-col text-[#e0e0e0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="text-[9px] uppercase tracking-[0.2em] font-mono-hud text-white/40">GALLERY ARCHIVE</div>
            <h3 className="text-xs font-mono-hud font-bold text-white uppercase tracking-wider">Captured AR Photographs</h3>
            <span className="px-2 py-0.5 rounded-sm bg-white/10 text-[10px] font-mono-hud text-white border border-white/20">
              {photos.length} RECORDS
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono-hud">
            <div className="w-12 h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">No Captured Photos Recorded</h4>
            <p className="text-[11px] text-white/40 mt-1 max-w-xs leading-relaxed">
              Align camera with physical white card and trigger IMPRINT PATTERN shutter button.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-mono-hud">
            {/* Main Preview Area */}
            <div className="flex-1 relative bg-[#050505] flex items-center justify-center p-4">
              {/* Photo Display */}
              <div className="relative max-w-full max-h-full rounded-sm overflow-hidden shadow-2xl border border-white/20 group">
                <img
                  src={showOriginal ? currentPhoto.originalDataUrl : currentPhoto.compositeDataUrl}
                  alt={currentPhoto.cardName}
                  className="max-h-[60vh] object-contain rounded-none"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 bg-[#0a0a0a]/90 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-lg tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  {showOriginal ? 'RAW PHYSICAL CAMERA STREAM' : `IMPRINTED: ${currentPhoto.cardName}`}
                </div>
              </div>

              {/* Navigation Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                    className="absolute left-3 p-2.5 rounded-sm bg-[#0a0a0a]/90 hover:bg-white text-white/80 hover:text-black backdrop-blur-md border border-white/20 transition-all shadow-xl"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 p-2.5 rounded-sm bg-[#0a0a0a]/90 hover:bg-white text-white/80 hover:text-black backdrop-blur-md border border-white/20 transition-all shadow-xl"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Sidebar Controls & Thumbnail List */}
            <div className="w-full md:w-80 bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-white/10 p-4 flex flex-col justify-between overflow-y-auto">
              {/* Actions & Detail */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1 border-b border-white/10 pb-3">
                  <div className="text-[9px] text-white/40 uppercase tracking-widest">CAPTURED TIMESTAMP</div>
                  <div className="text-xs font-bold text-white">
                    {new Date(currentPhoto.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>

                {/* Before / After Toggle */}
                <button
                  onMouseDown={() => setShowOriginal(true)}
                  onMouseUp={() => setShowOriginal(false)}
                  onTouchStart={() => setShowOriginal(true)}
                  onTouchEnd={() => setShowOriginal(false)}
                  className="w-full py-2.5 rounded-sm bg-white/5 hover:bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white/20 active:scale-98 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  HOLD TO COMPARE PHYSICAL CARD
                </button>

                {/* Switch Card on Photo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">SWAP PATTERN</label>
                  <select
                    value={cards.find((c) => c.name === currentPhoto.cardName)?.id || ''}
                    onChange={(e) => {
                      const newCard = cards.find((c) => c.id === e.target.value);
                      if (newCard) onUpdatePhotoCard(currentPhoto.id, newCard);
                    }}
                    className="w-full bg-[#050505] border border-white/20 text-xs rounded-sm px-3 py-2 text-white focus:outline-none focus:border-white font-mono-hud"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Thumbnails */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">RECORD INDEX</div>
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedIndex(idx)}
                        className={`relative rounded-sm overflow-hidden border aspect-[4/3] ${
                          idx === selectedIndex ? 'border-2 border-white scale-105' : 'border-white/10 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={p.compositeDataUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Download & Delete Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleDownload(currentPhoto)}
                  className="flex-1 py-2.5 rounded-sm bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT IMAGE
                </button>
                <button
                  onClick={() => {
                    onDeletePhoto(currentPhoto.id);
                    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
                  }}
                  className="p-2.5 rounded-sm bg-white/5 hover:bg-red-950/40 text-red-400 border border-white/10 transition-colors"
                  title="删除照片"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
