import React from 'react';
import { useSelector } from 'react-redux';

export const LoadingBar = () => {
  const isFetchingOrMutating = useSelector((state) => {
    const queries = state.api?.queries || {};
    const mutations = state.api?.mutations || {};

    const hasActiveQuery = Object.values(queries).some((q) => q?.status === 'pending');
    const hasActiveMutation = Object.values(mutations).some((m) => m?.status === 'pending');

    return hasActiveQuery || hasActiveMutation;
  });

  if (!isFetchingOrMutating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden bg-indigo-100/60 pointer-events-none">
      <div className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 animate-indeterminate-primary rounded-full" />
      <div className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 animate-indeterminate-secondary rounded-full" />
    </div>
  );
};
