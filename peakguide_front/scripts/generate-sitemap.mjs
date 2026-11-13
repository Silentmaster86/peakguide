import { writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; the existing sitemap has not been changed.');
async function slugs(table, filter = '') {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${url}/rest/v1/${table}?select=slug&order=slug&limit=1000&offset=${offset}${filter}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!response.ok) throw new Error(`Sitemap source ${table}: HTTP ${response.status}; existing sitemap unchanged.`);
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.some((row) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))) throw new Error('Invalid catalogue response');
    out.push(...rows.map((row) => row.slug));
    if (rows.length < 1000) return out;
  }
}
const [peaks, ranges] = await Promise.all([slugs('peaks', '&active=eq.true'), slugs('mountain_ranges')]);
const paths = ['/', '/peaks', '/ranges', '/trails', '/about', ...peaks.map((slug) => `/peaks/${slug}`), ...ranges.map((slug) => `/ranges/${slug}`)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map((path) => `  <url><loc>https://peak-guide.netlify.app${path}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile('public/sitemap.xml', xml);
console.log(`Sitemap: ${new Set(paths).size} URLs (${peaks.length} peaks, ${ranges.length} ranges).`);
