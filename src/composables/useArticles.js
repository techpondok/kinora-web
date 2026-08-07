import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useArticles() {
  const articles = ref([])
  const article = ref(null)
  const loading = ref(false)
  const error = ref('')
  const totalCount = ref(0)

  function generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function calculateSeoScore(data) {
    let score = 0
    const kw = (data.focus_keyword || '').toLowerCase()
    if (!kw) return 0

    if (data.title?.toLowerCase().includes(kw)) score += 15
    if (data.slug?.toLowerCase().includes(kw)) score += 10
    if (data.meta_description?.toLowerCase().includes(kw)) score += 10
    if (data.body?.substring(0, 300).toLowerCase().includes(kw)) score += 10
    if (data.title && data.title.length >= 30 && data.title.length <= 70) score += 10
    if (data.meta_description && data.meta_description.length >= 120 && data.meta_description.length <= 160) score += 10
    if (data.body?.includes('<h2') || data.body?.includes('<h3') || data.body?.includes('## ')) score += 10
    if (data.cover_alt) score += 5
    if (data.body?.includes('href=')) score += 10
    if (data.body && data.body.length >= 300) score += 10

    return Math.min(score, 100)
  }

  async function fetchArticles({ page = 1, pageSize = 10, search = '', contentType = '', status = '', featured = '', sortBy = 'created_at', sortAsc = false } = {}) {
    loading.value = true
    error.value = ''

    let query = supabase
      .from('kinora_articles')
      .select('id, title, slug, content_type, category, author_name, status, is_published, published_at, updated_at, read_count, is_featured, cover_url, seo_score, created_by', { count: 'exact' })

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,author_name.ilike.%${search}%,focus_keyword.ilike.%${search}%`)
    }
    if (contentType) query = query.eq('content_type', contentType)
    if (status) {
      query = query.eq('status', status)
      if (status === 'published') query = query.lte('published_at', new Date().toISOString())
    }
    if (featured === 'true') query = query.eq('is_featured', true)
    if (featured === 'false') query = query.eq('is_featured', false)

    query = query.order(sortBy, { ascending: sortAsc })

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)

    const { data, error: err, count } = await query
    if (err) {
      error.value = err.message
    } else {
      articles.value = data || []
      totalCount.value = count || 0
    }
    loading.value = false
  }

  async function fetchArticle(id) {
    loading.value = true
    error.value = ''
    const { data, error: err } = await supabase
      .from('kinora_articles')
      .select('*')
      .eq('id', id)
      .single()

    if (err) {
      error.value = err.message
    } else {
      article.value = data
    }
    loading.value = false
    return { data, error: err }
  }

  async function fetchBySlug(slug) {
    const { data, error: err } = await supabase
      .from('kinora_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .single()
    return { data, error: err }
  }

  async function saveArticle(payload) {
    loading.value = true
    error.value = ''

    payload.seo_score = calculateSeoScore(payload)

    // Sync is_published with status
    payload.is_published = payload.status === 'published'
    if (payload.status === 'published' && !payload.published_at) {
      payload.published_at = new Date().toISOString()
    }
    if (payload.status === 'scheduled') {
      payload.is_published = false
      payload.published_at = null
    }
    if (payload.status === 'draft') {
      payload.is_published = false
    }

    // Resolve OG image from cover if not set
    if (!payload.og_image && payload.cover_url) {
      payload.og_image = payload.cover_url
    }
    // Auto-fill OG fields
    if (!payload.og_title && payload.seo_title) payload.og_title = payload.seo_title
    if (!payload.og_description && payload.meta_description) payload.og_description = payload.meta_description
    // Auto-fill Twitter from OG
    if (!payload.twitter_title && payload.og_title) payload.twitter_title = payload.og_title
    if (!payload.twitter_description && payload.og_description) payload.twitter_description = payload.og_description
    if (!payload.twitter_image && payload.og_image) payload.twitter_image = payload.og_image
    // Auto canonical
    if (!payload.canonical_url && payload.slug) {
      payload.canonical_url = 'https://kinorafamilies.com/articles/' + payload.slug
    }

    let result
    if (payload.id) {
      payload.updated_at = new Date().toISOString()
      result = await supabase.from('kinora_articles').update(payload).eq('id', payload.id).select().single()
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      payload.created_by = user?.id
      result = await supabase.from('kinora_articles').insert(payload).select().single()
    }

    if (result.error) {
      error.value = result.error.message
      if (result.error.message.includes('idx_kinora_articles_slug')) {
        error.value = 'Slug sudah digunakan. Gunakan slug lain.'
      }
    }
    loading.value = false
    return result
  }

  async function deleteArticle(id) {
    const { error: err } = await supabase.from('kinora_articles').delete().eq('id', id)
    if (err) error.value = err.message
    return { error: err }
  }

  async function updateStatus(id, newStatus) {
    const payload = { status: newStatus, is_published: newStatus === 'published', updated_at: new Date().toISOString() }
    if (newStatus === 'published') payload.published_at = new Date().toISOString()
    const { error: err } = await supabase.from('kinora_articles').update(payload).eq('id', id)
    if (err) error.value = err.message
    return { error: err }
  }

  async function uploadImage(file, slug) {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const ext = file.name.split('.').pop()
    const fileName = `${slug || 'img'}-${Date.now()}.${ext}`
    const path = `${year}/${month}/${fileName}`

    const { data, error: err } = await supabase.storage
      .from('articles')
      .upload(path, file, { cacheControl: '31536000', upsert: false })

    if (err) return { url: null, error: err.message }

    const { data: urlData } = supabase.storage.from('articles').getPublicUrl(path)
    return { url: urlData.publicUrl, error: null }
  }

  async function deleteImage(url) {
    if (!url) return
    const match = url.match(/articles\/(.+)$/)
    if (match) {
      await supabase.storage.from('articles').remove([match[1]])
    }
  }

  async function incrementReadCount(id) {
    await supabase.rpc('increment_article_read_count', { article_id: id }).catch(() => {})
  }

  return {
    articles,
    article,
    loading,
    error,
    totalCount,
    generateSlug,
    calculateSeoScore,
    fetchArticles,
    fetchArticle,
    fetchBySlug,
    saveArticle,
    deleteArticle,
    updateStatus,
    uploadImage,
    deleteImage,
    incrementReadCount,
  }
}
