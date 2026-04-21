# Media Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `media_hub` Drupal module that redesigns /media-hub with a hero banner, quick-access cards, collapsible filter sidebar, type-differentiated hover cards, a lightbox popup with related images, and responsive image styles.

**Architecture:** A new custom module at `web/modules/custom/media_hub/` owns all presentation logic. Config changes (image styles, Search API index, view filters, sorts) are exported as YAML to the sync directory and applied via `drush config:import`. The existing view route at `/media-hub` is kept; the module injects additional content via Drupal hooks and template overrides. The `oneservices` module is not modified.

**Tech Stack:** Drupal 11, PHP 8.2, Search API (db_server), facets_exposed_filters, Better Exposed Filters, Views, Olivero theme, Vanilla JS, CSS custom properties.

**Config sync dir** (referred to as `$SYNC` in all tasks):
```
web/sites/default/config/config_Wcf9u2KYrq7qwFLiKrqzo9rn5wtHpZNGjarzrhgljogItOdH2td1jOH8mDhB2L3luORP_P7KDQ/sync
```

**Run all Drush commands from:** `/Users/samuel/Documents/GitHub/taqatransmission-one`

---

## File Map

### New — module files
| Path | Purpose |
|---|---|
| `web/modules/custom/media_hub/media_hub.info.yml` | Module definition |
| `web/modules/custom/media_hub/media_hub.module` | Hooks: preprocess, theme, page_attachments |
| `web/modules/custom/media_hub/media_hub.routing.yml` | Route for /media-hub/related/{media_id} |
| `web/modules/custom/media_hub/media_hub.libraries.yml` | CSS/JS library |
| `web/modules/custom/media_hub/src/Controller/MediaHubController.php` | Related images JSON endpoint |
| `web/modules/custom/media_hub/templates/views-view--media-center.html.twig` | Page wrapper: hero + quick access + view |
| `web/modules/custom/media_hub/templates/views-view-field--media-center--thumbnail.html.twig` | Card with hover overlay |
| `web/modules/custom/media_hub/css/media-hub.css` | All scoped styles |
| `web/modules/custom/media_hub/js/media-hub.js` | Lightbox, chips, collapsibles |
| `web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php` | Unit test for related logic |

### New — config YAML (in $SYNC)
- `image.style.media_hub_small.yml`
- `image.style.media_hub_medium.yml`
- `image.style.media_hub_large.yml`
- `responsive_image.styles.media_hub_grid.yml`

### Modified — config YAML (in $SYNC)
- `search_api.index.media_index.yml` — add 6 new fields (created + 5 taxonomy fields)
- `views.view.media_center.yml` — remove caption filter, add sorts, add 5 new facet filters, update thumbnail image style to responsive
- `block.block.olivero_exposedformmedia_centerpage_1.yml` — update visible filter list

---

## Task 1: Module Scaffold

**Files:**
- Create: `web/modules/custom/media_hub/media_hub.info.yml`
- Create: `web/modules/custom/media_hub/media_hub.module`
- Create: `web/modules/custom/media_hub/media_hub.routing.yml`
- Create: `web/modules/custom/media_hub/media_hub.libraries.yml`
- Create: `web/modules/custom/media_hub/css/media-hub.css`
- Create: `web/modules/custom/media_hub/js/media-hub.js`

- [ ] **Step 1: Create module directory**

```bash
mkdir -p web/modules/custom/media_hub/src/Controller
mkdir -p web/modules/custom/media_hub/templates
mkdir -p web/modules/custom/media_hub/css
mkdir -p web/modules/custom/media_hub/js
mkdir -p web/modules/custom/media_hub/tests/src/Unit
```

- [ ] **Step 2: Create media_hub.info.yml**

```yaml
# web/modules/custom/media_hub/media_hub.info.yml
name: 'Media Hub'
type: module
description: 'Redesigned Media Hub page with hero, quick access, collapsible filters, lightbox, and responsive images.'
package: Custom
core_version_requirement: ^11
dependencies:
  - drupal:media
  - drupal:views
  - drupal:search_api
  - drupal:responsive_image
  - better_exposed_filters:better_exposed_filters
  - facets:facets_exposed_filters
```

- [ ] **Step 3: Create media_hub.libraries.yml**

```yaml
# web/modules/custom/media_hub/media_hub.libraries.yml
media_hub:
  version: 1.0
  css:
    theme:
      css/media-hub.css: {}
  js:
    js/media-hub.js: {}
  dependencies:
    - core/drupal
    - core/jquery
    - core/once
```

- [ ] **Step 4: Create media_hub.routing.yml**

```yaml
# web/modules/custom/media_hub/media_hub.routing.yml
media_hub.related:
  path: '/media-hub/related/{media_id}'
  defaults:
    _controller: '\Drupal\media_hub\Controller\MediaHubController::related'
    _title: 'Related Media'
  requirements:
    _permission: 'access content'
    media_id: '\d+'
  methods: [GET]
```

- [ ] **Step 5: Create empty css/media-hub.css and js/media-hub.js**

```css
/* web/modules/custom/media_hub/css/media-hub.css */
/* Populated in Task 7 */
```

```js
// web/modules/custom/media_hub/js/media-hub.js
// Populated in Task 8
```

- [ ] **Step 6: Create media_hub.module stub**

```php
<?php
// web/modules/custom/media_hub/media_hub.module

/**
 * @file
 * Media Hub module hooks.
 */

use Drupal\Core\Routing\RouteMatchInterface;

/**
 * Implements hook_theme().
 */
function media_hub_theme(): array {
  return [];
}

/**
 * Implements hook_page_attachments().
 */
function media_hub_page_attachments(array &$attachments): void {
  $route = \Drupal::routeMatch()->getRouteName();
  if ($route === 'view.media_center.page_1') {
    $attachments['#attached']['library'][] = 'media_hub/media_hub';
  }
}
```

- [ ] **Step 7: Enable the module**

```bash
vendor/bin/drush en media_hub -y
```

Expected output: `media_hub was enabled successfully.`

- [ ] **Step 8: Commit**

```bash
git add web/modules/custom/media_hub/
git commit -m "feat(media_hub): scaffold module with routing and library"
```

---

## Task 2: Image Style Config Files

**Files:**
- Create: `$SYNC/image.style.media_hub_small.yml`
- Create: `$SYNC/image.style.media_hub_medium.yml`
- Create: `$SYNC/image.style.media_hub_large.yml`
- Create: `$SYNC/responsive_image.styles.media_hub_grid.yml`

- [ ] **Step 1: Create image.style.media_hub_small.yml**

```yaml
# $SYNC/image.style.media_hub_small.yml
langcode: en
status: true
dependencies: {}
name: media_hub_small
label: 'Media Hub small (180×180)'
effects:
  a1b2c3d4-0001-0001-0001-000000000001:
    uuid: a1b2c3d4-0001-0001-0001-000000000001
    id: image_scale_and_crop
    weight: 0
    data:
      width: 180
      height: 180
      anchor: 'center-center'
  a1b2c3d4-0001-0001-0001-000000000002:
    uuid: a1b2c3d4-0001-0001-0001-000000000002
    id: image_convert
    weight: 2
    data:
      extension: webp
```

- [ ] **Step 2: Create image.style.media_hub_medium.yml**

```yaml
# $SYNC/image.style.media_hub_medium.yml
langcode: en
status: true
dependencies: {}
name: media_hub_medium
label: 'Media Hub medium (220×220)'
effects:
  b2c3d4e5-0002-0002-0002-000000000001:
    uuid: b2c3d4e5-0002-0002-0002-000000000001
    id: image_scale_and_crop
    weight: 0
    data:
      width: 220
      height: 220
      anchor: 'center-center'
  b2c3d4e5-0002-0002-0002-000000000002:
    uuid: b2c3d4e5-0002-0002-0002-000000000002
    id: image_convert
    weight: 2
    data:
      extension: webp
```

- [ ] **Step 3: Create image.style.media_hub_large.yml**

```yaml
# $SYNC/image.style.media_hub_large.yml
langcode: en
status: true
dependencies: {}
name: media_hub_large
label: 'Media Hub large (280×280)'
effects:
  c3d4e5f6-0003-0003-0003-000000000001:
    uuid: c3d4e5f6-0003-0003-0003-000000000001
    id: image_scale_and_crop
    weight: 0
    data:
      width: 280
      height: 280
      anchor: 'center-center'
  c3d4e5f6-0003-0003-0003-000000000002:
    uuid: c3d4e5f6-0003-0003-0003-000000000002
    id: image_convert
    weight: 2
    data:
      extension: webp
```

- [ ] **Step 4: Create responsive_image.styles.media_hub_grid.yml**

