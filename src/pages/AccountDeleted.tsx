// src/pages/AccountDeleted.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { useLanguage } from "@/utils/languageContextUtils";

export default function AccountDeleted() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {t("accountDeletedTitle")}
        </h1>
        <p className="text-gray-700 mb-6">
          {t("accountDeletedDescription")}
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
        >
          {t("backToLoginButton")}
        </button>
      </div>
    </div>
  );
}
