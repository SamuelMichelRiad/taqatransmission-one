<?php

namespace Drupal\media_hub\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for Media Hub routes.
 *
 * Stub — fully implemented in Task 5.
 */
class MediaHubController extends ControllerBase {

  /**
   * Returns related media for a given media item.
   *
   * @param int $media_id
   *   The media entity ID.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response containing related media.
   */
  public function related(int $media_id): JsonResponse {
    return new JsonResponse([]);
  }

}
