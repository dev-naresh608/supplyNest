import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logoutState, setCredentials } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // Attempt token refresh on 401 for non-auth endpoints
    const isAuthUrl =
      typeof args === 'string'
        ? args.includes('/auth/login') || args.includes('/auth/refresh-token')
        : args.url?.includes('/auth/login') || args.url?.includes('/auth/refresh-token');

    if (!isAuthUrl) {
      const refreshResult = await baseQuery(
        { url: '/auth/refresh-token', method: 'POST' },
        api,
        extraOptions
      );

      if (refreshResult?.data) {
        const { accessToken } = refreshResult.data.data || {};
        if (accessToken) {
          api.dispatch(setCredentials({ accessToken }));
          // Retry original request with newly generated token
          result = await baseQuery(args, api, extraOptions);
        }
      } else {
        api.dispatch(logoutState());
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Hierarchy',
    'Roles',
    'Products',
    'Categories',
    'Brands',
    'Inventory',
    'Transactions',
    'Alerts',
    'Revenue',
    'Sessions',
  ],
  endpoints: () => ({}),
});
