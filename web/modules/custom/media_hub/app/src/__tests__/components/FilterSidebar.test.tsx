import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSidebar } from '../../components/FilterSidebar';
import { emptyFilters } from '../../types/media';
import type { TaxonomyData } from '../../types/media';

const taxonomy: TaxonomyData = {
  categories: [
    { id: 'cat-1', name: 'Brand Assets' },
    { id: 'cat-2', name: 'Events' },
  ],
  tags: [{ id: 'tag-1', name: 'CEO' }],
  licenses: [{ id: 'lic-1', name: 'Public' }],
  locations: [],
  assetTypes: [],
  graphicalElements: [],
  peopleFeatured: [],
  publications: [],
  sites: [],
  solutionSegments: [],
  themes: [],
};

describe('FilterSidebar', () => {
  it('renders all non-empty filter groups', () => {
    render(
      <FilterSidebar taxonomy={taxonomy} filters={emptyFilters()} onFilterChange={vi.fn()} />,
    );
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    // Locations is empty — should not render
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
  });

  it('renders taxonomy term labels', () => {
    render(
      <FilterSidebar taxonomy={taxonomy} filters={emptyFilters()} onFilterChange={vi.fn()} />,
    );
    expect(screen.getByText('Brand Assets')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
  });

  it('calls onFilterChange with toggled category ID when label clicked', async () => {
    const onChange = vi.fn();
    render(
      <FilterSidebar taxonomy={taxonomy} filters={emptyFilters()} onFilterChange={onChange} />,
    );

    await userEvent.click(screen.getByText('Brand Assets'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: new Set(['cat-1']) }),
    );
  });

  it('deselects a category that is already selected', async () => {
    const onChange = vi.fn();
    const filters = { ...emptyFilters(), categoryIds: new Set(['cat-1']) };
    render(<FilterSidebar taxonomy={taxonomy} filters={filters} onFilterChange={onChange} />);

    await userEvent.click(screen.getByText('Brand Assets'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: new Set() }),
    );
  });

  it('shows "Clear all" button only when filters are active', () => {
    const { rerender } = render(
      <FilterSidebar taxonomy={taxonomy} filters={emptyFilters()} onFilterChange={vi.fn()} />,
    );
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();

    rerender(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={{ ...emptyFilters(), categoryIds: new Set(['cat-1']) }}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('"Clear all" resets all filter sets', async () => {
    const onChange = vi.fn();
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={{
          ...emptyFilters(),
          categoryIds: new Set(['cat-1']),
          tagIds: new Set(['tag-1']),
        }}
        onFilterChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText('Clear all'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: new Set(),
        tagIds: new Set(),
        licenseIds: new Set(),
        locationIds: new Set(),
      }),
    );
  });

  it('collapses and expands a filter group on header click', async () => {
    render(
      <FilterSidebar taxonomy={taxonomy} filters={emptyFilters()} onFilterChange={vi.fn()} />,
    );

    expect(screen.getByText('Brand Assets')).toBeVisible();

    // Click the "Category" header button to collapse
    await userEvent.click(screen.getByRole('button', { name: /category/i }));
    expect(screen.queryByText('Brand Assets')).not.toBeInTheDocument();

    // Click again to expand
    await userEvent.click(screen.getByRole('button', { name: /category/i }));
    expect(screen.getByText('Brand Assets')).toBeVisible();
  });
});
