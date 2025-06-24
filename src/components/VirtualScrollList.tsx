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

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizes = [5, 10, 20, 30, 40, 50];
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

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

  // Update page if items/pageSize change
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Get paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

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

  // Debug logs for troubleshooting stuck/blank issues
  useEffect(() => {
    console.log('[VirtualScrollList] items.length:', items.length);
    console.log('[VirtualScrollList] visibleRange:', visibleRange);
    console.log('[VirtualScrollList] scrollTop:', scrollTop);
    console.log('[VirtualScrollList] totalHeight:', totalHeight);
    console.log('[VirtualScrollList] offsetY:', offsetY);
    console.log('[VirtualScrollList] page:', page, 'pageSize:', pageSize, 'totalPages:', totalPages);
  }, [items.length, visibleRange, scrollTop, totalHeight, offsetY, page, pageSize, totalPages]);

  return (
    <div>
      {/* Pagination controls */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="mr-2">عدد العناصر في الصفحة:</label>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">السابق</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-2 py-1 border rounded ${page === i + 1 ? 'bg-primary text-white' : ''}`}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">التالي</button>
        </div>
      </div>
      {/* Visible items container */}
      <div
        ref={scrollElementRef}
        className={cn(
          'overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 w-full',
          className
        )}
        style={{ height: containerHeight + 400, width: '100%' }} // زيادة ارتفاع منطقة العرض 200 بكسل إضافية
        onScroll={handleScroll}
      >
        {paginatedItems.map((item, index) => {
          const actualIndex = (page - 1) * pageSize + index;
          const key = getItemKey ? getItemKey(item, actualIndex) : actualIndex;
          return (
            <div key={key} className="flex-shrink-0 w-full min-h-[80px]">
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