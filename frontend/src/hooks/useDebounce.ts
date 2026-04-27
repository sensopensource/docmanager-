import { useState, useEffect } from "react"

// Retourne `value` apres `delay`ms d'inactivite.
// Si `value` change avant la fin du delai, on re-attend.
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Programme une mise a jour apres `delay`ms
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Si `value` change avant la fin, on annule le timer precedent
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
