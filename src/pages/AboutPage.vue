<template>
  <div class="min-h-screen bg-white">

    <div v-if="loading" class="py-24 text-center text-gray-500 text-sm">Memuat...</div>

    <template v-else-if="about">
    <!-- Hero -->
    <section class="py-20 px-4 sm:px-6 bg-gradient-to-b from-amber-50 to-white">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight" style="font-family: 'Bricolage Grotesque', sans-serif">
          {{ about.hero?.title }}
        </h1>
        <p class="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          {{ about.hero?.subtitle }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a :href="about.hero?.cta_primary_link || '/register'" class="px-6 py-3 bg-amber-500 text-white rounded-full font-semibold text-sm hover:bg-amber-600 transition shadow-md">{{ about.hero?.cta_primary }}</a>
          <a :href="about.hero?.cta_secondary_link || '/help/contact'" class="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:border-amber-300 transition">{{ about.hero?.cta_secondary }}</a>
        </div>
      </div>
    </section>

    <!-- Story -->
    <section v-if="about.story?.content" class="py-16 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ about.story?.title }}</h2>
        <div class="space-y-4 text-gray-600 leading-relaxed">
          <p v-for="(p, i) in storyParagraphs" :key="i">{{ p }}</p>
        </div>
      </div>
    </section>

    <!-- Vision -->
    <section v-if="about.vision" class="py-16 px-4 sm:px-6 bg-gray-50">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">{{ about.vision?.title }}</h2>
        <p class="text-gray-600 text-base leading-relaxed">{{ about.vision?.description }}</p>
      </div>
    </section>

    <!-- Missions -->
    <section v-if="about.missions?.length" class="py-16 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 text-center mb-10">Our Mission</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div v-for="m in about.missions" :key="m.title" class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3 text-lg">{{ m.icon }}</div>
            <h3 class="font-semibold text-gray-900 mb-2">{{ m.title }}</h3>
            <p class="text-sm text-gray-600">{{ m.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section v-if="about.values?.length" class="py-16 px-4 sm:px-6 bg-gray-50">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 text-center mb-10">Our Values</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div v-for="val in about.values" :key="val.title" class="bg-white rounded-xl border border-gray-100 p-5">
            <h3 class="font-semibold text-gray-900 text-sm mb-1">{{ val.title }}</h3>
            <p class="text-xs text-gray-600 leading-relaxed">{{ val.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Founder -->
    <section v-if="about.founder" class="py-16 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-8">The Person Behind Kinora</h2>
        <div class="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div class="w-24 h-24 rounded-full bg-amber-100 mx-auto mb-4 overflow-hidden border-4 border-amber-200">
            <img v-if="about.founder.photo_url" :src="about.founder.photo_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-amber-700">{{ (about.founder.name || 'K').charAt(0) }}</div>
          </div>
          <h3 v-if="about.founder.name" class="font-bold text-gray-900">{{ about.founder.name }}</h3>
          <p class="text-sm text-gray-500">{{ about.founder.title }}</p>
          <p class="mt-4 text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">{{ about.founder.bio }}</p>
          <blockquote v-if="about.founder.quote" class="mt-6 text-sm italic text-gray-500 border-l-4 border-amber-300 pl-4 text-left max-w-md mx-auto">
            "{{ about.founder.quote }}"
          </blockquote>
        </div>
      </div>
    </section>

    <!-- Team Roles -->
    <section v-if="about.team_roles?.length" class="py-16 px-4 sm:px-6 bg-gray-50">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 text-center mb-10">Behind Kinora</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div v-for="t in about.team_roles" :key="t.title" class="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <div class="text-2xl mb-2">{{ t.icon }}</div>
            <h3 class="font-semibold text-gray-900 text-sm">{{ t.title }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ t.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Commitments -->
    <section v-if="about.commitments?.length" class="py-16 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Our Commitment</h2>
        <ul class="space-y-3 text-sm text-gray-600">
          <li v-for="c in about.commitments" :key="c" class="flex items-start gap-3"><span class="text-green-500 mt-0.5">✓</span> {{ c }}</li>
        </ul>
      </div>
    </section>

    <!-- Future -->
    <section v-if="about.future_areas?.length" class="py-16 px-4 sm:px-6 bg-amber-50/50">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">The Future of Kinora</h2>
        <p class="text-sm text-gray-600 mb-8">Kinora akan terus berkembang dengan tetap mempertahankan fokus utama pada kebutuhan nyata keluarga.</p>
        <div class="flex flex-wrap justify-center gap-2">
          <span v-for="area in about.future_areas" :key="area" class="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 rounded-full text-xs font-medium">{{ area }}</span>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section v-if="about.contact" class="py-16 px-4 sm:px-6">
      <div class="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Hubungi Kami</h2>
        <div class="space-y-2 text-sm text-gray-600">
          <p v-if="about.contact.email">📧 {{ about.contact.email }}</p>
          <p v-if="about.contact.phone">📱 {{ about.contact.phone }}</p>
        </div>
        <a href="/help/contact" class="mt-6 inline-block px-6 py-2.5 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition">Kirim Pesan</a>
      </div>
    </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'


const loading = ref(true)
const about = ref(null)

const storyParagraphs = computed(() => {
  if (!about.value?.story?.content) return []
  return about.value.story.content.split('\n').filter(p => p.trim())
})

async function loadAbout() {
  const { data } = await supabase
    .from('kinora_landing_config')
    .select('value')
    .eq('key', 'about')
    .eq('status', 'published')
    .maybeSingle()
  if (data?.value) {
    about.value = data.value
  }
  loading.value = false
}

onMounted(() => {
  loadAbout()
  document.title = 'About Us — Kinora | Family OS'
})
</script>
