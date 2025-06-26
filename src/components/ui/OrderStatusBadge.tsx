import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const { t } = useLanguage();

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          label: t('statusPending'),
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'processing':
        return {
          label: t('statusProcessing'),
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'shipped':
        return {
          label: t('statusShipped'),
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'delivered':
        return {
          label: t('statusDelivered'),
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'cancelled':
        return {
          label: t('statusCancelled'),
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'completed':
        return {
          label: t('statusCompleted'),
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200'
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default OrderStatusBadge;
