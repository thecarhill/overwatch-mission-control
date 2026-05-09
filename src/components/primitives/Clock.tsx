import { useEffect, useState } from 'react'
import { T } from '../../theme/tokens'

export function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <span style={{ fontFamily: T.mono, fontSize: 10 }}>
      {t.toLocaleTimeString('en-GB', { hour12: false })}
    </span>
  )
}
