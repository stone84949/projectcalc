'use strict';

/* Hotshot Math IFTA calculator (/hotshot/ifta/). One row per jurisdiction; the
   'hotshot-ifta' engine tool does the math. Results recalculate silently as you
   type; only a CALCULATE press is announced to screen readers and sends one
   tool_run event with the tool slug. Typed numbers never leave the page. */
(function () {
  var form = document.getElementById('ifta-form');
  if (!form || !window.ProjectCalc) return;
  var tool = form.getAttribute('data-hotshot-tool');
  var rowsBox = document.getElementById('ifta-rows');
  var addBtn = document.getElementById('ifta-add');
  var clearBtn = document.getElementById('ifta-clear');
  var countEl = document.getElementById('ifta-count');
  var card = document.getElementById('tool-result');
  var labelEl = document.getElementById('result-label');
  var mainEl = document.getElementById('result-main');
  var statusEl = document.getElementById('result-status');
  var rowsEl = document.getElementById('result-rows');
  var announceEl = document.getElementById('result-announce');
  var MAX_ROWS = 30;
  var nextId = rowsBox.querySelectorAll('.ifta-row').length + 1;

  function track(name, props) {
    if (window.SiteTrack) window.SiteTrack.event(name, props);
  }

  function usd(n, digits) {
    var d = digits == null ? 2 : digits;
    var sign = n < 0 ? '-' : '';
    return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function gal(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function num(n) {
    return Number(n).toLocaleString('en-US');
  }

  function rowEls() {
    return Array.prototype.slice.call(rowsBox.querySelectorAll('.ifta-row'));
  }

  function field(row, name) {
    return row.querySelector('[data-field="' + name + '"]');
  }

  function read() {
    return {
      fleetMpg: document.getElementById('fleetMpg').value,
      jurisdictions: rowEls().map(function (row) {
        return {
          name: field(row, 'name').value,
          miles: field(row, 'miles').value,
          gallonsPurchased: field(row, 'gallonsPurchased').value,
          ratePerGallon: field(row, 'ratePerGallon').value,
        };
      }),
    };
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

  // Row titles, remove-button labels and the row count follow the current order.
  function refreshRows() {
    var rows = rowEls();
    rows.forEach(function (r, i) {
      r.querySelector('[data-row-title]').textContent = 'ROW ' + (i + 1);
      var btn = r.querySelector('[data-remove]');
      btn.setAttribute('aria-label', 'Remove row ' + (i + 1));
      btn.disabled = rows.length === 1;
    });
    addBtn.disabled = rows.length >= MAX_ROWS;
    countEl.textContent = rows.length >= MAX_ROWS ? 'That is the most rows this calculator holds (' + MAX_ROWS + ').' : '';
  }

  function newRow() {
    var id = 'j' + nextId;
    nextId += 1;
    var div = document.createElement('div');
    div.className = 'ifta-row';
    div.innerHTML =
      '<p class="ifta-row-head"><span class="ifta-row-title" data-row-title></span><button class="ifta-remove" type="button" data-remove>REMOVE</button></p>' +
      '<div class="mini"><label for="' + id + '-name">JURISDICTION</label>' +
      '<input id="' + id + '-name" data-field="name" type="text" maxlength="12" placeholder="e.g. TN"></div>' +
      '<div class="mini"><label for="' + id + '-miles">MILES DRIVEN</label>' +
      '<input id="' + id + '-miles" data-field="miles" type="number" inputmode="decimal" step="any" min="0"></div>' +
      '<div class="mini"><label for="' + id + '-gal">GALLONS BOUGHT</label>' +
      '<input id="' + id + '-gal" data-field="gallonsPurchased" type="number" inputmode="decimal" step="any" min="0"></div>' +
      '<div class="mini"><label for="' + id + '-rate">RATE $/GAL</label>' +
      '<input id="' + id + '-rate" data-field="ratePerGallon" type="number" inputmode="decimal" step="any" min="0" aria-describedby="' + id + '-rate-hint">' +
      '<span class="hint" id="' + id + '-rate-hint">From the current IFTA matrix.</span></div>';
    return div;
  }

  function view(v) {
    var out = { rows: [] };
    var mpgText = gal(v.mpgUsed) + ' mpg' + (v.mpgOverridden ? ' (your own figure)' : '');
    var example = rowsBox.querySelector('.ifta-row.is-example') ? ' - EXAMPLE numbers, type over them' : '';
    if (v.taxComplete) {
      out.label = v.totalTax < 0 ? 'NET CREDIT' : 'NET TAX DUE';
      out.main = usd(Math.abs(v.totalTax));
      out.status = 'Fleet MPG ' + gal(v.mpgUsed) + (v.mpgOverridden ? ' (yours)' : '') + example;
    } else {
      out.label = 'FLEET MPG';
      out.main = gal(v.mpgUsed);
      out.status = 'Add a rate for ' + v.rowsMissingRate + (v.rowsMissingRate === 1 ? ' row' : ' rows') + ' to see the tax due' + example;
    }
    out.rows.push(['Total miles', num(v.totalMiles)]);
    out.rows.push(['Total gallons bought', gal(v.totalGallonsPurchased)]);
    out.rows.push(['Fleet MPG used - ' + (v.mpgOverridden ? 'the figure you typed' : 'miles / gallons'), mpgText]);
    v.jurisdictions.forEach(function (j) {
      var label = j.name + ': ' + gal(j.taxableGallons) + ' taxable - ' + gal(j.gallonsPurchased) + ' bought = ' + gal(j.netTaxableGallons) + ' net gal';
      if (j.tax == null) {
        out.rows.push([label + ' (no rate yet)', '--']);
      } else {
        out.rows.push([label + ' x ' + usd(j.ratePerGallon, 4), usd(j.tax)]);
      }
    });
    out.rows.push(['Net taxable gallons, all rows', gal(v.netTaxableGallons)]);
    if (v.totalTax != null) {
      out.rows.push([v.taxComplete ? 'Net tax due (credit if negative)' : 'Tax on the rows with a rate (incomplete)', usd(v.totalTax), v.taxComplete ? 'net' : 'key']);
    }
    return out;
  }

  function run() {
    var input = read();
    var result = window.ProjectCalc.compute(tool, input);
    if (!result.ok) {
      var allBlank = input.jurisdictions.every(function (j) { return !j.miles && !j.gallonsPurchased && !j.ratePerGallon; });
      card.classList.toggle('is-error', !allBlank);
      labelEl.textContent = allBlank ? 'ENTER YOUR MILES AND GALLONS' : 'CHECK YOUR NUMBERS';
      mainEl.textContent = allBlank ? '--' : result.error;
      statusEl.textContent = '';
      statusEl.className = 'readout-status';
      rowsEl.textContent = '';
      return false;
    }
    var v = view(result.values);
    card.classList.remove('is-error');
    labelEl.textContent = v.label;
    mainEl.textContent = v.main;
    statusEl.textContent = v.status;
    statusEl.className = 'readout-status';
    rowsEl.textContent = '';
    v.rows.forEach(function (r) { rowsEl.appendChild(row(r[0], r[1], r[2])); });
    return true;
  }

  form.addEventListener('input', function (event) {
    // Typing in an example row makes it yours: the EXAMPLE tag comes off.
    var row = event.target.closest && event.target.closest('.ifta-row');
    if (row) row.classList.remove('is-example');
    run();
  });

  rowsBox.addEventListener('click', function (event) {
    var btn = event.target.closest && event.target.closest('[data-remove]');
    if (!btn || btn.disabled) return;
    var rows = rowEls();
    if (rows.length === 1) return;
    btn.closest('.ifta-row').remove();
    refreshRows();
    addBtn.focus();
    run();
  });

  addBtn.addEventListener('click', function () {
    if (rowEls().length >= MAX_ROWS) return;
    var r = newRow();
    rowsBox.appendChild(r);
    refreshRows();
    field(r, 'name').focus();
    run();
  });

  // Clears every row (examples or your own) back to one blank row, so you can start clean.
  clearBtn.addEventListener('click', function () {
    var rows = rowEls();
    rows.slice(1).forEach(function (r) { r.remove(); });
    var first = rows[0];
    ['name', 'miles', 'gallonsPurchased', 'ratePerGallon'].forEach(function (f) { field(first, f).value = ''; });
    first.classList.remove('is-example');
    refreshRows();
    field(first, 'name').focus();
    run();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var done = run();
    if (announceEl) announceEl.textContent = labelEl.textContent + ': ' + mainEl.textContent + '. ' + statusEl.textContent;
    if (done) track('tool_run', { tool: tool });
    if (card.scrollIntoView && card.getBoundingClientRect().top > window.innerHeight) card.scrollIntoView({ block: 'start' });
  });

  refreshRows();
  run();
})();
