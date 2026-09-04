import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  token: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      if (user) state.user = user;
      if (accessToken !== undefined) state.token = accessToken;
      state.isAuthenticated = !!state.user;
      state.isInitialized = true;
    },
    setUserProfile: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitialized = true;
    },
    logoutState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload ?? true;
    },
  },
});

export const { setCredentials, setUserProfile, logoutState, setInitialized } = authSlice.actions;
export default authSlice.reducer;
