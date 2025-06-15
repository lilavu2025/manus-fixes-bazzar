// src/pages/AccountDeleted.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";

export default function AccountDeleted() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">تم حذف حسابك</h1>
        <p className="text-gray-700 mb-6">تم حذف حسابك وجميع بياناتك من النظام. إذا كان لديك أي استفسار أو ترغب في استعادة حسابك، يرجى التواصل مع الدعم.</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/auth', { replace: true });
          }}
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
