// Тихие звуки меню. Синтезируем в браузере — файлов не нужно.
// Браузер разрешает звук только после первого действия человека,
// поэтому AudioContext создаём лениво, на первом щелчке.
import { useSyncExternalStore } from 'react'

const KEY = 'tormosh-muted'
const VOLUME = 0.05

let ctx: AudioContext | null = null
let muted = readMuted()
const listeners = new Set<() => void>()

function readMuted() {
  try {
    // По умолчанию звук выключен — включается кнопкой в шапке
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(KEY, value ? '1' : '0')
  } catch {
    // приватный режим — просто не запоминаем
  }
  listeners.forEach((l) => l())
}

export function useMuted() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => muted,
  )
}

function audio() {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Короткий нота-удар с быстрым затуханием */
function blip(ac: AudioContext, freq: number, endFreq: number, start: number, length: number, type: OscillatorType) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + length)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(VOLUME, start + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

/** Щелчок барабана — как деревянная трещотка */
export function tick() {
  const ac = audio()
  if (ac) blip(ac, 1100, 520, ac.currentTime, 0.05, 'triangle')
}

/** Мягкий двойной звон при выборе */
export function chime() {
  const ac = audio()
  if (!ac) return
  blip(ac, 660, 640, ac.currentTime, 0.22, 'sine')
  blip(ac, 990, 960, ac.currentTime + 0.09, 0.3, 'sine')
}
