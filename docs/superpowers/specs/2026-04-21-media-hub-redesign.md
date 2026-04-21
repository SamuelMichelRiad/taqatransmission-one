# Media Hub Redesign — Design Spec

**Date:** 2026-04-21
**Audience:** Internal staff only
**Implementation approach:** New `media_hub` custom Drupal module (Option A)
**Brand colors:**
- Orange: `rgb(255, 95, 0)` / `#FF5F00`
- Light blue: `rgb(8, 158, 209)` / `#089ED1`
- Dark navy: `rgb(0, 9, 63)` / `#00093F`

---

## 1. Architecture

A new module `web/modules/custom/media_hub/` owns all Media Hub presentation logic. The existing `oneservices` module is not modified.

### Module contents

| Path | Purpose |
|---|---|
| `media_hub.info.yml` | Module definition |
| `media_hub.module` | Hook implementations (theme, preprocess) |
| `media_hub.routing.yml` | Custom routes |
| `media_hub.libraries.yml` | CSS/JS library declaration |
| `src/Controller/MediaHubController.php` | Page controller + related images JSON endpoint |
| `templates/media-hub-page.html.twig` | Page template (hero + quick access + view embed) |
| `templates/media-hub-card.html.twig` | Per-item card template override |
| `css/media-hub.css` | Scoped styles (applied only on /media-hub) |
| `js/media-hub.js` | Lightbox, filters, chips, hover, collapsibles |
| `config/install/` | Image styles, responsive image mapping |

### Custom routes

- `GET /media-hub` — main page (page controller renders hero + quick access, embeds View)
- `GET /media-hub/related/{media_id}` — JSON endpoint returning 3 related media items (same category + shared tag, falls back to same category only)

---

## 2. Page Structure

The `/media-hub` page renders three vertical zones:

### 2a. Hero Banner
- Full-width dark navy block with diagonal orange accent on the right
- "MEDIA HUB" heading in white, bold, uppercase
- Search bar below the heading (white background, magnifier icon)
- Implemented as a Twig block injected above the View via the page controller
- The search bar submits to the View's keyword filter via AJAX

### 2b. Quick Access
- Four image cards in a row: Assets, Events, People, Videos
- Each card links to `/media-hub?f[0]=category:{Term}`, pre-filtering the gallery below
- Thumbnail images are configurable; initial placeholders use brand color gradients
- Section title "Quick Access" in orange, uppercase

### 2c. Gallery + Sidebar
- Two-column layout: gallery (main) + filter sidebar (260px, right)
- "Gallery" section title in orange, uppercase
- Result count top-right: "X results" (Views Result Summary header)
- Active filter chips row above the grid — chips generated from current URL query params, each with × to remove
- 6-column thumbnail grid (desktop), responsive down to 2 columns (mobile)
- Pagination row below grid — current page in light blue, no boxed style on inactive pages

---

## 3. Filter Sidebar

Four collapsible groups. All start expanded. Dark navy header with light blue chevron toggle. Filter changes fire AJAX via Better Exposed Filters auto-submit.

| Group | Field | Widget | Options |
|---|---|---|---|
| Category | `field_media_category` | Radio | People, Events, Assets, Press Release |
| License & Usage | `field_media_license` | Radio | Internal, External, Public, Editorial |
| Media Type | `bundle` + `field_media_asset_type` | Radio | IMAGE, VIDEO, DOCUMENT, JPEG, PNG, PPT |
| Tags | `field_media_tags` | Multi-select pills | All tag terms; active = light blue |

- Caption filter removed from sidebar entirely
- "Reset" text link in light blue at the bottom of Tags group clears all filters
- Collapsible behaviour: JS toggles a CSS class; no Drupal form rebuild needed

### Fifth filter group — More Filters (collapsible, starts collapsed)
A fifth group "More Filters" contains the remaining taxonomy fields, collapsed by default to keep the sidebar clean:

