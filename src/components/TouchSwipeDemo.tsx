import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/utils/languageContextUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Hand, ArrowLeft, ArrowRight, Image as ImageIcon, Camera } from 'lucide-react';

const TouchSwipeDemo: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // عرض هذا المكون على الموبايل فقط
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-4 right-4 z-40 pointer-events-none"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg pointer-events-auto">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
            <Smartphone className="h-4 w-4" />
            {t("swipeGestures")}
          </CardTitle>
          <CardDescription className="text-xs text-blue-600">
            {t("touchSupported")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* الصور */}
            <div className="flex items-center gap-2 text-blue-700">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <Camera className="h-3 w-3" />
              </div>
              <span>{t("swipeToNavigateImages")}</span>
            </div>
            
            {/* الاتجاهات */}
            <div className="flex items-center gap-2 text-purple-700">
              <Hand className="h-3 w-3" />
              <div className="flex items-center gap-1">
                {isRTL ? (
                  <>
                    <ArrowRight className="h-3 w-3" />
                    <ArrowLeft className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-3 w-3" />
                    <ArrowRight className="h-3 w-3" />
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* مؤشر الحركة */}
          <div className="mt-3 flex justify-center">
            <motion.div
              animate={{ x: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex items-center gap-1 text-blue-500"
            >
              <Hand className="h-4 w-4" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TouchSwipeDemo;
