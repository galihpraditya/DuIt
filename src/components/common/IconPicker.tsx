import React from 'react';
import { AVAILABLE_ICONS, getIconComponent } from '../../constants/icons';

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
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 max-h-48 overflow-y-auto bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
      {AVAILABLE_ICONS.map((iconName) => {
        const isSelected = selectedIcon === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onSelectIcon(iconName)}
            className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-emerald-500 text-white shadow-md scale-105'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
            title={iconName}
          >
            <DynamicIcon name={iconName} className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};
