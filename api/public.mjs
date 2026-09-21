import { json } from '../lib/session.mjs';
import { readState } from '../lib/supabase.mjs';

function activeCampaign(state) {
  return state.campaigns.find(item => item.id === state.settings.activeCampaignId && item.status !== 'rascunho') || null;
}

function campaignView(campaign) {
  if (!campaign) return null;
  return {
    id: campaign.id,
    name: campaign.name,
    supplier: campaign.supplier || '',
    status: campaign.status,
    theme: {
      logo: campaign.theme?.logo || '',
      colorPrimary: campaign.theme?.colorPrimary || '#f6d42c',
    },
  };
}

export async function GET(request) {
  try {
    const state = await readState();
    const campaign = activeCampaign(state);
    const code = new URL(request.url).searchParams.get('code')?.trim();
    if (!code) return json({ campaign: campaignView(campaign) });
    if (!campaign) return json({ campaign: null, result: null });

    const customer = state.customers.find(item => String(item.code).toUpperCase() === code.toUpperCase());
    const sales = customer
      ? state.sales.filter(item => item.campaignId === campaign.id && item.customerId === customer.id && item.status === 'valida')
      : [];
    return json({
      campaign: campaignView(campaign),
      result: customer && sales.length ? {
        customer: { name: customer.name, code: customer.code },
        participations: sales.map(item => ({ acquisition: item.acquisition, date: item.date })),
      } : null,
    });
  } catch (error) {
    console.error('public.GET', error);
    return json({ error: 'Consulta temporariamente indisponível.' }, 503);
  }
}
