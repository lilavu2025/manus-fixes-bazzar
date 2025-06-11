import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { useAuth } from '@/contexts/useAuth';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Package, CreditCard } from 'lucide-react';

const Orders: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  // Mock orders data - replace with real data later
  const orders = [
    {
      id: '1',
      date: new Date('2024-01-15').toLocaleDateString('en-GB'), // Use Gregorian calendar
      status: 'delivered',
      total: 299.99,
      items: 3
    },
    {
      id: '2', 
      date: new Date('2024-01-10').toLocaleDateString('en-GB'), // Use Gregorian calendar
      status: 'shipped',
      total: 159.50,
      items: 2
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearchChange={() => {}}
        onCartClick={() => {}}
        onMenuClick={() => {}}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h1 className="text-3xl font-bold">{t('orders')}</h1>
          <p className="text-gray-600 mt-2">{t('viewYourOrders')}</p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('noOrders')}
                </h3>
                <p className="text-gray-500">
                  {t('noOrdersDescription')}
                </p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div>
                      <CardTitle className="text-lg">
                        {t('order')} #{order.id}
                      </CardTitle>
                      <div className={`flex items-center gap-4 mt-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CalendarDays className="h-4 w-4" />
                          <span>{order.date}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Package className="h-4 w-4" />
                          <span>{order.items} {t('items')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {t(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 text-lg font-semibold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CreditCard className="h-4 w-4" />
                      <span>{order.total.toFixed(2)} {t('currency')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;