```yaml
# $SYNC/responsive_image.styles.media_hub_grid.yml
langcode: en
status: true
dependencies:
  config:
    - image.style.media_hub_small
    - image.style.media_hub_medium
    - image.style.media_hub_large
name: media_hub_grid
label: 'Media Hub Grid'
breakpoint_group: responsive_image
fallback_image_style: media_hub_large
image_style_mappings:
  - image_mapping_type: image_style
    image_mapping: media_hub_small
    breakpoint_id: responsive_image.viewport_sizing
    multiplier: 1x
```

- [ ] **Step 5: Import config and verify**

```bash
vendor/bin/drush config:import -y
```

Expected: no errors. Then verify:

```bash
vendor/bin/drush image-style:list | grep media_hub
```

Expected output includes: `media_hub_small`, `media_hub_medium`, `media_hub_large`

- [ ] **Step 6: Commit**

```bash
git add $SYNC/image.style.media_hub_*.yml $SYNC/responsive_image.styles.media_hub_grid.yml
git commit -m "feat(media_hub): add responsive image styles"
```

---

## Task 3: Update Search API Index

**Files:**
- Modify: `$SYNC/search_api.index.media_index.yml`

The current index has 8 fields. Add `created` (for date sort) plus 5 taxonomy fields for "More Filters".

- [ ] **Step 1: Write the failing test (verify fields are missing)**

```bash
vendor/bin/drush php:eval "
\$index = \Drupal\search_api\Entity\Index::load('media_index');
\$fields = array_keys(\$index->getFields());
\$missing = array_diff(['created', 'field_media_location', 'field_media_theme', 'field_media_asset_type', 'field_media_solution_segment', 'field_media_people_featured'], \$fields);
print_r(\$missing);
"
```

Expected: all 6 field names printed (they are missing).

- [ ] **Step 2: Add the 6 new fields to search_api.index.media_index.yml**

In `$SYNC/search_api.index.media_index.yml`, add the following to the `field_settings:` block (after the existing `status:` entry) and add corresponding `dependencies.config` entries:

```yaml
# Add to dependencies.config section:
    - field.storage.media.field_media_asset_type
    - field.storage.media.field_media_location
    - field.storage.media.field_media_people_featured
    - field.storage.media.field_media_solution_segment
    - field.storage.media.field_media_theme

# Add to field_settings section:
  created:
    label: 'Authored on'
    datasource_id: 'entity:media'
    property_path: created
    type: date
    dependencies:
      module:
        - media
  field_media_asset_type:
    label: 'Asset type'
    datasource_id: 'entity:media'
    property_path: field_media_asset_type
    type: integer
    dependencies:
      config:
        - field.storage.media.field_media_asset_type
  field_media_location:
    label: Location
    datasource_id: 'entity:media'
    property_path: field_media_location
    type: integer
    dependencies:
      config:
        - field.storage.media.field_media_location
  field_media_people_featured:
    label: 'People featured'
    datasource_id: 'entity:media'
    property_path: field_media_people_featured
    type: integer
    dependencies:
      config:
        - field.storage.media.field_media_people_featured
  field_media_solution_segment:
    label: 'Solution segment'
    datasource_id: 'entity:media'
    property_path: field_media_solution_segment
    type: integer
    dependencies:
      config:
        - field.storage.media.field_media_solution_segment
  field_media_theme:
    label: Theme
    datasource_id: 'entity:media'
    property_path: field_media_theme
    type: integer
    dependencies:
      config:
        - field.storage.media.field_media_theme
```

- [ ] **Step 3: Import and re-index**

```bash
vendor/bin/drush config:import -y
vendor/bin/drush search-api:index media_index
```

Expected: `Indexed X items for search index Media index.`

- [ ] **Step 4: Verify fields are now present**

```bash
vendor/bin/drush php:eval "
\$index = \Drupal\search_api\Entity\Index::load('media_index');
\$fields = array_keys(\$index->getFields());
\$expected = ['created', 'field_media_location', 'field_media_theme', 'field_media_asset_type', 'field_media_solution_segment', 'field_media_people_featured'];
foreach (\$expected as \$f) {
  echo \$f . ': ' . (in_array(\$f, \$fields) ? 'OK' : 'MISSING') . PHP_EOL;
}
"
```

Expected: all 6 show `OK`.

- [ ] **Step 5: Commit**

```bash
git add $SYNC/search_api.index.media_index.yml
git commit -m "feat(media_hub): add 6 new fields to Search API index"
```

---

## Task 4: Update Views YAML

**Files:**
- Modify: `$SYNC/views.view.media_center.yml`
- Modify: `$SYNC/block.block.olivero_exposedformmedia_centerpage_1.yml`

Changes: remove caption filter, add date/name sorts, add 5 new facet filters, update thumbnail to use responsive image style.

- [ ] **Step 1: Remove caption filter from views.view.media_center.yml**

Find and delete the entire `facets_field_media_caption:` block under `filters:` (lines starting with `facets_field_media_caption:` through the closing `processor_configs: {}`). Also remove the `facets_field_media_caption:` entry under `bef: > filter:` in the `exposed_form` section.

The `facets_field_media_caption` block under `filters:` looks like:
```yaml
        facets_field_media_caption:
          id: facets_field_media_caption
          table: search_api_index_media_index
          field: facets_field_media_caption
          ...
          (remove entire block through processor_configs)
```

The BEF entry to remove:
```yaml
              facets_field_media_caption:
                plugin_id: bef
                advanced:
                  ...
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
```

- [ ] **Step 2: Add sort criteria to views.view.media_center.yml**

Replace `sorts: {}` with:

```yaml
      sorts:
        created:
          id: created
          table: search_api_index_media_index
          field: created
          order: DESC
          exposed: true
          expose:
            label: 'Sort by date'
            field_identifier: created
        name:
          id: name
          table: search_api_index_media_index
          field: name
          order: ASC
          exposed: true
          expose:
            label: 'Sort by name'
            field_identifier: name
```

- [ ] **Step 3: Add 5 new facet filters to views.view.media_center.yml**

Add the following 5 blocks inside the `filters:` section, after the existing `facets_field_media_tags:` block. Use the same structure as `facets_field_media_tags:` for each:

```yaml
        facets_field_media_location:
          id: facets_field_media_location
          table: search_api_index_media_index
          field: facets_field_media_location
          relationship: none
          group_type: group
          admin_label: ''
          plugin_id: facets_filter
          operator: '='
          value: ''
          group: 1
          exposed: true
          expose:
            operator_id: ''
            label: Location
            description: ''
            use_operator: false
            operator: ''
            operator_limit_selection: false
            operator_list: {}
            identifier: location
            required: false
            remember: false
            multiple: true
            remember_roles:
              authenticated: authenticated
          is_grouped: false
          group_info:
            label: ''
            description: ''
            identifier: ''
            optional: true
            widget: select
            multiple: false
            remember: false
            default_group: All
            default_group_multiple: {}
            group_items: {}
          hierarchy: false
          label_display: visible
          facet:
            query_operator: or
            min_count: 1
            show_numbers: true
            processor_configs:
              translate_entity:
                processor_id: translate_entity
                weights:
                  build: 5
                settings: {}
        facets_field_media_theme:
          id: facets_field_media_theme
          table: search_api_index_media_index
          field: facets_field_media_theme
          relationship: none
          group_type: group
          admin_label: ''
          plugin_id: facets_filter
          operator: '='
          value: ''
          group: 1
          exposed: true
          expose:
            operator_id: ''
            label: Theme
            description: ''
            use_operator: false
            operator: ''
            operator_limit_selection: false
            operator_list: {}
            identifier: theme
            required: false
            remember: false
            multiple: true
            remember_roles:
              authenticated: authenticated
          is_grouped: false
          group_info:
            label: ''
            description: ''
            identifier: ''
            optional: true
            widget: select
            multiple: false
            remember: false
            default_group: All
            default_group_multiple: {}
            group_items: {}
          hierarchy: false
          label_display: visible
          facet:
            query_operator: or
            min_count: 1
            show_numbers: true
            processor_configs:
              translate_entity:
                processor_id: translate_entity
                weights:
                  build: 5
                settings: {}
        facets_field_media_asset_type:
          id: facets_field_media_asset_type
          table: search_api_index_media_index
          field: facets_field_media_asset_type
          relationship: none
          group_type: group
          admin_label: ''
          plugin_id: facets_filter
          operator: '='
          value: ''
          group: 1
          exposed: true
          expose:
            operator_id: ''
            label: 'Asset type'
            description: ''
            use_operator: false
            operator: ''
            operator_limit_selection: false
            operator_list: {}
            identifier: asset_type
            required: false
            remember: false
            multiple: true
            remember_roles:
              authenticated: authenticated
          is_grouped: false
          group_info:
            label: ''
            description: ''
            identifier: ''
            optional: true
            widget: select
            multiple: false
            remember: false
            default_group: All
            default_group_multiple: {}
            group_items: {}
          hierarchy: false
          label_display: visible
          facet:
            query_operator: or
            min_count: 1
            show_numbers: true
            processor_configs:
              translate_entity:
                processor_id: translate_entity
                weights:
                  build: 5
                settings: {}
        facets_field_media_solution_segment:
          id: facets_field_media_solution_segment
          table: search_api_index_media_index
          field: facets_field_media_solution_segment
          relationship: none
          group_type: group
          admin_label: ''
          plugin_id: facets_filter
          operator: '='
          value: ''
          group: 1
          exposed: true
          expose:
            operator_id: ''
            label: 'Solution segment'
            description: ''
            use_operator: false
            operator: ''
            operator_limit_selection: false
            operator_list: {}
            identifier: solution_segment
            required: false
            remember: false
            multiple: true
            remember_roles:
              authenticated: authenticated
          is_grouped: false
          group_info:
            label: ''
            description: ''
            identifier: ''
            optional: true
            widget: select
            multiple: false
            remember: false
            default_group: All
            default_group_multiple: {}
            group_items: {}
          hierarchy: false
          label_display: visible
          facet:
            query_operator: or
            min_count: 1
            show_numbers: true
            processor_configs:
              translate_entity:
                processor_id: translate_entity
                weights:
                  build: 5
                settings: {}
        facets_field_media_people_featured:
          id: facets_field_media_people_featured
          table: search_api_index_media_index
          field: facets_field_media_people_featured
          relationship: none
          group_type: group
          admin_label: ''
          plugin_id: facets_filter
          operator: '='
          value: ''
          group: 1
          exposed: true
          expose:
            operator_id: ''
            label: 'People featured'
            description: ''
            use_operator: false
            operator: ''
            operator_limit_selection: false
            operator_list: {}
            identifier: people_featured
            required: false
            remember: false
            multiple: true
            remember_roles:
              authenticated: authenticated
          is_grouped: false
          group_info:
            label: ''
            description: ''
            identifier: ''
            optional: true
            widget: select
            multiple: false
            remember: false
            default_group: All
            default_group_multiple: {}
            group_items: {}
          hierarchy: false
          label_display: visible
          facet:
            query_operator: or
            min_count: 1
            show_numbers: true
            processor_configs:
              translate_entity:
                processor_id: translate_entity
                weights:
                  build: 5
                settings: {}
```

