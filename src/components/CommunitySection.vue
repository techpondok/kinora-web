<template>
  <section v-if="hasContent" class="py-16 px-4 sm:px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900" style="font-family: 'Bricolage Grotesque', sans-serif">
          Terhubung dengan Kinora
        </h2>
        <p class="mt-2 text-gray-600 text-sm max-w-lg mx-auto">
          Ikuti, bergabung, dan terhubung dengan komunitas keluarga Kinora.
        </p>
      </div>

      <!-- Social Media (compact) -->
      <div v-if="socialLinks.length" class="mb-10">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Ikuti Kinora</h3>
        <div class="flex flex-wrap gap-3">
          <a
            v-for="link in socialLinks"
            :key="link.id"
            :href="link.is_coming_soon ? undefined : link.url"
            :target="link.is_coming_soon ? undefined : '_blank'"
            rel="noopener noreferrer"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition text-sm font-medium',
              link.is_coming_soon
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
                : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-sm hover:text-purple-700'
            ]"
            @click="trackClick(link)"
          >
            <component :is="getPlatformIcon(link.platform_key)" :size="18" class="flex-shrink-0" />
            <span>{{ link.platform_name }}</span>
            <span v-if="link.is_coming_soon" class="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Segera</span>
          </a>
        </div>
      </div>

      <!-- Community Groups (cards) -->
      <div v-if="communityLinks.length">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Bergabung dengan Komunitas Kinora</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            v-for="link in communityLinks"
            :key="link.id"
            :href="link.is_coming_soon ? undefined : link.url"
            :target="link.is_coming_soon ? undefined : '_blank'"
            rel="noopener noreferrer"
            :class="[
              'block rounded-xl border p-5 transition',
              link.is_featured ? 'border-purple-200 bg-purple-50/50 ring-1 ring-purple-100' : 'border-gray-200 bg-white',
              link.is_coming_soon ? 'cursor-default opacity-70' : 'hover:border-purple-300 hover:shadow-md'
            ]"
            @click="trackClick(link)"
          >
            <div class="flex items-start gap-3">
              <div :class="link.is_featured ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'" class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <component :is="getPlatformIcon(link.platform_key)" :size="20" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold text-gray-900">{{ link.display_name }}</h4>
                  <span v-if="link.is_featured" class="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Utama</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ link.platform_name }}</p>
                <p v-if="link.description" class="text-xs text-gray-600 mt-2 leading-relaxed">{{ link.description }}</p>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between">
              <span v-if="link.is_coming_soon" class="text-xs text-gray-400 font-medium">Coming Soon</span>
              <span v-else class="text-xs font-medium text-purple-700">{{ link.cta_label || 'Bergabung' }} →</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import { ExternalLink, MessageCircle, Users, Send } from '@lucide/vue'
import { h } from 'vue'

// Brand icons removed from lucide — use simple SVG wrappers
const Instagram = { name: 'Instagram', props: { size: { type: Number, default: 24 } }, render() { return h('svg', { width: this.size, height: this.size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [h('rect', { x: '2', y: '2', width: '20', height: '20', rx: '5', ry: '5' }), h('path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }), h('line', { x1: '17.5', y1: '6.5', x2: '17.51', y2: '6.5' })]) } }
const Youtube = { name: 'Youtube', props: { size: { type: Number, default: 24 } }, render() { return h('svg', { width: this.size, height: this.size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [h('path', { d: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z' }), h('polygon', { points: '9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02' })]) } }
const Facebook = { name: 'Facebook', props: { size: { type: Number, default: 24 } }, render() { return h('svg', { width: this.size, height: this.size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [h('path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' })]) } }
const Twitter = { name: 'Twitter', props: { size: { type: Number, default: 24 } }, render() { return h('svg', { width: this.size, height: this.size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [h('path', { d: 'M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M20 4l-6.768 6.768' })]) } }

const allLinks = ref([])
const loadError = ref(false)

const hasContent = computed(() => allLinks.value.length > 0)

const socialLinks = computed(() =>
  allLinks.value.filter(l => l.link_type === 'social_media' || l.link_type === 'official_channel')
)

const communityLinks = computed(() =>
  allLinks.value.filter(l => l.link_type === 'community_group' || l.link_type === 'support_channel' || l.link_type === 'other')
)

const platformIcons = {
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  tiktok: ExternalLink,
  linkedin: ExternalLink,
  discord: Users,
  threads: ExternalLink,
}

function getPlatformIcon(key) {
  return platformIcons[key] || ExternalLink
}

function trackClick(link) {
  if (link.is_coming_soon) return
  // Analytics event — uses existing system if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'social_link_click', {
      platform: link.platform_key,
      entry: link.display_name,
      link_type: link.link_type,
    })
  }
}

onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('kinora_social_links')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    // Filter by visibility: show items visible on website or community_section or all
    allLinks.value = (data || []).filter(l => {
      const vis = l.visibility || []
      return vis.includes('all') || vis.includes('website') || vis.includes('community_section')
    })
  } catch (e) {
    loadError.value = true
    console.warn('[CommunitySection] Failed to load:', e.message)
  }
})
</script>
