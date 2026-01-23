import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { RefObject } from 'react'
import { useClickOutside } from '../useClickOutside'

describe('useClickOutside', () => {
  let handler: ReturnType<typeof vi.fn>

  beforeEach(() => {
    handler = vi.fn()
  })

  it('calls handler when clicking outside the element', () => {
    // Create a mock element
    const element = document.createElement('div')
    document.body.appendChild(element)

    // Create a ref-like object
    const ref = { current: element }

    renderHook(() => useClickOutside(ref, handler))

    // Click outside the element
    const outsideElement = document.createElement('button')
    document.body.appendChild(outsideElement)

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(element)
    document.body.removeChild(outsideElement)
  })

  it('does not call handler when clicking inside the element', () => {
    // Create a mock element with a child
    const element = document.createElement('div')
    const childElement = document.createElement('button')
    element.appendChild(childElement)
    document.body.appendChild(element)

    const ref = { current: element }

    renderHook(() => useClickOutside(ref, handler))

    // Click inside the element
    const event = new MouseEvent('mousedown', { bubbles: true })
    childElement.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(element)
  })

  it('does not call handler when ref is null', () => {
    const ref = { current: null } as unknown as RefObject<HTMLElement>

    renderHook(() => useClickOutside(ref, handler))

    // Click anywhere
    const event = new MouseEvent('mousedown', { bubbles: true })
    document.body.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('handles touch events', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)

    const ref = { current: element }

    renderHook(() => useClickOutside(ref, handler))

    // Touch outside the element
    const outsideElement = document.createElement('button')
    document.body.appendChild(outsideElement)

    const event = new TouchEvent('touchstart', { bubbles: true })
    outsideElement.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(element)
    document.body.removeChild(outsideElement)
  })

  it('removes event listeners on unmount', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)

    const ref = { current: element }

    const { unmount } = renderHook(() => useClickOutside(ref, handler))

    // Unmount the hook
    unmount()

    // Click outside after unmount
    const outsideElement = document.createElement('button')
    document.body.appendChild(outsideElement)

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    // Handler should not be called after unmount
    expect(handler).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(element)
    document.body.removeChild(outsideElement)
  })

  it('updates handler when it changes', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)

    const ref = { current: element }
    const newHandler = vi.fn()

    const { rerender } = renderHook(
      ({ handler }) => useClickOutside(ref, handler),
      { initialProps: { handler } }
    )

    // Change the handler
    rerender({ handler: newHandler })

    // Click outside
    const outsideElement = document.createElement('button')
    document.body.appendChild(outsideElement)

    const event = new MouseEvent('mousedown', { bubbles: true })
    outsideElement.dispatchEvent(event)

    // New handler should be called
    expect(newHandler).toHaveBeenCalled()
    // Old handler should not be called (since listener was updated)
    expect(handler).not.toHaveBeenCalled()

    // Cleanup
    document.body.removeChild(element)
    document.body.removeChild(outsideElement)
  })
})
