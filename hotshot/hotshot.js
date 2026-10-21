'use strict';

(function () {
  var form = document.getElementById('load-form');
  var flag = document.getElementById('flag');
  var flagWord = document.getElementById('flag-word');
  var flagSub = document.getElementById('flag-sub');
  var verdictNote = document.getElementById('verdict-note');
  var netNeedle = document.getElementById('net-needle');
  var netReadout = document.getElementById('net-readout');
  var netState = document.getElementById('net-state');

  // Dial geometry: -90deg (empty) to +90deg (full sweep), 180deg total.
  function needleRotation(fraction) {
    var f = Math.max(0, Math.min(1, fraction));
    return -90 + f * 180;
  }

  function setNeedle(line, fraction) {
    line.style.transform = 'rotate(' + needleRotation(fraction) + 'deg)';
  }

  function setGaugeReadout(line, value) {
    var svg = line.parentNode;
    var readout = svg.querySelector('.readout');
    if (readout) readout.textContent = value;
  }

  function setGauge(name, fraction, value) {
    var line = form.querySelector('[data-gauge="' + name + '"]');
    if (!line) return;
    setNeedle(line, fraction);
    setGaugeReadout(line, value);
  }

  // NET bands share the needle pivot (100,105) at radius 85.
  // The amber/green junction sits at the operator's minimum.
  function bandPoint(fraction) {
    var f = Math.max(0.02, Math.min(0.98, fraction));
    var a = (-90 + f * 180) * Math.PI / 180;
    return (100 + 85 * Math.sin(a)).toFixed(1) + ' ' + (105 - 85 * Math.cos(a)).toFixed(1);
  }

  function setBands(minFraction) {
    var amber = document.getElementById('amber-band');
    var green = document.getElementById('green-band');
    if (!amber || !green) return;
    var p = bandPoint(minFraction);
    amber.setAttribute('d', 'M 15 105 A 85 85 0 0 1 ' + p);
    green.setAttribute('d', 'M ' + p + ' A 85 85 0 0 1 185 105');
  }

  var TICKS = 7; // across the sweep

  function drawTicks(group, sweepOnly) {
    if (!group) return;
    var html = '';
    for (var i = 0; i < TICKS; i++) {
      var angle = (-90 + (i / (TICKS - 1)) * 180) * Math.PI / 180;
      var cx = 100, cy = 105, r1 = 71, r2 = 80;
      if (sweepOnly && i === 0) continue; // peg start tick shared with rim
      var x1 = cx + r1 * Math.sin(angle), y1 = cy - r1 * Math.cos(angle);
      var x2 = cx + r2 * Math.sin(angle), y2 = cy - r2 * Math.cos(angle);
      html += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"></line>';
    }
    group.innerHTML = html;
  }

  var groups = form.querySelectorAll('.ticks');
  Array.prototype.forEach.call(groups, function (g) { drawTicks(g, false); });

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

    if (!result.ok) {
      verdictNote.textContent = result.error;
      return;
    }

    var v = result.values;
    setGauge('rate', v.effectiveRatePerMile / 5, v.effectiveRatePerMile.toFixed(2));
    setGauge('fuel', v.fuelCost / 500, '$' + Math.round(v.fuelCost));
    setGauge('deadhead', v.deadheadMiles / 500, String(v.deadheadMiles));
    setGauge('tolls', v.tolls / 500, '$' + Math.round(v.tolls));
    setGauge('factoring', v.factoringPct / 15, v.factoringPct.toFixed(1) + '%');
    setGauge('miles', v.loadedMiles / 5000, String(v.loadedMiles));

    var min = v.minNetPerMile || 0;
    var netFraction = Math.max(0, Math.min(1, v.netPerTotalMile / 4));
    if (min > 0) setBands(min / 4);
    setNeedle(netNeedle, netFraction);
    netReadout.textContent = '$' + v.netPerTotalMile.toFixed(2);

    if (v.verdict) {
      flag.hidden = false;
      flag.classList.toggle('pass', v.verdict === 'pass');
      flagWord.textContent = v.verdict === 'take' ? 'TAKE IT' : 'PASS';
      flagSub.textContent = '$' + v.netPerTotalMile.toFixed(2) + '/MI NET';
      netState.textContent = v.verdict === 'take' ? 'IN THE GREEN' : 'IN THE AMBER';
      verdictNote.textContent = v.verdict === 'take'
        ? 'Clears your $' + min.toFixed(2) + '/mi minimum by $' + (v.netPerTotalMile - min).toFixed(2) + '.'
        : 'Under your $' + min.toFixed(2) + '/mi minimum by $' + (min - v.netPerTotalMile).toFixed(2) + '. Counter or pass.';
    } else {
      flag.hidden = true;
      netState.textContent = 'NO MIN SET';
      verdictNote.textContent = 'Set MIN $/MI NET to get a take-it-or-pass flag.';
    }
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
