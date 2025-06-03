
import React from 'react';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className = '', titleClassName = '', icon, action }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-slate-200 ${className}`}>
      {title && (
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <div className="flex items-center">
            {icon && <div className="mr-3 text-sky-600">{icon}</div>}
            <h3 className={`text-xl font-semibold text-slate-700 ${titleClassName}`}>
              {title}
            </h3>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};
