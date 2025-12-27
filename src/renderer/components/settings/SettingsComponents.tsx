import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderOpen, X } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        {description && (
          <p className="text-text-muted text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface SettingsToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SettingsToggle({ label, description, value, onChange }: SettingsToggleProps) {
  return (
    <label className="flex items-start gap-4 cursor-pointer group">
      <div className="flex-1">
        <div className="text-white group-hover:text-accent-purple transition-colors">
          {label}
        </div>
        {description && (
          <p className="text-text-muted text-sm">{description}</p>
        )}
      </div>
      <button
        type="button"
        className={`relative w-12 h-7 rounded-full transition-colors ${
          value ? 'bg-accent-purple' : 'bg-surface-interactive'
        }`}
        onClick={() => onChange(!value)}
      >
        <motion.div
          className="absolute top-1 w-5 h-5 bg-white rounded-full"
          animate={{ left: value ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </label>
  );
}

interface SettingsSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  color?: string;
  onChange: (value: number) => void;
}

export function SettingsSlider({
  label,
  description,
  value,
  min,
  max,
  unit,
  color,
  onChange,
}: SettingsSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {color && <span className={`w-3 h-3 rounded-full ${color}`} />}
          <span className="text-white">{label}</span>
          <span className="text-accent-purple ml-2 font-medium">
            {value} {unit}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-text-muted text-sm">{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-accent-purple cursor-pointer"
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SettingsSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function SettingsSelect({ label, value, options, onChange }: SettingsSelectProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent-purple cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  warning?: boolean;
}

interface SettingsRadioProps {
  value: string;
  options: RadioOption[];
  onChange: (value: string) => void;
}

export function SettingsRadio({ value, options, onChange }: SettingsRadioProps) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
            value === opt.value
              ? 'bg-accent-purple/20 border border-accent-purple/50'
              : 'bg-surface-elevated border border-white/5 hover:border-white/10'
          }`}
        >
          <input
            type="radio"
            name="radio-option"
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 accent-accent-purple"
          />
          <div>
            <div className={`font-medium ${opt.warning ? 'text-red-400' : 'text-white'}`}>
              {opt.label}
            </div>
            {opt.description && (
              <p className="text-text-muted text-sm">{opt.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

interface PathListManagerProps {
  paths: string[];
  onChange: (paths: string[]) => void;
  placeholder?: string;
  defaultPath?: string;
}

export function PathListManager({ paths, onChange, placeholder, defaultPath }: PathListManagerProps) {
  const [newPath, setNewPath] = useState('');

  const addPath = () => {
    if (newPath && !paths.includes(newPath)) {
      onChange([...paths, newPath]);
      setNewPath('');
    }
  };

  const removePath = (path: string) => {
    onChange(paths.filter((p) => p !== path));
  };

  const selectFolder = async () => {
    const result = await window.electronAPI.selectFolder();
    if (result && !paths.includes(result)) {
      onChange([...paths, result]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newPath}
          onChange={(e) => setNewPath(e.target.value)}
          placeholder={placeholder || '/path/to/folder'}
          className="flex-1 bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-white placeholder-text-muted focus:outline-none focus:border-accent-purple"
          onKeyDown={(e) => e.key === 'Enter' && addPath()}
        />
        <button
          type="button"
          className="btn-secondary px-4 py-2 rounded-lg flex items-center gap-1.5"
          onClick={addPath}
        >
          <Plus size={16} />
          Add
        </button>
        <button
          type="button"
          className="btn-secondary px-4 py-2 rounded-lg flex items-center gap-1.5"
          onClick={selectFolder}
        >
          <FolderOpen size={16} />
          Browse
        </button>
      </div>

      <AnimatePresence>
        {paths.map((path) => (
          <motion.div
            key={path}
            className="flex items-center justify-between bg-surface-elevated rounded-lg px-4 py-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="text-sm truncate flex-1">{path}</span>
            <button
              type="button"
              className="text-red-400 hover:text-red-300 ml-2"
              onClick={() => removePath(path)}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {paths.length === 0 && (
        <p className="text-text-muted text-sm">
          No paths configured yet.
        </p>
      )}
    </div>
  );
}
