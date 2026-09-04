import { apiSlice } from './apiSlice';

export const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: (params) => ({
        url: '/roles',
        params,
      }),
      providesTags: ['Roles'],
      transformResponse: (response) => response?.data || [],
    }),

    getRoleStats: builder.query({
      query: () => '/roles/stats',
      providesTags: ['Roles'],
      transformResponse: (response) => response?.data || null,
    }),

    getRoleById: builder.query({
      query: (id) => `/roles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Roles', id }],
      transformResponse: (response) => response?.data || null,
    }),

    createRole: builder.mutation({
      query: (roleData) => ({
        url: '/roles',
        method: 'POST',
        body: roleData,
      }),
      invalidatesTags: ['Roles'],
      transformResponse: (response) => response?.data || null,
    }),

    updateRole: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['Roles'],
      transformResponse: (response) => response?.data || null,
    }),

    cloneRole: builder.mutation({
      query: ({ id, newRoleName }) => ({
        url: `/roles/${id}/clone`,
        method: 'POST',
        body: { newRoleName },
      }),
      invalidatesTags: ['Roles'],
      transformResponse: (response) => response?.data || null,
    }),

    assignRole: builder.mutation({
      query: ({ staffUserId, roleId }) => ({
        url: '/roles/assign',
        method: 'POST',
        body: { staffUserId, roleId },
      }),
      invalidatesTags: ['Roles', 'Hierarchy', 'Auth'],
      transformResponse: (response) => response?.data || null,
    }),

    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});


export const {
  useGetRolesQuery,
  useGetRoleStatsQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useCloneRoleMutation,
  useAssignRoleMutation,
} = rolesApi;

