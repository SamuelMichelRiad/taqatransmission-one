import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaCard } from '../../components/MediaCard';
import type { MediaItem } from '../../types/media';

const categoryNames = new Map([['cat-1', 'Brand Assets']]);

function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: '1',
    name: 'My Photo',
    bundle: 'image',
    thumbnailUrl: '/thumb.jpg',
    fullUrl: '/full.jpg',
    downloadUrl: '/full.jpg',
    caption: '',
    categoryIds: ['cat-1'],
    tagIds: [],
    licenseIds: [],
    locationIds: [],
    created: '2025-01-01T00:00:00+00:00',
    videoUrl: '',
    ...overrides,
  };
}

describe('MediaCard', () => {
  it('renders the item name', () => {
    render(<MediaCard item={makeItem()} categoryNames={categoryNames} onClick={vi.fn()} />);
    expect(screen.getByText('My Photo')).toBeInTheDocument();
  });

  it('renders thumbnail image when thumbnailUrl is set', () => {
    render(<MediaCard item={makeItem()} categoryNames={categoryNames} onClick={vi.fn()} />);
    expect(screen.getByRole('img', { name: 'My Photo' })).toHaveAttribute('src', '/thumb.jpg');
  });

  it('renders placeholder when thumbnailUrl is empty', () => {
    render(
      <MediaCard
        item={makeItem({ thumbnailUrl: '' })}
        categoryNames={categoryNames}
        onClick={vi.fn()}
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('displays first category badge', () => {
    render(<MediaCard item={makeItem()} categoryNames={categoryNames} onClick={vi.fn()} />);
    expect(screen.getByText('Brand Assets')).toBeInTheDocument();
  });

  it('calls onClick with the item when clicked', async () => {
    const onClick = vi.fn();
    const item = makeItem();
    render(<MediaCard item={item} categoryNames={categoryNames} onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(item);
  });

  it('shows video play icon for video bundle', () => {
    render(
      <MediaCard
        item={makeItem({ bundle: 'video', thumbnailUrl: '/thumb.jpg' })}
        categoryNames={categoryNames}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText('▶')).toBeInTheDocument();
  });
});
