document.addEventListener('DOMContentLoaded', function () {
  let data = null;
  let currentTab = 'code_agent';
  let sortKey = 'sr';
  let sortAsc = false;

  // Fetch data
  fetch('./static/data/leaderboard.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      renderTable();
    });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentTab = this.dataset.tab;
      renderTable();
    });
  });

  function renderTable() {
    if (!data) return;

    const rows = [...data[currentTab]];
    const metrics = data.metrics;

    // Sort
    rows.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      return sortAsc ? va - vb : vb - va;
    });

    // Find best values per column
    const bestValues = {};
    metrics.forEach(m => {
      bestValues[m.key] = Math.max(...rows.map(r => r[m.key]));
    });

    // Find max values per column (for bar widths)
    const maxValues = {};
    metrics.forEach(m => {
      maxValues[m.key] = Math.max(...rows.map(r => r[m.key]));
    });

    // Build header
    const thead = document.getElementById('lb-thead');
    // Group header row
    let groupHtml = '<tr class="header-group">';
    groupHtml += '<th rowspan="2" class="col-rank">#</th>';
    groupHtml += '<th rowspan="2" class="col-model" style="text-align:left">Model</th>';
    groupHtml += '<th colspan="2" class="level-l1">L1</th>';
    groupHtml += '<th colspan="1" class="level-l2">L2</th>';
    groupHtml += '<th colspan="2" class="level-l3">L3</th>';
    groupHtml += '<th colspan="1" class="level-l4">L4</th>';
    groupHtml += '</tr>';

    // Metric header row
    let metricHtml = '<tr class="header-metrics">';
    metrics.forEach(m => {
      const isActive = sortKey === m.key;
      const arrow = isActive ? (sortAsc ? '\u25B2' : '\u25BC') : '\u25BC';
      metricHtml += `<th class="${isActive ? 'sort-active' : ''}" data-sort="${m.key}">`;
      metricHtml += `${m.label} <span class="sort-arrow">${arrow}</span>`;
      metricHtml += '</th>';
    });
    metricHtml += '</tr>';

    thead.innerHTML = groupHtml + metricHtml;

    // Bind sort events
    thead.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', function () {
        const key = this.dataset.sort;
        if (sortKey === key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = key;
          sortAsc = false;
        }
        renderTable();
      });
    });

    // Build body
    const tbody = document.getElementById('lb-tbody');
    let bodyHtml = '';

    rows.forEach((row, idx) => {
      const rank = idx + 1;
      let rankClass = '';
      let badgeClass = 'normal';

      if (rank === 1) { rankClass = 'rank-1'; badgeClass = 'gold'; }
      else if (rank === 2) { rankClass = 'rank-2'; badgeClass = 'silver'; }
      else if (rank === 3) { rankClass = 'rank-3'; badgeClass = 'bronze'; }

      bodyHtml += `<tr class="${rankClass}" style="animation-delay: ${idx * 30}ms">`;

      // Rank
      bodyHtml += `<td class="col-rank"><span class="rank-badge ${badgeClass}">${rank}</span></td>`;

      // Model
      bodyHtml += `<td class="col-model"><div class="model-info">`;
      bodyHtml += `<span class="model-family">${row.family}</span>`;
      bodyHtml += `<span class="model-version">${row.version}</span>`;
      bodyHtml += `</div></td>`;

      // Metrics
      metrics.forEach(m => {
        const val = row[m.key];
        const isBest = val === bestValues[m.key] && val > 0;
        const barWidth = maxValues[m.key] > 0 ? (val / maxValues[m.key]) * 100 : 0;
        const level = m.level.toLowerCase();

        bodyHtml += `<td class="score-cell ${isBest ? 'best-in-col' : ''}">`;
        bodyHtml += `<div class="score-bar bar-${level}" style="width:${barWidth}%"></div>`;
        bodyHtml += `<span class="score-value">${val.toFixed(3)}</span>`;
        bodyHtml += '</td>';
      });

      bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;

    // Update sort info
    const activeMetric = metrics.find(m => m.key === sortKey);
    const sortLabel = activeMetric ? activeMetric.label : sortKey;
    const sortDir = sortAsc ? 'ascending' : 'descending';
    document.getElementById('sort-info').innerHTML =
      `<span>Sorted by <strong>${sortLabel}</strong> (${sortDir}) &middot; Click any column header to sort</span>`;
  }
});
