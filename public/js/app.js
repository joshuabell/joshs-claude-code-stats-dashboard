// ============================================
// CONFIGURATION (loaded from /api/config)
// ============================================

// Config will be available as window.CONFIG

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// ============================================
// DATA LOADING
// ============================================

async function loadStats() {
  try {
    const response = await fetch('/data/stats.json');
    if (!response.ok) {
      throw new Error('No stats data available');
    }
    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('Error loading stats:', error);
    return null;
  }
}

async function loadDays() {
  try {
    const response = await fetch('/data/days.json');
    if (!response.ok) {
      throw new Error('No days data available');
    }
    const days = await response.json();
    return days;
  } catch (error) {
    console.error('Error loading days:', error);
    return [];
  }
}

// ============================================
// UI POPULATION
// ============================================

function formatCurrency(value) {
  return `$${(value || 0).toFixed(2)}`;
}

function formatNumber(value) {
  return (value || 0).toLocaleString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
}

function populateUserInfo() {
  const config = window.CONFIG || {};

  // Set user info from config
  document.getElementById('userName').textContent = config.userName || 'Developer';
  const bioElement = document.getElementById('userBio');
  if (config.userBio) {
    bioElement.textContent = config.userBio;
  } else {
    bioElement.style.display = 'none';
  }

  // Update page title
  if (config.siteTitle) {
    document.title = config.siteTitle;
  }

  // Populate social links
  const socialSection = document.getElementById('socialSection');
  const socialLinksContainer = document.getElementById('socialLinks');
  const socialLinks = [];

  if (config.socials?.github) {
    socialLinks.push({
      icon: '→',
      label: 'GitHub',
      url: `https://github.com/${config.socials.github}`
    });
  }

  if (config.socials?.twitter) {
    socialLinks.push({
      icon: '→',
      label: 'Twitter',
      url: `https://twitter.com/${config.socials.twitter}`
    });
  }

  if (config.socials?.linkedin) {
    socialLinks.push({
      icon: '→',
      label: 'LinkedIn',
      url: config.socials.linkedin
    });
  }

  if (config.socials?.website) {
    socialLinks.push({
      icon: '→',
      label: 'Website',
      url: config.socials.website
    });
  }

  if (socialLinks.length > 0) {
    socialSection.style.display = 'block';
    socialLinksContainer.innerHTML = socialLinks.map(link => `
      <a href="${link.url}" target="_blank" class="social-link">
        <span class="social-icon">${link.icon}</span>
        ${link.label}
      </a>
    `).join('');
  }
}

function populateStats(stats) {
  if (!stats) {
    console.warn('No stats available');
    return;
  }

  // Lifetime stats
  document.getElementById('lifetimeCost').textContent = formatCurrency(stats.lifetime?.totalCost);
  document.getElementById('lifetimeTokens').textContent = `${formatNumber(stats.lifetime?.totalTokens)} tokens`;

  // Days active
  document.getElementById('daysActive').textContent = stats.lifetime?.dayCount || 0;

  // Streaks
  document.getElementById('currentStreak').textContent = stats.streaks?.currentStreak || 0;
  document.getElementById('longestStreak').textContent = `Longest: ${stats.streaks?.longestStreak || 0}`;

  // Daily velocity (7d avg)
  document.getElementById('dailyCost').textContent = formatCurrency(stats.daily?.totalCost);
  document.getElementById('dailyTokens').textContent = `${formatNumber(stats.daily?.totalTokens)} tokens`;

  // Monthly
  document.getElementById('monthlyCost').textContent = formatCurrency(stats.monthly?.totalCost);
  document.getElementById('monthlyTokens').textContent = `${formatNumber(stats.monthly?.totalTokens)} tokens`;

  // Highest day
  document.getElementById('highestDayCost').textContent = formatCurrency(stats.highest?.day?.totalCost);
  const highestDate = stats.highest?.day?.date;
  document.getElementById('highestDayDate').textContent = highestDate ? formatDate(highestDate) : 'No data';

  // Weekly
  document.getElementById('weeklyCost').textContent = formatCurrency(stats.weekly?.totalCost);
  document.getElementById('weeklyTokens').textContent = `${formatNumber(stats.weekly?.totalTokens)} tokens`;

  // Average per day (lifetime)
  document.getElementById('avgDailyCost').textContent = formatCurrency(stats.lifetime?.averageCost);
  document.getElementById('avgDailyTokens').textContent = `${formatNumber(stats.lifetime?.averageTokens)} tokens`;

  // Last updated
  const lastUpdated = stats.lastUpdated;
  document.getElementById('lastUpdated').textContent = lastUpdated
    ? `Last updated: ${formatRelativeTime(lastUpdated)}`
    : 'Never updated';
}

