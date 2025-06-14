import * as React from "react";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useVirtualScroll, VirtualGrid } from '@/utils/virtualScrollUtils';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight?: number; // جعلها اختيارية
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
  loadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  threshold?: number;
}

function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  getItemKey,
  loadMore,
  hasNextPage = false,
  isLoading = false,
  threshold = 200,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggered = useRef(false);

  // إذا لم يتم تمرير itemHeight، لا تحسب visibleRange ولا totalHeight
  const visibleRange = useMemo(() => {
    if (!itemHeight) return { startIndex: 0, endIndex: items.length - 1, visibleItemCount: items.length };
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleItemCount + overscan * 2
    );
    return { startIndex, endIndex, visibleItemCount };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);

      // Infinite scroll logic
      if (loadMore && hasNextPage && !isLoading) {
        const scrollHeight = e.currentTarget.scrollHeight;
        const clientHeight = e.currentTarget.clientHeight;
        const scrollBottom = scrollHeight - newScrollTop - clientHeight;

        if (scrollBottom <= threshold && !loadMoreTriggered.current) {
          loadMoreTriggered.current = true;
          loadMore();
        }
      }
    },
    [onScroll, loadMore, hasNextPage, isLoading, threshold]
  );

  // Reset load more trigger when loading state changes
  useEffect(() => {
    if (!isLoading) {
      loadMoreTriggered.current = false;
    }
  }, [isLoading]);

  // Scroll to top when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && items.length === 0) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  // Calculate total height
  let safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  // Extra protection: filter out items with invalid total if present
  function hasValidTotal(item: unknown): boolean {
    return typeof item !== 'object' || item === null || !('total' in item) || (typeof (item as { total?: unknown }).total === 'number' && !isNaN((item as { total?: unknown }).total as number));
  }
  safeItems = safeItems.filter(hasValidTotal);
  const totalHeight = safeItems.length * (itemHeight || 0);

  // Calculate offset for visible items
  const offsetY = visibleRange.startIndex * (itemHeight || 0);

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        'overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Visible items container */}
      <div>
        {safeItems.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => {
          const actualIndex = visibleRange.startIndex + index;
          const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
          return (
            <div key={key} className="flex-shrink-0">
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[100px]">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VirtualScrollList;