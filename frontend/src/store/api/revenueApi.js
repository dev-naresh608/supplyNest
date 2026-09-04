import { apiSlice } from './apiSlice';

export const revenueApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRevenue: builder.query({
      query: (params) => ({
        url: '/revenue',
        params,
      }),
      providesTags: ['Revenue'],
      transformResponse: (response) => response?.data || { items: [], totalRevenue: 0 },
    }),
  }),
});

export const { useGetRevenueQuery } = revenueApi;
