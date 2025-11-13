export const useTypeWriter = (targetElement: Ref<HTMLElement | null>) => {
  const words = ['critical', 'constructive', 'creative']
  const wordIndex = ref(0)
  const characterIndex = ref(0)
  const deleting = ref(false)
  const isActive = ref(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const currentWord = computed(() => words[wordIndex.value % words.length])

  const typeNextFrame = () => {
    if (!targetElement.value || !isActive.value) return

    const currentWordValue = currentWord.value

    if (!deleting.value) {
      characterIndex.value += 1
      if (targetElement.value) {
        targetElement.value.textContent = currentWordValue.slice(
          0,
          characterIndex.value
        )
      }

      if (characterIndex.value === currentWordValue.length) {
        deleting.value = true
        timeoutId = setTimeout(() => {
          typeNextFrame()
        }, 1600)
        return
      }
    } else {
      characterIndex.value -= 1
      if (targetElement.value) {
        targetElement.value.textContent = currentWordValue.slice(
          0,
          characterIndex.value
        )
      }

      if (characterIndex.value === 0) {
        deleting.value = false
        wordIndex.value += 1
      }
    }

    const delay = deleting.value ? 45 : 90
    timeoutId = setTimeout(() => {
      typeNextFrame()
    }, delay)
  }

  const start = () => {
    if (!targetElement.value) return
    isActive.value = true
    timeoutId = setTimeout(() => {
      typeNextFrame()
    }, 400)
  }

  const stop = () => {
    isActive.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  onMounted(() => {
    if (targetElement.value) {
      start()
    } else {
      watch(
        targetElement,
        (newValue) => {
          if (newValue && !isActive.value) {
            start()
          }
        },
        { immediate: true }
      )
    }
  })

  onUnmounted(() => {
    stop()
  })

  return {
    start,
    stop,
    isActive: readonly(isActive),
  }
}

