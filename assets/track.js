'use strict';

/* Site analytics — off until a config names a provider with complete settings.
   Reads PROJECTCALC_CONFIG.analytics or HotshotConfig.analytics. Plausible, Umami
   and GA4 each read utm_* tags from the landing URL themselves.
   Events carry the tool or guide name only, never typed numbers or email addresses.
   See ANALYTICS.md for the event list and how to turn a provider on. */
(function (root) {
  const EVENTS = ['tool_run', 'verdict_take', 'verdict_pass', 'copy_results', 'print_sheet', 'signup', 'outbound_affiliate', 'guide_view'];
  const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
  const GA4_ID = /^G-[A-Z0-9]{4,}$/;

  const PROVIDERS = {
    plausible: {
      valid: (c) => DOMAIN.test(c.domain || '') && (!c.scriptUrl || HTTPS_URL.test(c.scriptUrl)),
      script: (c) => ({ src: c.scriptUrl || 'https://plausible.io/js/script.js', attrs: { 'data-domain': c.domain } }),
      send: (name, props) => root.plausible(name, { props }),
      ready: () => typeof root.plausible === 'function',
    },
    umami: {
      valid: (c) => HTTPS_URL.test(c.scriptUrl || '') && UUID.test(c.websiteId || ''),
      script: (c) => ({ src: c.scriptUrl, attrs: { 'data-website-id': c.websiteId } }),
      send: (name, props) => root.umami.track(name, props),
      ready: () => Boolean(root.umami && root.umami.track),
    },
    ga4: {
      valid: (c) => GA4_ID.test(c.measurementId || ''),
      script: (c) => ({ src: 'https://www.googletagmanager.com/gtag/js?id=' + c.measurementId, attrs: {} }),
      send: (name, props) => root.gtag('event', name, props),
      ready: () => typeof root.gtag === 'function',
    },
  };

  function settings() {
    const cfg = root.PROJECTCALC_CONFIG || root.HotshotConfig || {};
    return cfg.analytics || {};
  }

  function pick(config) {
    const provider = PROVIDERS[String(config.provider || '').toLowerCase()];
    return provider && provider.valid(config) ? provider : null;
  }

  function cleanProps(props) {
    const out = {};
    Object.entries(props || {}).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length <= 80) out[key] = value;
    });
    return out;
  }

  function create(config, doc) {
    const provider = pick(config);
    const queue = [];
    let loaded = false;

    function flush() {
      if (!provider || !provider.ready()) return;
      loaded = true;
      queue.splice(0).forEach(([name, props]) => provider.send(name, props));
    }

    function event(name, props) {
      if (!provider || EVENTS.indexOf(name) === -1) return false;
      queue.push([name, cleanProps(props)]);
      if (loaded) flush();
      return true;
    }

    if (provider && doc) {
      if (provider === PROVIDERS.ga4) {
        root.dataLayer = root.dataLayer || [];
        root.gtag = function () { root.dataLayer.push(arguments); };
        root.gtag('js', new Date());
        root.gtag('config', config.measurementId);
      }
      const spec = provider.script(config);
      const tag = doc.createElement('script');
      tag.async = true;
      tag.src = spec.src;
      Object.entries(spec.attrs).forEach(([key, value]) => tag.setAttribute(key, value));
      tag.addEventListener('load', flush);
      doc.head.appendChild(tag);
      flush();

      // Affiliate links are marked rel="sponsored"; count the click, not the person.
      doc.addEventListener('click', (e) => {
        const link = e.target.closest && e.target.closest('a[rel~="sponsored"]');
        if (link) event('outbound_affiliate', { host: link.hostname });
      });
    }

    return { enabled: Boolean(provider), event };
  }

  const api = create(settings(), root.document);
  api.create = create;
  api.EVENTS = EVENTS.slice();
  root.SiteTrack = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
