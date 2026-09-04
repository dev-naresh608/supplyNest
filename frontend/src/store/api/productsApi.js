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
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetBrandsQuery,
  useCreateBrandMutation,
} = productsApi;
