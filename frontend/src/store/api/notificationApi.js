import { apiSlice } from './apiSlice';

export const notificationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params = {}) => ({
        url: '/notifications',
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Notifications', id: _id })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
      transformResponse: (response) => ({
        items: response?.data || [],
        meta: response?.meta || {},
      }),
    }),

    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: [{ type: 'UnreadCount', id: 'COUNT' }],
      transformResponse: (response) => response?.data?.unreadCount || 0,
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notifications', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'UnreadCount', id: 'COUNT' },
      ],
      transformResponse: (response) => response?.data || null,
    }),

    markAllAsRead: builder.mutation({
      query: (body = {}) => ({
        url: '/notifications/mark-all-read',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'UnreadCount', id: 'COUNT' },
      ],
      transformResponse: (response) => response?.data || null,
    }),

    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'UnreadCount', id: 'COUNT' },
      ],
      transformResponse: (response) => response?.data || null,
    }),

    clearReadNotifications: builder.mutation({
      query: () => ({
        url: '/notifications/clear-read',
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'UnreadCount', id: 'COUNT' },
      ],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,
} = notificationApi;
