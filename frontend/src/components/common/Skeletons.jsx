import React from 'react';

/**
 * Reusable Card Skeleton for KPI summaries and metrics
 */
export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 bg-slate-200/80 rounded-md shimmer-bg" />
            <div className="w-10 h-10 rounded-xl bg-slate-100 shimmer-bg" />
          </div>
          <div className="h-8 w-20 bg-slate-200/90 rounded-lg shimmer-bg mt-2" />
        </div>
      ))}
    </div>
  );
};

/**
 * Reusable Table Skeleton for tabular data feeds
 */
export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="h-4 w-36 bg-slate-200/80 rounded-md shimmer-bg" />
        <div className="h-6 w-20 bg-slate-100 rounded-full shimmer-bg" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-3.5 bg-slate-100 rounded-md shimmer-bg flex-1"
                style={{ maxWidth: colIdx === 0 ? '160px' : colIdx === 1 ? '120px' : '100px' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Reusable Grid Cards Skeleton (e.g. for Products, Roles, or Sessions)
 */
export const GridSkeleton = ({ count = 6, height = 'h-48' }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between ${height}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200/80 rounded-md shimmer-bg" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 shimmer-bg" />
            </div>
            <div className="h-3 w-48 bg-slate-100 rounded-md shimmer-bg" />
            <div className="h-3 w-36 bg-slate-100 rounded-md shimmer-bg" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="h-4 w-16 bg-slate-200/70 rounded-md shimmer-bg" />
            <div className="h-7 w-20 bg-slate-100 rounded-xl shimmer-bg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Reusable Tree Skeleton for Hierarchy views
 */
export const TreeSkeleton = () => {
  return (
    <div className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div className="h-5 w-48 bg-slate-200/80 rounded-md shimmer-bg mb-6" />
      <div className="space-y-3 pl-2">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-200 shimmer-bg shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 bg-slate-200/80 rounded-md shimmer-bg" />
            <div className="h-3 w-56 bg-slate-100 rounded-md shimmer-bg" />
          </div>
        </div>

        <div className="pl-8 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/60 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-200 shimmer-bg shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-32 bg-slate-200/80 rounded-md shimmer-bg" />
                <div className="h-2.5 w-44 bg-slate-100 rounded-md shimmer-bg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable List Item Skeleton (e.g. for Notifications, Stock Alerts, Logs)
 */
export const ListSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-start justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 shimmer-bg shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 bg-slate-200/80 rounded-md shimmer-bg" />
                <div className="h-4 w-12 bg-slate-100 rounded-full shimmer-bg" />
              </div>
              <div className="h-3 w-3/4 bg-slate-100 rounded-md shimmer-bg" />
              <div className="h-2.5 w-24 bg-slate-100 rounded-md shimmer-bg mt-1" />
            </div>
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded-xl shimmer-bg shrink-0" />
        </div>
      ))}
    </div>
  );
};
