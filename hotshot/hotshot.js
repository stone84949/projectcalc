'use strict';

(function () {
  var form = document.getElementById('load-form');
  var verdict = document.getElementById('verdict');
  var lines = document.getElementById('printed-lines');
  var stamp = document.getElementById('stamp');
  var stampWord = document.getElementById('stamp-word');
  var stampSub = document.getElementById('stamp-sub');
  var verdictNote = document.getElementById('verdict-note');

  function money(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function row(label, value, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    var l = document.createElement('span');
    l.textContent = label;
    var v = document.createElement('span');
    v.textContent = value;
    p.appendChild(l);
    p.appendChild(v);
    return p;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var result = window.ProjectCalc.compute('hotshot-load', {
      ratePerMile: form.ratePerMile.value,
      flatRate: form.flatRate.value,
      miles: form.miles.value,
      deadheadMiles: form.deadheadMiles.value,
      fuelPrice: form.fuelPrice.value,
      truckMpg: form.truckMpg.value,
      tolls: form.tolls.value,
      factoringPct: form.factoringPct.value,
      minNetPerMile: form.minNetPerMile.value,
    });

    lines.innerHTML = '';
    stamp.hidden = true;

    if (!result.ok) {
      verdict.hidden = false;
      verdictNote.textContent = result.error;
      return;
    }

    var v = result.values;
    lines.appendChild(row('Gross linehaul', money(v.grossPay)));
    lines.appendChild(row('Total miles - ' + v.loadedMiles + ' loaded + ' + v.deadheadMiles + ' deadhead', v.totalMiles + ' mi'));
    lines.appendChild(row('Fuel - ' + v.fuelGallons + ' gal', '-' + money(v.fuelCost), 'neg'));
    if (v.tolls > 0) lines.appendChild(row('Tolls', '-' + money(v.tolls), 'neg'));
    if (v.factoringFee > 0) lines.appendChild(row('Factoring', '-' + money(v.factoringFee), 'neg'));
    lines.appendChild(row('Net to truck', money(v.netToTruck), 'net'));
    lines.appendChild(row('Net per total mile', '$' + v.netPerTotalMile.toFixed(2) + '/mi', 'net'));

    if (v.verdict) {
      stamp.hidden = false;
      stamp.classList.toggle('pass', v.verdict === 'pass');
      stampWord.textContent = v.verdict === 'take' ? 'TAKE IT' : 'PASS';
      stampSub.textContent = '$' + v.netPerTotalMile.toFixed(2) + '/MI NET';
      verdictNote.textContent = v.verdict === 'take'
        ? 'Clears your $' + v.minNetPerMile.toFixed(2) + '/mi minimum by $' + (v.netPerTotalMile - v.minNetPerMile).toFixed(2) + '.'
        : 'Under your $' + v.minNetPerMile.toFixed(2) + '/mi minimum by $' + (v.minNetPerMile - v.netPerTotalMile).toFixed(2) + '. Counter or pass.';
    } else {
      verdictNote.textContent = 'Set your minimum $/mi to get a take-it-or-pass stamp.';
    }

    verdict.hidden = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    verdict.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });

    // reprint animation: lines appear in order
    var rows = lines.querySelectorAll('p');
    Array.prototype.forEach.call(rows, function (p, i) {
      p.style.animationDelay = i * 0.12 + 's';
    });
  });

  // activate the kit capture only when a real endpoint exists
  var kitForm = document.querySelector('[data-kit-form]');
  var note = document.querySelector('[data-kit-note]');
  var endpoint = (window.HotshotConfig && window.HotshotConfig.kitFormUrl) || '';
  if (kitForm && endpoint) {
    var email = document.getElementById('kit-email');
    var button = kitForm.querySelector('.kit-btn');
    email.disabled = false;
    button.disabled = false;
    if (note) note.textContent = 'One email when the kit drops. Nothing else.';
    kitForm.addEventListener('submit', function (event) {
      event.preventDefault();
      window.location.href = endpoint + encodeURIComponent(email.value.trim());
    });
  }
})();
