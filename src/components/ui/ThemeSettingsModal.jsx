import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useApp, THEME_PALETTES, FONT_FAMILIES } from '../../context/AppContext';
import { Palette, Type, Check } from 'lucide-react';

export default function ThemeSettingsModal({ isOpen, onClose }) {
  const { themeColorId, setThemeColorId, fontFamilyId, setFontFamilyId } = useApp();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Theme & Typography Settings" size="md">
      <div className="space-y-6">
        {/* Accent Color Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Primary Accent Color
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Choose the studio's primary brand color across buttons, active states, and borders.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {THEME_PALETTES.map((palette) => {
              const isSelected = themeColorId === palette.id;
              return (
                <button
                  key={palette.id}
                  onClick={() => setThemeColorId(palette.id)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50 shadow-xs ring-1 ring-slate-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: palette.color }}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{palette.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Family Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Type size={16} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Application Font Family
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Select high-legibility typography for the entire operating system.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {FONT_FAMILIES.map((font) => {
              const isSelected = fontFamilyId === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => setFontFamilyId(font.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-slate-800 bg-slate-50 shadow-xs ring-1 ring-slate-800'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span
                    className="block text-sm font-bold text-slate-900"
                    style={{ fontFamily: font.css }}
                  >
                    {font.name}
                  </span>
                  <span className="text-[10px] text-slate-400">Aa Bb Gg 123</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
