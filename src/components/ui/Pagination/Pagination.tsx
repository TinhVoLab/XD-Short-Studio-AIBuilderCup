import React from 'react';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'mục',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) {
        pages.push('ellipsis-start');
      }

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safeCurrentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`${styles.paginationContainer} ${className}`}>
      {/* Meta Count */}
      <div className={styles.metaInfo}>
        Hiển thị{' '}
        <span className={styles.metaHighlight}>
          {startItem}–{endItem}
        </span>{' '}
        trên{' '}
        <span className={styles.metaHighlight}>{totalItems}</span> {itemLabel}
      </div>

      <div className={styles.controlsGroup}>
        {/* Page Size Selector */}
        {onPageSizeChange && pageSizeOptions.length > 1 && (
          <div className={styles.pageSizeWrapper}>
            <span>Số hàng:</span>
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                // When page size changes, recalculate to avoid jumping out of bounds
                const newTotalPages = Math.max(1, Math.ceil(totalItems / newSize));
                if (safeCurrentPage > newTotalPages) {
                  onPageChange(newTotalPages);
                }
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={styles.pageNav}>
          {/* First Page */}
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage <= 1}
            title="Trang đầu"
            aria-label="Trang đầu"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>

          {/* Previous Page */}
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            title="Trang trước"
            aria-label="Trang trước"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Page Numbers */}
          {pages.map((p, idx) => {
            if (typeof p === 'string') {
              return (
                <span key={`el-${idx}`} className={styles.ellipsis}>
                  …
                </span>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <button
                key={p}
                type="button"
                className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            title="Trang tiếp"
            aria-label="Trang tiếp"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Last Page */}
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            title="Trang cuối"
            aria-label="Trang cuối"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
