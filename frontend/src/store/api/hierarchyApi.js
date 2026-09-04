import { apiSlice } from './apiSlice';

export const hierarchyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHierarchyTree: builder.query({
      query: () => '/hierarchy/tree',
      providesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || [],
    }),

    getDownline: builder.query({
      query: (params) => ({
        url: '/hierarchy/downline',
        params,
      }),
      providesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || [],
    }),

    getDirectChildren: builder.query({
      query: () => '/hierarchy/children',
      providesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || [],
    }),

    getHierarchyStats: builder.query({
      query: () => '/hierarchy/stats',
      providesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || null,
    }),

    createChildUser: builder.mutation({
      query: (userData) => ({
        url: '/hierarchy/children',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || null,
    }),

    transferChild: builder.mutation({
      query: ({ id, newParentId }) => ({
        url: `/hierarchy/transfer/${id}`,
        method: 'PATCH',
        body: { newParentId },
      }),
      invalidatesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || null,
    }),

    deleteChild: builder.mutation({
      query: (id) => ({
        url: `/hierarchy/children/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Hierarchy'],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});

export const {
  useGetHierarchyTreeQuery,
  useGetDownlineQuery,
  useGetDirectChildrenQuery,
  useGetHierarchyStatsQuery,
  useCreateChildUserMutation,
  useTransferChildMutation,
  useDeleteChildMutation,
} = hierarchyApi;
