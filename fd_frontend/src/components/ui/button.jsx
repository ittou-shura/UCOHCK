import React from 'react';

export function Button({ children, variant = 'solid', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-2xl font-semibold transition';
  const styles = {
    solid: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  const cls = `${base} ${styles[variant] || styles.solid} ${className}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
