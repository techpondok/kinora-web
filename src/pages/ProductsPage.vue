<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Produk</h1>
        <p class="text-sm text-gray-500">Kelola produk, harga, stok, dan media.</p>
      </div>
      <button @click="openEditor(null)" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">+ Tambah Produk</button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-center">
      <input v-model="search" type="text" placeholder="Cari produk..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm w-52 outline-none" />
      <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Status</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="inactive">Inactive</option>
        <option value="archived">Archived</option>
      </select>
      <select v-model="categoryFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
        <option value="">Semua Kategori</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center gap-4">
        <div class="w-14 h-14 bg-gray-200 rounded-lg"></div>
        <div class="flex-1"><div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div><div class="h-3 bg-gray-100 rounded w-1/4"></div></div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredProducts.length === 0 && !search && !statusFilter" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p class="text-gray-900 font-semibold text-sm mb-1">Belum ada produk</p>
      <p class="text-gray-500 text-xs mb-4">Tambahkan produk pertama agar dapat ditampilkan pada katalog Kinora.</p>
      <button @click="openEditor(null)" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Tambah Produk</button>
    </div>

    <!-- Product Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Produk</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Harga</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">Stok</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="p in filteredProducts" :key="p.id" class="hover:bg-gray-50 transition">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img v-if="p.cover_url" :src="p.cover_url" :alt="p.name" class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ p.name }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ p.sku || p.slug || '—' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3"><span class="text-xs px-2 py-0.5 bg-gray-100 rounded">{{ p.category }}</span></td>
              <td class="px-4 py-3">
                <div>
                  <span v-if="p.compare_at_price && p.compare_at_price > p.base_price" class="text-xs text-gray-400 line-through mr-1">{{ formatIDR(p.compare_at_price) }}</span>
                  <span class="font-medium text-gray-900">{{ formatIDR(p.base_price) }}</span>
                  <span v-if="p.promo_price && isPromoActive(p)" class="block text-xs text-amber-600 font-medium">Promo: {{ formatIDR(p.promo_price) }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span v-if="!p.track_stock" class="text-xs text-gray-400">—</span>
                <span v-else-if="p.stock_quantity <= 0" class="text-xs text-red-600 font-medium">Habis</span>
                <span v-else-if="p.stock_quantity <= (p.low_stock_threshold || 5)" class="text-xs text-amber-600 font-medium">{{ p.stock_quantity }}</span>
                <span v-else class="text-xs text-gray-700">{{ p.stock_quantity }}</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="statusBadge(p.status)" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ p.status }}</span>
              </td>
              <td class="px-4 py-3 text-right space-x-2">
                <button @click="openEditor(p)" class="text-blue-600 text-xs hover:underline">Edit</button>
                <button v-if="p.status === 'draft'" @click="publishProduct(p)" class="text-green-600 text-xs hover:underline">Publish</button>
                <button v-if="p.status === 'published'" @click="unpublishProduct(p)" class="text-orange-600 text-xs hover:underline">Unpublish</button>
                <button @click="deleteProduct(p)" class="text-red-600 text-xs hover:underline">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Product Editor Drawer -->
    <div v-if="showEditor" class="fixed inset-0 z-50 flex justify-end">
      <div @click="showEditor = false" class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div class="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 class="font-bold text-gray-900">{{ form.id ? 'Edit Produk' : 'Tambah Produk' }}</h3>
          <button @click="showEditor = false" class="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        <div class="p-6 space-y-5">
          <!-- Basic Info -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">Informasi Dasar</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Nama Produk *</label><input v-model="form.name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Slug</label><input v-model="form.slug" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none" placeholder="auto-generated" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">SKU</label><input v-model="form.sku" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Jenis</label>
                <select v-model="form.product_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="physical">Fisik</option><option value="digital">Digital</option><option value="service">Layanan</option>
                </select>
              </div>
              <div><label class="block text-xs text-gray-500 mb-1">Kategori</label>
                <select v-model="form.category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="hardfile">Hardfile</option><option value="baju">Baju</option><option value="merchandise">Merchandise</option><option value="gps_tag">GPS Tag</option><option value="other">Lainnya</option>
                </select>
              </div>
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Deskripsi Singkat</label><input v-model="form.short_description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Deskripsi Lengkap</label><textarea v-model="form.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
            </div>
          </section>

          <!-- Media -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">Media</h4>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Gambar Utama (URL)</label>
              <input v-model="form.cover_url" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="https://..." />
              <div v-if="form.cover_url" class="mt-2 w-24 h-24 rounded-lg overflow-hidden border"><img :src="form.cover_url" class="w-full h-full object-cover" /></div>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Upload Gambar</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="handleImageUpload" class="text-sm" />
              <p v-if="uploadingImage" class="text-xs text-blue-600 mt-1">Mengunggah...</p>
              <p v-if="uploadError" class="text-xs text-red-600 mt-1">{{ uploadError }}</p>
            </div>
            <div v-if="galleryImages.length" class="flex flex-wrap gap-2">
              <div v-for="(img, i) in galleryImages" :key="img.id || i" class="relative w-20 h-20 rounded-lg overflow-hidden border group">
                <img :src="img.image_url" class="w-full h-full object-cover" />
                <button @click="removeGalleryImage(i)" class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
              </div>
            </div>
          </section>

          <!-- Pricing -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">Harga</h4>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs text-gray-500 mb-1">Harga Normal (IDR) *</label><input v-model.number="form.base_price" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Harga Coret (IDR)</label><input v-model.number="form.compare_at_price" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Harga Promo (IDR)</label><input v-model.number="form.promo_price" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Currency</label><input v-model="form.price_currency" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Promo Mulai</label><input v-model="form.promo_start_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Promo Berakhir</label><input v-model="form.promo_end_at" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            </div>
            <div v-if="form.compare_at_price > form.base_price" class="text-xs text-gray-400"><s>{{ formatIDR(form.compare_at_price) }}</s> → {{ formatIDR(form.base_price) }}</div>
          </section>

          <!-- Stock -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">Stok</h4>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" v-model="form.track_stock" class="rounded" /> Track stock</label>
              <div v-if="form.track_stock"><label class="block text-xs text-gray-500 mb-1">Jumlah Stok</label><input v-model.number="form.stock_quantity" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div v-if="form.track_stock"><label class="block text-xs text-gray-500 mb-1">Low Stock Alert</label><input v-model.number="form.low_stock_threshold" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Min Purchase</label><input v-model.number="form.min_quantity" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Max Purchase</label><input v-model.number="form.max_purchase" type="number" min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            </div>
          </section>

          <!-- Physical product fields -->
          <section v-if="form.product_type === 'physical'" class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">Pengiriman</h4>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="block text-xs text-gray-500 mb-1">Berat (gram)</label><input v-model.number="form.weight_grams" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Checkout Type</label>
                <select v-model="form.checkout_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="internal">Internal</option><option value="external">External (Olshop)</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Variants -->
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-gray-500 uppercase">Variasi</h4>
              <button @click="addVariant" class="text-xs text-blue-600 hover:underline">+ Tambah</button>
            </div>
            <div v-for="(v, i) in form.variants" :key="i" class="p-3 bg-gray-50 rounded-lg grid grid-cols-12 gap-2 items-end">
              <div class="col-span-3"><label class="block text-xs text-gray-500 mb-1">SKU</label><input v-model="v.sku" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
              <div class="col-span-3"><label class="block text-xs text-gray-500 mb-1">Harga</label><input v-model.number="v.price" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Stok</label><input v-model.number="v.stock" type="number" min="0" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" /></div>
              <div class="col-span-3"><label class="block text-xs text-gray-500 mb-1">Options (JSON)</label><input v-model="v.options_str" type="text" class="w-full px-2 py-1.5 border border-gray-200 rounded text-sm outline-none" placeholder='{"ukuran":"L"}' /></div>
              <div class="col-span-1"><button @click="form.variants.splice(i, 1)" class="text-red-500 text-sm">✕</button></div>
            </div>
          </section>

          <!-- SEO & Publish -->
          <section class="space-y-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase">SEO & Publikasi</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">SEO Title</label><input v-model="form.seo_title" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div class="col-span-2"><label class="block text-xs text-gray-500 mb-1">Meta Description</label><textarea v-model="form.meta_description" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"></textarea></div>
              <div><label class="block text-xs text-gray-500 mb-1">Focus Keyword</label><input v-model="form.focus_keyword" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
              <div><label class="block text-xs text-gray-500 mb-1">Status</label>
                <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                  <option value="draft">Draft</option><option value="published">Published</option><option value="inactive">Inactive</option><option value="archived">Archived</option>
                </select>
              </div>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.is_featured" class="rounded" /> Featured</label>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="form.is_active" class="rounded" /> Aktif</label>
            </div>
          </section>

          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button @click="saveProduct" :disabled="saving" class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {{ saving ? 'Menyimpan...' : (form.id ? 'Simpan' : 'Buat Produk') }}
            </button>
            <button @click="showEditor = false" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Batal</button>
          </div>
          <p v-if="saveError" class="text-xs text-red-600">{{ saveError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase.js'

const products = ref([])
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const showEditor = ref(false)
const saving = ref(false)
const saveError = ref('')
const uploadingImage = ref(false)
const uploadError = ref('')
const galleryImages = ref([])

const defaultForm = {
  id: null, name: '', slug: '', sku: '', product_type: 'physical', category: 'other',
  short_description: '', description: '', cover_url: '', base_price: 0, compare_at_price: null,
  promo_price: null, price_currency: 'IDR', promo_start_at: '', promo_end_at: '',
  track_stock: true, stock_quantity: 0, low_stock_threshold: 5, min_quantity: 1, max_quantity: 100,
  max_purchase: 10, weight_grams: null, checkout_type: 'internal', is_active: true, is_featured: false,
  status: 'draft', seo_title: '', meta_description: '', focus_keyword: '', tags: [],
  option_groups: [], external_links: [], variants: []
}
const form = ref({ ...defaultForm })

const categories = computed(() => [...new Set(products.value.map(p => p.category))].sort())

const filteredProducts = computed(() => {
  let list = products.value
  if (statusFilter.value) list = list.filter(p => p.status === statusFilter.value)
  if (categoryFilter.value) list = list.filter(p => p.category === categoryFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q))
  }
  return list
})

