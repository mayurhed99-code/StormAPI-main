import { createSlice } from '@reduxjs/toolkit'

const TOKEN_KEY = 'stormapi_token'
const USER_KEY  = 'stormapi_user'

const storedToken = localStorage.getItem(TOKEN_KEY)
const storedUser  = (() => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
})()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: storedToken || null,
    user:  storedUser  || null,   // { userId, email }
  },
  reducers: {
    setCredentials(state, action) {
      const { token, userId, email } = action.payload
      state.token = token
      state.user  = { userId, email }
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify({ userId, email }))
    },
    logout(state) {
      state.token = null
      state.user  = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectToken   = (s) => s.auth.token
export const selectUser    = (s) => s.auth.user
export const selectIsAuthed = (s) => !!s.auth.token
