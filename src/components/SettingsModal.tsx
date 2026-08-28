import React from 'react';
import { ARSettings, BlendModeOption } from '../types';
import { Sliders, X, Sun, Eye, Sparkles, RefreshCw, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ARSettings;
  onUpdateSettings: (newSettings: Partial<ARSettings>) => void;
  onResetCorners: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetCorners,
}) => {
  if (!isOpen) return null;

  const blendModeLabels: Record<BlendModeOption, { title: string; desc: string }> = {
    multiply: { title: '正片叠底 (推荐)', desc: '完美透出现实纸张阴影、光照与表面质感' },
    overlay: { title: '叠加模式', desc: '增强对比度，突出牌面色彩与光影细节' },
    'soft-light': { title: '柔光模式', desc: '柔和融于环境，适合强光环境' },
    'hard-light': { title: '强光模式', desc: '高饱和度印制效果' },
    direct: { title: '原图覆写', desc: '直接覆盖，不匹配环境阴影' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/20 rounded-sm shadow-2xl overflow-hidden text-[#e0e0e0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] font-mono-hud text-white/40">CONFIG MATRIX</div>
              <h3 className="text-xs font-mono-hud font-bold text-white uppercase tracking-wider">AR Light & Shadow Calibration</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-sm bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* Blend Mode Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono-hud font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Blend Mode Matrix
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono-hud">
              {(Object.keys(blendModeLabels) as BlendModeOption[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ blendMode: mode })}
                  className={`p-3 rounded-sm border text-left transition-all ${
                    settings.blendMode === mode
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide">{blendModeLabels[mode].title}</div>
                  <div className={`text-[10px] leading-snug mt-1 ${settings.blendMode === mode ? 'text-black/70' : 'text-white/40'}`}>
                    {blendModeLabels[mode].desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Shadow Intensity Slider */}
          <div className="space-y-2 bg-[#050505] p-3.5 rounded-sm border border-white/10 font-mono-hud">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white/80 flex items-center gap-1.5 tracking-wider uppercase text-[10px]">
                <Sun className="w-3.5 h-3.5 text-white" />
                Physical Shadow Opacity
              </span>
              <span className="text-white font-bold">{Math.round(settings.shadowIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={settings.shadowIntensity}
              onChange={(e) => onUpdateSettings({ shadowIntensity: parseFloat(e.target.value) })}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Highlight Preserve Slider */}
          <div className="space-y-2 bg-[#050505] p-3.5 rounded-sm border border-white/10 font-mono-hud">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white/80 flex items-center gap-1.5 tracking-wider uppercase text-[10px]">
                <Zap className="w-3.5 h-3.5 text-white" />
                Highlight Specular Retention
              </span>
              <span className="text-white font-bold">{Math.round(settings.highlightPreserve * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.highlightPreserve}
              onChange={(e) => onUpdateSettings({ highlightPreserve: parseFloat(e.target.value) })}
              className="w-full accent-white cursor-pointer"
            />
          </div>

          {/* Toggles Group */}
          <div className="space-y-2 font-mono-hud text-xs">
            {/* Ambient Color Match */}
            <label className="flex items-center justify-between p-3 rounded-sm bg-[#050505] border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">Ambient Color Temperature Sensing</div>
                <div className="text-[10px] text-white/40">Sample light color temperature to stain pattern</div>
              </div>
              <input
                type="checkbox"
                checked={settings.ambientColorMatch}
                onChange={(e) => onUpdateSettings({ ambientColorMatch: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
            </label>

            {/* Auto Detect White Card */}
            <label className="flex items-center justify-between p-3 rounded-sm bg-[#050505] border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">Auto Corner Alignment Snap</div>
                <div className="text-[10px] text-white/40">Detect white card boundaries & snap vertex points</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoDetectWhiteCard}
                onChange={(e) => onUpdateSettings({ autoDetectWhiteCard: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
            </label>

            {/* Lock Aspect Ratio */}
            <label className="flex items-center justify-between p-3 rounded-sm bg-[#050505] border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">Lock Aspect Ratio (1 : 1.40)</div>
                <div className="text-[10px] text-white/40">Preserve standard poker card dimensions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.lockAspectRatio}
                onChange={(e) => onUpdateSettings({ lockAspectRatio: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
            </label>
          </div>

          {/* Reset Corners */}
          <div className="pt-1 font-mono-hud">
            <button
              onClick={onResetCorners}
              className="w-full py-2.5 rounded-sm bg-white/5 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              RESET TARGETING BOUNDS
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#050505] flex justify-end font-mono-hud">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-sm bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-widest transition-all"
          >
            CONFIRM & APPLY
          </button>
        </div>
      </div>
    </div>
  );
};
