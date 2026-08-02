<template>
  <ConsultantLayout>
    <div class="space-y-6">
      <!-- Loading -->
      <div v-if="loading" class="py-12 text-center text-gray-500 text-sm">Memuat...</div>

      <template v-else>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Ulasan & Rating</h1>
        <p class="text-sm text-gray-500">Ulasan dari klien setelah sesi konsultasi.</p>
      </div>

      <!-- Average Rating -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p class="text-4xl font-bold text-gray-900">{{ averageRating.toFixed(1) }}</p>
        <p class="text-amber-500 text-lg mt-1">{{ '⭐'.repeat(Math.round(averageRating)) }}</p>
        <p class="text-xs text-gray-500 mt-1">Dari {{ reviews.length }} ulasan</p>
      </div>

      <!-- Rating Distribution -->
      <section class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="font-semibold text-gray-900 mb-4">Distribusi Rating</h2>
        <div class="space-y-2">
          <div v-for="bar in ratingDistribution" :key="bar.stars" class="flex items-center gap-3">
            <span class="text-sm text-gray-600 w-8">{{ bar.stars }}⭐</span>
            <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full" :style="{ width: bar.percentage + '%' }"></div>
            </div>
            <span class="text-xs text-gray-500 w-8 text-right">{{ bar.count }}</span>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <div v-if="reviews.length === 0" class="text-sm text-gray-400 text-center py-8">Belum ada ulasan.</div>
      <div class="space-y-3">
        <div v-for="review in reviews" :key="review.id" class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm text-amber-500">{{ '⭐'.repeat(review.rating) }}</span>
              <span class="text-xs text-gray-400">{{ review.date }}</span>
            </div>
          </div>
          <p class="text-sm text-gray-800 mb-2">{{ review.text }}</p>
          <p class="text-xs text-gray-500">— {{ review.client }} · {{ review.service }}</p>
        </div>
      </div>
      </template>
    </div>
  </ConsultantLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase.js'
import ConsultantLayout from '../../components/ConsultantLayout.vue'

const loading = ref(true)
const reviews = ref([])
const averageRating = ref(0)
const ratingDistribution = ref([])

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function loadReviews() {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }

  const { data: profile } = await supabase
    .from('kinora_consultants')
    .select('id')
    .eq('consultant_user_id', user.id)
    .maybeSingle()
  if (!profile) { loading.value = false; return }

  const { data: sessions } = await supabase
    .from('kinora_consultation_sessions')
    .select('id, user_rating, user_review, topic, completed_at, user:users!kinora_consultation_sessions_user_id_fkey(display_name)')
    .eq('consultant_id', profile.id)
    .not('user_rating', 'is', null)
    .order('completed_at', { ascending: false })

  reviews.value = (sessions || []).map(s => ({
    id: s.id,
    rating: s.user_rating,
    text: s.user_review || '—',
    client: s.user?.display_name || 'Klien',
    service: s.topic || 'Konsultasi',
    date: formatDate(s.completed_at),
  }))

  // Compute average
  if (reviews.value.length > 0) {
    const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
    averageRating.value = total / reviews.value.length
  }

  // Compute distribution
  const dist = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.value.filter(r => r.rating === stars).length
    const percentage = reviews.value.length > 0 ? Math.round((count / reviews.value.length) * 100) : 0
    return { stars, count, percentage }
  })
  ratingDistribution.value = dist

  loading.value = false
}

onMounted(loadReviews)
</script>
