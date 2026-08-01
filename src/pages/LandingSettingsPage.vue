<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Landing Page Settings</h1>
        <p class="text-sm text-gray-500">Kelola konten halaman publik Kinora.</p>
      </div>
      <div class="flex gap-2">
        <button @click="saveAll('draft')" :disabled="saving" class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Save Draft</button>
        <button @click="saveAll('published')" :disabled="saving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ saving ? 'Publishing...' : 'Publish' }}</button>
      </div>
    </div>

    <div v-if="saveSuccess" class="p-3 bg-green-50 text-green-700 text-sm rounded-lg">✓ Tersimpan!</div>
    <div v-if="saveError" class="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{{ saveError }}</div>

    <!-- Section tabs -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      <button v-for="s in sections" :key="s.id" @click="activeSection = s.id"
        :class="activeSection === s.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'"
        class="px-3 py-2 text-xs font-medium border-b-2 whitespace-nowrap">{{ s.label }}</button>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-500">Memuat...</div>
    <div v-else>
      <!-- General -->
      <div v-if="activeSection === 'general'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">General</h3>
        <!-- Logo Upload -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Logo</label>
          <div class="flex items-center gap-4">
            <div v-if="data.general.logo_url" class="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center">
              <img :src="data.general.logo_url" alt="Logo" class="h-7" />
            </div>
            <div v-else class="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center text-xs text-gray-400">Belum ada logo</div>
            <input type="file" accept="image/png,image/svg+xml,image/webp" @change="uploadLogo" class="text-xs" />
            <button v-if="data.general.logo_url" @click="data.general.logo_url = ''" class="text-xs text-red-500 hover:underline">Hapus</button>
          </div>
          <p v-if="logoUploading" class="text-xs text-blue-600 mt-1">Mengupload...</p>
          <p v-if="logoUploadError" class="text-xs text-red-600 mt-1">{{ logoUploadError }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Nama Produk</label><input v-model="data.general.app_name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Tagline</label><input v-model="data.general.tagline" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">WhatsApp</label><input v-model="data.general.whatsapp" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Email Support</label><input v-model="data.general.email_support" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Play Store URL</label><input v-model="data.general.play_store" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">App Store URL</label><input v-model="data.general.app_store" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Web App URL</label><input v-model="data.general.web_app" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Warna Utama</label><input v-model="data.general.primary_color" type="color" class="w-12 h-9 border border-gray-300 rounded cursor-pointer" /></div>
        </div>
      </div>

      <!-- Hero -->
      <div v-if="activeSection === 'hero'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">Hero Section</h3>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.hero.active" class="rounded" /> Active</label>
        <div><label class="block text-xs text-gray-500 mb-1">Badge</label><input v-model="data.hero.badge" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Judul</label><input v-model="data.hero.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Deskripsi</label><textarea v-model="data.hero.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">CTA Primary</label><input v-model="data.hero.cta_primary" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Link</label><input v-model="data.hero.cta_primary_link" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">CTA Secondary</label><input v-model="data.hero.cta_secondary" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Download Sekarang" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">CTA Secondary Link</label><input v-model="data.hero.cta_secondary_link" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="#features" /></div>
        </div>
        <!-- Hero Image Upload -->
        <div>
          <label class="block text-xs text-gray-500 mb-1">Hero Image</label>
          <div v-if="data.hero.image_url" class="mb-2 relative w-full max-w-sm h-40 rounded-lg overflow-hidden bg-gray-100">
            <img :src="data.hero.image_url" class="w-full h-full object-cover" />
            <button @click="data.hero.image_url = ''" class="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded">✕</button>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="uploadHeroImage" class="text-xs" />
          <p v-if="heroUploading" class="text-xs text-blue-600 mt-1">Mengupload...</p>
          <p v-if="heroUploadError" class="text-xs text-red-600 mt-1">{{ heroUploadError }}</p>
        </div>
      </div>

      <!-- Features -->
      <div v-if="activeSection === 'features'" class="bg-white rounded-xl border p-5 space-y-4">
        <div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">Features</h3><button @click="addFeature" class="text-xs text-blue-600 hover:underline">+ Tambah</button></div>
        <div v-for="(f, i) in data.features.items" :key="i" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <input v-model="f.icon" type="text" class="w-16 px-2 py-1 border border-gray-200 rounded text-xs" placeholder="icon" />
          <input v-model="f.title" type="text" class="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Title" />
          <input v-model="f.description" type="text" class="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Description" />
          <label class="text-xs"><input type="checkbox" v-model="f.active" class="rounded" /> On</label>
          <button @click="data.features.items.splice(i, 1)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
        </div>
      </div>

      <!-- Consultants -->
      <div v-if="activeSection === 'consultants'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">Konsultan di Landing Page</h3>
        <p class="text-sm text-gray-500">Data konsultan diambil langsung dari tab <strong>Konsultasi</strong>. Hanya konsultan aktif yang tampil.</p>
        <div v-if="liveConsultants.length === 0" class="p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center">Belum ada konsultan aktif. Tambahkan dari menu Konsultasi.</div>
        <div v-else class="space-y-2">
          <div v-for="c in liveConsultants" :key="c.id" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              <img v-if="c.avatar_url" :src="c.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-xs">👤</span>
            </div>
            <div class="flex-1"><p class="text-sm font-medium text-gray-900">{{ c.name }}</p><p class="text-xs text-gray-500">{{ c.specialty }}</p></div>
            <span class="text-xs text-green-600">Aktif</span>
          </div>
        </div>
      </div>

      <!-- Webinars -->
      <div v-if="activeSection === 'webinars'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">Webinar di Landing Page</h3>
        <p class="text-sm text-gray-500">Data webinar diambil langsung dari tab <strong>Webinar</strong>. Hanya webinar published yang tampil.</p>
        <div v-if="liveWebinars.length === 0" class="p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center">Belum ada webinar published. Buat dari menu Webinar.</div>
        <div v-else class="space-y-2">
          <div v-for="w in liveWebinars" :key="w.id" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-12 h-8 bg-gray-200 rounded overflow-hidden"><img v-if="w.cover_url" :src="w.cover_url" class="w-full h-full object-cover" /></div>
            <div class="flex-1"><p class="text-sm font-medium text-gray-900">{{ w.title }}</p><p class="text-xs text-gray-500">{{ w.speaker_name }}</p></div>
            <span class="text-xs text-green-600">Published</span>
          </div>
        </div>
      </div>

      <!-- Articles -->
      <div v-if="activeSection === 'articles'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">Artikel di Landing Page</h3>
        <p class="text-sm text-gray-500">Data artikel diambil langsung dari tab <strong>Konten</strong>. Hanya artikel published yang tampil.</p>
        <div v-if="liveArticles.length === 0" class="p-4 bg-gray-50 rounded-lg text-sm text-gray-400 text-center">Belum ada artikel published. Buat dari menu Konten.</div>
        <div v-else class="space-y-2">
          <div v-for="a in liveArticles" :key="a.id" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-12 h-8 bg-gray-200 rounded overflow-hidden"><img v-if="a.cover_url" :src="a.cover_url" class="w-full h-full object-cover" /></div>
            <div class="flex-1"><p class="text-sm font-medium text-gray-900">{{ a.title }}</p><p class="text-xs text-gray-500">{{ a.category }} · {{ a.author_name || 'Kinora' }}</p></div>
            <span class="text-xs text-green-600">Published</span>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div v-if="activeSection === 'faq'" class="bg-white rounded-xl border p-5 space-y-4">
        <div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">FAQ</h3><button @click="addFaq" class="text-xs text-blue-600 hover:underline">+ Tambah</button></div>
        <div v-for="(item, i) in data.faq.items" :key="i" class="p-3 bg-gray-50 rounded-lg space-y-2">
          <div class="flex gap-2"><input v-model="item.q" type="text" class="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Pertanyaan" /><label class="text-xs"><input type="checkbox" v-model="item.active" class="rounded" /> On</label><button @click="data.faq.items.splice(i,1)" class="text-red-400 text-xs">✕</button></div>
          <textarea v-model="item.a" rows="2" class="w-full px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Jawaban"></textarea>
        </div>
      </div>

      <!-- Testimonials -->
      <div v-if="activeSection === 'testimonials'" class="bg-white rounded-xl border p-5 space-y-4">
        <div class="flex items-center justify-between"><h3 class="font-semibold text-gray-900">Testimonials</h3><button @click="addTestimonial" class="text-xs text-blue-600 hover:underline">+ Tambah</button></div>
        <div v-for="(t, i) in data.testimonials.items" :key="i" class="p-3 bg-gray-50 rounded-lg space-y-2">
          <div class="grid grid-cols-3 gap-2">
            <input v-model="t.name" type="text" class="px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Nama" />
            <input v-model="t.role" type="text" class="px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Role" />
            <div class="flex items-center gap-1"><input v-model.number="t.rating" type="number" min="1" max="5" class="w-12 px-2 py-1 border border-gray-200 rounded text-sm" /><label class="text-xs"><input type="checkbox" v-model="t.active" class="rounded" /></label><button @click="data.testimonials.items.splice(i,1)" class="text-red-400 text-xs">✕</button></div>
          </div>
          <textarea v-model="t.text" rows="2" class="w-full px-2 py-1 border border-gray-200 rounded text-sm" placeholder="Testimoni"></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="activeSection === 'footer'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">Footer</h3>
        <div><label class="block text-xs text-gray-500 mb-1">Deskripsi</label><input v-model="data.footer.description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">Privacy URL</label><input v-model="data.footer.privacy_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">Terms URL</label><input v-model="data.footer.terms_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div><label class="block text-xs text-gray-500 mb-1">Copyright</label><input v-model="data.footer.copyright" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <h4 class="text-xs font-medium text-gray-500 mt-4">Social Media</h4>
        <div class="grid grid-cols-2 gap-3">
          <div v-for="platform in ['instagram','tiktok','youtube','facebook','twitter','linkedin']" :key="platform">
            <label class="block text-xs text-gray-500 mb-1 capitalize">{{ platform }}</label>
            <input v-model="data.footer.social[platform]" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" :placeholder="`https://${platform}.com/...`" />
          </div>
        </div>
      </div>

      <!-- SEO -->
      <div v-if="activeSection === 'seo'" class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-900">SEO</h3>
        <div><label class="block text-xs text-gray-500 mb-1">Page Title</label><input v-model="data.seo.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        <div><label class="block text-xs text-gray-500 mb-1">Meta Description</label><textarea v-model="data.seo.meta_description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-xs text-gray-500 mb-1">OG Title</label><input v-model="data.seo.og_title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div><label class="block text-xs text-gray-500 mb-1">OG Description</label><input v-model="data.seo.og_description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
        </div>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.seo.robots_index" class="rounded" /> Index</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="data.seo.robots_follow" class="rounded" /> Follow</label>
        </div>
      </div>

      <!-- PAGES -->
      <div v-if="activeSection === 'pages'" class="space-y-4">
        <div v-for="pageKey in ['page_privacy', 'page_terms', 'page_help']" :key="pageKey" class="bg-white rounded-xl border p-5 space-y-4">
          <h3 class="font-semibold text-gray-900">{{ pageLabels[pageKey] }}</h3>
          <div><label class="block text-xs text-gray-500 mb-1">Judul Halaman</label><input v-model="data[pageKey].title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Konten</label>
            <RichTextEditor v-model="data[pageKey].body" />
          </div>
          <p class="text-xs text-gray-400">URL: <a :href="'/' + pageKey.replace('page_', '')" class="text-blue-600 hover:underline" target="_blank">/{{ pageKey.replace('page_', '') }}</a></p>
        </div>
      </div>

      <!-- HELP ARTICLES -->
      <div v-if="activeSection === 'help_articles'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Artikel Bantuan ({{ helpArticles.length }})</h3>
          <button @click="editHelpArticle(null)" class="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Tambah Artikel</button>
        </div>

        <div v-if="helpArticles.length === 0" class="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">Belum ada artikel bantuan.</div>
        <div v-else class="space-y-2">
          <div v-for="a in helpArticles" :key="a.id" class="bg-white rounded-xl border p-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ a.title }}</p>
              <p class="text-xs text-gray-400">{{ a.category }} · {{ a.status }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="editHelpArticle(a)" class="text-xs text-blue-600 hover:underline">Edit</button>
              <button @click="deleteHelpArticle(a.id)" class="text-xs text-red-600 hover:underline">Hapus</button>
            </div>
          </div>
        </div>

        <!-- Help Article Editor Modal -->
        <Teleport to="body">
        <div v-if="showHelpEditor" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" @click.self="showHelpEditor = false">
          <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-4">
            <h3 class="font-semibold text-gray-900">{{ helpForm.id ? 'Edit Artikel' : 'Tambah Artikel' }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Judul *</label><input v-model="helpForm.title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Slug *</label><input v-model="helpForm.slug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Kategori</label>
                <select v-model="helpForm.category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="akun">Akun & Login</option>
                  <option value="family">Family & Anggota</option>
                  <option value="subscription">Subscription</option>
                  <option value="lokasi">Lokasi & Safe Zone</option>
                  <option value="keamanan">SOS & Keamanan</option>
                  <option value="parenting">Parenting</option>
                  <option value="general">Umum</option>
                </select>
              </div>
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Ringkasan</label><input v-model="helpForm.summary" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div class="col-span-2">
                <label class="block text-xs text-gray-500 mb-1">Konten</label>
                <RichTextEditor v-model="helpForm.body" />
              </div>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="helpForm.is_popular" class="rounded" /> Populer</label>
                <label class="flex items-center gap-2 text-xs"><input type="checkbox" v-model="helpForm.is_faq" class="rounded" /> FAQ</label>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Status</label>
                <select v-model="helpForm.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div v-if="helpError" class="text-xs text-red-600">{{ helpError }}</div>
            <div class="flex justify-end gap-3">
              <button @click="showHelpEditor = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
              <button @click="saveHelpArticle" :disabled="helpSaving" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ helpSaving ? 'Saving...' : 'Simpan' }}</button>
            </div>
          </div>
        </div>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'
import RichTextEditor from '../components/RichTextEditor.vue'

const sections = [
  { id: 'general', label: 'General' },
  { id: 'hero', label: 'Hero' },
  { id: 'features', label: 'Features' },
  { id: 'consultants', label: 'Consultants' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'articles', label: 'Articles' },
  { id: 'faq', label: 'FAQ' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'footer', label: 'Footer' },
  { id: 'seo', label: 'SEO' },
  { id: 'pages', label: 'Pages' },
  { id: 'help_articles', label: 'Help Articles' },
]

const activeSection = ref('general')
const loading = ref(true)
const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')
const heroUploading = ref(false)
const heroUploadError = ref('')
const logoUploading = ref(false)
const logoUploadError = ref('')
const data = ref({ general: {}, hero: {}, features: { items: [] }, faq: { items: [] }, testimonials: { items: [] }, footer: { social: {} }, seo: {}, download: {}, page_privacy: { title: '', body: '' }, page_terms: { title: '', body: '' }, page_help: { title: '', body: '' } })
const pageLabels = { page_privacy: 'Kebijakan Privasi', page_terms: 'Syarat & Ketentuan', page_help: 'Pusat Bantuan' }
const liveConsultants = ref([])
const liveWebinars = ref([])
const liveArticles = ref([])

async function loadConfig() {
  loading.value = true
  const [configRes, consRes, webRes, artRes] = await Promise.all([
    supabase.from('kinora_landing_config').select('key, value'),
    supabase.from('kinora_consultants').select('id, name, specialty, avatar_url').eq('is_active', true).order('priority', { ascending: false }).limit(10),
    supabase.from('kinora_webinars').select('id, title, speaker_name, cover_url').eq('is_published', true).order('scheduled_at', { ascending: false }).limit(10),
    supabase.from('kinora_articles').select('id, title, category, author_name, cover_url').eq('status', 'published').order('published_at', { ascending: false }).limit(10),
  ])
  if (configRes.data) {
    for (const r of configRes.data) data.value[r.key] = r.value
  }
  if (!data.value.footer.social) data.value.footer.social = {}
  if (!data.value.features.items) data.value.features.items = []
  if (!data.value.faq.items) data.value.faq.items = []
  if (!data.value.testimonials.items) data.value.testimonials.items = []
  liveConsultants.value = consRes.data || []
  liveWebinars.value = webRes.data || []
  liveArticles.value = artRes.data || []
  loading.value = false
}

async function saveAll(status = 'published') {
  saving.value = true
  saveSuccess.value = false
  saveError.value = ''
  const errors = []

  for (const key of Object.keys(data.value)) {
    const res = await supabase.rpc('founder_save_landing_config', { p_key: key, p_value: data.value[key], p_status: status })
    if (res.error) errors.push(`${key}: ${res.error.message}`)
  }

  if (errors.length) {
    saveError.value = errors.join(' | ')
  } else {
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  }
  saving.value = false
}

function addFeature() { data.value.features.items.push({ title: '', description: '', icon: 'star', active: true }) }
function addFaq() { data.value.faq.items.push({ q: '', a: '', active: true }) }
function addTestimonial() { data.value.testimonials.items.push({ name: '', role: '', text: '', rating: 5, active: true }) }

async function uploadHeroImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  heroUploadError.value = ''
  if (file.size > 5 * 1024 * 1024) { heroUploadError.value = 'Max 5MB'; return }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { heroUploadError.value = 'Format: JPEG, PNG, WebP'; return }

  heroUploading.value = true
  const path = `landing/hero-${Date.now()}.${file.name.split('.').pop()}`
  const { error } = await supabase.storage.from('articles').upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) {
    heroUploadError.value = error.message
  } else {
    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(path)
    data.value.hero.image_url = urlData.publicUrl
  }
  heroUploading.value = false
}

