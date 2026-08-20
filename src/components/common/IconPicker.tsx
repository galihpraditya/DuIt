import React, { useState, useMemo } from 'react';
import { AVAILABLE_ICONS, getIconComponent } from '../../constants/icons';
import { Search } from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = getIconComponent(name);
  return <IconComponent className={className} size={size} />;
};

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelectIcon }) => {
  const [query, setQuery] = useState('');

  const filteredIcons = useMemo(() => {
    if (!query.trim()) return AVAILABLE_ICONS;
    const q = query.toLowerCase().trim();
    return AVAILABLE_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari ikon..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 max-h-48 overflow-y-auto bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 scrollbar-none">
        {filteredIcons.length === 0 ? (
          <div className="col-span-full py-4 text-center text-xs text-slate-400">
            Tidak ada ikon ditemukan
          </div>
        ) : (
          filteredIcons.map((iconName) => {
            const isSelected = selectedIcon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => onSelectIcon(iconName)}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:scale-95'
                }`}
                title={iconName}
              >
                <DynamicIcon name={iconName} className="w-4 h-4" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
