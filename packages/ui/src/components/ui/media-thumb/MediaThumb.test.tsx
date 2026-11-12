import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { VolumeOffIcon } from '../../icons'
import { MediaThumb } from './MediaThumb'
import { MediaThumbBadge } from './MediaThumbBadge'

const POSTER = { uri: 'https://example.test/poster.jpg' }

// jsdom never loads an image; this stand-in fails every load, as a broken URL would.
class FailingImage {
  onerror: ((event: unknown) => void) | null = null
  onload: ((event: unknown) => void) | null = null
  set src(_uri: string) {
    setTimeout(() => this.onerror?.({ type: 'error' }), 0)
  }
}

// react-native-web pairs each labelled Image with a hidden <img alt>, which a role query also counts.
function framesNamed(container: HTMLElement, name: string) {
  return container.querySelectorAll(`[role="img"][aria-label="${name}"]`)
}

function badges() {
  return {
    bottomStart: <MediaThumbBadge accessibilityLabel="No sound" icon={VolumeOffIcon} />,
    bottomEnd: <MediaThumbBadge accessibilityLabel="Length 4:12">4:12</MediaThumbBadge>,
  }
}

describe('MediaThumb', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('draws the frame at the 16:9 default aspect', () => {
    const { container } = render(<MediaThumb source={POSTER} accessibilityLabel="Poster" />)

    expect(framesNamed(container, 'Poster')).toHaveLength(1)
    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe(String(16 / 9))
  })

  it('takes an arbitrary aspect', () => {
    const { container } = render(<MediaThumb source={POSTER} aspect={9 / 16} />)

    expect((container.firstChild as HTMLElement).style.aspectRatio).toBe(String(9 / 16))
  })

  it('letterboxes a contain-blur frame on a blurred copy of itself', () => {
    const { container } = render(
      <MediaThumb source={POSTER} fit="contain-blur" accessibilityLabel="Poster" />
    )

    expect(framesNamed(container, 'Poster')).toHaveLength(1)
    expect(container.querySelector('[style*="blur"]')).not.toBeNull()
  })

  it('shows the play plane when there is no source', () => {
    render(<MediaThumb accessibilityLabel="Untitled video" />)

    expect(screen.getByTestId('media-thumb-no-source')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Untitled video' })).toBeInTheDocument()
  })

  it('falls back to the play plane when the image fails to load', async () => {
    vi.stubGlobal('Image', FailingImage)
    render(<MediaThumb source={{ uri: 'https://example.test/broken.jpg' }} {...badges()} />)

    await waitFor(() => expect(screen.getByTestId('media-thumb-no-source')).toBeInTheDocument())
    expect(screen.getByRole('img', { name: 'Length 4:12' })).toBeInTheDocument()
  })

  it('shows a skeleton and no badges while loading', () => {
    render(<MediaThumb isLoading source={POSTER} {...badges()} />)

    expect(screen.getByRole('progressbar', { name: 'Loading media' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'No sound' })).toBeNull()
  })

  it('reads each badge by its label, not its glyph or digits', () => {
    render(
      <MediaThumb
        source={POSTER}
        topStart={<MediaThumbBadge accessibilityLabel="Draft">Draft</MediaThumbBadge>}
        {...badges()}
      />
    )

    expect(screen.getByRole('img', { name: 'Length 4:12' })).toHaveTextContent('4:12')
    expect(screen.getByRole('img', { name: 'No sound' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Draft' })).toBeInTheDocument()
  })

  it.each([
    [
      'with a frame and badges',
      <MediaThumb key="f" source={POSTER} accessibilityLabel="Poster" {...badges()} />,
    ],
    ['contain-blur', <MediaThumb key="c" source={POSTER} fit="contain-blur" {...badges()} />],
    ['with no source', <MediaThumb key="n" {...badges()} />],
    ['loading', <MediaThumb key="l" isLoading />],
  ])('has no accessibility violations %s', async (_name, element) => {
    const { container } = render(element)

    expect(await axe(container)).toHaveNoViolations()
  })
})
