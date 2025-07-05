import { useCallback, useRef, useState, TouchEvent } from 'react';

interface TouchSwipeOptions {
  minSwipeDistance?: number;
  preventDefaultDuringSwipe?: boolean;
  trackMouse?: boolean;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeEventData {
  deltaX: number;
  deltaY: number;
  first: boolean;
  initial: { x: number; y: number };
  event: TouchEvent | MouseEvent;
}

export function useSwipeable(
  handlers: SwipeHandlers,
  options: TouchSwipeOptions = {}
) {
  const {
    minSwipeDistance = 50,
    preventDefaultDuringSwipe = false,
    trackMouse = false,
  } = options;

  const [isSwiping, setIsSwiping] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) {
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      currentPosRef.current = { x: touch.clientX, y: touch.clientY };
      setIsSwiping(true);
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!startPosRef.current) return;

    const touch = event.touches[0];
    if (touch) {
      currentPosRef.current = { x: touch.clientX, y: touch.clientY };
      
      if (preventDefaultDuringSwipe) {
        event.preventDefault();
      }
    }
  }, [preventDefaultDuringSwipe]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!startPosRef.current || !currentPosRef.current) {
      setIsSwiping(false);
      return;
    }

    const deltaX = currentPosRef.current.x - startPosRef.current.x;
    const deltaY = currentPosRef.current.y - startPosRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // تحديد اتجاه السحب الأساسي
    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      // السحب الأفقي
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
      // السحب الرأسي
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }

    // إعادة تعيين المتغيرات
    startPosRef.current = null;
    currentPosRef.current = null;
    setIsSwiping(false);
  }, [handlers, minSwipeDistance]);

  // دعم الماوس للاختبار على سطح المكتب
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!trackMouse) return;
    
    startPosRef.current = { x: event.clientX, y: event.clientY };
    currentPosRef.current = { x: event.clientX, y: event.clientY };
    setIsSwiping(true);
  }, [trackMouse]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!trackMouse || !startPosRef.current) return;
    
    currentPosRef.current = { x: event.clientX, y: event.clientY };
  }, [trackMouse]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!trackMouse || !startPosRef.current || !currentPosRef.current) {
      setIsSwiping(false);
      return;
    }

    const deltaX = currentPosRef.current.x - startPosRef.current.x;
    const deltaY = currentPosRef.current.y - startPosRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
      if (deltaX > 0 && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (deltaX < 0 && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > minSwipeDistance) {
      if (deltaY > 0 && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      } else if (deltaY < 0 && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      }
    }

    startPosRef.current = null;
    currentPosRef.current = null;
    setIsSwiping(false);
  }, [handlers, minSwipeDistance, trackMouse]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: trackMouse ? handleMouseDown : undefined,
    onMouseMove: trackMouse ? handleMouseMove : undefined,
    onMouseUp: trackMouse ? handleMouseUp : undefined,
    isSwiping,
  };
}

// Hook مبسط للاستخدام السريع
export function useSimpleSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options?: TouchSwipeOptions
) {
  return useSwipeable(
    {
      onSwipeLeft,
      onSwipeRight,
    },
    {
      minSwipeDistance: 30,
      preventDefaultDuringSwipe: true,
      trackMouse: false,
      ...options,
    }
  );
}