function populateActivity(days) {
  const activityContainer = document.getElementById('recentActivity');

  if (!days || days.length === 0) {
    activityContainer.innerHTML = '<div class="loading">No activity data available. Upload your first report!</div>';
    return;
  }

  // Show last 10 days
  const recentDays = days.slice(-10).reverse();

  activityContainer.innerHTML = recentDays.map(day => `
    <div class="activity-item">
      <div class="activity-date">${formatDate(day.date)}</div>
      <div class="activity-stats">
        <div class="activity-stat">
          <div class="activity-stat-label">Cost</div>
          <div class="activity-stat-value">${formatCurrency(day.totalCost)}</div>
        </div>
        <div class="activity-stat">
          <div class="activity-stat-label">Tokens</div>
          <div class="activity-stat-value">${formatNumber(day.totalTokens)}</div>
        </div>
        ${day.inputTokens ? `
          <div class="activity-stat">
            <div class="activity-stat-label">Input</div>
            <div class="activity-stat-value">${formatNumber(day.inputTokens)}</div>
          </div>
        ` : ''}
        ${day.outputTokens ? `
          <div class="activity-stat">
            <div class="activity-stat-label">Output</div>
            <div class="activity-stat-value">${formatNumber(day.outputTokens)}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// ============================================
// ACTIVITY HEATMAP
// ============================================

function populateHeatmap(days) {
  if (!days || days.length === 0) {
    return;
  }

  const heatmapGrid = document.getElementById('heatmapGrid');
  const heatmapMonths = document.getElementById('heatmapMonths');

  // Start from the first active day
  const firstDay = new Date(days[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Sunday of the week containing the first day (start of week)
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  startDate.setDate(startDate.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  // Create day-by-day map
  const dayMap = {};
  days.forEach(day => {
    const dateKey = new Date(day.date).toISOString().split('T')[0];
    dayMap[dateKey] = day;
  });

  // Find max cost for scaling
  let maxCost = 0;
  days.forEach(day => {
    if (day.totalCost > maxCost) maxCost = day.totalCost;
  });

  // Generate cells
  const cells = [];
  const monthPositions = [];
  let currentDate = new Date(startDate);
  let cellIndex = 0;

  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const dayData = dayMap[dateKey];
    const isBeforeFirstDay = currentDate < firstDay;

    // Determine level (0-4)
    let level = 0;
    if (dayData && maxCost > 0) {
      const ratio = dayData.totalCost / maxCost;
      if (ratio > 0.8) level = 4;
      else if (ratio > 0.6) level = 3;
      else if (ratio > 0.4) level = 2;
      else if (ratio > 0) level = 1;
    }

    const cell = document.createElement('div');
    cell.className = `heatmap-cell level-${level}`;

    // Add empty class for cells before first day
    if (isBeforeFirstDay) {
      cell.style.opacity = '0';
    }

    if (dayData) {
      const tooltip = document.createElement('div');
      tooltip.className = 'heatmap-tooltip';
      tooltip.textContent = `${formatDate(dateKey)}: $${dayData.totalCost.toFixed(2)}`;
      cell.appendChild(tooltip);
    }

    cells.push(cell);

    // Track months for labels - capture position when month starts
    if (currentDate.getDate() === 1) {
      const monthYear = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const weekIndex = Math.floor(cellIndex / 7);
      monthPositions.push({ label: monthYear, weekIndex });
    }

    cellIndex++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add cells to grid (grid-auto-flow: column will create week columns automatically)
  heatmapGrid.innerHTML = '';
  cells.forEach(cell => heatmapGrid.appendChild(cell));

  // Add month labels at correct positions
  const totalWeeks = Math.ceil(cells.length / 7);
  const monthsHTML = [];

  for (let i = 0; i < totalWeeks; i++) {
    const monthAtWeek = monthPositions.find(m => m.weekIndex === i);
    if (monthAtWeek) {
      monthsHTML.push(`<div class="heatmap-month">${monthAtWeek.label}</div>`);
    } else {
      monthsHTML.push(`<div class="heatmap-month"></div>`);
    }
  }

  heatmapMonths.innerHTML = monthsHTML.join('');

  // Add day labels (remove any existing ones first)
  const container = document.querySelector('.heatmap-container');
  const existingLabels = container.querySelector('.heatmap-day-labels');
  if (existingLabels) {
    existingLabels.remove();
  }

  const dayLabels = document.createElement('div');
  dayLabels.className = 'heatmap-day-labels';
  dayLabels.innerHTML = `
    <div class="heatmap-day-label"></div>
    <div class="heatmap-day-label">Mon</div>
    <div class="heatmap-day-label"></div>
    <div class="heatmap-day-label">Wed</div>
    <div class="heatmap-day-label"></div>
    <div class="heatmap-day-label">Fri</div>
    <div class="heatmap-day-label"></div>
  `;
  container.insertBefore(dayLabels, container.firstChild);
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
  // Initialize theme
  initTheme();

  // Populate user info
  populateUserInfo();

  // Load and populate data
  const stats = await loadStats();
  const days = await loadDays();

  populateStats(stats);
  populateActivity(days);
  populateHeatmap(days);
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
