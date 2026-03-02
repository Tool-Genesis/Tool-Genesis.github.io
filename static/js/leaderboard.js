document.addEventListener('DOMContentLoaded', function () {
  let data = null;
  let currentTab = 'code_agent';
  let sortKey = 'sr';
  let sortAsc = false;

  // Show loading state
  var tbody = document.getElementById('lb-tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:#64748b;font-size:0.95rem;">Loading leaderboard data...</td></tr>';

  // Fetch data
  fetch('./static/data/leaderboard.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (json) {
      data = json;
      renderTable();
    })
    .catch(function (err) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:#ef4444;font-size:0.95rem;">Failed to load leaderboard data. Please refresh the page.</td></tr>';
      console.error('Leaderboard fetch error:', err);
    });

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentTab = this.dataset.tab;
      renderTable();
    });
  });

  function renderTable() {
    if (!data) return;

    var rows = data[currentTab].slice();
    var metrics = data.metrics;

    // Sort
    rows.sort(function (a, b) {
      var va = a[sortKey], vb = b[sortKey];
      return sortAsc ? va - vb : vb - va;
    });

    // Find best values per column
    var bestValues = {};
    metrics.forEach(function (m) {
      bestValues[m.key] = Math.max.apply(null, rows.map(function (r) { return r[m.key]; }));
    });

    // Find max values per column (for bar widths)
    var maxValues = {};
    metrics.forEach(function (m) {
      maxValues[m.key] = Math.max.apply(null, rows.map(function (r) { return r[m.key]; }));
    });

    // Build header
    var thead = document.getElementById('lb-thead');
    var groupHtml = '<tr class="header-group">';
    groupHtml += '<th rowspan="2" class="col-rank">#</th>';
    groupHtml += '<th rowspan="2" class="col-model" style="text-align:left">Model</th>';
    groupHtml += '<th colspan="2" class="level-l1">L1</th>';
    groupHtml += '<th colspan="1" class="level-l2">L2</th>';
    groupHtml += '<th colspan="2" class="level-l3">L3</th>';
    groupHtml += '<th colspan="1" class="level-l4">L4</th>';
    groupHtml += '</tr>';

    // Metric header row — use html field for subscript support
    var metricHtml = '<tr class="header-metrics">';
    metrics.forEach(function (m) {
      var isActive = sortKey === m.key;
      var arrow = isActive ? (sortAsc ? '\u25B2' : '\u25BC') : '\u25BC';
      var displayLabel = m.html || m.label;
      metricHtml += '<th class="' + (isActive ? 'sort-active' : '') + '" data-sort="' + m.key + '">';
      metricHtml += displayLabel + ' <span class="sort-arrow">' + arrow + '</span>';
      metricHtml += '</th>';
    });
    metricHtml += '</tr>';

    thead.innerHTML = groupHtml + metricHtml;

    // Bind sort events
    thead.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var key = this.dataset.sort;
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
    var tbodyEl = document.getElementById('lb-tbody');
    var bodyHtml = '';

    rows.forEach(function (row, idx) {
      var rank = idx + 1;
      var rankClass = '';
      var badgeClass = 'normal';

      if (rank === 1) { rankClass = 'rank-1'; badgeClass = 'gold'; }
      else if (rank === 2) { rankClass = 'rank-2'; badgeClass = 'silver'; }
      else if (rank === 3) { rankClass = 'rank-3'; badgeClass = 'bronze'; }

      bodyHtml += '<tr class="' + rankClass + '" style="animation-delay: ' + (idx * 30) + 'ms">';

      // Rank
      bodyHtml += '<td class="col-rank"><span class="rank-badge ' + badgeClass + '">' + rank + '</span></td>';

      // Model
      bodyHtml += '<td class="col-model"><div class="model-info">';
      bodyHtml += '<span class="model-family">' + row.family + '</span>';
      bodyHtml += '<span class="model-version">' + row.version + '</span>';
      bodyHtml += '</div></td>';

      // Metrics
      metrics.forEach(function (m) {
        var val = row[m.key];
        var isBest = val === bestValues[m.key] && val > 0;
        var barWidth = maxValues[m.key] > 0 ? (val / maxValues[m.key]) * 100 : 0;
        var level = m.level.toLowerCase();

        bodyHtml += '<td class="score-cell ' + (isBest ? 'best-in-col' : '') + '">';
        bodyHtml += '<div class="score-bar bar-' + level + '" style="width:' + barWidth + '%"></div>';
        bodyHtml += '<span class="score-value">' + val.toFixed(3) + '</span>';
        bodyHtml += '</td>';
      });

      bodyHtml += '</tr>';
    });

    tbodyEl.innerHTML = bodyHtml;

    // Update sort info
    var activeMetric = metrics.find(function (m) { return m.key === sortKey; });
    var sortLabel = activeMetric ? activeMetric.label : sortKey;
    var sortDir = sortAsc ? 'ascending' : 'descending';
    document.getElementById('sort-info').innerHTML =
      '<span>Sorted by <strong>' + sortLabel + '</strong> (' + sortDir + ') &middot; Click any column header to sort</span>';
  }
});
