import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSidebar } from '../../components/FilterSidebar';
import { emptyFilters, emptyVisibleIds } from '../../types/media';
import type { TaxonomyData, VisibleIds } from '../../types/media';

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

// visibleIds containing all term IDs from the taxonomy fixture above.
const allVisible: VisibleIds = {
  ...emptyVisibleIds(),
  categoryIds: new Set(['cat-1', 'cat-2']),
  tagIds: new Set(['tag-1']),
  licenseIds: new Set(['lic-1']),
  bundles: new Set(['image']),
};

describe('FilterSidebar', () => {
  it('renders all non-empty filter groups', () => {
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
  });

  it('renders taxonomy term labels', () => {
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Brand Assets')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
  });

  it('hides terms not present in visibleIds when not loading', () => {
    const partial: VisibleIds = {
      ...emptyVisibleIds(),
      categoryIds: new Set(['cat-1']), // cat-2 not visible
      tagIds: new Set(['tag-1']),
      licenseIds: new Set(['lic-1']),
    };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={partial}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Brand Assets')).toBeInTheDocument();
    expect(screen.queryByText('Events')).not.toBeInTheDocument();
  });

  it('shows all terms while loading regardless of visibleIds', () => {
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={emptyVisibleIds()}
        loading={true}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Brand Assets')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('keeps a selected term visible even if not in visibleIds', () => {
    const filters = { ...emptyFilters(), categoryIds: new Set(['cat-2']) };
    const partial: VisibleIds = { ...emptyVisibleIds(), categoryIds: new Set(['cat-1']) };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={filters}
        visibleIds={partial}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('calls onFilterChange with toggled category ID when label clicked', async () => {
    const onChange = vi.fn();
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Brand Assets'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: new Set(['cat-1']) }),
    );
  });

  it('deselects a category that is already selected', async () => {
    const onChange = vi.fn();
    const filters = { ...emptyFilters(), categoryIds: new Set(['cat-1']) };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={filters}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Brand Assets'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: new Set() }),
    );
  });

  it('shows "Clear all" button only when filters are active', () => {
    const { rerender } = render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();

    rerender(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={{ ...emptyFilters(), categoryIds: new Set(['cat-1']) }}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('"Clear all" resets all filter sets including technical', async () => {
    const onChange = vi.fn();
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={{
          ...emptyFilters(),
          categoryIds: new Set(['cat-1']),
          tagIds: new Set(['tag-1']),
          orientation: new Set(['landscape']),
          colorModel: new Set(['rgb']),
        }}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Clear all'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: new Set(),
        tagIds: new Set(),
        orientation: new Set(),
        colorModel: new Set(),
        resolutionPreset: new Set(),
        dpi: new Set(),
        watermarked: new Set(),
        fileSize: new Set(),
      }),
    );
  });

  it('collapses and expands a filter group on header click', async () => {
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={allVisible}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Brand Assets')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /category/i }));
    expect(screen.queryByText('Brand Assets')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /category/i }));
    expect(screen.getByText('Brand Assets')).toBeVisible();
  });

  it('shows Technical section with image technical filters when metadata present', () => {
    const withTech: VisibleIds = {
      ...allVisible,
      orientations: new Set(['landscape', 'portrait']),
      colorModels: new Set(['rgb']),
      resolutionPresets: new Set(['fhd', '4k']),
      dpiBuckets: new Set(['web', 'print']),
      watermarkedValues: new Set(['yes', 'no']),
      fileSizes: new Set(['large']),
    };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={withTech}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Orientation')).toBeInTheDocument();
    expect(screen.getByText('Landscape')).toBeInTheDocument();
    expect(screen.getByText('Portrait')).toBeInTheDocument();
    expect(screen.queryByText('Square')).not.toBeInTheDocument(); // not in visibleIds
    expect(screen.getByText('Color Model')).toBeInTheDocument();
    expect(screen.getByText('RGB')).toBeInTheDocument();
    expect(screen.queryByText('CMYK')).not.toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();
    expect(screen.getByText('Full HD (1920–3839 px)')).toBeInTheDocument();
    expect(screen.getByText('4K+ (≥ 3840 px)')).toBeInTheDocument();
    expect(screen.getByText('DPI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /watermarked/i })).toBeInTheDocument();
    expect(screen.getByText('Not watermarked')).toBeInTheDocument();
    expect(screen.getByText('File Size')).toBeInTheDocument();
  });

  it('toggles orientation filter', async () => {
    const onChange = vi.fn();
    const withOrientations: VisibleIds = {
      ...allVisible,
      orientations: new Set(['landscape', 'portrait']),
    };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={withOrientations}
        loading={false}
        onFilterChange={onChange}
      />,
    );
    await userEvent.click(screen.getByText('Landscape'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: new Set(['landscape']) }),
    );
  });

  it('shows Media Type group when bundles are present', () => {
    const withBundles: VisibleIds = {
      ...allVisible,
      bundles: new Set(['image', 'video', 'audio']),
    };
    render(
      <FilterSidebar
        taxonomy={taxonomy}
        filters={emptyFilters()}
        visibleIds={withBundles}
        loading={false}
        onFilterChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Media Type')).toBeInTheDocument();
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.queryByText('Document')).not.toBeInTheDocument();
  });
});
