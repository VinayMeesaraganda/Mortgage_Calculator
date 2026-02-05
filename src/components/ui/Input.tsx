import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const base = 'w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-primary focus:ring-2 focus:ring-brand-accent';
  const classes = [base, className].filter(Boolean).join(' ');

  return <input className={classes} {...props} />;
};

export default Input;