- [ ] **Step 4: Add BEF config for the 5 new filters**

Inside `exposed_form > options > bef > filter:`, add after the `facets_field_media_tags:` entry:

```yaml
              facets_field_media_location:
                plugin_id: bef
                advanced:
                  rewrite:
                    filter_rewrite_values: ''
                    filter_rewrite_values_key: false
                  collapsible: false
                  collapsible_disable_automatic_open: false
                  is_secondary: false
                  hide_label: false
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
              facets_field_media_theme:
                plugin_id: bef
                advanced:
                  rewrite:
                    filter_rewrite_values: ''
                    filter_rewrite_values_key: false
                  collapsible: false
                  collapsible_disable_automatic_open: false
                  is_secondary: false
                  hide_label: false
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
              facets_field_media_asset_type:
                plugin_id: bef
                advanced:
                  rewrite:
                    filter_rewrite_values: ''
                    filter_rewrite_values_key: false
                  collapsible: false
                  collapsible_disable_automatic_open: false
                  is_secondary: false
                  hide_label: false
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
              facets_field_media_solution_segment:
                plugin_id: bef
                advanced:
                  rewrite:
                    filter_rewrite_values: ''
                    filter_rewrite_values_key: false
                  collapsible: false
                  collapsible_disable_automatic_open: false
                  is_secondary: false
                  hide_label: false
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
              facets_field_media_people_featured:
                plugin_id: bef
                advanced:
                  rewrite:
                    filter_rewrite_values: ''
                    filter_rewrite_values_key: false
                  collapsible: false
                  collapsible_disable_automatic_open: false
                  is_secondary: false
                  hide_label: false
                select_all_none: false
                select_all_none_nested: false
                display_inline: true
```

- [ ] **Step 5: Update thumbnail image style to use responsive**

In `views.view.media_center.yml`, under `fields > thumbnail > settings:`, change:

```yaml
          settings:
            image_link: ''
            image_style: media_library
            image_loading:
              attribute: lazy
```

to:

```yaml
          settings:
            image_link: ''
            image_style: ''
            responsive_image_style: media_hub_grid
            image_loading:
              attribute: lazy
```

Also update the `type:` for the thumbnail field from `image` to `responsive_image`:

```yaml
          type: responsive_image
```

- [ ] **Step 6: Update block config to add new filter identifiers**

In `$SYNC/block.block.olivero_exposedformmedia_centerpage_1.yml`, find the `filters:` list under `settings > plugin_configuration` and update it to:

```yaml
        filters:
          - keywords
          - category
          - license
          - type
          - tags
          - location
          - theme
          - asset_type
          - solution_segment
          - people_featured
```

(Remove `caption` from the list.)

- [ ] **Step 7: Import config**

```bash
vendor/bin/drush config:import -y
vendor/bin/drush cr
```

Expected: no errors. Visit `/media-hub` and verify the page loads without errors and caption filter is gone.

- [ ] **Step 8: Commit**

```bash
git add $SYNC/views.view.media_center.yml $SYNC/block.block.olivero_exposedformmedia_centerpage_1.yml
git commit -m "feat(media_hub): update view filters, sorts, and image style"
```

---

## Task 5: MediaHubController — Related Images Endpoint

**Files:**
- Create: `web/modules/custom/media_hub/src/Controller/MediaHubController.php`
- Create: `web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php`

- [ ] **Step 1: Write the failing unit test**

```php
<?php
// web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php

namespace Drupal\Tests\media_hub\Unit;

use Drupal\media_hub\Controller\MediaHubController;
use Drupal\Tests\UnitTestCase;

class MediaHubControllerTest extends UnitTestCase {

  public function testSelectRelatedPrefersSharedTagCandidates(): void {
    $result = MediaHubController::selectRelated([10, 20], [30, 40, 50], 3);
    $this->assertSame([10, 20, 30], $result);
  }

  public function testSelectRelatedFallsBackToCategoryOnlyWhenNoTagMatch(): void {
    $result = MediaHubController::selectRelated([], [30, 40, 50], 3);
    $this->assertSame([30, 40, 50], $result);
  }

  public function testSelectRelatedLimitsToRequestedCount(): void {
    $result = MediaHubController::selectRelated([10, 20, 30, 40], [], 3);
    $this->assertSame([10, 20, 30], $result);
  }

  public function testSelectRelatedDeduplicatesOverlap(): void {
    $result = MediaHubController::selectRelated([10, 20], [10, 30], 3);
    $this->assertSame([10, 20, 30], $result);
  }

  public function testSelectRelatedReturnsEmptyWhenNoCandidates(): void {
    $result = MediaHubController::selectRelated([], [], 3);
    $this->assertSame([], $result);
  }

}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
vendor/bin/phpunit web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php
```

Expected: FAIL — `MediaHubController` class not found.

- [ ] **Step 3: Implement MediaHubController**

