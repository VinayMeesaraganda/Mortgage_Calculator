import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-primary' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </span>
      {label && <span className="text-sm text-slate-600">{label}</span>}
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
};

export default Toggle;
