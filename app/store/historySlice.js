// store/postSlice.js
export const createHistorySlice = (set) => ({
    history: [],
    setHistory: (history) => set({history}),
    clearHistory: () => set({ history: [] })
});