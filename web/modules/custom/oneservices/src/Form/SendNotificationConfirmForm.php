<?php

declare(strict_types=1);

namespace Drupal\oneservices\Form;

use Drupal\Core\Form\ConfirmFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\oneservices\Service\FcmBroadcaster;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Component\Utility\Xss;

final class SendNotificationConfirmForm extends ConfirmFormBase {

  private ?NodeInterface $node = NULL;

  public function __construct(private readonly FcmBroadcaster $broadcaster) {}

  public static function create(ContainerInterface $container): self {
    return new self($container->get('oneservices.fcm_broadcaster'));
  }

  public function getFormId(): string {
    return 'oneservices_send_notification_confirm';
  }

  /**
   * Route param converter injects the Node here.
   */
  public function buildForm(array $form, FormStateInterface $form_state, NodeInterface $node = NULL): array {
    $this->node = $node;

    if (!$this->node || $this->node->bundle() !== 'notification') {
      $this->messenger()->addError($this->t('This action is only available for Notification content.'));
      return $this->cancelForm($form, $form_state);
    }

    $title = $this->node->label();
    $body  = '';
    if ($this->node->hasField('field_notification_subtitle') && !$this->node->get('field_notification_subtitle')->isEmpty()) {
      // Show a safe excerpt in the confirm screen.
      $raw = (string) $this->node->get('field_notification_subtitle')->value;
      $body = mb_strimwidth(strip_tags($raw), 0, 300, '…');
    }

    $form = parent::buildForm($form, $form_state);
    $form['details'] = [
      '#type' => 'item',
      '#title' => $this->t('You are about to send this notification to ALL users'),
      '#markup' => '<div><strong>' . $this->t('Title') . ':</strong> ' . Xss::filterAdmin($title) . '</div>'
        . ($body !== '' ? '<div style="margin-top:6px"><strong>' . $this->t('Subtitle') . ':</strong> '
          . Xss::filterAdmin($body) . '</div>' : ''),
    ];

    return $form;
  }

  public function getQuestion(): string {
    return (string) $this->t('Send this notification now?');
  }

  public function getCancelUrl(): Url {
    return Url::fromRoute('entity.node.canonical', ['node' => $this->node?->id()]);
  }

  public function getConfirmText(): string {
    return (string) $this->t('Send now');
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    if (!$this->node) {
      $this->messenger()->addError($this->t('Node not found.'));
      $form_state->setRedirectUrl(Url::fromRoute('<front>'));
      return;
    }

    $title = $this->node->label() ?: $this->t('Notification');
    $body  = '';
    if ($this->node->hasField('field_notification_subtitle') && !$this->node->get('field_notification_subtitle')->isEmpty()) {
      $body = (string) $this->node->get('field_notification_subtitle')->value;
    }

    try {
      $ok = $this->broadcaster->broadcast((string) $title, (string) $body, [
        'deeplink' => 'oneservices://notifications',
        'nid' => (string) $this->node->id(),
      ]);
      $ok
        ? $this->messenger()->addStatus($this->t('Push broadcast sent.'))
        : $this->messenger()->addError($this->t('Failed to send push broadcast.'));
    } catch (\Throwable $e) {
      $this->messenger()->addError($this->t('Error sending push: @msg', ['@msg' => $e->getMessage()]));
      $this->logger('oneservices_push')->error($e->getMessage());
    }

    $form_state->setRedirectUrl($this->getCancelUrl());
  }
}

