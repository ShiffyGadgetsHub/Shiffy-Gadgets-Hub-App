import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  DoughnutController,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
  DoughnutController
);

/**
 * Renders a Chart.js chart to a detached (never-attached-to-the-DOM)
 * canvas and returns it as a PNG data URL, for embedding into the
 * Year-End Wrap workbook via ExcelJS — a real Excel chart object isn't
 * something ExcelJS can create, so a rendered image is the closest
 * practical equivalent.
 */
// Loosely typed on purpose: this helper fans out to several different
// chart "type" literals (line/bar/doughnut), and Chart.js's config type
// is a discriminated union keyed on `type` — once genericized across
// call sites it stops narrowing usefully, so strict typing here just
// fights call sites that are already correct for the type they pass.
async function renderToDataUrl(config: any, width: number, height: number): Promise<string> {
  const canvas = document.createElement('canvas');
  const scale = 2; // render at 2x for crispness when embedded larger in Excel
  canvas.width = width * scale;
  canvas.height = height * scale;
  const chart = new Chart(canvas, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      animation: false,
      devicePixelRatio: scale,
    },
  });
  // Let the browser finish a paint cycle before reading pixels back out.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const url = canvas.toDataURL('image/png');
  chart.destroy();
  return url;
}

const FONT = { family: 'Segoe UI, Arial, sans-serif', size: 12 };

export async function renderLineChart(labels: string[], data: number[], color: string, width = 560, height = 280): Promise<string> {
  return renderToDataUrl(
    {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: color,
            backgroundColor: `${color}22`,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: color,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: FONT }, grid: { display: false } },
          y: { ticks: { font: FONT }, grid: { color: '#e7e8f0' }, beginAtZero: true },
        },
      },
    },
    width,
    height
  );
}

export async function renderDoughnutChart(labels: string[], data: number[], colors: string[], width = 420, height = 300): Promise<string> {
  return renderToDataUrl(
    {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderColor: '#ffffff', borderWidth: 2, cutout: '62%' }],
      },
      options: {
        plugins: {
          legend: { position: 'bottom', labels: { font: FONT, boxWidth: 12, padding: 12 } },
        },
      },
    },
    width,
    height
  );
}

export async function renderHorizontalBarChart(labels: string[], data: number[], color: string, width = 480, height = 300): Promise<string> {
  return renderToDataUrl(
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: color, borderRadius: 4, barThickness: 18 }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: FONT }, grid: { color: '#e7e8f0' }, beginAtZero: true },
          y: { ticks: { font: FONT }, grid: { display: false } },
        },
      },
    },
    width,
    height
  );
}

export async function renderComboChart(
  labels: string[],
  bars: number[],
  line: number[],
  barColor: string,
  lineColor: string,
  width = 560,
  height = 280
): Promise<string> {
  return renderToDataUrl(
    {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Revenue', data: bars, backgroundColor: barColor, borderRadius: 4, yAxisID: 'y' },
          {
            type: 'line',
            label: 'Units Sold',
            data: line,
            borderColor: lineColor,
            backgroundColor: lineColor,
            tension: 0.35,
            pointRadius: 3,
            borderWidth: 2.5,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { font: FONT, boxWidth: 12 } } },
        scales: {
          x: { ticks: { font: FONT }, grid: { display: false } },
          y: { position: 'left', ticks: { font: FONT }, grid: { color: '#e7e8f0' }, beginAtZero: true },
          y1: { position: 'right', ticks: { font: FONT }, grid: { display: false }, beginAtZero: true },
        },
      },
    },
    width,
    height
  );
}
