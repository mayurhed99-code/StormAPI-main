import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice.js'
import runReducer from './runSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    run: runReducer,
  },
})
