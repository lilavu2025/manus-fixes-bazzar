import React, { useEffect } from 'react';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useLocation } from 'react-router-dom';
import AdminUsersHeader from './users/AdminUsersHeader';
import UserStatsCards from './users/UserStatsCards';
import UserFilters from './users/UserFilters';
import UsersTable from './users/UsersTable';
import UserErrorDisplay from './users/UserErrorDisplay';
import { useLanguage } from '@/utils/languageContextUtils';

const AdminUsers: React.FC = () => {
  const { isRTL } = useLanguage();
  const location = useLocation();
  
  const {
    users,
    setUsers,
    filteredAndSortedUsers,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    userTypeFilter,
    setUserTypeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    refetch,
    disableUser,
    deleteUser
  } = useAdminUsers({ disableRealtime: true });

  // Handle filter from dashboard navigation
  useEffect(() => {
    if (location.state?.filterType) {
      const filterType = location.state.filterType;
      // Map Arabic names to English for filtering
      const typeMapping: { [key: string]: string } = {
        'مدير': 'admin',
        'جملة': 'wholesale', 
        'تجزئة': 'retail',
        'admin': 'admin',
        'wholesale': 'wholesale',
        'retail': 'retail'
      };
      const mappedType = typeMapping[filterType] || filterType;
      setUserTypeFilter(mappedType);
    }
  }, [location.state, setUserTypeFilter]);

  if (error) {
    return <UserErrorDisplay error={error} />;
  }

  const handleSortOrderChange = (order: string) => {
    setSortOrder(order as 'asc' | 'desc');
  };

  return (
    <div className={`p-4 lg:p-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <AdminUsersHeader />

      <div className="space-y-6">
        <UserStatsCards users={users} />
        
        <UserFilters 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          userTypeFilter={userTypeFilter}
          setUserTypeFilter={setUserTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={handleSortOrderChange}
        />

        <UsersTable users={filteredAndSortedUsers} isLoading={isLoading} error={error} setUsers={setUsers} disableUser={disableUser} deleteUser={deleteUser} />
      </div>
    </div>
  );
};

export default AdminUsers;
