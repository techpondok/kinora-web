import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

  let adsTxt = '# ads.txt not configured\n'

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'google_services')
      .eq('status', 'published')
      .maybeSingle()

    if (data?.value?.adsense?.ads_txt) {
      adsTxt = data.value.adsense.ads_txt + '\n'
    }
  } catch (e) { /* serve default */ }

  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  res.status(200).send(adsTxt)
}
