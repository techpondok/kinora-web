const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  const supabaseUrl = 'https://sasigbuckngggpwpxlhz.supabase.co'
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhc2lnYnVja25nZ2dwd3B4bGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODQ3ODYsImV4cCI6MjA5NTg2MDc4Nn0.4Zw4PrvyW0GJzNG54N5nUHi3Tr0sbZjOJ4tnemaMV4I'

  let adsTxt = ''

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data } = await supabase
      .from('kinora_landing_config')
      .select('value')
      .eq('key', 'google_services')
      .eq('status', 'published')
      .maybeSingle()

    if (data?.value?.adsense?.ads_txt) {
      adsTxt = data.value.adsense.ads_txt.trim()
    }
  } catch (e) {
    // If DB fails, try fallback from app_secrets
    try {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data } = await supabase
        .from('kinora_app_secrets')
        .select('value_encrypted')
        .eq('secret_key', 'GOOGLE_ADS_TXT_CONTENT')
        .maybeSingle()
      if (data?.value_encrypted) {
        adsTxt = data.value_encrypted.trim()
      }
    } catch (e2) { /* continue */ }
  }

  // If still empty, return 404-like plain text
  if (!adsTxt) {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300')
    return res.status(200).send('# ads.txt not yet configured\n')
  }

  res.setHeader('Content-Type', 'text/plain; charset=UTF-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(adsTxt + '\n')
}