function formatIDR(val) {
  if (!val && val !== 0) return 'Gratis'
  return 'Rp ' + Number(val).toLocaleString('id-ID')
}

function statusBadge(status) {
  if (status === 'published') return 'bg-green-100 text-green-700'
  if (status === 'draft') return 'bg-gray-100 text-gray-600'
  if (status === 'inactive') return 'bg-orange-100 text-orange-700'
  if (status === 'archived') return 'bg-red-100 text-red-600'
  return 'bg-gray-100 text-gray-500'
}

function isPromoActive(p) {
  if (!p.promo_price) return false
  const now = new Date()
  if (p.promo_start_at && new Date(p.promo_start_at) > now) return false
  if (p.promo_end_at && new Date(p.promo_end_at) < now) return false
  return true
}

async function fetchProducts() {
  loading.value = true
  const { data } = await supabase
    .from('kinora_print_products')
    .select('*')
    .order('updated_at', { ascending: false })
  products.value = data || []
  loading.value = false
}

async function openEditor(product) {
  if (product) {
    form.value = { ...defaultForm, ...product, variants: [] }
    // Load variants
    const { data: variants } = await supabase
      .from('kinora_print_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at')
    form.value.variants = (variants || []).map(v => ({ ...v, options_str: JSON.stringify(v.options || {}) }))
    // Load gallery
    const { data: imgs } = await supabase
      .from('kinora_print_product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order')
    galleryImages.value = imgs || []
  } else {
    form.value = { ...defaultForm, variants: [] }
    galleryImages.value = []
  }
  saveError.value = ''
  showEditor.value = true
}

