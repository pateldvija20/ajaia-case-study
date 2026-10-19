import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

export const EASE_UI = 'back.out(1.1)'

/**
 * Moving indicator (tab underline, workflow strip). The leading edge travels on
 * a stiffer, shorter tween than the trailing edge, so the bar stretches toward
 * its target and settles. Transform only: x + scaleX on a 1px-wide bar.
 */
export function useIndicator(wrap: React.RefObject<HTMLElement | null>, key: unknown) {
  const edges = useRef<{ l: number; r: number } | null>(null)
  useLayoutEffect(() => {
    const w = wrap.current
    const bar = w?.querySelector<HTMLElement>('[data-indicator]')
    if (!w || !bar) return
    const measure = () => {
      const act = w.querySelector<HTMLElement>('[data-active="true"]')
      if (!act) return null
      const wr = w.getBoundingClientRect()
      const ar = act.getBoundingClientRect()
      return { l: ar.left - wr.left, r: ar.right - wr.left }
    }
    const apply = (l: number, r: number) => gsap.set(bar, { x: l, scaleX: Math.max(1, r - l), opacity: 1 })
    const target = measure()
    if (!target) {
      gsap.set(bar, { opacity: 0 })
      return
    }
    const prev = edges.current
    if (!prev || prefersReduced()) {
      edges.current = { ...target }
      apply(target.l, target.r)
    } else {
      gsap.killTweensOf(prev)
      const right = target.l > prev.l
      const update = () => apply(prev.l, prev.r)
      gsap.to(prev, { [right ? 'r' : 'l']: right ? target.r : target.l, duration: 0.26, ease: 'power3.out', onUpdate: update })
      gsap.to(prev, { [right ? 'l' : 'r']: right ? target.l : target.r, duration: 0.5, ease: 'power2.out', onUpdate: update })
    }
    const ro = new ResizeObserver(() => {
      const t = measure()
      if (t && edges.current) {
        gsap.killTweensOf(edges.current)
        Object.assign(edges.current, t)
        apply(t.l, t.r)
      }
    })
    ro.observe(w)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
