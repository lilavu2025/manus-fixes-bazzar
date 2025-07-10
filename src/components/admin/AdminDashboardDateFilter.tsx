import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, RotateCcw } from "lucide-react";
import { useLanguage } from "@/utils/languageContextUtils";

interface DateFilterProps {
  onDateFilterChange: (dateFrom: string, dateTo: string) => void;
}

const AdminDashboardDateFilter: React.FC<DateFilterProps> = ({
  onDateFilterChange,
}) => {
  const { t } = useLanguage();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleFromDateChange = (value: string) => {
    setDateFrom(value);
    onDateFilterChange(value, dateTo);
  };

  const handleToDateChange = (value: string) => {
    setDateTo(value);
    onDateFilterChange(dateFrom, value);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    onDateFilterChange("", "");
  };

  const setQuickFilter = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];
    
    setDateFrom(fromStr);
    setDateTo(toStr);
    onDateFilterChange(fromStr, toStr);
  };

  return (
    <Card className="bg-blue-50 border-blue-200 shadow-sm">
      <CardContent className="p-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-700 font-medium">من</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="h-8 w-36 text-sm"
            max={dateTo || undefined}
          />
          <span className="text-sm text-gray-700 font-medium">إلى</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="h-8 w-36 text-sm"
            min={dateFrom || undefined}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter(7)}
            className="h-8 px-3 text-sm"
          >
            آخر 7 أيام
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter(30)}
            className="h-8 px-3 text-sm"
          >
            آخر 30 يوم
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter(180)}
            className="h-8 px-3 text-sm"
          >
            آخر 6 شهور
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickFilter(365)}
            className="h-8 px-3 text-sm"
          >
            آخر عام
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-3 text-sm"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            إعادة تعيين
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardDateFilter;
