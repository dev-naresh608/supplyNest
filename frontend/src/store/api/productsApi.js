import { apiSlice } from './apiSlice';

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Products'],
      transformResponse: (response) => response?.data || [],
    }),

    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Products', id }],
      transformResponse: (response) => response?.data || null,
    }),

    createProduct: builder.mutation({
      query: (productData) => ({
        url: '/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['Products', 'Inventory', 'Alerts'],
      transformResponse: (response) => response?.data || null,
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['Products'],
      transformResponse: (response) => response?.data || null,
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products', 'Inventory'],
      transformResponse: (response) => response?.data || null,
    }),

    getCategories: builder.query({
      query: () => '/products/categories',
      providesTags: ['Categories'],
      transformResponse: (response) => response?.data || [],
    }),

    createCategory: builder.mutation({
      query: (catData) => ({
        url: '/products/categories',
        method: 'POST',
        body: catData,
      }),
      invalidatesTags: ['Categories'],
      transformResponse: (response) => response?.data || null,
    }),

    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/categories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categories', 'Products'],
      transformResponse: (response) => response?.data || null,
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/products/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
      transformResponse: (response) => response?.data || null,
    }),

    getBrands: builder.query({
      query: () => '/products/brands',
      providesTags: ['Brands'],
      transformResponse: (response) => response?.data || [],
    }),

    createBrand: builder.mutation({
      query: (brandData) => ({
        url: '/products/brands',
        method: 'POST',
        body: brandData,
      }),
      invalidatesTags: ['Brands'],
      transformResponse: (response) => response?.data || null,
    }),

    updateBrand: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/brands/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brands', 'Products'],
      transformResponse: (response) => response?.data || null,
    }),

    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `/products/brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Brands'],
      transformResponse: (response) => response?.data || null,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = productsApi;

