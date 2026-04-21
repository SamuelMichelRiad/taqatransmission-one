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
