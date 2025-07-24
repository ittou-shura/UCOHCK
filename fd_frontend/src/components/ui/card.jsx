import React from 'react';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white rounded-2xl shadow p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-2 border-b pb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}
