// Custom hook for number input handling - eliminates ~200 lines of duplication

import { useState } from 'react';
import type { NumberInputHook } from '../types/mortgage';

export const useNumberInput = (
  initialValue: number,
  defaultValue: number,
  fieldName: string,
  validate?: (value: number) => number
): NumberInputHook => {
  const [value, setValue] = useState(initialValue);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [rawValue, setRawValue] = useState<string>('');

  const isEditing = editingField === fieldName;

  const displayValue = isEditing 
    ? (value === 0 ? '' : rawValue || value.toString())
    : (value === 0 ? '' : value.toLocaleString());

  const handleChange = (inputValue: string) => {
    setEditingField(fieldName);
    const cleaned = inputValue.replace(/,/g, '');
    setRawValue(cleaned);
    
    if (cleaned === '' || cleaned === '-') {
      setValue(0);
    } else if (/^\d*\.?\d*$/.test(cleaned)) {
      const num = Number(cleaned);
      if (!isNaN(num) && num >= 0) {
        setValue(validate ? validate(num) : num);
      }
    }
  };

  const handleFocus = () => {
    setEditingField(fieldName);
    setRawValue(value.toString());
  };

  const handleBlur = () => {
    setEditingField(null);
    if (value === 0 || rawValue === '') {
      setValue(defaultValue);
    }
    setRawValue('');
  };

  return {
    value,
    displayValue,
    setValue,
    handleChange,
    handleFocus,
    handleBlur,
    isEditing
  };
};

