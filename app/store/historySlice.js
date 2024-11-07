// store/postSlice.js
export const createHistorySlice = (set) => ({
    history: [],
    display: [],
    setHistory: (history) => set({history}),
    setDisplay: (display) => set({display}),
    clearHistory: () => set({ history: [], display: [] }),
});