async function uploadLogo(e) {
  const file = e.target.files?.[0]
  if (!file) return
  logoUploadError.value = ''
  if (file.size > 2 * 1024 * 1024) { logoUploadError.value = 'Max 2MB'; return }
  if (!['image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) { logoUploadError.value = 'Format: PNG, SVG, WebP'; return }

  logoUploading.value = true
  const ext = file.name.split('.').pop()
  const path = `landing/logo-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('articles').upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) {
    logoUploadError.value = error.message
  } else {
    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(path)
    data.value.general.logo_url = urlData.publicUrl
  }
  logoUploading.value = false
}

onMounted(() => {
  loadConfig()
  loadHelpArticles()
})

// Help Articles
const helpArticles = ref([])
const showHelpEditor = ref(false)
const helpForm = ref({ id: null, title: '', slug: '', summary: '', body: '', category: 'general', is_popular: false, is_faq: false, status: 'published' })
const helpSaving = ref(false)
const helpError = ref('')

async function loadHelpArticles() {
  const { data } = await supabase.from('kinora_help_articles').select('*').order('sort_order')
  helpArticles.value = data || []
}

function editHelpArticle(article) {
  if (article) {
    helpForm.value = { ...article }
  } else {
    helpForm.value = { id: null, title: '', slug: '', summary: '', body: '', category: 'general', is_popular: false, is_faq: false, status: 'published', sort_order: helpArticles.value.length }
  }
  helpError.value = ''
  showHelpEditor.value = true
}

async function saveHelpArticle() {
  helpError.value = ''
  if (!helpForm.value.title) { helpError.value = 'Judul wajib diisi'; return }
  if (!helpForm.value.slug) {
    helpForm.value.slug = helpForm.value.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  helpSaving.value = true
  const { id, ...payload } = helpForm.value
  payload.updated_at = new Date().toISOString()

  let result
  if (id) {
    result = await supabase.from('kinora_help_articles').update(payload).eq('id', id)
  } else {
    result = await supabase.from('kinora_help_articles').insert(payload)
  }

  if (result.error) {
    helpError.value = result.error.message
  } else {
    showHelpEditor.value = false
    loadHelpArticles()
  }
  helpSaving.value = false
}

async function deleteHelpArticle(id) {
  if (!confirm('Hapus artikel ini?')) return
  await supabase.from('kinora_help_articles').delete().eq('id', id)
  loadHelpArticles()
}
</script>
