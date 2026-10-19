import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(Flip, useGSAP)

export { gsap, Flip, useGSAP }

export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const EASE_IN = 'power3.out'
export const EASE_MOVE = 'power2.inOut'

export function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Reactive reduced-motion flag, driven by gsap.matchMedia. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReduced)
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add({ reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      setReduced(Boolean(ctx.conditions?.reduce))
    })
    return () => mm.revert()
  }, [])
  return reduced
}

/**
 * Run animations only when motion is allowed. Call inside useGSAP so the
 * surrounding context owns (and reverts) every tween.
 */
export function withMotion(fn: () => void) {
  if (window.matchMedia(MOTION_OK).matches) fn()
}

/** Tween a number into an element's textContent. */
export function tweenNumber(el: HTMLElement | null, from: number, to: number, duration = 0.4) {
  if (!el) return
  if (prefersReduced() || from === to) {
    el.textContent = String(to)
    return
  }
  const o = { v: from }
  gsap.to(o, {
    v: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = String(Math.round(o.v))
    },
  })
}
