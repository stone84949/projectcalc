'use strict';

/* Hotshot Math config — mirrors the ProjectCalc config convention.
   kitFormUrl: the Google Apps Script web app URL for the operator-kit sign-up
   (https://script.google.com/macros/s/.../exec; see HOTSHOT-EMAIL-SETUP.md).
   Anything else, including empty, keeps the sign-up form disabled.
   analytics: GA4 property "Hotshot Math"; same shape as assets/config.js (ANALYTICS.md).
   Add the Hotshot domain to hosts when it moves. */
window.HotshotConfig = {
  kitFormUrl: 'https://script.google.com/macros/s/AKfycbyKvT2aXhdxrNJTuc1cxaYZgaHyu5od9czeenITW_SPbJmp7bbob06wYdZka8Mf5zESUw/exec',
  analytics: { provider: 'ga4', measurementId: 'G-NLRYCRRB2H', hosts: ['projectcalc-tools.pages.dev'] },
};
