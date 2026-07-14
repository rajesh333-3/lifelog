import { useState, useRef, useEffect } from 'react'

export function useVoiceInput() {
  const [listening,  setListening]  = useState(false)
  const [interim,    setInterim]    = useState('')
  const [supported,  setSupported]  = useState(null)
  const recRef         = useRef(null)
  const callbackRef    = useRef(null)
  const shouldListen   = useRef(false)  // intent flag: true while user wants mic on

  useEffect(() => {
    setSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
  }, [])

  function startSession() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR || !shouldListen.current) return

    const rec = new SR()
    // continuous = false: each utterance is isolated — no result accumulation.
    // onend auto-restarts while the user still wants to listen.
    rec.continuous     = false
    rec.interimResults = true
    rec.lang           = navigator.language || 'en-US'

    rec.onresult = (e) => {
      let interimText = ''
      let finalText   = ''
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText   += t
        else                      interimText += t
      }
      setInterim(interimText)
      if (finalText.trim()) callbackRef.current?.(finalText.trim())
    }

    rec.onend = () => {
      setInterim('')
      if (shouldListen.current) {
        // Brief gap then restart so the user gets a continuous experience
        setTimeout(startSession, 150)
      } else {
        setListening(false)
      }
    }

    rec.onerror = () => {
      setInterim('')
      if (shouldListen.current) {
        setTimeout(startSession, 300)
      } else {
        setListening(false)
      }
    }

    try {
      rec.start()
      recRef.current = rec
    } catch {
      shouldListen.current = false
      setListening(false)
    }
  }

  function start(onFinal) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    callbackRef.current = onFinal
    shouldListen.current = true
    setListening(true)
    startSession()
  }

  function stop() {
    shouldListen.current = false
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
    setInterim('')
  }

  function toggle(onFinal) {
    if (listening) stop()
    else start(onFinal)
  }

  return { listening, interim, supported, start, stop, toggle }
}