| Sub-filter | Field |
|---|---|
| Location | `field_media_location` |
| Theme | `field_media_theme` |
| Asset Type | `field_media_asset_type` |
| Solution Segment | `field_media_solution_segment` |
| People Featured | `field_media_people_featured` |

Each rendered as a multi-select pill group matching the Tags style.

### Sort options
A sort dropdown added to the View exposed form: Newest (default), Oldest, Name A–Z.

---

## 4. Lightbox Popup

Clicking any thumbnail opens a full-screen overlay without page navigation.

### Layout
Two-column overlay:
- **Left (image area):** large image, left/right nav arrows, caption bar, related images
- **Right (filter sidebar):** search bar + same four collapsible filter groups, dark-themed

### Left column details
- Image rendered at full available height
- Previous/Next arrows navigate within the current filtered result set (order matches gallery)
- Caption bar: caption text (left) + Download button in orange (right)
  - Download links directly to the original file
  - No Download button for remote video items
- Related Images: 3 thumbnails fetched from `/media-hub/related/{media_id}` on open
  - Logic: same category + at least one shared tag; falls back to same category if no tag overlap
  - Clicking a related thumbnail swaps the lightbox to that item

### Close behaviour
- × button (top right) or Escape key closes the lightbox
- Gallery scroll position is restored on close

### Media type variants in lightbox
| Type | Behaviour |
|---|---|
| Image | Large image + caption + Download |
| Local video | Embedded video player + Download |
| Remote video | Iframe embed (YouTube/Vimeo); no Download button |
| Document | File icon + filename + file size + Download button |
| Audio | Audio player + Download button |

### Right column (popup sidebar)
- Same four filter groups, dark-themed (navy background)
- Search bar at top
- Changing a filter closes the lightbox and reloads the gallery with the new filter

---

## 5. Responsive Image Styles & Card Variants

### New image styles
Three new image styles, each with scale + WebP conversion:

| Style name | Dimensions | Use |
|---|---|---|
| `media_hub_small` | 180×180 | Mobile (1–2 columns) |
| `media_hub_medium` | 220×220 | Tablet (3–4 columns) |
| `media_hub_large` | 280×280 | Desktop (6 columns) |

A new responsive image mapping `media_hub_grid` maps these to breakpoints and is assigned to the View's image field, serving the correct size via `srcset`.

### Card hover overlays (per type)
| Type | At rest | On hover |
|---|---|---|
| Image | Plain thumbnail | Dark navy overlay (55% opacity) + title + Download button |
| Video (local) | Thumbnail + play icon badge | Overlay + title + Download button |
| Remote video | Thumbnail + play icon badge | Overlay + title + Play button |
| Document | Thumbnail + file type badge (PDF/PPT/etc.) | Overlay + filename + Download button |
| Audio | Placeholder + waveform icon badge | Overlay + title + Download button |

---

## 6. Configuration Changes

All exported to `web/sites/default/config/.../sync/` as YAML, applied via `drush config:import`.

| Config | Change |
|---|---|
| `image.style.media_hub_small.yml` | New — 180×180 + WebP |
| `image.style.media_hub_medium.yml` | New — 220×220 + WebP |
| `image.style.media_hub_large.yml` | New — 280×280 + WebP |
| `responsive_image.styles.media_hub_grid.yml` | New — srcset mapping |
| `views.view.media_center.yml` | Remove Caption filter; add sort (Newest/Oldest/Name); add Result Summary header; update image style to responsive |
| `facets.facet.*.yml` | Update Category, License, Media Type, Tags facets; delete Caption facet |
| `block.block.olivero_exposedformmedia_centerpage_1.yml` | Update filter list to match new groups |

---

## 7. Scope Boundaries

**In scope:**
- New `media_hub` module with all features above
- Config YAML exports for image styles, view, facets, blocks
- Scoped CSS/JS (no global theme changes)

**Out of scope:**
- Solr search backend
- Any changes to other pages or the Olivero theme globally
- User authentication / access control changes (site already restricted to internal staff)
- Mobile app or API consumers
