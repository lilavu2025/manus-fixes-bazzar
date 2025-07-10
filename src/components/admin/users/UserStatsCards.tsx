import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, XCircle, TrendingUp, Shield, UserX } from 'lucide-react';
import { useLanguage } from '@/utils/languageContextUtils';
import type { UserProfile } from '@/types/profile';

interface UserStatsCardsProps {
  users: UserProfile[];
  onFilterByType?: (type: string) => void;
  setSearchQuery?: (query: string) => void;
  setUserTypeFilter?: (type: string) => void;
  setStatusFilter?: (status: string) => void;
  setSortBy?: (sort: string) => void;
  setSortOrder?: (order: string) => void;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({
  users,
  onFilterByType,
  setSearchQuery,
  setUserTypeFilter,
  setStatusFilter,
  setSortBy,
  setSortOrder,
}) => {
  const { t } = useLanguage();

  const stats = {
    total: users.length,
    wholesale: users.filter(user => user.user_type === 'wholesale').length,
    retail: users.filter(user => user.user_type === 'retail').length,
    admin: users.filter(user => user.user_type === 'admin').length,
    confirmed: users.filter(user => user.email_confirmed_at).length,
    disabled: users.filter(user => user.disabled).length,
  };

  const statsCards = [
    {
      title: t('totalUsers') || 'إجمالي المستخدمين',
      value: stats.total,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      type: 'all',
    },
    {
      title: t('wholesaleUsers') || 'مستخدمي الجملة',
      value: stats.wholesale,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      type: 'wholesale',
    },
    {
      title: t('retailUsers') || 'مستخدمي التجزئة',
      value: stats.retail,
      icon: UserCheck,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      type: 'retail',
    },
    {
      title: t('adminUsers') || 'المدراء',
      value: stats.admin,
      icon: Shield,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      type: 'admin',
    },
    {
      title: t('confirmedUsers') || 'مؤكدين',
      value: stats.confirmed,
      icon: UserCheck,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100',
      borderColor: 'border-teal-200',
      iconColor: 'text-teal-600',
      type: 'confirmed',
    },
    {
      title: t('disabledUsers') || 'معطلين',
      value: stats.disabled,
      icon: UserX,
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      type: 'disabled',
    }
  ];

  const handleCardClick = (type: string) => {
    // Reset all filters before applying the new filter
    setSearchQuery && setSearchQuery("");
    setUserTypeFilter && setUserTypeFilter("all");
    setStatusFilter && setStatusFilter("all");
    setSortBy && setSortBy("created_at");
    setSortOrder && setSortOrder("desc");
    
    setTimeout(() => {
      if (type === 'confirmed') {
        setStatusFilter && setStatusFilter('confirmed');
      } else if (type === 'disabled') {
        // For disabled users, we might need a different approach since it's not in the current filters
        // For now, just use the user type filter
        onFilterByType && onFilterByType('all');
      } else {
        onFilterByType && onFilterByType(type);
      }
    }, 0);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`bg-gradient-to-br ${stat.bgColor} ${stat.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
            onClick={() => handleCardClick(stat.type)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-3">
                <div className={`p-2 bg-white/70 rounded-lg group-hover:bg-white/90 transition-colors`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <p className={`text-xs font-medium ${stat.iconColor} opacity-80`}>
                {stat.title}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStatsCards;
