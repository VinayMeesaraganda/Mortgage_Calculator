import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card: React.FC<CardProps> = ({ variant = 'default', className, ...props }) => {
  const base = 'rounded-xl border border-brand-border bg-white';
  const variants = {
    default: 'shadow-sm',
    elevated: 'shadow-soft',
    outlined: 'shadow-none'
  };

  const classes = [base, variants[variant], className].filter(Boolean).join(' ');

  return <div className={classes} {...props} />;
};

export default Card;
