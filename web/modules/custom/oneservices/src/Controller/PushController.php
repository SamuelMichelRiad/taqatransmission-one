<?php

declare(strict_types=1);

namespace Drupal\oneservices\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\oneservices_push\Service\FcmBroadcaster;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class PushController extends ControllerBase {

  public function __construct(private readonly FcmBroadcaster $broadcaster) {}

  public static function create(ContainerInterface $container): self {
    return new self($container->get('oneservices.fcm_broadcaster'));
  }

  /**
   * POST /admin/oneservices/push/broadcast
   * Body (JSON or form): title, body, [data: { key: value, ... }]
   */
  public function broadcast(Request $request): JsonResponse {
    // Accept either JSON or form-urlencoded.
    $contentType = (string) $request->headers->get('Content-Type', '');
    $params = str_contains($contentType, 'application/json')
      ? (array) json_decode((string) $request->getContent(), true)
      : $request->request->all();

    $title = trim((string) ($params['title'] ?? ''));
    $body  = trim((string) ($params['body']  ?? ''));
    $data  = (array) ($params['data'] ?? []);

    if ($title === '' || $body === '') {
      return new JsonResponse(['ok' => false, 'error' => 'title and body are required'], 400);
    }

    $ok = $this->broadcaster->broadcast($title, $body, $data);
    return new JsonResponse(['ok' => $ok]);
  }
}

