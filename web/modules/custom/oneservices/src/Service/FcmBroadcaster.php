<?php

declare(strict_types=1);

namespace Drupal\oneservices\Service;

use Google\Auth\ApplicationDefaultCredentials;
use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;

final class FcmBroadcaster {

  private string $projectId;
  private Client $http;

  public function __construct(string $projectId, string $serviceAccountJsonPath) {
    $this->projectId = $projectId;

    // Google Auth via service account JSON (HTTP v1 API).
    putenv("GOOGLE_APPLICATION_CREDENTIALS={$serviceAccountJsonPath}");
    $scopes = ['https://www.googleapis.com/auth/firebase.messaging'];

    $stack = HandlerStack::create();
    $stack->push(ApplicationDefaultCredentials::getMiddleware($scopes));

    $this->http = new Client([
      'handler' => $stack,
      'auth' => 'google_auth',
      'timeout' => 10,
    ]);
  }

  /**
   * Send a notification to the "all" topic.
   */
  public function broadcast(string $title, string $body, array $data = []) : bool {
    $url = sprintf('https://fcm.googleapis.com/v1/projects/%s/messages:send', $this->projectId);

    $payload = [
      'message' => [
        'topic' => 'all',
        'notification' => ['title' => $title, 'body' => $body],
        'data' => array_map('strval', $data), // values must be strings
        'android' => [
          'priority' => 'HIGH',
          'notification' => ['channel_id' => 'memos'],
        ],
        'apns' => [
          'headers' => ['apns-priority' => '10'],
          'payload' => ['aps' => ['sound' => 'default']],
        ],
      ],
    ];

    $res = $this->http->post($url, ['json' => $payload]);
    return $res->getStatusCode() >= 200 && $res->getStatusCode() < 300;
  }
}

