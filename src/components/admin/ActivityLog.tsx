import React from 'react';
import { useLanguage } from '@/utils/languageContextUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FormattedDate from '@/components/ui/FormattedDate';
import { User, ShoppingCart, Settings, Trash2, Edit, Plus } from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  action: string;
  target: string;
  targetId?: string;
  details?: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
    type: string;
  };
}

interface ActivityLogProps {
  entries: ActivityLogEntry[];
  maxEntries?: number;
  showUserInfo?: boolean;
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
    case 'add':
      return <Plus className="h-4 w-4" />;
    case 'update':
    case 'edit':
      return <Edit className="h-4 w-4" />;
    case 'delete':
    case 'remove':
      return <Trash2 className="h-4 w-4" />;
    case 'login':
    case 'logout':
      return <User className="h-4 w-4" />;
    case 'order':
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'create':
    case 'add':
      return 'bg-green-100 text-green-800';
    case 'update':
    case 'edit':
      return 'bg-blue-100 text-blue-800';
    case 'delete':
    case 'remove':
      return 'bg-red-100 text-red-800';
    case 'login':
      return 'bg-emerald-100 text-emerald-800';
    case 'logout':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-purple-100 text-purple-800';
  }
};

export const ActivityLog: React.FC<ActivityLogProps> = ({
  entries,
  maxEntries = 10,
  showUserInfo = true
}) => {
  const { t } = useLanguage();

  const displayEntries = entries.slice(0, maxEntries);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('activityLog')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayEntries.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            {t('noActivityFound')}
          </p>
        ) : (
          <div className="space-y-3">
            {displayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(entry.action)}>
                      {t(entry.action) || entry.action}
                    </Badge>
                    <span className="font-medium text-sm">
                      {t(entry.target) || entry.target}
                    </span>
                    {entry.targetId && (
                      <span className="text-xs text-gray-500">
                        #{entry.targetId}
                      </span>
                    )}
                  </div>
                  
                  {entry.details && (
                    <p className="text-sm text-gray-600 mb-2">
                      {entry.details}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <FormattedDate date={entry.timestamp} format="relative" />
                    
                    {showUserInfo && entry.user && (
                      <div className="flex items-center gap-2">
                        <span>{entry.user.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {t(entry.user.type)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;
