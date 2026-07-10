import { useState, useCallback } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = ++toastId
    const newToast = {
      id,
      title,
      description,
      variant,
      open: true,
    }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
    
    // Log to console for debugging
    console.log(`[Toast] ${title}: ${description}`)
    
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return {
    toast,
    dismiss,
    dismissAll,
    toasts,
  }
}

export default useToast
