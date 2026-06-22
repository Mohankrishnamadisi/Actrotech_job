import React from 'react';

interface FloatingCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ title, subtitle, value }) => {
  return (
    <div className="floating-card" style={{ minWidth: 180 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-dark)' }}>{value ?? subtitle}</div>
    </div>
  );
};

export default FloatingCard;
