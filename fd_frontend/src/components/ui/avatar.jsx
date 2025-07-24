import React from 'react';

export function Avatar({ children, size = 40, className = '', ...props }) {
  return (
    <div
      className={`flex items-center justify-center bg-gray-200 rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <span className="text-lg font-bold text-gray-700">{children}</span>
    </div>
  );
}
