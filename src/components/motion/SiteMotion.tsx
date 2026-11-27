import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function SiteMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const main = root.querySelector('main')
      if (!main) return

      const hero = main.querySelector('.landing-hero')
      if (hero) {
        const intro = hero.querySelectorAll('h1, p, .landing-hero__visual')
        gsap.fromTo(
          intro,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.09,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
          },
        )
      } else {
        const heading = main.querySelector('h1')
        if (heading) {
          gsap.fromTo(
            heading,
            { autoAlpha: 0, y: 12 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.45,
              ease: 'power2.out',
              clearProps: 'opacity,visibility,transform',
            },
          )
        }
      }

      main.querySelectorAll<HTMLElement>('[data-gsap-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: element,
              start: 'top 92%',
              once: true,
            },
          },
        )
      })
    })

    return () => media.revert()
  }, [pathname])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const animateHover = (event: PointerEvent, scale: number) => {
      if (reducedMotion.matches) return
      const target = event.target
      if (!(target instanceof Element)) return
      const control = target.closest<HTMLElement>('[data-gsap-hover]')
      if (!control || control.matches(':disabled')) return
      if (event.relatedTarget instanceof Node && control.contains(event.relatedTarget)) return

      gsap.to(control, {
        scale,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    const onPointerOver = (event: PointerEvent) => animateHover(event, 1.025)
    const onPointerOut = (event: PointerEvent) => animateHover(event, 1)
    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut)

    return () => {
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
      gsap.killTweensOf('[data-gsap-hover]')
    }
  }, [])

  return <div ref={rootRef}>{children}</div>
}
