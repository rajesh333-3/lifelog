import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { db } from '../../db'

const HOBBY_COLORS = ['#a78bfa','#60a5fa','#4ade80','#f87171','#fbbf24','#fb923c','#e879f9','#34d399']

export function HobbySection({ date }) {
  const [adding,     setAdding]     = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newColor,   setNewColor]   = useState(HOBBY_COLORS[0])
  const [logOpen,    setLogOpen]    = useState(null)  // hobbyId being logged

  const hobbies = useLiveQuery(
    () => db.hobbies.orderBy('priority').toArray(),
    []
  ) ?? []

  const todayLogs = useLiveQuery(
    () => db.days.get(date).then(d => d?.hobbyLogs ?? []),
    [date]
  ) ?? []

  async function addHobby() {
    if (!newName.trim()) return
    const priority = hobbies.length
    await db.hobbies.add({ name: newName.trim(), color: newColor, priority, icon: '★' })
    setNewName('')
    setAdding(false)
  }

  async function reorder(newOrder) {
    await Promise.all(newOrder.map((h, i) => db.hobbies.update(h.id, { priority: i })))
  }

  async function saveLog(hobbyId, minutes, note) {
    const day     = (await db.days.get(date)) ?? { date, weekId: date.slice(0,7), hobbyLogs: [] }
    const logs    = (day.hobbyLogs ?? []).filter(l => l.hobbyId !== hobbyId)
    if (minutes || note) logs.push({ hobbyId, minutes: Number(minutes) || 0, note })
    await db.days.put({ ...day, hobbyLogs: logs })
    setLogOpen(null)
  }

  async function deleteHobby(id) {
    await db.hobbies.delete(id)
  }

  return (
    <div className="flex flex-col gap-2">
      {hobbies.length === 0 && !adding && (
        <p className="text-[#333] text-sm py-2">No hobbies yet. Add something you love.</p>
      )}

      {/* Reorderable list */}
      {hobbies.length > 0 && (
        <Reorder.Group axis="y" values={hobbies} onReorder={reorder} className="flex flex-col gap-2">
          {hobbies.map(hobby => {
            const log = todayLogs.find(l => l.hobbyId === hobby.id)
            return (
              <Reorder.Item key={hobby.id} value={hobby}>
                <HobbyRow
                  hobby={hobby}
                  log={log}
                  isLogOpen={logOpen === hobby.id}
                  onToggleLog={() => setLogOpen(logOpen === hobby.id ? null : hobby.id)}
                  onSaveLog={saveLog}
                  onDelete={deleteHobby}
                />
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      )}

      {/* Add hobby */}
      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex flex-col gap-3 overflow-hidden"
          >
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addHobby()}
              placeholder="Name your hobby…"
              className="bg-transparent text-[#f0f0f0] text-sm placeholder:text-[#2a2a2a] focus:outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {HOBBY_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)}
                  className="w-6 h-6 rounded-full transition-transform active:scale-90"
                  style={{ background: c, outline: c === newColor ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={addHobby} disabled={!newName.trim()}
                className="flex-1 bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2.5 disabled:opacity-30 active:opacity-80 min-h-[40px]">
                Add hobby
              </button>
              <button onClick={() => { setAdding(false); setNewName('') }}
                className="px-4 border border-[#2a2a2a] rounded-lg text-[#555] text-xs min-h-[40px]">
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-[#444] text-sm py-2 active:text-[#a78bfa] transition-colors min-h-[40px]">
            <span className="text-lg leading-none">+</span>
            <span>Add hobby</span>
          </button>
        )}
      </AnimatePresence>
    </div>
  )
}

function HobbyRow({ hobby, log, isLogOpen, onToggleLog, onSaveLog, onDelete }) {
  const [minutes, setMinutes] = useState(log?.minutes ?? '')
  const [note,    setNote]    = useState(log?.note ?? '')

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Drag handle */}
        <div className="cursor-grab active:cursor-grabbing flex flex-col gap-[3px] shrink-0 py-1">
          <div className="w-3 h-[1.5px] bg-[#333] rounded" />
          <div className="w-3 h-[1.5px] bg-[#333] rounded" />
          <div className="w-2 h-[1.5px] bg-[#2a2a2a] rounded" />
        </div>

        {/* Color dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: hobby.color }} />

        {/* Name */}
        <span className="flex-1 text-[#e0e0e0] text-sm">{hobby.name}</span>

        {/* Today log badge */}
        {log?.minutes > 0 && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ color: hobby.color, background: `${hobby.color}18` }}>
            {log.minutes}m
          </span>
        )}

        {/* Log button */}
        <button onClick={onToggleLog}
          className="text-[10px] uppercase tracking-widest text-[#444] active:text-[#f0f0f0] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          {isLogOpen ? '✕' : 'Log'}
        </button>

        {/* Delete */}
        <button onClick={() => onDelete(hobby.id)}
          className="text-[#2a2a2a] hover:text-[#f87171] transition-colors w-6 h-6 flex items-center justify-center rounded text-lg leading-none">
          ×
        </button>
      </div>

      {/* Inline log panel */}
      <AnimatePresence>
        {isLogOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#1a1a1a] px-3 py-3 flex flex-col gap-2.5 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#444] text-xs w-14 shrink-0">Minutes</span>
              <input
                type="number"
                min={0} max={999}
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                placeholder="0"
                className="w-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#a78bfa] text-center"
              />
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What did you work on?"
              rows={2}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#2a2a2a] resize-none focus:outline-none focus:border-[#a78bfa]"
            />
            <button
              onClick={() => onSaveLog(hobby.id, minutes, note)}
              className="bg-[#a78bfa] text-[#0a0a0a] text-xs font-semibold rounded-lg py-2.5 active:opacity-80 min-h-[40px]"
            >Save log</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
