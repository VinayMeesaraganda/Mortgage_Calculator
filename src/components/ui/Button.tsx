import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2';
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-primary text-white shadow-soft hover:shadow-hover hover:translate-y-[-1px]',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    ghost: 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
  };

  const classes = [base, variants[variant], className].filter(Boolean).join(' ');

  return <button className={classes} {...props} />;
};

export default Button;
