<template>
  <footer class="py-12 px-4 sm:px-6 bg-gray-900 text-gray-400">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 class="font-bold text-white text-lg mb-3" style="font-family: 'Bricolage Grotesque', sans-serif">{{ general.app_name || 'Kinora' }}</h3>
          <p class="text-sm leading-relaxed">{{ footer.description || 'Family OS untuk keluarga Indonesia.' }}</p>
        </div>
        <div>
          <h4 class="font-medium text-white text-sm mb-3">Produk</h4>
          <div class="space-y-2 text-sm">
            <a href="/#features" class="block hover:text-white transition">Fitur</a>
            <a href="/#pricing" class="block hover:text-white transition">Harga</a>
            <a href="/articles" class="block hover:text-white transition">Artikel</a>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-white text-sm mb-3">Bantuan</h4>
          <div class="space-y-2 text-sm">
            <a :href="footer.help_url || '/help'" class="block hover:text-white transition">Pusat Bantuan</a>
            <a :href="footer.privacy_url || '/privacy'" class="block hover:text-white transition">Kebijakan Privasi</a>
            <a :href="footer.terms_url || '/terms'" class="block hover:text-white transition">Syarat & Ketentuan</a>
          </div>
        </div>
        <div>
          <h4 class="font-medium text-white text-sm mb-3">Hubungi</h4>
          <div class="space-y-2 text-sm">
            <p v-if="general.email_support">{{ general.email_support }}</p>
            <p v-if="general.whatsapp">WhatsApp: {{ general.whatsapp }}</p>
            <div v-if="hasSocial" class="flex gap-3 mt-3">
              <a v-for="(url, platform) in (footer.social || {})" :key="platform" v-show="url" :href="url" target="_blank" rel="noopener noreferrer" class="hover:text-white transition capitalize text-xs">{{ platform }}</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Community Section -->
      <div v-if="communityLinks.length" class="mt-10 pt-6 border-t border-gray-800">
        <h4 class="font-medium text-white text-sm mb-4">Komunitas</h4>
        <div class="flex flex-wrap gap-3">
          <a v-for="link in communityLinks" :key="link.id" :href="link.url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm text-gray-300 hover:text-white">
            <component :is="getPlatformIcon(link.platform_key)" :size="16" class="flex-shrink-0" />
            <span>{{ link.display_name }}</span>
          </a>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs">© {{ currentYear }} {{ general.app_name || 'Kinora' }}. All rights reserved.</p>
        <div class="flex gap-3">
          <a v-if="general.play_store" :href="general.play_store" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-gray-700">Google Play</a>
          <a v-if="general.app_store" :href="general.app_store" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-gray-700">App Store</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../composables/useAuth.js'
import { ExternalLink } from '@lucide/vue'

const { user } = useAuth()
const general = ref({})
const footer = ref({})
const communityLinks = ref([])
const currentYear = new Date().getFullYear()

const hasSocial = computed(() => {
  const s = footer.value.social || {}
  return Object.values(s).some(url => !!url)
})

function getPlatformIcon(platformKey) {
  // Return ExternalLink as default — actual platform icons handled via known keys
  return ExternalLink
}

onMounted(async () => {
  try {
    const [configRes, linksRes] = await Promise.all([
      supabase.from('kinora_landing_config').select('key, value').eq('status', 'published').in('key', ['general', 'footer']),
      supabase.from('kinora_social_links').select('*').eq('is_active', true).order('display_order', { ascending: true }),
    ])

    if (configRes.data) {
      for (const row of configRes.data) {
        if (row.key === 'general') general.value = row.value || {}
        if (row.key === 'footer') footer.value = row.value || {}
      }
    }

    // Filter community links visible in footer
    if (linksRes.data) {
      communityLinks.value = linksRes.data.filter(l => {
        const vis = l.visibility || []
        return vis.includes('all') || vis.includes('footer')
      })
    }
  } catch (e) {
    // Graceful degradation — show static defaults
    console.warn('[PublicFooter] Failed to load config:', e.message)
  }
})
</script>
