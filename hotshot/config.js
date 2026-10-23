'use strict';

/* Hotshot Math config — mirrors the ProjectCalc config convention.
   kitFormUrl: the Google Apps Script web app URL for the operator-kit sign-up
   (https://script.google.com/macros/s/.../exec; see HOTSHOT-EMAIL-SETUP.md).
   Anything else, including empty, keeps the sign-up form disabled.
   analytics: same shape as assets/config.js; empty provider keeps analytics off (ANALYTICS.md). */
window.HotshotConfig = {
  kitFormUrl: '',
  analytics: { provider: '', domain: '', scriptUrl: '', websiteId: '', measurementId: '' },
};
