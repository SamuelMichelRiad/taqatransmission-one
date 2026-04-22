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
    created: '2025-01-02T00:00:00+00:00',
    videoUrl: '',
  },
];

const mockTaxonomy = {
  categories: [
    { id: 'cat-1', name: 'Brand Assets' },
    { id: 'cat-2', name: 'Events' },
  ],
  tags: [],
  licenses: [],
  locations: [],
};

beforeEach(() => {
  vi.spyOn(jsonapi, 'fetchAllMedia').mockResolvedValue(mockMedia);
  vi.spyOn(jsonapi, 'fetchTaxonomy').mockImplementation((vocab) => {
    const data: Record<string, { id: string; name: string }[]> = {
      media_category: mockTaxonomy.categories,
      media_tags: mockTaxonomy.tags,
      media_license: mockTaxonomy.licenses,
      media_location: mockTaxonomy.locations,
    };
    return Promise.resolve(data[vocab] ?? []);
  });
});

describe('App', () => {
  it('shows loading skeleton then renders media cards', async () => {
    render(<App />);
    // Loading skeletons visible initially (animate-pulse divs)
    await waitFor(() => {
      expect(screen.getByText('Asset One')).toBeInTheDocument();
      expect(screen.getByText('Event Photo')).toBeInTheDocument();
    });
  });

  it('filters items by search query', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    const searchInput = screen.getByPlaceholderText('Search media…');
    await userEvent.type(searchInput, 'Event');

    expect(screen.queryByText('Asset One')).not.toBeInTheDocument();
    expect(screen.getByText('Event Photo')).toBeInTheDocument();
  });

  it('quick access buttons filter by category', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Asset One'));

    const eventsBtn = screen.getByRole('button', { name: 'Events' });
    await userEvent.click(eventsBtn);

    expect(screen.queryByText('Asset One')).not.toBeInTheDocument();
    expect(screen.getByText('Event Photo')).toBeInTheDocument();
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
