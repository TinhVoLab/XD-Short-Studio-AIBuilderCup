import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './ScrubNumberInput.module.css'

export interface ScrubNumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  title?: string
  disabled?: boolean
  precision?: number
  className?: string
}

export const ScrubNumberInput: React.FC<ScrubNumberInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  title,
  disabled = false,
  precision,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [textValue, setTextValue] = useState(String(value ?? 0))

  const dragStartRef = useRef<{ startX: number; startVal: number }>({ startX: 0, startVal: 0 })
  const latestValRef = useRef(value)
  latestValRef.current = value

  // Synchronize internal text value when external value changes while not typing
  useEffect(() => {
    if (!isFocused) {
      const displayVal = precision !== undefined ? Number(value.toFixed(precision)) : value
      setTextValue(String(displayVal ?? 0))
    }
  }, [value, isFocused, precision])

  const clampValue = useCallback((val: number) => {
    let res = val
    if (min !== undefined) res = Math.max(min, res)
    if (max !== undefined) res = Math.min(max, res)
    if (precision !== undefined) {
      res = Number(res.toFixed(precision))
    } else if (step >= 1) {
      res = Math.round(res)
    } else {
      const decimals = (String(step).split('.')[1] || '').length || 2
      res = Number(res.toFixed(decimals))
    }
    return res
  }, [min, max, step, precision])

  // Mouse drag scrubbing on label
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startVal: latestValRef.current || 0,
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX
      let factor = step || 1
      if (moveEvent.shiftKey) factor *= 10
      if (moveEvent.altKey) factor *= 0.1

      const rawNext = dragStartRef.current.startVal + deltaX * factor
      const nextVal = clampValue(rawNext)
      onChange(nextVal)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const commitTextValue = () => {
    setIsFocused(false)
    const parsed = parseFloat(textValue)
    if (!isNaN(parsed)) {
      const clamped = clampValue(parsed)
      onChange(clamped)
      setTextValue(String(clamped))
    } else {
      setTextValue(String(latestValRef.current ?? 0))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitTextValue()
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      setTextValue(String(latestValRef.current ?? 0))
      e.currentTarget.blur()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const delta = e.shiftKey ? 10 * step : step
      const nextVal = clampValue((latestValRef.current || 0) + delta)
      onChange(nextVal)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const delta = e.shiftKey ? 10 * step : step
      const nextVal = clampValue((latestValRef.current || 0) - delta)
      onChange(nextVal)
    }
  }

  return (
    <div
      className={`${styles.numBox} ${isDragging ? styles.numBoxDragging : ''} ${className}`}
      title={title || `Kéo sang trái/phải để đổi ${label} (Giữ Shift để kéo x10)`}
    >
      <span
        className={styles.numLabel}
        onMouseDown={handleMouseDown}
      >
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        className={styles.numInput}
        value={textValue}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onChange={e => setTextValue(e.target.value)}
        onBlur={commitTextValue}
        onKeyDown={handleKeyDown}
      />
      {unit && <span className={styles.unitLabel}>{unit}</span>}
    </div>
  )
}

export default ScrubNumberInput
