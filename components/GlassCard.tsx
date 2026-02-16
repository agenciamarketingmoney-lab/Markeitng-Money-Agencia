import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 ${className}`}>
      {/* Subtle shine effect - adapted for light mode */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      
      {(title || action) && (
        <div className="flex justify-between items-center p-6 border-b border-gray-100 relative z-10">
          {title && <h3 className="text-lg font-semibold text-slate-800 tracking-wide">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      
      <div className="p-6 relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;