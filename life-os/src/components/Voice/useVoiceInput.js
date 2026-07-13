import { useState, useRef, useEffect } from 'react'

export function useVoiceInput() {
  const [listening,  setListening]  = useState(false)
  const [interim,    setInterim]    = useState('')
  const [supported,  setSupported]  = useState(null)
  const recRef      = useRef(null)
  const callbackRef = useRef(null)

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  function start(onFinal) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    callbackRef.current = onFinal

    const rec          = new SR()
    rec.continuous     = true
    rec.interimResults = true
    rec.lang           = navigator.language || 'en-US'

    rec.onresult = (e) => {
      let interimText = ''
      let finalText   = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText   += t
        else                      interimText += t
      }

      setInterim(interimText)
      if (finalText.trim()) callbackRef.current?.(finalText.trim())
    }

    rec.onend   = () => { setListening(false); setInterim('') }
    rec.onerror = (e) => {
      // 'no-speech' is benign — just reset
      setListening(false)
      setInterim('')
    }

    try {
      rec.start()
      recRef.current = rec
      setListening(true)
    } catch {
      // Another recognition session may be active
    }
  }

  function stop() {
    recRef.current?.stop()
    recRef.current = null
  }

  function toggle(onFinal) {
    if (listening) stop()
    else start(onFinal)
  }

  return { listening, interim, supported, start, stop, toggle }
}
