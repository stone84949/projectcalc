'use strict';

/* Hotshot Math single-calculator pages (cost per mile, factoring, deadhead).
   The form names its engine tool in data-hotshot-tool. Results recalculate
   silently as you type; each CALCULATE press is a deliberate run and sends one
   tool_run event with the tool slug only. Typed numbers never leave the page. */
(function () {
  var form = document.querySelector('form[data-hotshot-tool]');
  if (!form || !window.ProjectCalc) return;
  var tool = form.getAttribute('data-hotshot-tool');
  var card = document.getElementById('tool-result');
  var labelEl = document.getElementById('result-label');
  var mainEl = document.getElementById('result-main');
  var statusEl = document.getElementById('result-status');
  var rowsEl = document.getElementById('result-rows');
  // Results redraw on every keystroke; only a Calculate press is announced to screen readers.
  var announceEl = document.getElementById('result-announce');

  function track(name, props) {
    if (window.SiteTrack) window.SiteTrack.event(name, props);
  }

  function usd(n, digits) {
    var d = digits == null ? 2 : digits;
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function num(n) {
    return Number(n).toLocaleString('en-US');
  }

  function pct(n) {
    return String(n) + '%';
  }

  var RENDER = {
    'hotshot-cost-per-mile': function (v) {
      var rows = [
        ['Fixed costs per month', usd(v.fixedMonthly)],
        ['Fixed cost per mile - ' + usd(v.fixedMonthly, 0) + ' / ' + num(v.monthlyMiles) + ' mi', usd(v.fixedPerMile, 3)],
        ['Fuel per mile', usd(v.fuelPerMile, 3)],
        ['Maintenance and tires', usd(v.maintenancePerMile, 3)],
        ['Driver pay', usd(v.driverPayPerMile, 3)],
        ['Variable cost per mile', usd(v.variablePerMile, 3)],
        ['All-in cost per mile', usd(v.costPerMile, 3), 'net'],
        ['Target profit per mile', usd(v.profitPerMile, 3)],
        ['Loaded miles a month at ' + pct(v.deadheadPct) + ' deadhead', num(v.loadedMilesPerMonth)],
        ['Minimum rate per loaded mile (exact ' + usd(v.minRatePerLoadedMileExact, 3) + ')', usd(v.minRatePerLoadedMile), 'key'],
        ['Type into the panel\'s MIN $/MI NET', usd(v.panelMinNetPerMile), 'key'],
      ];
      return {
        label: 'MINIMUM RATE PER LOADED MILE',
        main: usd(v.minRatePerLoadedMile),
        status: 'Panel MIN $/MI NET: ' + usd(v.panelMinNetPerMile) + ' (no fuel - the panel subtracts it per load)',
        tone: '',
        rows: rows,
      };
    },
    'hotshot-factoring': function (v) {
      var rows = [
        ['Percent fee - ' + pct(v.factoringPct) + ' of ' + usd(v.invoiceAmount), usd(v.pctFee)],
        ['Flat fees', usd(v.flatFees)],
        ['Total fee', usd(v.totalFee), 'net'],
        ['Effective rate', pct(v.effectivePct), 'key'],
        ['Advance - ' + pct(v.advancePct) + ' of the invoice', usd(v.advance)],
        ['Cash today - advance minus fees', usd(v.cashToday), 'key'],
        ['Reserve later', usd(v.reserveLater)],
        ['You receive in total', usd(v.netReceived)],
      ];
      if (v.invoicesPerMonth > 0) {
        rows.push(['Revenue a month - ' + num(v.invoicesPerMonth) + ' invoices', usd(v.monthlyRevenue)]);
        rows.push(['Factoring cost a month', usd(v.monthlyFees), 'key']);
      }
      var per = v.perPointBasis === 'month'
        ? 'Every 1% on ' + usd(v.perPointBase) + '/month of revenue = ' + usd(v.perPointCost) + '/month'
        : 'Every 1% on this ' + usd(v.perPointBase) + ' invoice = ' + usd(v.perPointCost);
      return {
        label: 'TOTAL FEE ON THIS INVOICE',
        main: usd(v.totalFee),
        status: per,
        tone: '',
        rows: rows,
      };
    },
    'hotshot-deadhead': function (v) {
      var hasMin = v.minNetPerMile > 0;
      var rows = [
        ['Total miles - ' + num(v.loadedMiles) + ' loaded + ' + num(v.deadheadMiles) + ' empty', num(v.totalMiles)],
        ['Deadhead share of total miles', pct(v.deadheadPct)],
        ['Fuel for the empty miles', usd(v.deadheadFuelCost)],
        ['Fuel for the whole trip', usd(v.fuelCost)],
        ['Rate per loaded mile', usd(v.ratePerLoadedMile)],
        ['Rate per total mile', usd(v.ratePerTotalMile)],
        ['Net after fuel', usd(v.netAfterFuel)],
        ['Net after fuel per total mile', usd(v.netPerTotalMile), 'net'],
      ];
      var status;
      var tone;
      if (v.failsWithNoDeadhead) {
        status = hasMin
          ? 'Under your ' + usd(v.minNetPerMile) + '/mi minimum even with zero empty miles'
          : 'Fuel alone eats this rate, even with zero empty miles';
        tone = 'warn';
      } else if (!hasMin) {
        status = 'No minimum set: this is where net after fuel hits $0';
        tone = '';
      } else if (v.meetsMinimum) {
        status = 'Clears your ' + usd(v.minNetPerMile) + '/mi minimum at ' + num(v.deadheadMiles) + ' empty miles';
        tone = 'good';
      } else {
        status = 'Under your ' + usd(v.minNetPerMile) + '/mi minimum at ' + num(v.deadheadMiles) + ' empty miles';
        tone = 'warn';
      }
      return {
        label: hasMin ? 'MOST EMPTY MILES THIS LOAD CAN CARRY' : 'BREAK-EVEN DEADHEAD',
        main: num(v.breakEvenDeadheadMiles) + ' MI',
        status: status,
        tone: tone,
        rows: rows,
      };
    },
  };

  function read() {
    var input = {};
    Array.prototype.forEach.call(form.querySelectorAll('input[name]'), function (el) {
      input[el.name] = el.value;
    });
    return input;
  }

  function row(label, value, kind) {
    var p = document.createElement('p');
    if (kind === 'net') p.className = 'worked-net';
    if (kind === 'key') p.className = 'key';
    var a = document.createElement('span');
    a.textContent = label;
    var b = document.createElement('span');
    b.textContent = value;
    p.appendChild(a);
    p.appendChild(b);
    return p;
  }

  function run() {
    var result = window.ProjectCalc.compute(tool, read());
    if (!result.ok) {
      card.classList.add('is-error');
      labelEl.textContent = 'CHECK YOUR NUMBERS';
      mainEl.textContent = result.error;
      statusEl.textContent = '';
      rowsEl.textContent = '';
      return false;
    }
    var view = RENDER[tool](result.values);
    card.classList.remove('is-error');
    labelEl.textContent = view.label;
    mainEl.textContent = view.main;
    statusEl.textContent = view.status;
    statusEl.className = 'readout-status' + (view.tone ? ' ' + view.tone : '');
    rowsEl.textContent = '';
    view.rows.forEach(function (r) { rowsEl.appendChild(row(r[0], r[1], r[2])); });
    return true;
  }

  form.addEventListener('input', run);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var done = run();
    if (announceEl) announceEl.textContent = labelEl.textContent + ': ' + mainEl.textContent + '. ' + statusEl.textContent;
    if (done) track('tool_run', { tool: tool });
    if (card.scrollIntoView && card.getBoundingClientRect().top > window.innerHeight) card.scrollIntoView({ block: 'start' });
  });
  run();
})();
