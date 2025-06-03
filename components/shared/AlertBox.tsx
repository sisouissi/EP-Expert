
import React from 'react';
import { Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBoxProps {
  type: AlertType;
  title?: string;
  message: React.ReactNode;
  className?: string;
}

const alertConfig: Record<AlertType, { icon: React.ElementType; base: string; iconColor: string; titleColor: string; textColor: string; borderColor: string }> = {
  info: {
    icon: Info,
    base: 'bg-sky-50',
    iconColor: 'text-sky-500',
    titleColor: 'text-sky-800',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-500',
  },
  success: {
    icon: CheckCircle,
    base: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-800',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    base: 'bg-amber-50',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-500',
  },
  error: {
    icon: XCircle,
    base: 'bg-red-50',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    borderColor: 'border-red-500',
  },
};

export const AlertBox: React.FC<AlertBoxProps> = ({ type, title, message, className = '' }) => {
  const config = alertConfig[type];
  const IconComponent = config.icon;

  return (
    <div className={`p-4 rounded-lg border-l-4 shadow-sm ${config.base} ${config.borderColor} ${className}`}>
      <div className="flex">
        <div className={`flex-shrink-0 mr-3 ${config.iconColor}`}>
          <IconComponent className="h-5 w-5 mt-0.5" aria-hidden="true" />
        </div>
        <div className={`${config.textColor}`}>
          {title && <h3 className={`text-md font-semibold mb-1 ${config.titleColor}`}>{title}</h3>}
          <div className="text-sm">{message}</div>
        </div>
      </div>
    </div>
  );
};
