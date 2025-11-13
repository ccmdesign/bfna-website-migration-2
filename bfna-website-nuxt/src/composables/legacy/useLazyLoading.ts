import { useIntersectionObserver } from '@vueuse/core'

const WORKSTREAM_LIST = [
  'democracy',
  'future-leadership',
  'digital-world',
  'politics-society',
  'podcasts',
]

export const useLazyLoading = () => {
  const hydrateImage = (image: HTMLImageElement | null) => {
    if (!image) return

    const src = image.getAttribute('data-src')
    if (src) {
      image.setAttribute('src', src)
      image.removeAttribute('data-src')
    }

    const srcset = image.getAttribute('data-srcset')
    if (srcset) {
      image.setAttribute('srcset', srcset)
      image.removeAttribute('data-srcset')
    }
  }

  const useLazyImage = (target: Ref<HTMLElement | null>) => {
    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting && target.value) {
          const img = target.value.querySelector('img')
          if (img) {
            hydrateImage(img)
          }
          stop()
        }
      },
      {
        threshold: 0.1,
      }
    )
  }

  const useLazyCard = (
    target: Ref<HTMLElement | null>,
    onVisible?: () => void
  ) => {
    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting && target.value) {
          const image = target.value.querySelector('figure > img')
          if (image) {
            hydrateImage(image as HTMLImageElement)
          }
          if (onVisible) {
            onVisible()
          }
          stop()
        }
      },
      {
        threshold: 0.1,
      }
    )
  }

  const getWorkstreams = (): string[] => {
    if (process.client) {
      const stored = sessionStorage.getItem('cardFilter')
      const list = stored ? JSON.parse(stored) : []
      return list && list.length > 0 ? list : WORKSTREAM_LIST
    }
    return WORKSTREAM_LIST
  }

  return {
    hydrateImage,
    useLazyImage,
    useLazyCard,
    getWorkstreams,
  }
}

