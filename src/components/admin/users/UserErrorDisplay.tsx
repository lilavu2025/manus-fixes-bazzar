
import React from 'react';

interface UserErrorDisplayProps {
  error: Error | unknown;
}

const UserErrorDisplay: React.FC<UserErrorDisplayProps> = ({ error }) => {
  return (
    <div className="text-center py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-red-800 font-semibold mb-2">خطأ في تحميل البيانات</h3>
        <p className="text-red-600 text-sm mb-4">
          {error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
};

export default UserErrorDisplay;
