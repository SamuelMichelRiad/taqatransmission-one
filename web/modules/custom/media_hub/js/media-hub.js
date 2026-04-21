// web/modules/custom/media_hub/js/media-hub.js
/* global Drupal, drupalSettings */

(function (Drupal) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  const FILTER_GROUPS = [
    { id: 'category',         label: 'Category',        collapsed: false },
    { id: 'license',          label: 'License & Usage', collapsed: false },
    { id: 'type',             label: 'Media Type',      collapsed: false },
    { id: 'tags',             label: 'Tags',            collapsed: false },
    { id: 'more',             label: 'More Filters',    collapsed: true  },
  ];

  // Map URL query param identifiers to their group id
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

  let cardIndex = [];
  let lightboxPos = 0;

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
      const identifiers = Object.keys(FILTER_PARAM_MAP).filter(function (k) {
        return FILTER_PARAM_MAP[k] === group.id || k === group.id;
      });

      const inputs = [];
      identifiers.forEach(function (id) {
        container.querySelectorAll('[name*="' + id + '"], [id*="' + id + '"]').forEach(function (el) {
          inputs.push(el);
        });
      });

      if (inputs.length === 0) return;

      const items = new Set();
      inputs.forEach(function (input) {
        const item = input.closest('.js-form-item, .form-item, .js-form-wrapper, .form-wrapper');
        if (item) items.add(item);
      });

      if (items.size === 0) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'mh-filter-group' + (group.collapsed ? ' mh-filter-group--collapsed' : '');
      wrapper.dataset.groupId = group.id;

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'mh-filter-group__header';
      header.innerHTML = Drupal.t(group.label) + '<span class="mh-filter-group__chevron" aria-hidden="true">&#9660;</span>';
      header.addEventListener('click', function () {
        wrapper.classList.toggle('mh-filter-group--collapsed');
      });

      const body = document.createElement('div');
      body.className = 'mh-filter-group__body';

      items.forEach(function (item) {
        body.appendChild(item);
      });

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

      const firstItem = Array.from(items)[0];
      if (firstItem.parentNode) {
        firstItem.parentNode.insertBefore(wrapper, firstItem);
      }
    });
  }

  function clearGroupFilters(groupId) {
    const params = new URLSearchParams(window.location.search);
    const fValues = [];
    const otherParams = new URLSearchParams();

    params.forEach(function (value, key) {
      if (key.startsWith('f[')) {
        const identifier = value.split(':')[0];
        const belongsToGroup = FILTER_PARAM_MAP[identifier] === groupId || identifier === groupId;
        if (!belongsToGroup) {
          fValues.push(value);
        }
      } else {
        otherParams.append(key, value);
      }
    });

    fValues.forEach(function (v, i) {
      otherParams.append('f[' + i + ']', v);
    });

    window.location.search = otherParams.toString();
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

    container.innerHTML = '';
    chips.forEach(function (chip) {
      const el = document.createElement('div');
      el.className = 'media-hub-chip';

      const text = document.createTextNode(chip.label);
      el.appendChild(text);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'media-hub-chip__remove';
      btn.setAttribute('aria-label', Drupal.t('Remove filter @label', { '@label': chip.label }));
      btn.textContent = '\u00d7';
      btn.addEventListener('click', function () {
        removeFilter(chip.key);
      });
      el.appendChild(btn);
      container.appendChild(el);
    });
  }

  function removeFilter(paramKey) {
    const params = new URLSearchParams(window.location.search);
    const fValues = [];
    const otherParams = new URLSearchParams();

    params.forEach(function (value, key) {
      if (key.startsWith('f[')) {
        if (key !== paramKey) fValues.push(value);
      } else {
        otherParams.append(key, value);
      }
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

    const params = new URLSearchParams(window.location.search);
    input.value = params.get('keywords') || '';

    let debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        const p = new URLSearchParams(window.location.search);
        if (input.value.trim()) {
          p.set('keywords', input.value.trim());
        } else {
          p.delete('keywords');
        }
        window.location.search = p.toString();
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

    // Stop any playing video/audio
    const mediaEl = document.getElementById('lightbox-media');
    if (mediaEl) {
      mediaEl.querySelectorAll('video, audio, iframe').forEach(function (el) {
        if (el.tagName === 'IFRAME') {
          el.src = el.src;
        } else {
          el.pause();
        }
      });
    }
  }

  function renderLightboxItem(card) {
    const data = getCardData(card);
    const mediaEl = document.getElementById('lightbox-media');
    const captionEl = document.getElementById('lightbox-caption');
    const downloadEl = document.getElementById('lightbox-download');

    if (captionEl) captionEl.textContent = data.caption || '';

    if (downloadEl) {
      if (data.downloadUrl && data.bundle !== 'remote_video') {
        downloadEl.href = data.downloadUrl;
        downloadEl.removeAttribute('hidden');
      } else {
        downloadEl.setAttribute('hidden', '');
      }
    }

    if (!mediaEl) return;
    mediaEl.innerHTML = '';

    if (data.bundle === 'image') {
      const img = document.createElement('img');
      img.src = data.imgSrc;
      img.alt = data.name || '';
      mediaEl.appendChild(img);
    } else if (data.bundle === 'video' && data.videoUrl) {
      const video = document.createElement('video');
      video.src = data.videoUrl;
      video.controls = true;
      mediaEl.appendChild(video);
    } else if (data.bundle === 'remote_video' && data.videoUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = getEmbedUrl(data.videoUrl);
      iframe.setAttribute('allowfullscreen', '');
      iframe.allow = 'autoplay; encrypted-media';
      mediaEl.appendChild(iframe);
    } else if (data.bundle === 'document') {
      const doc = document.createElement('div');
      doc.className = 'lightbox-doc';
      doc.innerHTML =
        '<span class="lightbox-doc-icon" aria-hidden="true">&#128196;</span>' +
        '<strong>' + escapeHtml(data.name || '') + '</strong>' +
        (data.fileSize ? '<span>' + escapeHtml(data.fileSize) + '</span>' : '');
      mediaEl.appendChild(doc);
    } else if (data.bundle === 'audio') {
      const audio = document.createElement('audio');
      audio.src = data.downloadUrl;
      audio.controls = true;
      mediaEl.appendChild(audio);
    } else {
      // Fallback: show thumbnail image
      const img = document.createElement('img');
      img.src = data.imgSrc;
      img.alt = data.name || '';
      mediaEl.appendChild(img);
    }

    fetchRelated(data.id);
  }

  function getEmbedUrl(url) {
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch) return 'https://www.youtube.com/embed/' + ytMatch[1];
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return 'https://player.vimeo.com/video/' + vmMatch[1];
    return url;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateLightboxNav() {
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    if (prev) prev.style.visibility = lightboxPos > 0 ? 'visible' : 'hidden';
    if (next) next.style.visibility = lightboxPos < cardIndex.length - 1 ? 'visible' : 'hidden';
  }

  function fetchRelated(mediaId) {
    const relatedSection = document.getElementById('lightbox-related');
    const container = document.getElementById('lightbox-related-thumbs');
    if (!container) return;
    container.innerHTML = '';

    const base = (typeof drupalSettings !== 'undefined' && drupalSettings.path && drupalSettings.path.baseUrl)
      ? drupalSettings.path.baseUrl
      : '/';

    fetch(base + 'media-hub/related/' + mediaId)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (items) {
        if (!items || items.length === 0) {
          if (relatedSection) relatedSection.style.display = 'none';
          return;
        }
        if (relatedSection) relatedSection.style.display = '';
        items.forEach(function (item) {
          const thumb = document.createElement('div');
          thumb.className = 'media-hub-lightbox__related-thumb';
          thumb.setAttribute('role', 'button');
          thumb.setAttribute('tabindex', '0');
          thumb.setAttribute('aria-label', item.name || '');

          if (item.thumbnail) {
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.name || '';
            thumb.appendChild(img);
          }

          thumb.addEventListener('click', function () {
            const idx = cardIndex.findIndex(function (c) {
              return c.dataset.mediaId == item.id;
            });
            if (idx !== -1) {
              lightboxPos = idx;
              renderLightboxItem(cardIndex[idx]);
              updateLightboxNav();
            } else {
              loadLightboxByData(item);
            }
          });

          thumb.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              thumb.click();
            }
          });

          container.appendChild(thumb);
        });
      })
      .catch(function () {
        if (relatedSection) relatedSection.style.display = 'none';
      });
  }

  function loadLightboxByData(item) {
    const synth = document.createElement('div');
    synth.dataset.mediaId = item.id;
    synth.dataset.mediaBundle = item.bundle || 'image';
    synth.dataset.mediaName = item.name || '';
    synth.dataset.mediaCaption = '';
    synth.dataset.mediaDownloadUrl = '';
    synth.dataset.mediaVideoUrl = '';
    synth.dataset.mediaFileSize = '';
    synth.dataset.mediaFileExt = '';
    if (item.thumbnail) {
      const img = document.createElement('img');
      img.src = item.thumbnail;
      synth.appendChild(img);
    }
    renderLightboxItem(synth);
  }

  // ── Sidebar clone for lightbox ──────────────────────────────

  function cloneSidebarToLightbox() {
    const mainSidebar = document.getElementById('media-hub-sidebar');
    const lbSidebar = document.getElementById('lightbox-sidebar-filters');
    if (!mainSidebar || !lbSidebar) return;

    lbSidebar.innerHTML = '';
    const clone = mainSidebar.cloneNode(true);
    clone.id = '';
    clone.removeAttribute('id');

    // Changing any filter in lightbox closes lightbox first
    clone.querySelectorAll('input, select').forEach(function (input) {
      input.addEventListener('change', function () {
        closeLightbox();
      });
    });

    lbSidebar.appendChild(clone);
  }

  // ── Lightbox sidebar search ─────────────────────────────────

  function initLightboxSidebarSearch() {
    const lbInput = document.getElementById('lightbox-sidebar-search');
    if (!lbInput) return;
    lbInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const p = new URLSearchParams(window.location.search);
        if (lbInput.value.trim()) {
          p.set('keywords', lbInput.value.trim());
        } else {
          p.delete('keywords');
        }
        closeLightbox();
        window.location.search = p.toString();
      }
    });
  }

  // ── Bootstrap ───────────────────────────────────────────────

  Drupal.behaviors.mediaHub = {
    attach: function (context) {
      const page = context === document
        ? document.querySelector('.media-hub-page')
        : (context.classList && context.classList.contains('media-hub-page') ? context : context.querySelector('.media-hub-page'));

      if (!page) return;

      buildCardIndex();
      buildChips();
      initHeroSearch();

      const sidebar = document.getElementById('media-hub-sidebar');
      wrapFilterGroups(sidebar);

      // Card click/keyboard → open lightbox
      cardIndex.forEach(function (card, i) {
        card.addEventListener('click', function () { openLightbox(i); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(i);
          }
        });
      });

      // Lightbox close
      const lbClose = document.getElementById('media-hub-lightbox-close');
      if (lbClose) lbClose.addEventListener('click', closeLightbox);

      // Lightbox nav arrows
      const lbPrev = document.getElementById('lightbox-prev');
      if (lbPrev) lbPrev.addEventListener('click', function () {
        if (lightboxPos > 0) openLightbox(lightboxPos - 1);
      });

      const lbNext = document.getElementById('lightbox-next');
      if (lbNext) lbNext.addEventListener('click', function () {
        if (lightboxPos < cardIndex.length - 1) openLightbox(lightboxPos + 1);
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', function (e) {
        const lb = document.getElementById('media-hub-lightbox');
        if (!lb || lb.hasAttribute('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPos > 0) openLightbox(lightboxPos - 1);
        if (e.key === 'ArrowRight' && lightboxPos < cardIndex.length - 1) openLightbox(lightboxPos + 1);
      });

      // Clone sidebar into lightbox and init its search
      cloneSidebarToLightbox();
      initLightboxSidebarSearch();
    }
  };

})(Drupal);
