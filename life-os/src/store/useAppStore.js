import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Which panel is open
  activePanel: null,   // 'dayView' | 'aiChat' | 'eisenhower' | 'settings' | null
  selectedDate: null,  // 'YYYY-MM-DD'
  selectedWeek: null,  // 'YYYY-WW'

  openDayView: (date) => set({ activePanel: 'dayView', selectedDate: date }),
  openAIChat:  ()     => set({ activePanel: 'aiChat' }),
  openEisenhower: ()  => set({ activePanel: 'eisenhower' }),
  openSettings: ()    => set({ activePanel: 'settings' }),
  closePanel:   ()    => set({ activePanel: null, selectedDate: null }),

  hoveredWeek: null,
  setHoveredWeek: (weekId) => set({ hoveredWeek: weekId }),
}))
