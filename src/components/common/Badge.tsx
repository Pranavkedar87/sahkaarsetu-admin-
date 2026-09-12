import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'live' | 'demo';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, icon }) => {
  return (
    <span className={`badge badge-${variant}`}>
      {icon}
      {children}
    </span>
  );
};
