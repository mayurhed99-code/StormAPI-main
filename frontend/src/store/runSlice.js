import { createSlice } from '@reduxjs/toolkit'

// Tracks the currently active (or most recently active) test run for
// the live dashboard WebSocket subscription.
const runSlice = createSlice({
  name: 'run',
  initialState: {
    activeRunId: null,     // Long — set when a run is started
    progress: null,        // RunProgress payload from WebSocket
    // { runId, completed, total, failures, avgLatencyMs, status }
    latencyHistory: [],    // [{ t: timestamp, v: avgLatencyMs }] for chart
  },
  reducers: {
    setActiveRun(state, action) {
      state.activeRunId   = action.payload
      state.progress      = null
      state.latencyHistory = []
    },
    updateProgress(state, action) {
      state.progress = action.payload
      // Append a latency data point for the chart (keep last 60 points)
      if (action.payload.avgLatencyMs !== undefined) {
        state.latencyHistory = [
          ...state.latencyHistory.slice(-59),
          { t: Date.now(), v: action.payload.avgLatencyMs },
        ]
      }
    },
    clearRun(state) {
      state.activeRunId    = null
      state.progress       = null
      state.latencyHistory = []
    },
  },
})

export const { setActiveRun, updateProgress, clearRun } = runSlice.actions
export default runSlice.reducer

export const selectActiveRunId    = (s) => s.run.activeRunId
export const selectProgress       = (s) => s.run.progress
export const selectLatencyHistory = (s) => s.run.latencyHistory
