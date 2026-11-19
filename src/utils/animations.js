import gsap from 'gsap';

/**
 * Stagger-reveal animation for a list of elements (e.g., book cards in a grid).
 * Uses fromTo + clearProps so elements never get stuck in a faded/transparent state.
 * @param {string} selector - CSS selector or ref array for target elements
 * @param {object} options - Optional overrides
 */
export function staggerReveal(selector, options = {}) {
  gsap.killTweensOf(selector);
  return gsap.fromTo(
    selector,
    { y: options.y ?? 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: options.duration ?? 0.6,
      stagger: options.stagger ?? 0.08,
      ease: options.ease ?? 'power3.out',
      delay: options.delay ?? 0.1,
      clearProps: 'transform,opacity'
    }
  );
}

/**
 * Smooth scale-in entrance for modals and overlays.
 * @param {HTMLElement|string} element - Target element
 */
export function modalEntrance(element) {
  if (!element) return;
  gsap.killTweensOf(element);
  return gsap.fromTo(
    element,
    { scale: 0.92, opacity: 0, y: 20 },
    {
      scale: 1,
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'back.out(1.4)',
      clearProps: 'transform,opacity'
    }
  );
}

/**
 * Hero text reveal with staggered lines.
 * Uses fromTo + clearProps to ensure elements never get stuck in a faded/transparent state.
 * @param {string} containerSelector - Parent container with child elements to stagger
 */
export function heroTextReveal(containerSelector) {
  const children = document.querySelectorAll(`${containerSelector} > *`);
  if (!children || children.length === 0) return null;
  gsap.killTweensOf(children);
  return gsap.fromTo(
    children,
    { y: 50, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power4.out',
      delay: 0.1,
      clearProps: 'transform,opacity'
    }
  );
}

/**
 * Counter roll-up animation (e.g., rating numbers, book counts).
 * @param {HTMLElement} element - Target element to animate
 * @param {number} endValue - The final number value
 * @param {number} decimals - Decimal places (default 1)
 */
export function counterRollUp(element, endValue, decimals = 1) {
  if (!element) return;
  gsap.killTweensOf(element);
  const obj = { val: 0 };
  return gsap.to(obj, {
    val: endValue,
    duration: 1.2,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = obj.val.toFixed(decimals);
    }
  });
}

