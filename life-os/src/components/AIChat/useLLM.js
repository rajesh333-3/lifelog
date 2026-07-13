import { useSettingsStore } from '../../store/useSettingsStore'

export function useLLM() {
  const llm = useSettingsStore(s => s.llm)

  async function chat(messages, systemPrompt) {
    if (llm.provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${llm.apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: messages.map(m => ({
              role:  m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          }),
        }
      )
      if (!res.ok) throw new Error(`Gemini error ${res.status}`)
      const d = await res.json()
      return d.candidates[0].content.parts[0].text
    }

    if (llm.provider === 'ollama') {
      const url = (llm.ollamaUrl ?? 'http://localhost:11434').replace(/\/$/, '')
      const res = await fetch(`${url}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:    llm.ollamaModel ?? 'qwen2.5:7b',
          stream:   false,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      })
      if (!res.ok) throw new Error(`Ollama error ${res.status}`)
      const d = await res.json()
      return d.message.content
    }

    throw new Error('No LLM provider configured. Go to Settings → AI.')
  }

  // Summarise a long note into one short sentence (≤12 words)
  async function summarise(longNote) {
    return chat(
      [{ role: 'user', content: `Summarise in one short sentence (max 12 words): ${longNote}` }],
      'You are a concise summariser. Output only the summary, nothing else. No punctuation at end.'
    )
  }

  // Test the current provider connection
  async function testConnection() {
    return chat(
      [{ role: 'user', content: 'Reply with exactly: ok' }],
      'You are a connection test. Reply with exactly the word "ok".'
    )
  }

  return { chat, summarise, testConnection, provider: llm.provider }
}

// Extract the scoring JSON block from an AI message
export function extractScoringJSON(text) {
  const match = text.match(/\{[^{}]*"physical"\s*:\s*\d[^{}]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) } catch { return null }
}

// Build the evening check-in system prompt from user settings + recent context
export function buildSystemPrompt(profile, pillars, recentDays = []) {
  const recentContext = recentDays.length
    ? recentDays.map(d =>
        `${d.date}: Physical ${d.physical ?? '?'}/100, Mental ${d.mental ?? '?'}/100, Work ${d.work ?? '?'}/100${d.aiNote ? '. ' + d.aiNote : ''}`
      ).join('\n')
    : 'No recent data yet.'

  const phGoals = (pillars?.physical ?? []).join(', ') || 'not set'
  const mnGoals = (pillars?.mental   ?? []).join(', ') || 'not set'
  const wkGoals = (pillars?.work     ?? []).join(', ') || 'not set'

  return `You are a warm, non-judgmental daily life coach for ${profile.name}.
Their 3 life pillars and goals are:
  - Physical: ${phGoals}
  - Mental:   ${mnGoals}
  - Work:     ${wkGoals}
Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}.
Recent context (last 3 days):
${recentContext}

Rules:
- Ask ONE question at a time. Never two questions in one message.
- Be warm, brief, encouraging. Like a good friend, not a therapist.
- Cover all 3 pillars across the conversation naturally.
- After gathering enough info, output a JSON block EXACTLY like this (no extra text before/after):
  {"physical":85,"mental":60,"work":35,"physicalNote":"...","mentalNote":"...","workNote":"...","aiNote":"one line day summary","color":"yellow"}
- Color rules: "green" if overall avg >= 75, "yellow" if 40-74, "red" if < 40
- After the JSON block, say: "Does this feel right, or want to adjust anything?"
- Only consider it final when the user says yes / confirms. Never save without confirmation.`
}
