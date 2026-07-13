import { create } from 'zustand'
import { getSetting, setSetting } from '../db'

export const useSettingsStore = create((set, get) => ({
  profile: null,   // { name, dob, lifeExpectancy, timezone }
  pillars: null,   // { physical:[], mental:[], work:[] }
  llm: {
    provider:    'ollama',
    apiKey:      '',
    ollamaUrl:   'http://localhost:11434',
    ollamaModel: 'qwen2.5:7b',
  },
  reminders: {
    morning: '07:30',
    midday:  '13:00',
    evening: '21:00',
  },
  loaded: false,

  load: async () => {
    const [profile, pillars, llm, reminders] = await Promise.all([
      getSetting('profile'),
      getSetting('pillars'),
      getSetting('llm'),
      getSetting('reminders'),
    ])
    set({
      profile:   profile   ?? null,
      pillars:   pillars   ?? { physical: [], mental: [], work: [] },
      llm:       llm       ?? { provider: 'ollama', apiKey: '', ollamaUrl: 'http://localhost:11434', ollamaModel: 'qwen2.5:7b' },
      reminders: reminders ?? { morning: '07:30', midday: '13:00', evening: '21:00' },
      loaded: true,
    })
  },

  saveProfile: async (profile) => {
    await setSetting('profile', profile)
    set({ profile })
  },

  savePillars: async (pillars) => {
    await setSetting('pillars', pillars)
    set({ pillars })
  },

  saveLLM: async (llm) => {
    await setSetting('llm', llm)
    set({ llm })
  },

  saveReminders: async (reminders) => {
    await setSetting('reminders', reminders)
    set({ reminders })
  },
}))
