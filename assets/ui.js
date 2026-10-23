'use strict';

(function () {
  const SCHEMAS = {
    paint: {
      headline: 'Paint calculator',
      lead: 'Walls first. Doors are 21 sq ft and windows 15 sq ft unless you change coverage.',
      fields: [
        { name: 'lengthFt', label: 'Length', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'widthFt', label: 'Width', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'heightFt', label: 'Ceiling height', unit: 'ft', type: 'number', step: '0.1', value: 8, min: 6 },
        { name: 'doors', label: 'Doors', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'windows', label: 'Windows', type: 'number', step: '1', value: 2, min: 0 },
        {
          name: 'coats',
          label: 'Coats',
          type: 'select',
          value: '2',
          options: [
            { value: '1', label: '1 coat' },
            { value: '2', label: '2 coats' },
            { value: '3', label: '3 coats' },
          ],
        },
        { name: 'coverageSqFtPerGal', label: 'Coverage', unit: 'sq ft / gal', type: 'number', step: '5', value: 375, min: 150 },
        { name: 'pricePerGallon', label: 'Your gallon price', unit: 'USD', type: 'number', step: '0.01', value: 35, min: 0 },
        { name: 'includeCeiling', label: 'Include the ceiling', type: 'checkbox', value: false, wide: true },
      ],
    },
    'square-footage': {
      headline: 'Square footage calculator',
      lead: 'Add every room. Total floor area is what flooring, tile, and cost tools need next.',
      rooms: true,
    },
    mulch: {
      headline: 'Mulch calculator',
      lead: 'Volume is area × depth. One cubic yard covers 108 sq ft at 3 inches.',
      fields: [
        { name: 'lengthFt', label: 'Bed length', unit: 'ft', type: 'number', step: '0.1', value: 10, min: 0.5 },
        { name: 'widthFt', label: 'Bed width', unit: 'ft', type: 'number', step: '0.1', value: 20, min: 0.5 },
        { name: 'depthIn', label: 'Depth', unit: 'inches', type: 'number', step: '0.5', value: 3, min: 0.5 },
        { name: 'bagCuFt', label: 'Bag size', unit: 'cu ft', type: 'number', step: '0.5', value: 2, min: 0.5 },
        { name: 'pricePerYard', label: 'Bulk price / cu yd', unit: 'USD', type: 'number', step: '0.01', value: 40, min: 0 },
      ],
    },
    concrete: {
      headline: 'Concrete bag calculator',
      lead: 'Uses Quikrete published yields. 80 lb bags yield 0.60 cu ft.',
      fields: [
        { name: 'lengthFt', label: 'Length', unit: 'ft', type: 'number', step: '0.1', value: 10, min: 0.5 },
        { name: 'widthFt', label: 'Width', unit: 'ft', type: 'number', step: '0.1', value: 10, min: 0.5 },
        { name: 'thicknessIn', label: 'Thickness', unit: 'inches', type: 'number', step: '0.5', value: 4, min: 1 },
        {
          name: 'bagLb',
          label: 'Bag size',
          type: 'select',
          value: '80',
          options: [
            { value: '40', label: '40 lb (0.30 cu ft)' },
            { value: '50', label: '50 lb (0.375 cu ft)' },
            { value: '60', label: '60 lb (0.45 cu ft)' },
            { value: '80', label: '80 lb (0.60 cu ft)' },
            { value: '90', label: '90 lb (0.675 cu ft)' },
          ],
        },
        { name: 'wastePct', label: 'Waste', unit: '%', type: 'number', step: '1', value: 5, min: 0 },
        { name: 'pricePerBag', label: 'Price per bag', unit: 'USD', type: 'number', step: '0.01', value: 7, min: 0 },
      ],
    },
    tile: {
      headline: 'Tile calculator',
      lead: 'Straight layouts use 10% waste. Diagonal and herringbone use 20%.',
      fields: [
        { name: 'lengthFt', label: 'Room length', unit: 'ft', type: 'number', step: '0.1', value: 10, min: 0.5 },
        { name: 'widthFt', label: 'Room width', unit: 'ft', type: 'number', step: '0.1', value: 10, min: 0.5 },
        { name: 'tileIn', label: 'Tile size', unit: 'inches', type: 'number', step: '0.5', value: 12, min: 1 },
        {
          name: 'pattern',
          label: 'Layout',
          type: 'select',
          value: 'straight',
          options: [
            { value: 'straight', label: 'Straight / grid (10%)' },
            { value: 'offset', label: 'Offset / brick (15%)' },
            { value: 'diagonal', label: 'Diagonal (20%)' },
            { value: 'herringbone', label: 'Herringbone (20%)' },
          ],
        },
        { name: 'boxCoverageSqFt', label: 'Coverage per box', unit: 'sq ft', type: 'number', step: '0.1', value: 10, min: 1 },
        { name: 'pricePerSqFt', label: 'Tile price / sq ft', unit: 'USD', type: 'number', step: '0.01', value: 4, min: 0 },
      ],
    },
    flooring: {
      headline: 'Flooring calculator',
      lead: 'Default waste is 10% for a straight lay. Buy whole boxes only.',
      fields: [
        { name: 'lengthFt', label: 'Room length', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'widthFt', label: 'Room width', unit: 'ft', type: 'number', step: '0.1', value: 15, min: 0.5 },
        {
          name: 'pattern',
          label: 'Layout',
          type: 'select',
          value: 'straight',
          options: [
            { value: 'straight', label: 'Straight (10%)' },
            { value: 'diagonal', label: 'Diagonal (15%)' },
            { value: 'herringbone', label: 'Herringbone (20%)' },
          ],
        },
        { name: 'boxCoverageSqFt', label: 'Coverage per box', unit: 'sq ft', type: 'number', step: '0.1', value: 20, min: 5 },
        { name: 'pricePerSqFt', label: 'Price / sq ft', unit: 'USD', type: 'number', step: '0.01', value: 3.5, min: 0 },
      ],
    },
    drywall: {
      headline: 'Drywall calculator',
      lead: '4×8 sheets cover 32 sq ft. Waste starts at 15% because cuts are real.',
      fields: [
        { name: 'lengthFt', label: 'Room length', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'widthFt', label: 'Room width', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'heightFt', label: 'Ceiling height', unit: 'ft', type: 'number', step: '0.1', value: 8, min: 6 },
        { name: 'doors', label: 'Doors', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'windows', label: 'Windows', type: 'number', step: '1', value: 0, min: 0 },
        { name: 'wastePct', label: 'Waste', unit: '%', type: 'number', step: '1', value: 15, min: 0 },
        { name: 'pricePerSheet', label: 'Price per sheet', unit: 'USD', type: 'number', step: '0.01', value: 16, min: 0 },
        { name: 'includeCeiling', label: 'Include the ceiling', type: 'checkbox', value: true, wide: true },
      ],
    },
    wallpaper: {
      headline: 'Wallpaper calculator',
      lead: 'US double rolls are listed around 56 sq ft. We treat 80% as usable after match and waste.',
      fields: [
        { name: 'lengthFt', label: 'Room length', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'widthFt', label: 'Room width', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'heightFt', label: 'Wall height', unit: 'ft', type: 'number', step: '0.1', value: 8, min: 6 },
        { name: 'doors', label: 'Doors', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'windows', label: 'Windows', type: 'number', step: '1', value: 2, min: 0 },
        { name: 'rollSqFt', label: 'Listed sq ft / double roll', type: 'number', step: '1', value: 56, min: 20 },
        { name: 'usableFactor', label: 'Usable factor', type: 'number', step: '0.05', value: 0.8, min: 0.5 },
        { name: 'pricePerRoll', label: 'Price per double roll', unit: 'USD', type: 'number', step: '0.01', value: 55, min: 0 },
      ],
    },
    'moving-boxes': {
      headline: 'Moving boxes calculator',
      lead: 'Room counts times published mid-range box mixes. Packed homes use a 1.35× clutter factor.',
      fields: [
        { name: 'kitchen', label: 'Kitchens', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'living', label: 'Living rooms', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'master', label: 'Primary bedrooms', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'bedroom', label: 'Other bedrooms', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'bathroom', label: 'Bathrooms', type: 'number', step: '1', value: 1, min: 0 },
        { name: 'dining', label: 'Dining rooms', type: 'number', step: '1', value: 0, min: 0 },
        { name: 'garage', label: 'Garage / extras', type: 'number', step: '1', value: 0, min: 0 },
        {
          name: 'clutter',
          label: 'How full is the house?',
          type: 'select',
          value: 'typical',
          options: [
            { value: 'sparse', label: 'Sparse (0.75×)' },
            { value: 'typical', label: 'Typical' },
            { value: 'packed', label: 'Packed (1.35×)' },
          ],
        },
      ],
    },
    'room-cost': {
      headline: 'Room renovation cost calculator',
      lead: 'Planning bands only. Not a bid. Kitchens use a 2.5× intensity; bathrooms use their own bands from 2026 published cost guides.',
      fields: [
        { name: 'lengthFt', label: 'Room length', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        { name: 'widthFt', label: 'Room width', unit: 'ft', type: 'number', step: '0.1', value: 12, min: 0.5 },
        {
          name: 'roomType',
          label: 'Room type',
          type: 'select',
          value: 'bedroom',
          options: [
            { value: 'bedroom', label: 'Bedroom' },
            { value: 'living', label: 'Living room' },
            { value: 'bathroom', label: 'Bathroom (own 2026 bands)' },
            { value: 'kitchen', label: 'Kitchen (2.5×)' },
          ],
        },
        {
          name: 'finish',
          label: 'Finish level',
          type: 'select',
          value: 'mid',
          options: [
            { value: 'cosmetic', label: 'Cosmetic ($15–$30 / sq ft; 5×8 bath $3k–$8k)' },
            { value: 'mid', label: 'Mid remodel ($40–$80 / sq ft; 5×8 bath $9k–$18k)' },
            { value: 'full', label: 'Full gut-level ($100–$200 / sq ft; 5×8 bath $16k–$30k)' },
          ],
        },
      ],
    },
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === 'className') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    (children || []).forEach((child) => {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function money(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }

  function formatValue(row) {
    if (row.money) return money(row.value);
    if (typeof row.value === 'number' && !Number.isInteger(row.value)) {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(row.value);
    }
    return String(row.value);
  }

  function track(name, props) {
    if (window.SiteTrack) window.SiteTrack.event(name, props);
  }

  function storageKey(tool) {
    return 'projectcalc:' + tool;
  }

  function readForm(form) {
    const data = {};
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      if (field.type === 'checkbox') data[field.name] = field.checked;
      else data[field.name] = field.value;
    });
    if (form.dataset.rooms === '1') {
      data.rooms = Array.from(form.querySelectorAll('[data-room]')).map((row, idx) => ({
        label: row.querySelector('[data-role="label"]').value || 'Room ' + (idx + 1),
        lengthFt: row.querySelector('[data-role="length"]').value,
        widthFt: row.querySelector('[data-role="width"]').value,
      }));
    }
    return data;
  }

  function renderResults(mount, result) {
    const error = $('[data-error]', mount);
    const live = $('[data-live]', mount);
    const table = $('[data-table]', mount);
    const hero = $('[data-hero]', mount);
    const box = $('[data-results]', mount);
    error.textContent = '';
    table.replaceChildren();
    if (!result.ok) {
      error.textContent = result.error;
      hero.textContent = '';
      box.dataset.state = 'empty';
      return;
    }
    box.dataset.state = 'ready';
    result.rows.forEach((row) => {
      const tr = el('tr', {}, [
        el('th', { scope: 'row', text: row.label }),
        el('td', { text: formatValue(row) + (row.unit && !row.money ? ' ' + row.unit : '') }),
      ]);
      table.appendChild(tr);
    });
    const preferred = result.rows.find((row) =>
      /to buy|to order|sheets|double rolls|total floor|planning high/i.test(row.label) && !row.money,
    ) || result.rows.find((row) => !row.money) || result.rows[result.rows.length - 1];
    hero.textContent = preferred ? preferred.label + ': ' + formatValue(preferred) + (preferred.unit && !preferred.money ? ' ' + preferred.unit : '') : '';
    live.textContent = hero.textContent;
  }

  function bindPayPal(root) {
    const cfg = window.PROJECTCALC_CONFIG || {};
    root.querySelectorAll('[data-paypal]').forEach((node) => {
      if (cfg.paypalUrl) {
        node.hidden = false;
        if (node.tagName === 'A') node.setAttribute('href', cfg.paypalUrl);
      } else {
        node.hidden = true;
        if (node.tagName === 'A') node.removeAttribute('href');
      }
    });
  }

  function addRoomRow(list, preset) {
    const row = el('div', { className: 'fields', 'data-room': '1' }, [
      el('div', { className: 'field' }, [
        el('label', { text: 'Room name' }),
        el('input', { type: 'text', 'data-role': 'label', value: (preset && preset.label) || 'Room', maxlength: '40' }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { text: 'Length (ft)' }),
        el('input', { type: 'number', inputmode: 'decimal', min: '0.5', step: '0.1', 'data-role': 'length', value: (preset && preset.lengthFt) || '12' }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { text: 'Width (ft)' }),
        el('input', { type: 'number', inputmode: 'decimal', min: '0.5', step: '0.1', 'data-role': 'width', value: (preset && preset.widthFt) || '12' }),
      ]),
    ]);
    list.appendChild(row);
  }

  function mountCalculator(mount) {
    const tool = mount.getAttribute('data-tool');
    const schema = SCHEMAS[tool];
    if (!schema || !window.ProjectCalc) {
      mount.textContent = 'This calculator failed to load. Refresh the page.';
      return;
    }

    const form = el('form', { novalidate: true });
    if (schema.rooms) {
      form.dataset.rooms = '1';
      const list = el('div', { 'data-room-list': '1' });
      addRoomRow(list, { label: 'Room 1', lengthFt: 12, widthFt: 12 });
      form.appendChild(list);
      form.appendChild(
        el('div', { className: 'actions' }, [
          el('button', { type: 'button', text: 'Add room', onClick: () => addRoomRow(list) }),
        ]),
      );
    } else {
      const fields = el('div', { className: 'fields' });
      schema.fields.forEach((field) => {
        const wrap = el('div', { className: 'field' + (field.wide ? ' wide' : '') });
        if (field.type === 'checkbox') {
          const box = el('label', { className: 'checks' }, [
            el('input', { type: 'checkbox', name: field.name, checked: field.value ? true : null }),
            el('span', { text: field.label }),
          ]);
          wrap.appendChild(box);
        } else if (field.type === 'select') {
          wrap.appendChild(el('label', { text: field.label, for: field.name }));
          const select = el('select', { name: field.name, id: field.name });
          field.options.forEach((opt) => {
            select.appendChild(el('option', { value: opt.value, text: opt.label, selected: String(opt.value) === String(field.value) ? true : null }));
          });
          wrap.appendChild(select);
        } else {
          wrap.appendChild(el('label', { text: field.label + (field.unit ? ' (' + field.unit + ')' : ''), for: field.name }));
          wrap.appendChild(el('input', {
            id: field.name,
            name: field.name,
            type: 'number',
            inputmode: 'decimal',
            step: field.step || 'any',
            min: field.min,
            value: field.value,
            required: true,
          }));
        }
        if (field.hint) wrap.appendChild(el('div', { className: 'hint', text: field.hint }));
        fields.appendChild(wrap);
      });
      form.appendChild(fields);
    }

    const results = el('div', { className: 'results', 'data-results': '1', 'data-state': 'empty' }, [
      el('div', { className: 'error', 'data-error': '1' }),
      el('div', { className: 'hero-out', 'data-hero': '1' }),
      el('div', { className: 'visually-hidden', 'data-live': '1', 'aria-live': 'polite' }),
      el('table', { className: 'result-table' }, [
        el('tbody', { 'data-table': '1' }),
      ]),
    ]);

    const actions = el('div', { className: 'actions' }, [
      el('button', { type: 'submit', text: 'Calculate' }),
      el('button', {
        type: 'button',
        text: 'Print job sheet',
        onClick: () => {
          track('print_sheet', { tool });
          window.print();
        },
      }),
      el('button', {
        type: 'button',
        text: 'Copy results',
        onClick: () => {
          const lines = Array.from(results.querySelectorAll('tr')).map((row) => row.innerText.replace(/\t/g, ' '));
          if (!lines.length) return;
          navigator.clipboard.writeText(lines.join('\n')).then(() => track('copy_results', { tool })).catch(() => {});
        },
      }),
    ]);

    mount.replaceChildren(
      el('h2', { text: schema.headline }),
      el('p', { className: 'lede', text: schema.lead }),
      form,
      actions,
      results,
    );

    function run() {
      const input = readForm(form);
      try {
        localStorage.setItem(storageKey(tool), JSON.stringify(input));
      } catch (err) {
        /* ignore private-mode storage */
      }
      const result = window.ProjectCalc.compute(tool, input);
      renderResults(mount, result);
    }

    // One tool_run per calculator per page view, on the visitor's first change.
    // Inputs recalculate on every keystroke, so counting each run would inflate usage.
    let counted = false;
    function runByVisitor() {
      run();
      if (counted) return;
      counted = true;
      track('tool_run', { tool });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      runByVisitor();
    });
    form.addEventListener('input', () => runByVisitor());

    function applyValues(values) {
      Object.entries(values).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (!field) return;
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = value;
      });
    }

    // Guide pages pass their worked example as data-preset so the live numbers match the text.
    let preset = null;
    try {
      preset = JSON.parse(mount.getAttribute('data-preset') || 'null');
    } catch (err) {
      preset = null;
    }
    try {
      const saved = preset ? null : JSON.parse(localStorage.getItem(storageKey(tool)) || 'null');
      if (saved && !schema.rooms) applyValues(saved);
    } catch (err) {
      /* ignore */
    }
    if (preset && !schema.rooms) applyValues(preset);
    run();
  }

  function boot() {
    bindPayPal(document);
    document.querySelectorAll('[data-tool]').forEach(mountCalculator);
    const guide = document.querySelector('[data-guide]');
    if (guide) track('guide_view', { guide: guide.getAttribute('data-guide') });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
