<?php

namespace Drupal\media_hub\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class MediaHubController extends ControllerBase {

  public function related(int $media_id): JsonResponse {
    $storage = $this->entityTypeManager()->getStorage('media');
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
