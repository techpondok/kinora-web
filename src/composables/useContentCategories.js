import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const categories = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref(false)

export function useContentCategories() {
  async function loadCategories(contentType = null) {
    if (loaded.value && !contentType) return categories.value

    loading.value = true
    error.value = false
    try {
      let query = supabase
        .from('kinora_content_categories')
        .select('id, name, slug, description, display_order, content_type')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (contentType && contentType !== 'all') {
        query = query.in('content_type', [contentType, 'all'])
      }

      const { data, error: err } = await query
      if (err) throw err

      categories.value = data || []
      loaded.value = true
    } catch (e) {
      error.value = true
      console.warn('[useContentCategories] Failed to load:', e.message)
    } finally {
      loading.value = false
    }

    return categories.value
  }

  function getCategoryBySlug(slug) {
    return categories.value.find(c => c.slug === slug)
  }

  function isValidCategory(slug) {
    if (!slug) return true // empty = all
    return categories.value.some(c => c.slug === slug)
  }

  return {
    categories,
    loading,
    loaded,
    error,
    loadCategories,
    getCategoryBySlug,
    isValidCategory,
  }
}
