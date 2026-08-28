import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlayingCard, ARSettings, QuadCorners, CapturedPhoto } from './types';
import { generateFullDeck, wrapImageInCardFrame } from './utils/cardGenerator';
import { recompositeCapturedPhoto } from './utils/arEngine';
import { CameraView } from './components/CameraView';
import { SettingsModal } from './components/SettingsModal';
import { PhotoGalleryModal } from './components/PhotoGalleryModal';
import { SuitRankModal } from './components/SuitRankModal';

export function App() {
  // Initialize standard 52 playing card deck
  const initialDeck = useMemo(() => generateFullDeck(), []);
  const [cards, setCards] = useState<PlayingCard[]>(initialDeck);
  const [selectedCard, setSelectedCard] = useState<PlayingCard>(initialDeck[0]);

  // Initial Suit & Rank selection screen state
  const [isSuitRankOpen, setIsSuitRankOpen] = useState<boolean>(true);

  // AR Settings
  const [settings, setSettings] = useState<ARSettings>({
    blendMode: 'multiply',
    shadowIntensity: 0.85,
    highlightPreserve: 0.4,
    ambientColorMatch: true,
    edgeFeather: 2,
    contrastBoost: 1.0,
    autoDetectWhiteCard: true,
    showCornerHandles: false, // Default off: no dashed bounding boxes
    lockAspectRatio: true,
    cardScale: 1.0,
  });

  // Target Box Quad Corners
  const [corners, setCorners] = useState<QuadCorners>({
    topLeft: { x: 300, y: 150 },
    topRight: { x: 540, y: 150 },
    bottomRight: { x: 540, y: 480 },
    bottomLeft: { x: 300, y: 480 },
  });

  // Saved Session Photos
  const [savedPhotos, setSavedPhotos] = useState<CapturedPhoto[]>([]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  // Add Custom Card Image
  const handleCustomImageUpload = async (dataUrl: string, name: string) => {
    const framedCardUrl = await wrapImageInCardFrame(dataUrl, name);
    const customCard: PlayingCard = {
      id: `custom-${Date.now()}`,
      name: name || `自定义卡牌 ${cards.filter((c) => c.isCustom).length + 1}`,
      dataUrl: framedCardUrl,
      isCustom: true,
    };
    setCards((prev) => [customCard, ...prev]);
    setSelectedCard(customCard);
  };

  // Update AR Settings
  const handleUpdateSettings = (newSettings: Partial<ARSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Reset Corners Position
  const handleResetCorners = useCallback(() => {
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 720;
    const cardW = Math.min(width * 0.45, 260);
    const cardH = cardW * 1.4;
    const cx = width / 2;
    const cy = height / 2;

    setCorners({
      topLeft: { x: cx - cardW / 2, y: cy - cardH / 2 },
      topRight: { x: cx + cardW / 2, y: cy - cardH / 2 },
      bottomRight: { x: cx + cardW / 2, y: cy + cardH / 2 },
      bottomLeft: { x: cx - cardW / 2, y: cy + cardH / 2 },
    });
  }, []);

  // Save Captured Photo
  const handleCapturePhoto = (photo: CapturedPhoto) => {
    setSavedPhotos((prev) => [photo, ...prev]);
  };

  // Delete Captured Photo
  const handleDeletePhoto = (id: string) => {
    setSavedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Update Photo Card Retroactively
  const handleUpdatePhotoCard = async (photoId: string, newCard: PlayingCard) => {
    const photoToUpdate = savedPhotos.find((p) => p.id === photoId);
    if (!photoToUpdate) return;

    const newCompositeUrl = await recompositeCapturedPhoto(
      photoToUpdate.originalDataUrl,
      newCard.dataUrl,
      photoToUpdate.corners,
      photoToUpdate.blendSettings
    );

    setSavedPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, cardName: newCard.name, compositeDataUrl: newCompositeUrl }
          : p
      )
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505] flex flex-col justify-between font-sans selection:bg-white selection:text-black">
      {/* Fullscreen Interactive Camera View */}
      <div className="absolute inset-0 z-0">
        <CameraView
          selectedCard={selectedCard}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onOpenSuitRankModal={() => setIsSuitRankOpen(true)}
          onCapturePhoto={handleCapturePhoto}
          savedPhotosCount={savedPhotos.length}
          corners={corners}
          setCorners={setCorners}
          cards={cards}
        />
      </div>

      {/* Initial Suit & Rank Interactive Selector Modal */}
      <SuitRankModal
        isOpen={isSuitRankOpen}
        onClose={() => setIsSuitRankOpen(false)}
        cards={cards}
        selectedCard={selectedCard}
        onSelectCard={(card) => setSelectedCard(card)}
        onCustomImageUpload={handleCustomImageUpload}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetCorners={handleResetCorners}
      />

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={savedPhotos}
        cards={cards}
        onDeletePhoto={handleDeletePhoto}
        onUpdatePhotoCard={handleUpdatePhotoCard}
      />
    </div>
  );
}

export default App;
