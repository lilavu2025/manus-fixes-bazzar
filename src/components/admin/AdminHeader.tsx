import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  count?: number;
  addLabel: string;
  onAdd: () => void;
  children?: React.ReactNode;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  count,
  addLabel,
  onAdd,
  children,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
    <div className="flex items-center gap-2">
      <h2 className="text-xl font-bold">{title}</h2>
      {typeof count === "number" && (
        <span className="text-xs text-gray-500">({count})</span>
      )}
      {children}
    </div>
    <Button onClick={onAdd} className="gap-2 bg-primary text-white font-bold h-10 text-xs sm:text-sm">
      <Plus className="h-4 w-4" />
      {addLabel}
    </Button>
  </div>
);

export default AdminHeader;
