/* ProjectCalc — public site config. Keep secrets out of this file. */
window.PROJECTCALC_CONFIG = {
  siteName: 'ProjectCalc',
  siteBase: 'https://projectcalc-tools.pages.dev',
  paypalUrl: '',
  productName: 'ProjectCalc Job Pack',
  productPrice: 9,
  version: '1.0.0',
  /* GA4 property "ProjectCalc". hosts keeps local runs and preview builds out of the numbers;
     add the new domain here when the site moves. See ANALYTICS.md. */
  analytics: { provider: 'ga4', measurementId: 'G-1W8VKWBBXY', hosts: ['projectcalc-tools.pages.dev'] }
};
