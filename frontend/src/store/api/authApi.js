import { apiSlice } from './apiSlice';
import { setCredentials, setUserProfile, logoutState, setInitialized } from '../slices/authSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['Auth'],
      transformResponse: (response) => response?.data || null,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUserProfile(data));
        } catch (err) {
          dispatch(setUserProfile(null));
        } finally {
          dispatch(setInitialized(true));
        }
      },
    }),

    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth', 'Sessions'],
      transformResponse: (response) => response?.data || null,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(
              setCredentials({
                user: data.user,
                accessToken: data.accessToken,
              })
            );
          }
        } catch (err) {
          // Handled in component
        }
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'Sessions', 'Hierarchy', 'Roles', 'Products', 'Inventory', 'Revenue'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutState());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),

    logoutAll: builder.mutation({
      query: () => ({
        url: '/auth/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['Sessions', 'Auth'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logoutState());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),

    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Auth'],
      transformResponse: (response) => response?.data || null,
    }),

    getSessions: builder.query({
      query: () => '/auth/sessions',
      providesTags: ['Sessions'],
      transformResponse: (response) => response?.data || [],
    }),

    revokeSession: builder.mutation({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sessions'],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});

export const {
  useGetProfileQuery,
  useLoginMutation,
  useLogoutMutation,
  useLogoutAllMutation,
  useUpdateProfileMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
} = authApi;