```php
<?php
// web/modules/custom/media_hub/src/Controller/MediaHubController.php

namespace Drupal\media_hub\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class MediaHubController extends ControllerBase {

  public function __construct(
    protected EntityTypeManagerInterface $entityTypeManager,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static($container->get('entity_type.manager'));
  }

  public function related(int $media_id): JsonResponse {
    $storage = $this->entityTypeManager->getStorage('media');
    $media = $storage->load($media_id);

    if (!$media) {
      return new JsonResponse([], Response::HTTP_NOT_FOUND);
    }

    $category_ids = array_column($media->get('field_media_category')->getValue(), 'target_id');
    $tag_ids = array_column($media->get('field_media_tags')->getValue(), 'target_id');

    $primary_ids = [];
    if (!empty($category_ids) && !empty($tag_ids)) {
      $primary_ids = array_values($storage->getQuery()
        ->accessCheck(TRUE)
        ->condition('status', 1)
        ->condition('field_media_category', $category_ids, 'IN')
        ->condition('field_media_tags', $tag_ids, 'IN')
        ->condition('mid', $media_id, '!=')
        ->range(0, 3)
        ->execute());
    }

    $fallback_ids = [];
    if (!empty($category_ids)) {
      $fallback_ids = array_values($storage->getQuery()
        ->accessCheck(TRUE)
        ->condition('status', 1)
        ->condition('field_media_category', $category_ids, 'IN')
        ->condition('mid', $media_id, '!=')
        ->range(0, 3)
        ->execute());
    }

    $selected_ids = static::selectRelated($primary_ids, $fallback_ids, 3);
    $items = $storage->loadMultiple($selected_ids);

    $result = [];
    foreach ($selected_ids as $id) {
      if (empty($items[$id])) {
        continue;
      }
      $item = $items[$id];
      $thumbnail = '';
      if ($item->hasField('thumbnail') && !$item->get('thumbnail')->isEmpty()) {
        /** @var \Drupal\image\Plugin\Field\FieldType\ImageItem $thumb_item */
        $thumb_item = $item->get('thumbnail')->first();
        $file = $thumb_item->entity;
        if ($file) {
          $thumbnail = \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri());
        }
      }
      $result[] = [
        'id'        => (int) $id,
        'name'      => $item->label(),
        'bundle'    => $item->bundle(),
        'thumbnail' => $thumbnail,
      ];
    }

    return new JsonResponse($result);
  }

  /**
   * Pure selection logic — unit testable without Drupal bootstrap.
   *
   * @param int[] $primary_ids   IDs matching category + shared tag.
   * @param int[] $fallback_ids  IDs matching category only.
   * @param int   $limit         Maximum results to return.
   *
   * @return int[]
   */
  public static function selectRelated(array $primary_ids, array $fallback_ids, int $limit = 3): array {
    if (count($primary_ids) >= $limit) {
      return array_slice($primary_ids, 0, $limit);
    }
    $merged = array_values(array_unique(array_merge($primary_ids, $fallback_ids)));
    return array_slice($merged, 0, $limit);
  }

}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
vendor/bin/phpunit web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php
```

Expected: 5 tests, 5 assertions — PASS.

- [ ] **Step 5: Verify endpoint works**

```bash
vendor/bin/drush cr
curl -s "http://localhost/media-hub/related/1" | python3 -m json.tool
```

