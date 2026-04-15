import React from 'react';

export default function Card({ children, className = '', onClick, glowColor }) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 transition-all duration-300 ${
        onClick
          ? 'cursor-pointer hover:-translate-y-1 hover:border-white/15'
          : ''
      } ${className}`}
      style={
        onClick && glowColor
          ? { boxShadow: `0 0 0 1px ${glowColor}18 inset, 0 24px 48px -16px ${glowColor}12` }
          : undefined
      }
      onClick={onClick}
    >
      {children}
    </div>
  );
}
