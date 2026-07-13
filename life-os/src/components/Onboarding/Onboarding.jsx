import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../store/useSettingsStore'
import { totalWeeks, weeksLived } from '../../utils/dateUtils'

const STEPS = ['welcome', 'name', 'dob', 'expectancy', 'pillars', 'done']

export function Onboarding({ onComplete }) {
  const saveProfile = useSettingsStore(s => s.saveProfile)
  const savePillars = useSettingsStore(s => s.savePillars)

  const [step, setStep]   = useState(0)
  const [name, setName]   = useState('')
  const [dob,  setDob]    = useState('')
  const [life, setLife]   = useState(85)
  const [pillars, setPillars] = useState({
    physical: ['Exercise 4×/week', '8k steps daily', 'Sleep 7h+'],
    mental:   ['Read 20 min/day', 'Meditate 10 min', 'No doom-scroll after 9pm'],
    work:     ['2h deep work block', 'Weekly review', 'Ship one thing/week'],
  })

  const current   = STEPS[step]
  const weeksLeft = dob ? totalWeeks(life) - weeksLived(dob) : null
  const weeksGone = dob ? weeksLived(dob) : null

  async function finish() {
    await saveProfile({ name: name.trim(), dob, lifeExpectancy: life, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    await savePillars(pillars)
    onComplete()
  }

  function updateGoal(pillar, i, val) {
    setPillars(p => ({ ...p, [pillar]: p[pillar].map((g, idx) => idx === i ? val : g) }))
  }

  function addGoal(pillar) {
    setPillars(p => ({ ...p, [pillar]: [...p[pillar], ''] }))
  }

  function removeGoal(pillar, i) {
    setPillars(p => ({ ...p, [pillar]: p[pillar].filter((_, idx) => idx !== i) }))
  }

  const canNext = {
    welcome:    true,
    name:       name.trim().length > 0,
    dob:        dob.length === 10,
    expectancy: life >= 50 && life <= 120,
    pillars:    true,
    done:       true,
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {current === 'welcome' && (
            <Step title="Life Log" subtitle={`"Don't fill your calendar.\nFill your weeks."`}>
              <p className="text-[#888] text-center text-sm mt-4">
                A personal operating system that answers one question visually:<br />
                <span className="text-[#f0f0f0]">how am I actually spending my weeks?</span>
              </p>
            </Step>
          )}

          {current === 'name' && (
            <Step title="What's your name?" subtitle="This personalises your AI check-ins.">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canNext.name && setStep(s => s + 1)}
                placeholder="Your first name"
                autoFocus
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4 text-[#f0f0f0] text-lg placeholder:text-[#444] focus:outline-none focus:border-[#a78bfa] mt-6"
              />
            </Step>
          )}

          {current === 'dob' && (
            <Step title={`Nice to meet you, ${name}.`} subtitle="When were you born? This builds your life grid.">
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                autoFocus
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4 text-[#f0f0f0] text-lg focus:outline-none focus:border-[#a78bfa] mt-6 [color-scheme:dark]"
              />
              {dob && (
                <p className="text-[#888] text-sm text-center mt-3">
                  You've lived <span className="text-[#a78bfa] font-medium">{weeksGone?.toLocaleString()} weeks</span> so far.
                </p>
              )}
            </Step>
          )}

          {current === 'expectancy' && (
            <Step
              title="How long do you plan to live?"
              subtitle="Set your target lifespan. The default 85 is a reasonable global mean — adjust to your goal."
            >
              <div className="mt-6 flex flex-col items-center gap-4">
                <span className="text-6xl font-light text-[#a78bfa]">{life}</span>
                <input
                  type="range"
                  min={50} max={120} value={life}
                  onChange={e => setLife(Number(e.target.value))}
                  className="w-full accent-[#a78bfa]"
                />
                <div className="flex justify-between w-full text-[#444] text-xs">
                  <span>50</span><span>120</span>
                </div>
                {dob && (
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 w-full text-center">
                    <p className="text-[#888] text-sm">Weeks remaining</p>
                    <p className="text-3xl font-light text-[#4ade80] mt-1">
                      {Math.max(0, weeksLeft)?.toLocaleString()}
                    </p>
                    <p className="text-[#444] text-xs mt-1">of {totalWeeks(life).toLocaleString()} total</p>
                  </div>
                )}
              </div>
            </Step>
          )}

          {current === 'pillars' && (
            <Step title="Your 3 life pillars" subtitle="Goals that your AI coach will check in on daily. Edit to match your life.">
              <div className="mt-4 flex flex-col gap-4">
                {[
                  { key: 'physical', icon: '💪', label: 'Physical' },
                  { key: 'mental',   icon: '🧠', label: 'Mental' },
                  { key: 'work',     icon: '💼', label: 'Work' },
                ].map(({ key, icon, label }) => (
                  <div key={key} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
                    <p className="text-sm text-[#888] mb-2">{icon} {label}</p>
                    {pillars[key].map((g, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          value={g}
                          onChange={e => updateGoal(key, i, e.target.value)}
                          className="flex-1 bg-[#222] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f0f0f0] focus:outline-none focus:border-[#a78bfa]"
                        />
                        <button
                          onClick={() => removeGoal(key, i)}
                          className="text-[#444] hover:text-[#f87171] text-lg px-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >×</button>
                      </div>
                    ))}
                    <button
                      onClick={() => addGoal(key)}
                      className="text-[#a78bfa] text-sm mt-1 min-h-[44px] px-2"
                    >+ Add goal</button>
                  </div>
                ))}
              </div>
            </Step>
          )}

          {current === 'done' && (
            <Step title="You're set." subtitle={`Your life grid is ready, ${name}. ${weeksLeft?.toLocaleString()} weeks to fill with intention.`}>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Weeks lived', value: weeksGone?.toLocaleString(), color: '#888' },
                  { label: 'Weeks left',  value: Math.max(0, weeksLeft)?.toLocaleString(), color: '#4ade80' },
                  { label: 'Life span',   value: `${life} yrs`, color: '#a78bfa' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3">
                    <p className="text-xs text-[#888]">{label}</p>
                    <p className="text-xl font-light mt-1" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </Step>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && current !== 'done' && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 border border-[#2a2a2a] rounded-xl py-4 text-[#888] min-h-[52px] active:opacity-70"
              >Back</button>
            )}
            {current !== 'done' ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext[current]}
                className="flex-1 bg-[#a78bfa] text-[#0a0a0a] font-semibold rounded-xl py-4 min-h-[52px] disabled:opacity-30 active:opacity-80"
              >
                {current === 'pillars' ? 'Almost there →' : 'Continue →'}
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex-1 bg-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl py-4 min-h-[52px] active:opacity-80"
              >Open my life grid →</button>
            )}
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === step ? 20 : 6,
                  height: 6,
                  background: i === step ? '#a78bfa' : i < step ? '#444' : '#222',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Step({ title, subtitle, children }) {
  return (
    <div>
      <h1 className="text-3xl font-light text-[#f0f0f0] text-center leading-tight">{title}</h1>
      {subtitle && (
        <p className="text-[#888] text-center text-sm mt-3 whitespace-pre-line">{subtitle}</p>
      )}
      {children}
    </div>
  )
}
