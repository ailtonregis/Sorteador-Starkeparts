const defaultState = () => ({
  version: 3,
  campaigns: [],
  customers: [],
  sales: [],
  draws: [],
  audit: [],
  settings: { activeCampaignId: null },
});

function settings() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) throw new Error('Supabase não configurado no servidor.');
  return { url, key };
}

function headers(key, extra = {}) {
  const result = { apikey: key, ...extra };
  if (key.startsWith('eyJ')) result.Authorization = `Bearer ${key}`;
  return result;
}

export function normalizeState(value) {
  const base = defaultState();
  if (!value || value.version !== 3) return base;
  return {
    ...base,
    ...value,
    campaigns: Array.isArray(value.campaigns) ? value.campaigns : [],
    customers: Array.isArray(value.customers) ? value.customers : [],
    sales: Array.isArray(value.sales) ? value.sales : [],
    draws: Array.isArray(value.draws) ? value.draws : [],
    audit: Array.isArray(value.audit) ? value.audit.slice(0, 1200) : [],
    settings: { ...base.settings, ...(value.settings || {}) },
  };
}

export async function readState() {
  const { url, key } = settings();
  const response = await fetch(`${url}/rest/v1/app_state?id=eq.main&select=data`, {
    headers: headers(key, { Accept: 'application/json' }),
  });
  if (!response.ok) throw new Error(`Supabase GET ${response.status}: ${await response.text()}`);
  const rows = await response.json();
  return normalizeState(rows[0]?.data);
}

export async function writeState(value) {
  const { url, key } = settings();
  const data = normalizeState(value);
  const response = await fetch(`${url}/rest/v1/app_state?on_conflict=id`, {
    method: 'POST',
    headers: headers(key, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify({ id: 'main', data, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`Supabase POST ${response.status}: ${await response.text()}`);
  return data;
}
