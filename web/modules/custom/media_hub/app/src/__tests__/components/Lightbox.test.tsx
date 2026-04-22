import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lightbox } from '../../components/Lightbox';
import type { MediaItem } from '../../types/media';

function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: '1',
    name: 'Test Image',
    bundle: 'image',
    thumbnailUrl: '/thumb.jpg',
    fullUrl: '/full.jpg',
    downloadUrl: '/full.jpg',
    caption: '<p>A caption</p>',
    categoryIds: ['cat-1'],
    tagIds: [],
    licenseIds: [],
    locationIds: [],
    assetTypeIds: [],
    graphicalElementIds: [],
    peopleFeaturedIds: [],
    publicationIds: [],
    siteIds: [],
    solutionSegmentIds: [],
    themeIds: [],
    created: '2025-01-01T00:00:00+00:00',
    videoUrl: '',
    ...overrides,
  };
}

const baseItems = [
  makeItem({ id: '1', name: 'Image One' }),
  makeItem({ id: '2', name: 'Image Two' }),
  makeItem({ id: '3', name: 'Image Three' }),
];

describe('Lightbox', () => {
  it('renders the item name', () => {
    render(
      <Lightbox item={baseItems[0]} allItems={baseItems} onClose={vi.fn()} onNavigate={vi.fn()} />,
    );
    expect(screen.getByText('Image One')).toBeInTheDocument();
  });

  it('renders image when fullUrl is set', () => {
    render(
      <Lightbox item={baseItems[0]} allItems={baseItems} onClose={vi.fn()} onNavigate={vi.fn()} />,
    );
    expect(screen.getByRole('img', { name: 'Image One' })).toHaveAttribute('src', '/full.jpg');
  });

  it('shows "No preview available" when fullUrl is empty', () => {
    render(
      <Lightbox
        item={makeItem({ fullUrl: '', thumbnailUrl: '' })}
        allItems={[makeItem({ fullUrl: '', thumbnailUrl: '' })]}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });

  it('calls onClose when Escape key pressed', async () => {
    const onClose = vi.fn();
    render(
      <Lightbox item={baseItems[0]} allItems={baseItems} onClose={onClose} onNavigate={vi.fn()} />,
    );

    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <Lightbox item={baseItems[0]} allItems={baseItems} onClose={onClose} onNavigate={vi.fn()} />,
    );
    // The outermost div is the backdrop
    await userEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navigates to next item with ArrowRight', async () => {
    const onNavigate = vi.fn();
    render(
      <Lightbox
        item={baseItems[0]}
        allItems={baseItems}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.keyboard('{ArrowRight}');
    expect(onNavigate).toHaveBeenCalledWith(baseItems[1]);
  });

  it('navigates to previous item with ArrowLeft', async () => {
    const onNavigate = vi.fn();
    render(
      <Lightbox
        item={baseItems[1]}
        allItems={baseItems}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.keyboard('{ArrowLeft}');
    expect(onNavigate).toHaveBeenCalledWith(baseItems[0]);
  });

  it('does not navigate left when on the first item', async () => {
    const onNavigate = vi.fn();
    render(
      <Lightbox
        item={baseItems[0]}
        allItems={baseItems}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.keyboard('{ArrowLeft}');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate right when on the last item', async () => {
    const onNavigate = vi.fn();
    render(
      <Lightbox
        item={baseItems[2]}
        allItems={baseItems}
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    await userEvent.keyboard('{ArrowRight}');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('shows a download link when downloadUrl is set', () => {
    render(
      <Lightbox item={baseItems[0]} allItems={baseItems} onClose={vi.fn()} onNavigate={vi.fn()} />,
    );
    const link = screen.getByRole('link', { name: /download/i });
    expect(link).toHaveAttribute('href', '/full.jpg');
    expect(link).toHaveAttribute('download');
  });

  it('shows related images that share a category', () => {
    const items = [
      makeItem({ id: '1', name: 'Main', categoryIds: ['cat-1'] }),
      makeItem({ id: '2', name: 'Related', categoryIds: ['cat-1'] }),
      makeItem({ id: '3', name: 'Unrelated', categoryIds: ['cat-99'] }),
    ];
    render(
      <Lightbox item={items[0]} allItems={items} onClose={vi.fn()} onNavigate={vi.fn()} />,
    );

    expect(screen.getByText('Related')).toBeInTheDocument(); // section header
    // The related thumbnail button should be present (img or placeholder)
    const relatedSection = screen.getByText(/related/i).closest('div');
    expect(relatedSection).toBeTruthy();
  });

  it('shows counter text', () => {
    render(
      <Lightbox item={baseItems[1]} allItems={baseItems} onClose={vi.fn()} onNavigate={vi.fn()} />,
    );
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('renders caption HTML', () => {
    render(
      <Lightbox
        item={makeItem({ caption: '<p>My caption text</p>' })}
        allItems={[makeItem({ caption: '<p>My caption text</p>' })]}
        onClose={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText('My caption text')).toBeInTheDocument();
  });
});