Expected: JSON array (may be empty if media ID 1 doesn't exist — verify with a real ID from the database).

- [ ] **Step 6: Commit**

```bash
git add web/modules/custom/media_hub/src/Controller/MediaHubController.php \
        web/modules/custom/media_hub/tests/src/Unit/MediaHubControllerTest.php
git commit -m "feat(media_hub): add related images JSON endpoint with unit tests"
```

---

## Task 6: Module Hooks and Twig Templates

**Files:**
- Modify: `web/modules/custom/media_hub/media_hub.module`
- Create: `web/modules/custom/media_hub/templates/views-view--media-center.html.twig`
- Create: `web/modules/custom/media_hub/templates/views-view-field--media-center--thumbnail.html.twig`

- [ ] **Step 1: Implement hooks in media_hub.module**

Replace the contents of `web/modules/custom/media_hub/media_hub.module` with:

```php
<?php
/**
 * @file
 * Media Hub module hooks.
 */

use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\media\MediaInterface;

/**
 * Implements hook_theme().
 */
function media_hub_theme(): array {
  return [];
}

/**
 * Implements hook_theme_suggestions_alter().
 *
 * Provide specific template suggestions for the media_center view.
 */
function media_hub_theme_suggestions_alter(array &$suggestions, array $variables, string $hook): void {
  if ($hook === 'views_view' && isset($variables['view']) && $variables['view']->id() === 'media_center') {
    $suggestions[] = 'views_view__media_center';
  }
  if ($hook === 'views_view_field' && isset($variables['view']) && $variables['view']->id() === 'media_center' && $variables['field']->field === 'thumbnail') {
    $suggestions[] = 'views_view_field__media_center__thumbnail';
  }
}

/**
 * Implements hook_preprocess_views_view_field() for the thumbnail field.
 *
 * Attaches extra card data as template variables.
 */
function media_hub_preprocess_views_view_field(&$variables): void {
  if ($variables['view']->id() !== 'media_center' || $variables['field']->field !== 'thumbnail') {
    return;
  }

  $row = $variables['row'];
  $entity = $row->_object ? $row->_object->getValue() : NULL;
  if (!$entity instanceof MediaInterface) {
    return;
  }

  /** @var \Drupal\Core\File\FileUrlGeneratorInterface $url_generator */
  $url_generator = \Drupal::service('file_url_generator');

  $bundle = $entity->bundle();
  $media_id = $entity->id();
  $name = $entity->label();
  $caption = '';
  $download_url = '';
  $file_size = '';
  $file_ext = '';
  $video_url = '';

  if ($entity->hasField('field_media_caption') && !$entity->get('field_media_caption')->isEmpty()) {
    $caption = $entity->get('field_media_caption')->value;
  }

  switch ($bundle) {
    case 'image':
      if (!$entity->get('field_media_image')->isEmpty()) {
        $file = $entity->get('field_media_image')->entity;
        if ($file) {
          $download_url = $url_generator->generateAbsoluteString($file->getFileUri());
        }
      }
      break;

    case 'video':
      if (!$entity->get('field_media_video_file')->isEmpty()) {
        $file = $entity->get('field_media_video_file')->entity;
        if ($file) {
          $download_url = $url_generator->generateAbsoluteString($file->getFileUri());
          $video_url = $download_url;
        }
      }
      break;

    case 'remote_video':
      if (!$entity->get('field_media_oembed_video')->isEmpty()) {
        $video_url = $entity->get('field_media_oembed_video')->value;
      }
      break;

    case 'document':
      $doc_field = $entity->hasField('field_media_document') ? 'field_media_document' : 'field_media_file';
      if ($entity->hasField($doc_field) && !$entity->get($doc_field)->isEmpty()) {
        $file = $entity->get($doc_field)->entity;
        if ($file) {
          $download_url = $url_generator->generateAbsoluteString($file->getFileUri());
          $file_size = format_size($file->getSize());
          $file_ext = strtoupper(pathinfo($file->getFilename(), PATHINFO_EXTENSION));
        }
      }
      break;

    case 'audio':
      $audio_field = $entity->hasField('field_media_audio_file') ? 'field_media_audio_file' : 'field_media_file';
      if ($entity->hasField($audio_field) && !$entity->get($audio_field)->isEmpty()) {
        $file = $entity->get($audio_field)->entity;
        if ($file) {
          $download_url = $url_generator->generateAbsoluteString($file->getFileUri());
        }
      }
      break;
  }

  $variables['media_id'] = $media_id;
  $variables['media_bundle'] = $bundle;
  $variables['media_name'] = $name;
  $variables['media_caption'] = $caption;
  $variables['media_download_url'] = $download_url;
  $variables['media_file_size'] = $file_size;
  $variables['media_file_ext'] = $file_ext;
  $variables['media_video_url'] = $video_url;
}

/**
 * Implements hook_page_attachments().
 */
function media_hub_page_attachments(array &$attachments): void {
  $route = \Drupal::routeMatch()->getRouteName();
  if ($route === 'view.media_center.page_1') {
    $attachments['#attached']['library'][] = 'media_hub/media_hub';
  }
}
```

- [ ] **Step 2: Create views-view--media-center.html.twig**

```twig
{# web/modules/custom/media_hub/templates/views-view--media-center.html.twig #}
{{ attach_library('media_hub/media_hub') }}

<div class="media-hub-page">

  {# Hero Banner #}
  <div class="media-hub-hero">
    <div class="media-hub-hero__content">
      <h1 class="media-hub-hero__title">MEDIA HUB</h1>
      <div class="media-hub-hero__search">
        <span class="media-hub-hero__search-icon">&#128269;</span>
        <input
          type="text"
          class="media-hub-hero__search-input"
          placeholder="{{ 'Search media...'|t }}"
          id="media-hub-hero-search"
          autocomplete="off"
        >
      </div>
    </div>
  </div>

  {# Quick Access #}
  <div class="media-hub-quick-access">
    <h2 class="media-hub-section-title">{{ 'Quick Access'|t }}</h2>
    <div class="media-hub-quick-access__grid">
      {% set categories = [
        { label: 'ASSETS'|t,  filter: 'Assets',       class: 'assets'  },
        { label: 'EVENTS'|t,  filter: 'Events',        class: 'events'  },
        { label: 'PEOPLE'|t,  filter: 'People',        class: 'people'  },
        { label: 'VIDEOS'|t,  filter: 'Videos',        class: 'videos'  },
      ] %}
      {% for cat in categories %}
        <a href="{{ path('view.media_center.page_1') }}?f[0]=category:{{ cat.filter }}"
           class="media-hub-qa-card media-hub-qa-card--{{ cat.class }}">
          <span class="media-hub-qa-card__label">{{ cat.label }}</span>
        </a>
      {% endfor %}
    </div>
  </div>

  {# Gallery + Sidebar #}
  <div class="media-hub-body">
    <div class="media-hub-gallery">
      <div class="media-hub-gallery__header">
        <h2 class="media-hub-section-title">{{ 'Gallery'|t }}</h2>
        {% if header %}
          <div class="media-hub-result-count">{{ header }}</div>
        {% endif %}
      </div>

      {# Active filter chips — populated by JS from URL params #}
      <div class="media-hub-chips" id="media-hub-chips" aria-label="{{ 'Active filters'|t }}"></div>

      {% if rows %}
        <div class="media-hub-grid">{{ rows }}</div>
      {% elseif empty %}
        <div class="media-hub-empty">{{ empty }}</div>
      {% endif %}

      {% if pager %}
        <div class="media-hub-pager">{{ pager }}</div>
      {% endif %}
    </div>

    {% if exposed %}
      <aside class="media-hub-sidebar" id="media-hub-sidebar">
        {{ exposed }}
      </aside>
    {% endif %}
  </div>
</div>

{# Lightbox overlay — populated and shown by JS #}
<div class="media-hub-lightbox" id="media-hub-lightbox" role="dialog" aria-modal="true" aria-label="{{ 'Media preview'|t }}" hidden>
  <div class="media-hub-lightbox__inner">
    <div class="media-hub-lightbox__main">
      <button class="media-hub-lightbox__close" id="media-hub-lightbox-close" aria-label="{{ 'Close'|t }}">
        {{ 'CLOSE'|t }} <span aria-hidden="true">&#10005;</span>
      </button>
      <div class="media-hub-lightbox__stage" id="media-hub-lightbox-stage">
        <button class="media-hub-lightbox__nav media-hub-lightbox__nav--prev" id="lightbox-prev" aria-label="{{ 'Previous'|t }}">&#8249;</button>
        <div class="media-hub-lightbox__media" id="lightbox-media"></div>
        <button class="media-hub-lightbox__nav media-hub-lightbox__nav--next" id="lightbox-next" aria-label="{{ 'Next'|t }}">&#8250;</button>
      </div>
      <div class="media-hub-lightbox__caption-bar" id="lightbox-caption-bar">
        <span class="media-hub-lightbox__caption" id="lightbox-caption"></span>
        <a class="media-hub-lightbox__download" id="lightbox-download" download>{{ 'Download'|t }} &#8595;</a>
      </div>
      <div class="media-hub-lightbox__related" id="lightbox-related">
        <div class="media-hub-section-title media-hub-section-title--small">{{ 'Related Images'|t }}</div>
        <div class="media-hub-lightbox__related-thumbs" id="lightbox-related-thumbs"></div>
      </div>
    </div>
    <aside class="media-hub-lightbox__sidebar">
      <div class="media-hub-lightbox__sidebar-search">
        <span>&#128269;</span>
        <input type="text" id="lightbox-sidebar-search" placeholder="{{ 'Search media...'|t }}">
      </div>
      <div id="lightbox-sidebar-filters">
        {# Cloned from main sidebar by JS #}
      </div>
    </aside>
  </div>
</div>
```

- [ ] **Step 3: Create views-view-field--media-center--thumbnail.html.twig**

```twig
{# web/modules/custom/media_hub/templates/views-view-field--media-center--thumbnail.html.twig #}
<div class="media-hub-card media-hub-card--{{ media_bundle }}"
     data-media-id="{{ media_id }}"
     data-media-bundle="{{ media_bundle }}"
     data-media-name="{{ media_name|e('html_attr') }}"
     data-media-caption="{{ media_caption|e('html_attr') }}"
     data-media-download-url="{{ media_download_url }}"
     data-media-video-url="{{ media_video_url }}"
     data-media-file-size="{{ media_file_size }}"
     data-media-file-ext="{{ media_file_ext }}"
     tabindex="0"
     role="button"
     aria-label="{{ 'Preview: '|t }}{{ media_name }}">

  {# Thumbnail image (from Views field output) #}
  <div class="media-hub-card__thumb">
    {{ output }}

    {# Type badge (shown at rest for non-image types) #}
    {% if media_bundle == 'video' or media_bundle == 'remote_video' %}
      <span class="media-hub-card__badge media-hub-card__badge--play" aria-hidden="true">&#9654;</span>
    {% elseif media_bundle == 'document' %}
      <span class="media-hub-card__badge media-hub-card__badge--doc" aria-hidden="true">{{ media_file_ext ?: 'DOC' }}</span>
    {% elseif media_bundle == 'audio' %}
      <span class="media-hub-card__badge media-hub-card__badge--audio" aria-hidden="true">&#9834;</span>
    {% endif %}
  </div>

  {# Hover overlay #}
  <div class="media-hub-card__overlay" aria-hidden="true">
    <span class="media-hub-card__overlay-title">{{ media_name }}</span>
    {% if media_bundle == 'remote_video' %}
      <span class="media-hub-card__overlay-action media-hub-card__overlay-action--play">&#9654; {{ 'Play'|t }}</span>
    {% elseif media_download_url %}
      <a class="media-hub-card__overlay-action media-hub-card__overlay-action--download"
         href="{{ media_download_url }}"
         download
         onclick="event.stopPropagation()">
        &#8595; {{ 'Download'|t }}
      </a>
    {% endif %}
  </div>
</div>
```

- [ ] **Step 4: Clear cache and verify templates load**

```bash
vendor/bin/drush cr
```

Visit `/media-hub` — the page should now show the hero, quick access row, and gallery with hover overlays on cards. (CSS/JS are not yet written — layout will be unstyled.)

- [ ] **Step 5: Commit**

```bash
git add web/modules/custom/media_hub/media_hub.module \
        web/modules/custom/media_hub/templates/
git commit -m "feat(media_hub): add hooks and Twig templates for hero, quick access, and cards"
```

---

## Task 7: CSS

**Files:**
- Modify: `web/modules/custom/media_hub/css/media-hub.css`

- [ ] **Step 1: Write media-hub.css**

```css
/* web/modules/custom/media_hub/css/media-hub.css */

:root {
  --mh-navy:      rgb(0, 9, 63);
  --mh-orange:    rgb(255, 95, 0);
  --mh-blue:      rgb(8, 158, 209);
  --mh-white:     #ffffff;
  --mh-gray-bg:   #f4f5f7;
  --mh-border:    #dde1e9;
  --mh-overlay:   rgba(0, 9, 63, 0.55);
}

/* ── Page wrapper ──────────────────────────────────────────── */
.media-hub-page {
  font-family: 'Segoe UI', Arial, sans-serif;
}

/* ── Hero ──────────────────────────────────────────────────── */
.media-hub-hero {
  background: linear-gradient(135deg, var(--mh-navy) 60%, var(--mh-blue) 100%);
  position: relative;
  overflow: hidden;
  padding: 48px 40px;
  margin-bottom: 28px;
  border-radius: 6px;
}

.media-hub-hero::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 220px;
  height: 100%;
  background: var(--mh-orange);
  clip-path: polygon(45% 0, 100% 0, 100% 100%, 0% 100%);
  opacity: 0.9;
}

.media-hub-hero__content {
  position: relative;
  z-index: 1;
}

.media-hub-hero__title {
  color: var(--mh-white);
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 20px;
}

.media-hub-hero__search {
  display: flex;
  align-items: center;
  background: var(--mh-white);
  border-radius: 4px;
  padding: 10px 16px;
  max-width: 480px;
  gap: 10px;
}

.media-hub-hero__search-icon {
  color: #888;
  font-size: 1rem;
  flex-shrink: 0;
}

.media-hub-hero__search-input {
  border: none;
  outline: none;
  font-size: 0.95rem;
  width: 100%;
  color: #333;
}

/* ── Section titles ────────────────────────────────────────── */
.media-hub-section-title {
  color: var(--mh-orange);
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 14px;
}

.media-hub-section-title--small {
  font-size: 0.8rem;
  margin-bottom: 8px;
}

/* ── Quick Access ──────────────────────────────────────────── */
.media-hub-quick-access {
  margin-bottom: 28px;
}

.media-hub-quick-access__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.media-hub-qa-card {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--mh-navy);
  text-decoration: none;
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
}

.media-hub-qa-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 9, 63, 0.35);
}

.media-hub-qa-card--assets  { background: linear-gradient(135deg, #00093f, #001a8c); }
.media-hub-qa-card--events  { background: linear-gradient(135deg, #00093f, #003080); }
.media-hub-qa-card--people  { background: linear-gradient(135deg, #1a0050, #3a1090); }
.media-hub-qa-card--videos  { background: linear-gradient(135deg, #3f0000, #8c1010); }

.media-hub-qa-card__label {
  display: block;
  width: 100%;
  text-align: center;
  color: var(--mh-white);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 1px;
  background: rgba(0, 9, 63, 0.65);
  padding: 8px;
}

/* ── Body layout ───────────────────────────────────────────── */
.media-hub-body {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: start;
}

/* ── Gallery ───────────────────────────────────────────────── */
.media-hub-gallery__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.media-hub-result-count {
  color: #666;
  font-size: 0.85rem;
}

/* ── Active filter chips ────────────────────────────────────── */
.media-hub-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  min-height: 0;
}

.media-hub-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--mh-blue);
  color: var(--mh-white);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.75rem;
  line-height: 1.4;
}

.media-hub-chip__remove {
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
  border: none;
  background: none;
  color: var(--mh-white);
  padding: 0;
}

/* ── Grid ──────────────────────────────────────────────────── */
.media-hub-grid .views-row,
.media-hub-grid .views-col {
  display: contents;
}

/* Views grid wraps in a table-like structure — override with CSS grid */
.media-hub-grid .views-view-responsive-grid,
.media-hub-grid > .views-view-grid {
  display: grid !important;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  width: 100%;
}

@media (max-width: 1200px) {
  .media-hub-grid .views-view-responsive-grid,
  .media-hub-grid > .views-view-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .media-hub-body { grid-template-columns: 1fr; }
  .media-hub-grid .views-view-responsive-grid,
  .media-hub-grid > .views-view-grid { grid-template-columns: repeat(2, 1fr); }
  .media-hub-quick-access__grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Cards ─────────────────────────────────────────────────── */
.media-hub-card {
  position: relative;
  display: block;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  background: var(--mh-navy);
  aspect-ratio: 1;
}

.media-hub-card:focus {
  outline: 2px solid var(--mh-blue);
  outline-offset: 2px;
}

.media-hub-card__thumb {
  width: 100%;
  height: 100%;
  position: relative;
}

.media-hub-card__thumb img,
.media-hub-card__thumb picture {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-hub-card__badge {
  position: absolute;
  top: 6px;
  left: 6px;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--mh-white);
  background: rgba(0, 9, 63, 0.75);
  pointer-events: none;
}

.media-hub-card__badge--play {
  font-size: 0.9rem;
  background: rgba(255, 95, 0, 0.85);
}

.media-hub-card__badge--doc {
  background: rgba(8, 158, 209, 0.85);
}

.media-hub-card__overlay {
  position: absolute;
  inset: 0;
  background: var(--mh-overlay);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.media-hub-card:hover .media-hub-card__overlay,
.media-hub-card:focus .media-hub-card__overlay {
  opacity: 1;
  pointer-events: auto;
}

.media-hub-card__overlay-title {
  color: var(--mh-white);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.3;
}

.media-hub-card__overlay-action {
  display: inline-block;
  background: var(--mh-orange);
  color: var(--mh-white);
  border: none;
  border-radius: 3px;
  padding: 4px 10px;
  font-size: 0.68rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  text-align: center;
}

.media-hub-card__overlay-action:hover {
  background: #cc4a00;
  color: var(--mh-white);
}

/* ── Pagination ─────────────────────────────────────────────── */
.media-hub-pager {
  margin-top: 16px;
}

.media-hub-pager .pager__item a,
.media-hub-pager .pager__item span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--mh-border);
  background: var(--mh-white);
  color: var(--mh-navy);
  font-size: 0.8rem;
  text-decoration: none;
  padding: 0 6px;
}

.media-hub-pager .pager__item--current span,
.media-hub-pager .is-active a {
  background: var(--mh-blue);
  border-color: var(--mh-blue);
  color: var(--mh-white);
}

/* ── Sidebar (filter groups) ────────────────────────────────── */
.media-hub-sidebar {
  position: sticky;
  top: 16px;
}

.media-hub-sidebar .views-exposed-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Hide default BEF labels — we show custom group headers */
.media-hub-sidebar label {
  font-size: 0.8rem;
  color: #333;
}

/* Filter group wrapper — added by JS */
.mh-filter-group {
  border-radius: 4px;
  overflow: hidden;
}

.mh-filter-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--mh-navy);
  color: var(--mh-white);
  padding: 10px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  border: none;
  width: 100%;
  text-align: left;
}

.mh-filter-group__chevron {
  color: var(--mh-blue);
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.mh-filter-group--collapsed .mh-filter-group__chevron {
  transform: rotate(-90deg);
}

.mh-filter-group__body {
  background: var(--mh-white);
  padding: 10px 14px;
  border: 1px solid var(--mh-border);
  border-top: none;
}

.mh-filter-group--collapsed .mh-filter-group__body {
  display: none;
}

/* Tag pills */
.mh-filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mh-filter-pill {
  background: #eef4fb;
  border: 1px solid #c5dcf0;
  border-radius: 3px;
  padding: 3px 8px;
  font-size: 0.72rem;
  color: var(--mh-navy);
  cursor: pointer;
}

.mh-filter-pill.is-active,
.mh-filter-pill input:checked + span {
  background: var(--mh-blue);
  color: var(--mh-white);
  border-color: var(--mh-blue);
}

/* Reset link */
.mh-filter-reset {
  display: block;
  text-align: right;
  color: var(--mh-blue);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  background: none;
  border: none;
  padding: 0;
}

/* ── Lightbox ───────────────────────────────────────────────── */
.media-hub-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 9, 63, 0.97);
  z-index: 9999;
  display: grid;
  grid-template-columns: 1fr;
}

.media-hub-lightbox[hidden] {
  display: none;
}

.media-hub-lightbox__inner {
  display: grid;
  grid-template-columns: 1fr 280px;
  height: 100vh;
  overflow: hidden;
}

.media-hub-lightbox__main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.media-hub-lightbox__close {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--mh-white);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  padding: 16px 20px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.media-hub-lightbox__close span {
  color: var(--mh-blue);
}

.media-hub-lightbox__stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 16px 48px;
  overflow: hidden;
}

.media-hub-lightbox__media {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-hub-lightbox__media img {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  object-fit: contain;
  border-radius: 4px;
}

.media-hub-lightbox__media video,
.media-hub-lightbox__media iframe {
  max-width: 100%;
  max-height: calc(100vh - 200px);
  width: 760px;
  border-radius: 4px;
  border: none;
}

.media-hub-lightbox__media .lightbox-doc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--mh-white);
  text-align: center;
}

.media-hub-lightbox__media .lightbox-doc-icon {
  font-size: 4rem;
  color: var(--mh-blue);
}

.media-hub-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: var(--mh-white);
  font-size: 1.6rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.media-hub-lightbox__nav:hover {
  background: rgba(255, 255, 255, 0.25);
}

.media-hub-lightbox__nav--prev { left: 8px; }
.media-hub-lightbox__nav--next { right: 8px; }

.media-hub-lightbox__caption-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  gap: 16px;
}

.media-hub-lightbox__caption {
  color: var(--mh-white);
  font-size: 0.88rem;
}

.media-hub-lightbox__download {
  flex-shrink: 0;
  background: var(--mh-orange);
  color: var(--mh-white);
  border: none;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
}

.media-hub-lightbox__download[hidden] {
  display: none;
}

.media-hub-lightbox__related {
  padding: 12px 48px 20px;
  flex-shrink: 0;
}

.media-hub-lightbox__related-thumbs {
  display: flex;
  gap: 10px;
}

.media-hub-lightbox__related-thumb {
  width: 72px;
  height: 54px;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s;
  background: rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.media-hub-lightbox__related-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-hub-lightbox__related-thumb:hover {
  border-color: var(--mh-blue);
}

/* Lightbox sidebar */
.media-hub-lightbox__sidebar {
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px;
  overflow-y: auto;
}

.media-hub-lightbox__sidebar-search {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 14px;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.media-hub-lightbox__sidebar-search input {
  background: none;
  border: none;
  outline: none;
  color: var(--mh-white);
  font-size: 0.85rem;
  width: 100%;
}

.media-hub-lightbox__sidebar-search input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Dark variants for lightbox sidebar filter groups */
.media-hub-lightbox__sidebar .mh-filter-group__header {
  border: 1px solid rgba(8, 158, 209, 0.3);
}

.media-hub-lightbox__sidebar .mh-filter-group__body {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(8, 158, 209, 0.2);
}

.media-hub-lightbox__sidebar .mh-filter-group__body label {
  color: rgba(255, 255, 255, 0.8);
}

.media-hub-lightbox__sidebar .mh-filter-pill {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.media-hub-lightbox__sidebar .mh-filter-pill.is-active {
  background: var(--mh-blue);
  color: var(--mh-white);
  border-color: var(--mh-blue);
}

@media (max-width: 768px) {
  .media-hub-lightbox__inner {
    grid-template-columns: 1fr;
  }
  .media-hub-lightbox__sidebar {
    display: none;
  }
  .media-hub-lightbox__caption-bar,
  .media-hub-lightbox__related,
  .media-hub-lightbox__stage {
    padding-left: 16px;
    padding-right: 16px;
  }
}
```

- [ ] **Step 2: Clear cache and do visual check**

```bash
vendor/bin/drush cr
```

Visit `/media-hub`. Verify: hero banner with navy/orange shows, Quick Access row appears, gallery grid is styled, filter sidebar has navy headers. Hover over a card — overlay should appear with title and download button.

- [ ] **Step 3: Commit**

```bash
git add web/modules/custom/media_hub/css/media-hub.css
git commit -m "feat(media_hub): add scoped CSS with brand colors, hero, grid, lightbox, and sidebar styles"
```

---

## Task 8: JavaScript

**Files:**
- Modify: `web/modules/custom/media_hub/js/media-hub.js`

- [ ] **Step 1: Write media-hub.js**

```js
// web/modules/custom/media_hub/js/media-hub.js
/* global Drupal */

(function (Drupal) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  const FILTER_GROUPS = [
    { id: 'category',         label: 'Category',          collapsed: false },
    { id: 'license',          label: 'License & Usage',   collapsed: false },
    { id: 'type',             label: 'Media Type',        collapsed: false },
    { id: 'tags',             label: 'Tags',              collapsed: false },
    { id: 'more',             label: 'More Filters',      collapsed: true  },
  ];

  // Map URL query param identifiers → group id
  const FILTER_PARAM_MAP = {
    category:         'category',
    license:          'license',
    type:             'type',
    tags:             'tags',
    location:         'more',
    theme:            'more',
    asset_type:       'more',
    solution_segment: 'more',
    people_featured:  'more',
  };

  // ── State ──────────────────────────────────────────────────

  let cardIndex = [];      // ordered list of card data from the current DOM
  let lightboxPos = 0;     // index of current item in cardIndex

  // ── Utilities ──────────────────────────────────────────────

  function getCardData(card) {
    return {
      id:          card.dataset.mediaId,
      bundle:      card.dataset.mediaBundle,
      name:        card.dataset.mediaName,
      caption:     card.dataset.mediaCaption,
      downloadUrl: card.dataset.mediaDownloadUrl,
      videoUrl:    card.dataset.mediaVideoUrl,
      fileSize:    card.dataset.mediaFileSize,
      fileExt:     card.dataset.mediaFileExt,
      imgSrc:      card.querySelector('img') ? card.querySelector('img').src : '',
    };
  }

  function buildCardIndex() {
    cardIndex = Array.from(document.querySelectorAll('.media-hub-card'));
  }

  // ── Filter group collapsibles ───────────────────────────────

  function wrapFilterGroups(container) {
    if (!container) return;

    FILTER_GROUPS.forEach(function (group) {
      // Find the BEF/Views form element for this group by its identifier
      const fieldset = container.querySelector(
        '[data-drupal-selector*="' + group.id + '"], ' +
        '.form-item--' + group.id + ', ' +
        '.bef-exposed-form .js-form-type-bef-checkbox-with-select'
      );
      // Fall back: find by label text
      const allLabels = container.querySelectorAll('label, .form-item > label');
      let groupEl = null;

      // Try to find any form items whose id/name includes the group id
      const inputs = container.querySelectorAll('[name*="' + group.id + '"], [id*="' + group.id + '"]');
      if (inputs.length > 0) {
        // Collect all form-item ancestors
        const items = new Set();
        inputs.forEach(function (input) {
          const item = input.closest('.js-form-item, .form-item');
          if (item) items.add(item);
        });
        if (items.size > 0) {
          const wrapper = document.createElement('div');
          wrapper.className = 'mh-filter-group' + (group.collapsed ? ' mh-filter-group--collapsed' : '');
          wrapper.dataset.groupId = group.id;

          const header = document.createElement('button');
          header.type = 'button';
          header.className = 'mh-filter-group__header';
          header.innerHTML = group.label + '<span class="mh-filter-group__chevron" aria-hidden="true">&#9660;</span>';

          const body = document.createElement('div');
          body.className = 'mh-filter-group__body';

          items.forEach(function (item) {
            body.appendChild(item);
          });

          // Add reset link to Tags and More Filters groups
          if (group.id === 'tags' || group.id === 'more') {
            const reset = document.createElement('button');
            reset.type = 'button';
            reset.className = 'mh-filter-reset';
            reset.textContent = Drupal.t('Reset');
            reset.addEventListener('click', function () {
              clearGroupFilters(group.id);
            });
            body.appendChild(reset);
          }

          wrapper.appendChild(header);
          wrapper.appendChild(body);
          header.addEventListener('click', function () {
            wrapper.classList.toggle('mh-filter-group--collapsed');
          });

          // Insert wrapper before the first item's original position
          const firstItem = Array.from(items)[0];
          firstItem.parentNode.insertBefore(wrapper, firstItem);
          groupEl = wrapper;
        }
      }
    });
  }

  function clearGroupFilters(groupId) {
    const params = new URLSearchParams(window.location.search);
    const keysToRemove = [];
    params.forEach(function (value, key) {
      if (key.startsWith('f[')) {
        const identifier = value.split(':')[0];
        if (FILTER_PARAM_MAP[identifier] === groupId || identifier === groupId) {
          keysToRemove.push(key);
        }
      }
    });
    keysToRemove.forEach(function (k) { params.delete(k); });
    window.location.search = params.toString();
  }

  // ── Active filter chips ─────────────────────────────────────

  function buildChips() {
    const container = document.getElementById('media-hub-chips');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const chips = [];

    params.forEach(function (value, key) {
      if (!key.startsWith('f[')) return;
      const parts = value.split(':');
      const identifier = parts[0];
      const label = parts.slice(1).join(':');
      if (label) {
        chips.push({ key: key, identifier: identifier, label: label });
      }
    });

    // Also handle sort
    if (params.get('sort_by')) {
      const sortLabel = params.get('sort_by') === 'created' ? Drupal.t('Newest') : Drupal.t('Name A–Z');
      chips.push({ key: 'sort_by', identifier: 'sort', label: sortLabel, noRemove: true });
    }

    container.innerHTML = '';
    chips.forEach(function (chip) {
      const el = document.createElement('div');
      el.className = 'media-hub-chip';
      el.innerHTML = Drupal.checkPlain(chip.label);
      if (!chip.noRemove) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'media-hub-chip__remove';
        btn.setAttribute('aria-label', Drupal.t('Remove filter @label', { '@label': chip.label }));
        btn.textContent = '×';
        btn.addEventListener('click', function () {
          removeFilter(chip.key);
        });
        el.appendChild(btn);
      }
      container.appendChild(el);
    });
  }

  function removeFilter(paramKey) {
    const params = new URLSearchParams(window.location.search);
    params.delete(paramKey);
    // Re-number f[] keys
    const fValues = [];
    params.forEach(function (value, key) {
      if (key.startsWith('f[')) fValues.push(value);
    });
    const otherParams = new URLSearchParams();
    params.forEach(function (value, key) {
      if (!key.startsWith('f[')) otherParams.append(key, value);
    });
    fValues.forEach(function (v, i) {
      otherParams.append('f[' + i + ']', v);
    });
    window.location.search = otherParams.toString();
  }

  // ── Hero search ─────────────────────────────────────────────

  function initHeroSearch() {
    const input = document.getElementById('media-hub-hero-search');
    if (!input) return;

    // Pre-populate with current keyword
    const params = new URLSearchParams(window.location.search);
    input.value = params.get('keywords') || '';

    let debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        const params = new URLSearchParams(window.location.search);
        if (input.value.trim()) {
          params.set('keywords', input.value.trim());
        } else {
          params.delete('keywords');
        }
        window.location.search = params.toString();
      }, 500);
    });
  }

  // ── Lightbox ────────────────────────────────────────────────

  function openLightbox(position) {
    const lb = document.getElementById('media-hub-lightbox');
    if (!lb || !cardIndex[position]) return;

    lightboxPos = position;
    lb.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    renderLightboxItem(cardIndex[position]);
    updateLightboxNav();

    lb.focus();
  }

  function closeLightbox() {
    const lb = document.getElementById('media-hub-lightbox');
    if (!lb) return;
    lb.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function renderLightboxItem(card) {
    const data = getCardData(card);
    const mediaEl = document.getElementById('lightbox-media');
    const captionEl = document.getElementById('lightbox-caption');
    const downloadEl = document.getElementById('lightbox-download');

    captionEl.textContent = data.caption || '';

    // Set download button
    if (data.downloadUrl && data.bundle !== 'remote_video') {
      downloadEl.href = data.downloadUrl;
      downloadEl.removeAttribute('hidden');
    } else {
      downloadEl.setAttribute('hidden', '');
    }

    // Render media content
    mediaEl.innerHTML = '';
    if (data.bundle === 'image') {
      const img = document.createElement('img');
      img.src = data.imgSrc;
      img.alt = data.name;
      mediaEl.appendChild(img);
    } else if (data.bundle === 'video' && data.videoUrl) {
      const video = document.createElement('video');
      video.src = data.videoUrl;
      video.controls = true;
      mediaEl.appendChild(video);
    } else if (data.bundle === 'remote_video' && data.videoUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = getEmbedUrl(data.videoUrl);
      iframe.allowFullscreen = true;
      iframe.allow = 'autoplay; encrypted-media';
      mediaEl.appendChild(iframe);
    } else if (data.bundle === 'document') {
      mediaEl.innerHTML =
        '<div class="lightbox-doc">' +
        '<span class="lightbox-doc-icon">&#128196;</span>' +
        '<strong>' + Drupal.checkPlain(data.name) + '</strong>' +
        (data.fileSize ? '<span>' + Drupal.checkPlain(data.fileSize) + '</span>' : '') +
        '</div>';
    } else if (data.bundle === 'audio') {
      const audio = document.createElement('audio');
      audio.src = data.downloadUrl;
      audio.controls = true;
      mediaEl.appendChild(audio);
    } else {
      // Fallback: show thumbnail
      const img = document.createElement('img');
      img.src = data.imgSrc;
      img.alt = data.name;
      mediaEl.appendChild(img);
    }

    // Fetch and render related images
    fetchRelated(data.id);
  }

  function getEmbedUrl(url) {
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1] + '?autoplay=0';
    // Vimeo
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return 'https://player.vimeo.com/video/' + vmMatch[1];
    return url;
  }

  function updateLightboxNav() {
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    if (prev) prev.style.visibility = lightboxPos > 0 ? 'visible' : 'hidden';
    if (next) next.style.visibility = lightboxPos < cardIndex.length - 1 ? 'visible' : 'hidden';
  }

  function fetchRelated(mediaId) {
    const container = document.getElementById('lightbox-related-thumbs');
    if (!container) return;
    container.innerHTML = '';

    fetch(drupalSettings.path.baseUrl + 'media-hub/related/' + mediaId)
      .then(function (r) { return r.json(); })
      .then(function (items) {
        if (!items || items.length === 0) {
          document.getElementById('lightbox-related').style.display = 'none';
          return;
        }
        document.getElementById('lightbox-related').style.display = '';
        items.forEach(function (item) {
          const thumb = document.createElement('div');
          thumb.className = 'media-hub-lightbox__related-thumb';
          thumb.setAttribute('role', 'button');
          thumb.setAttribute('tabindex', '0');
          thumb.setAttribute('aria-label', item.name);
          if (item.thumbnail) {
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.name;
            thumb.appendChild(img);
          }
          thumb.addEventListener('click', function () {
            // Find matching card in current index and open it
            const idx = cardIndex.findIndex(function (c) { return c.dataset.mediaId == item.id; });
            if (idx !== -1) {
              openLightbox(idx);
            } else {
              // Item not in current page; load its data directly
              loadLightboxById(item);
            }
          });
          container.appendChild(thumb);
        });
      })
      .catch(function () {
        document.getElementById('lightbox-related').style.display = 'none';
      });
  }

  function loadLightboxById(item) {
    // Synthetic card element to render in lightbox for related items not on current page
    const synth = document.createElement('div');
    synth.dataset.mediaId = item.id;
    synth.dataset.mediaBundle = item.bundle;
    synth.dataset.mediaName = item.name;
    synth.dataset.mediaCaption = '';
    synth.dataset.mediaDownloadUrl = '';
    synth.dataset.mediaVideoUrl = '';
    const img = document.createElement('img');
    img.src = item.thumbnail;
    synth.appendChild(img);
    renderLightboxItem(synth);
  }

  // ── Sidebar clone for lightbox ──────────────────────────────

  function cloneSidebarToLightbox() {
    const mainSidebar = document.getElementById('media-hub-sidebar');
    const lbSidebar = document.getElementById('lightbox-sidebar-filters');
    if (!mainSidebar || !lbSidebar) return;

    const clone = mainSidebar.cloneNode(true);
    clone.id = 'lightbox-sidebar-filters-inner';
    // Filter changes in lightbox close lightbox and navigate
    clone.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('change', function () {
        closeLightbox();
      });
    });
    lbSidebar.appendChild(clone);
  }

  // ── Lightbox sidebar search ─────────────────────────────────

  function initLightboxSidebarSearch() {
    const input = document.getElementById('lightbox-sidebar-search');
    if (!input) return;
    input.addEventListener('input', function () {
      const mainInput = document.querySelector('.media-hub-hero__search-input');
      if (mainInput) mainInput.value = input.value;
    });
  }

  // ── Bootstrap ───────────────────────────────────────────────

  Drupal.behaviors.mediaHub = {
    attach: function (context) {
      // Only run on the media hub page
      const page = context.querySelector ? context.querySelector('.media-hub-page') : null;
      const isPage = !!page || context.classList && context.classList.contains('media-hub-page');
      if (!isPage && context !== document) return;

      buildCardIndex();
      buildChips();
      initHeroSearch();

      // Wrap filter groups
      const sidebar = document.getElementById('media-hub-sidebar');
      wrapFilterGroups(sidebar);

      // Card click → lightbox
      document.querySelectorAll('.media-hub-card').forEach(function (card, i) {
        card.addEventListener('click', function () { openLightbox(i); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(i);
          }
        });
      });

      // Lightbox controls
      const lbClose = document.getElementById('media-hub-lightbox-close');
      if (lbClose) lbClose.addEventListener('click', closeLightbox);

      const lbPrev = document.getElementById('lightbox-prev');
      if (lbPrev) lbPrev.addEventListener('click', function () {
        if (lightboxPos > 0) openLightbox(lightboxPos - 1);
      });

      const lbNext = document.getElementById('lightbox-next');
      if (lbNext) lbNext.addEventListener('click', function () {
        if (lightboxPos < cardIndex.length - 1) openLightbox(lightboxPos + 1);
      });

      // Keyboard navigation
      document.addEventListener('keydown', function (e) {
        const lb = document.getElementById('media-hub-lightbox');
        if (!lb || lb.hasAttribute('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPos > 0) openLightbox(lightboxPos - 1);
        if (e.key === 'ArrowRight' && lightboxPos < cardIndex.length - 1) openLightbox(lightboxPos + 1);
      });

      // Lightbox sidebar
      cloneSidebarToLightbox();
      initLightboxSidebarSearch();
    }
  };

})(Drupal);
```

- [ ] **Step 2: Clear cache and test**

```bash
vendor/bin/drush cr
```

Visit `/media-hub` and verify:
- Hero search bar filters results when typing (after 500ms delay)
- Filter sidebar groups have collapsible headers
- Active filter chips appear when filters are applied
- Clicking a card opens the lightbox with the image
- Arrow keys and Escape close/navigate the lightbox
- Related images load below the lightbox image
- Download button appears for images/documents/video but not for remote_video

- [ ] **Step 3: Commit**

```bash
git add web/modules/custom/media_hub/js/media-hub.js
git commit -m "feat(media_hub): add JS for lightbox, filter chips, collapsibles, and hero search"
```

---

## Task 9: Final Config Export and Verification

- [ ] **Step 1: Export any config changes made during development**

```bash
vendor/bin/drush config:export -y
```

- [ ] **Step 2: Run all unit tests**

```bash
vendor/bin/phpunit web/modules/custom/media_hub/tests/
```

Expected: 5 tests, 5 assertions — PASS.

- [ ] **Step 3: Verify the view renders correctly**

```bash
vendor/bin/drush php:eval "
\$view = \Drupal\views\Views::getView('media_center');
\$view->setDisplay('page_1');
\$view->execute();
echo 'Results: ' . count(\$view->result) . PHP_EOL;
echo 'Filters: ' . implode(', ', array_keys(\$view->filter)) . PHP_EOL;
echo 'Sorts: ' . implode(', ', array_keys(\$view->sort)) . PHP_EOL;
"
```

Expected: `caption` NOT in filters list; `created` and `name` in sorts.

- [ ] **Step 4: Verify related endpoint**

Find a real media ID:

```bash
vendor/bin/drush php:eval "
\$ids = \Drupal::entityQuery('media')->accessCheck(FALSE)->range(0,1)->execute();
echo array_shift(\$ids);
"
```

Then test:

```bash
curl -s "http://localhost/media-hub/related/{ID}" | python3 -m json.tool
```

Expected: JSON array with up to 3 items each having `id`, `name`, `bundle`, `thumbnail`.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(media_hub): complete Media Hub redesign — hero, quick access, collapsible filters, lightbox, responsive images"
```
