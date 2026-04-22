import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import * as jsonapi from '../api/jsonapi';

const mockMedia = [
  {
    id: '1',
    name: 'Asset One',
    bundle: 'image' as const,
    thumbnailUrl: '/img/1.jpg',
    fullUrl: '/img/1.jpg',
    downloadUrl: '/img/1.jpg',
    caption: '',
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
  },
  {
    id: '2',
    name: 'Event Photo',
    bundle: 'image' as const,
    thumbnailUrl: '/img/2.jpg',
    fullUrl: '/img/2.jpg',
    downloadUrl: '/img/2.jpg',
    caption: '',
    categoryIds: ['cat-2'],
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
    created: '2025-01-02T00:00:00+00:00',
    videoUrl: '',
  },
];

const mockTaxonomy = [
  { id: 'cat-1', name: 'Brand Assets' },
  { id: 'cat-2', name: 'Events' },
];

beforeEach(() => {
  vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
    items: mockMedia,
    nextUrls: { image: null, video: null, remote_video: null, document: null, audio: null },
  });
  vi.spyOn(jsonapi, 'fetchTaxonomy').mockImplementation((vocab) => {
    if (vocab === 'media_category') return Promise.resolve(mockTaxonomy);
    return Promise.resolve([]);
  });
});

describe('App', () => {
  it('shows loading skeleton then renders media cards', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Asset One')).toBeInTheDocument();
      expect(screen.getByText('Event Photo')).toBeInTheDocument();
    });
  });

  it('passes search query to API via re-fetch (debounced)', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    const spy = vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [mockMedia[1]],
      nextUrls: { image: null, video: null, remote_video: null, document: null, audio: null },
    });

    const searchInput = screen.getByPlaceholderText('Search media…');
    await userEvent.type(searchInput, 'Event');

    await waitFor(
      () => {
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Event' }),
        );
      },
      { timeout: 1000 },
    );
  });

  it('quick access buttons filter by category', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    const spy = vi.spyOn(jsonapi, 'fetchMediaFirstPage').mockResolvedValue({
      items: [mockMedia[1]],
      nextUrls: { image: null, video: null, remote_video: null, document: null, audio: null },
    });

    // Quick-access strip renders before the sidebar; take the first match.
    const eventsBtn = screen.getAllByRole('button', { name: 'Events' })[0];
    await userEvent.click(eventsBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ categoryIds: new Set(['cat-2']) }),
      );
    });
  });

  it('opens lightbox when card is clicked', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    await userEvent.click(screen.getByText('Asset One'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes lightbox on Escape key', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    await userEvent.click(screen.getByText('Asset One'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