function addVariant() {
  form.value.variants.push({ sku: '', price: form.value.base_price, stock: 0, options_str: '{}', is_active: true, compare_at_price: null, promo_price: null })
}

async function handleImageUpload(e) {
  const files = e.target.files
  if (!files.length) return
  uploadingImage.value = true
  uploadError.value = ''
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) { uploadError.value = 'Maks 5 MB per gambar'; continue }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { uploadError.value = 'Format: JPG, PNG, WebP'; continue }
    const ext = file.name.split('.').pop()
    const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('marketplace-products').upload(path, file, { cacheControl: '3600' })
    if (error) { uploadError.value = error.message; continue }
    const { data: urlData } = supabase.storage.from('marketplace-products').getPublicUrl(path)
    galleryImages.value.push({ image_url: urlData.publicUrl, sort_order: galleryImages.value.length })
    if (!form.value.cover_url) form.value.cover_url = urlData.publicUrl
  }
  uploadingImage.value = false
}

function removeGalleryImage(idx) {
  galleryImages.value.splice(idx, 1)
}

async function saveProduct() {
  if (!form.value.name) { saveError.value = 'Nama produk wajib diisi.'; return }
  if (form.value.base_price < 0) { saveError.value = 'Harga tidak valid.'; return }
  saving.value = true
  saveError.value = ''

  const payload = {
    name: form.value.name,
    slug: form.value.slug || form.value.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    sku: form.value.sku || null,
    product_type: form.value.product_type,
    category: form.value.category,
    short_description: form.value.short_description || null,
    description: form.value.description || null,
    cover_url: form.value.cover_url || null,
    base_price: form.value.base_price,
    compare_at_price: form.value.compare_at_price || null,
    promo_price: form.value.promo_price || null,
    price_currency: form.value.price_currency || 'IDR',
    promo_start_at: form.value.promo_start_at || null,
    promo_end_at: form.value.promo_end_at || null,
    track_stock: form.value.track_stock,
    stock_quantity: form.value.stock_quantity || 0,
    low_stock_threshold: form.value.low_stock_threshold || 5,
    min_quantity: form.value.min_quantity || 1,
    max_quantity: form.value.max_quantity || 100,
    max_purchase: form.value.max_purchase || 10,
    weight_grams: form.value.weight_grams || null,
    checkout_type: form.value.checkout_type || 'internal',
    is_active: form.value.is_active,
    is_featured: form.value.is_featured,
    status: form.value.status,
    seo_title: form.value.seo_title || null,
    meta_description: form.value.meta_description || null,
    focus_keyword: form.value.focus_keyword || null,
    option_groups: form.value.option_groups || [],
    external_links: form.value.external_links || [],
    tags: form.value.tags || [],
    updated_at: new Date().toISOString(),
    published_at: form.value.status === 'published' ? (form.value.published_at || new Date().toISOString()) : null,
  }

  try {
    let productId = form.value.id
    if (productId) {
      const { error } = await supabase.from('kinora_print_products').update(payload).eq('id', productId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('kinora_print_products').insert(payload).select('id').single()
      if (error) throw error
      productId = data.id
    }

    // Save variants
    await supabase.from('kinora_print_variants').delete().eq('product_id', productId)
    if (form.value.variants.length) {
      const variantRows = form.value.variants.map((v, i) => ({
        product_id: productId, sku: v.sku || null, price: v.price || payload.base_price,
        stock: v.stock || 0, is_active: v.is_active !== false, compare_at_price: v.compare_at_price || null,
        promo_price: v.promo_price || null, options: safeParseJson(v.options_str, {})
      }))
      await supabase.from('kinora_print_variants').insert(variantRows)
    }

    // Save gallery images
    await supabase.from('kinora_print_product_images').delete().eq('product_id', productId)
    if (galleryImages.value.length) {
      const imgRows = galleryImages.value.map((img, i) => ({ product_id: productId, image_url: img.image_url, sort_order: i }))
      await supabase.from('kinora_print_product_images').insert(imgRows)
    }

    showEditor.value = false
    await fetchProducts()
  } catch (e) {
    saveError.value = e.message || 'Gagal menyimpan produk.'
  } finally {
    saving.value = false
  }
}

function safeParseJson(str, fallback) {
  try { return JSON.parse(str) } catch { return fallback }
}

async function publishProduct(p) {
  await supabase.from('kinora_print_products').update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', p.id)
  await fetchProducts()
}

async function unpublishProduct(p) {
  await supabase.from('kinora_print_products').update({ status: 'draft', updated_at: new Date().toISOString() }).eq('id', p.id)
  await fetchProducts()
}

async function deleteProduct(p) {
  if (!confirm(`Hapus produk "${p.name}"? Data varian dan gambar juga akan dihapus.`)) return

  // Check if product has orders
  const { count } = await supabase
    .from('kinora_print_orders')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', p.id)

  if (count > 0) {
    // Soft delete: archive product yang punya order
    const { error } = await supabase
      .from('kinora_print_products')
      .update({ status: 'archived', is_active: false, updated_at: new Date().toISOString() })
      .eq('id', p.id)
    if (error) { alert('Gagal archive produk: ' + error.message); return }
    alert('Produk memiliki riwayat pesanan, status diubah ke "Archived".')
  } else {
    // Hard delete: produk tanpa order
    const { error: e1 } = await supabase.from('kinora_print_variants').delete().eq('product_id', p.id)
    if (e1) { alert('Gagal hapus varian: ' + e1.message); return }
    const { error: e2 } = await supabase.from('kinora_print_product_images').delete().eq('product_id', p.id)
    if (e2) { alert('Gagal hapus gambar: ' + e2.message); return }
    const { error: e3 } = await supabase.from('kinora_print_products').delete().eq('id', p.id)
    if (e3) { alert('Gagal hapus produk: ' + e3.message); return }
  }
  await fetchProducts()
}

onMounted(fetchProducts)
</script>
