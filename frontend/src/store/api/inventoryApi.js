import { apiSlice } from './apiSlice';

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyStock: builder.query({
      query: (params) => ({
        url: '/inventory/my-stock',
        params,
      }),
      providesTags: ['Inventory'],
      transformResponse: (response) => response?.data || [],
    }),

    getTransactionHistory: builder.query({
      query: (params) => ({
        url: '/inventory/history',
        params,
      }),
      providesTags: ['Transactions'],
      transformResponse: (response) => response?.data || [],
    }),

    getLowStockAlerts: builder.query({
      query: () => '/inventory/alerts',
      providesTags: ['Alerts', 'Inventory'],
      transformResponse: (response) => response?.data || [],
    }),

    assignStock: builder.mutation({
      query: (assignmentData) => ({
        url: '/inventory/assign',
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: ['Inventory', 'Transactions', 'Alerts'],
      transformResponse: (response) => response?.data || null,
    }),

    adjustStock: builder.mutation({
      query: (adjustmentData) => ({
        url: '/inventory/adjust',
        method: 'POST',
        body: adjustmentData,
      }),
      invalidatesTags: ['Inventory', 'Transactions', 'Alerts'],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});

export const {
  useGetMyStockQuery,
  useGetTransactionHistoryQuery,
  useGetLowStockAlertsQuery,
  useAssignStockMutation,
  useAdjustStockMutation,
} = inventoryApi;
