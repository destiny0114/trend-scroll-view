import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

const MARGIN = 20

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollbarRef = useRef<HTMLDivElement>(null)
  const scrollbarAreaRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)

  // Function to update the width of the content based on its children
  const updateContentWidth = (): void => {
    const content = contentRef.current
    const scrollbar = scrollbarRef.current
    if (!scrollbar) return
    if (content) {
      const children = Array.from(content.children) as HTMLElement[]
      const contentWidth = children.reduce((acc, child, index) => {
        // Get width of the child and its margin-right
        const childWidth = child.offsetWidth
        const marginRight =
          index < children.length - 1
            ? parseInt(window.getComputedStyle(child).marginRight, 10)
            : 0
        return acc + childWidth + marginRight
      }, 0)
      scrollbar.style.left = `${MARGIN}px`
      content.style.width = `${contentWidth}px`
    }
  }

  // Update the dots based on the scroll position
  const updateDots = (scrollProgress: number) => {
    const dotsContainer = dotsRef.current
    if (dotsContainer) {
      // Select all child elements with class 'dot'
      const dotsArray = Array.from(
        dotsContainer.querySelectorAll('.dot')
      ) as HTMLDivElement[]
      const labelsArray = Array.from(
        dotsContainer.querySelectorAll('.label')
      ) as HTMLElement[] // assuming labels have the class 'label'
      const numberOfDots = dotsArray.length
      const activeDotIndex = Math.floor(scrollProgress * (numberOfDots - 1))

      // Reset all dots to inactive state and labels to default color
      dotsArray.forEach((dot) => {
        dot.style.backgroundColor = 'black' // inactive color for dots
      })

      // Set active dot color based on scroll progress
      dotsArray.forEach((dot, index) => {
        if (index <= activeDotIndex) {
          dot.style.backgroundColor = '#E59E2E' // active color
        }
      })

      // Update label colors based on active section
      // Assuming each label corresponds to a range of dots
      const activeLabelIndex = Math.floor(
        activeDotIndex / (dotsArray.length / 4)
      ) // Assuming there are 4 labels
      labelsArray.forEach((label, index) => {
        if (index <= activeLabelIndex) {
          label.style.color = '#E59E2E' // inactive color for dots
        } else {
          label.style.color = 'black' // active color
        }
      })
    }
  }

  const handleScroll = () => {
    const container = containerRef.current
    const content = contentRef.current
    const scrollbar = scrollbarRef.current
    const scrollbarArea = scrollbarAreaRef.current

    if (container && content && scrollbar && scrollbarArea) {
      // The total available width for the scrollbar thumb to move
      const trackWidth = scrollbarArea.clientWidth - MARGIN * 2

      // The current scroll position of the container
      const scrollLeft = container.scrollLeft

      // The maximum value of scrollLeft
      const maxScrollLeft = content.scrollWidth - container.clientWidth

      // The ratio of the current scroll position to the maximum scroll position
      const scrollRatio = scrollLeft / maxScrollLeft

      // The maximum left position for the thumb
      const maxThumbLeft = trackWidth - scrollbar.offsetWidth

      // The actual left position of the thumb based on the scroll ratio
      const thumbLeft = scrollRatio * maxThumbLeft + MARGIN // MARGIN is added for the initial offset

      // Set the thumb position
      scrollbar.style.left = `${thumbLeft}px`

      // Update the dots based on the scroll position
      updateDots(scrollRatio)
    }
  }

  // Function that handles the wheel event
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const container = containerRef.current

    if (container) {
      // Adjust the delta as needed
      const delta = event.deltaY
      container.scrollLeft += delta

      // Synchronize the scrollbar thumb position
      handleScroll()
    }
  }

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const track = scrollbarAreaRef.current
    const scrollbar = scrollbarRef.current
    const container = containerRef.current
    const content = contentRef.current

    if (track && scrollbar && container && content) {
      // Get the click position relative to the track
      const clickPosition = event.clientX - track.getBoundingClientRect().left
      // Calculate the ratio of the click position within the track
      const clickRatio = clickPosition / (track.offsetWidth - MARGIN * 2)
      // Calculate the new scroll position for the container
      const newScrollPosition =
        clickRatio * (content.scrollWidth - container.clientWidth)
      // Calculate the new position for the thumb
      const thumbPosition =
        clickRatio * (track.offsetWidth - scrollbar.offsetWidth - MARGIN * 2)

      // Set the new positions
      container.scrollLeft = newScrollPosition
      scrollbar.style.left = `${thumbPosition}px`

      // Update the dots based on the new scroll position
      updateDots(
        container.scrollLeft / (content.scrollWidth - container.clientWidth)
      )
    }
  }

  useEffect(() => {
    updateContentWidth()

    if (!scrollbarRef.current) return
    if (!contentRef.current) return
    if (!containerRef.current) return
    // Initialize scrollbar and content positions
    const scrollbar = scrollbarRef.current
    const container = containerRef.current
    const content = contentRef.current

    // Start the scrollbar with space from the left
    scrollbar.style.left = `${MARGIN}px`
    // Set the initial left position of the content
    content.style.left = `0px`

    handleScroll()
    window.addEventListener('resize', updateContentWidth)
    container.addEventListener('wheel', onWheel)

    return () => {
      window.removeEventListener('resize', updateContentWidth)
      container.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (
        !isDragging.current ||
        !scrollbarRef.current ||
        !containerRef.current ||
        !contentRef.current ||
        !scrollbarAreaRef.current
      )
        return

      event.preventDefault()

      const container = containerRef.current
      const scrollbar = scrollbarRef.current
      const content = contentRef.current
      const scrollbarArea = scrollbarAreaRef.current

      const trackWidth = scrollbarArea.clientWidth - MARGIN * 2
      const thumbWidth = scrollbar.offsetWidth
      const maxScrollLeft = content.scrollWidth - container.clientWidth

      // Calculate the new left position for the scrollbar within the bounds
      let newLeft =
        event.clientX -
        scrollbarArea.getBoundingClientRect().left -
        thumbWidth / 2
      newLeft = Math.max(
        MARGIN,
        Math.min(newLeft, trackWidth + MARGIN - thumbWidth)
      )

      // Calculate the scroll ratio
      const scrollRatio = (newLeft - MARGIN) / (trackWidth - thumbWidth)
      const boundedThumbLeft = Math.min(
        newLeft,
        trackWidth + MARGIN - thumbWidth
      )

      // Set the thumb position
      scrollbar.style.left = `${boundedThumbLeft}px`
      container.scrollLeft = scrollRatio * maxScrollLeft

      // Update the dots based on the scroll position
      updateDots(scrollRatio)
    }

    const onMouseUp = () => {
      isDragging.current = false
    }

    // Add event listeners for mouse movement and release
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)

    // Clean up the event listeners when the component is unmounted
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const onMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true
    event.preventDefault()
  }

  return (
    <div className="relative mx-auto h-full w-[1000px]">
      <div ref={containerRef} className="container mx-auto">
        <div ref={contentRef} className="content flex gap-4">
          <div className="h-[200px] w-[400px] bg-red-200"></div>
          <div className="h-[200px] w-[400px] bg-red-200"></div>
          <div className="h-[200px] w-[400px] bg-red-200"></div>
          <div className="h-[200px] w-[400px] bg-blue-200"></div>
          <div className="h-[200px] w-[400px] bg-blue-200"></div>
          <div className="h-[200px] w-[400px] bg-blue-200"></div>
          <div className="h-[200px] w-[400px] bg-yellow-200"></div>
          <div className="h-[200px] w-[400px] bg-yellow-200"></div>
          <div className="h-[200px] w-[400px] bg-yellow-200"></div>
          <div className="h-[200px] w-[400px] bg-green-200"></div>
          <div className="h-[200px] w-[400px] bg-green-200"></div>
          <div className="h-[200px] w-[400px] bg-green-200"></div>
        </div>
      </div>
      <div
        ref={scrollbarAreaRef}
        className="absolute bottom-0 flex w-full justify-center rounded-full border border-[#E1C3A0] p-6"
        onClick={handleTrackClick}
      >
        <div className="scrollbar-area relative h-5 w-full">
          <div
            ref={dotsRef}
            className="dots flex h-full items-center justify-between"
          >
            <div className="label h-fit">Max Drawdown</div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="label h-fit">Float Profit</div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="label h-fit">Closed Profit</div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="dot h-3 w-3 rounded-full bg-black"></div>
            <div className="label h-fit">Trades Number</div>
          </div>
        </div>
        <div
          ref={scrollbarRef}
          className="scrollbar cursor-pointer"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center justify-between">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
            >
              <path
                d="M12.1992 5.86625L8.57339 9.5L12.1992 13.1337L11.083 14.25L6.33297 9.5L11.083 4.75L12.1992 5.86625Z"
                fill="white"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
            >
              <path
                d="M6.80078 13.1337L10.4266 9.5L6.80078 5.86625L7.91703 4.75L12.667 9.5L7.91703 14.25L6.80078 13.1337Z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
