import type { ReactNode } from 'react';
interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}
export function GlassPanel({ children, className = '', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`glass neon-border p-6 ${onClick ? 'cursor-pointer transition-all duration-300' : ''} ${className}`}
      style={onClick ? undefined : undefined}
      onMouseEnter={onClick ? e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(143,187,145,0.45)';
      } : undefined}
      onMouseLeave={onClick ? e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '';
      } : undefined}
    >
      {children}
    </div>
  );
}
