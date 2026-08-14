import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export function useComments(contentId, contentType = 'article') {
  const comments = ref([])
  const totalCount = ref(0)
  const loading = ref(false)
  const hasMore = ref(false)
  const error = ref('')

  const PAGE_SIZE = 15
  let offset = 0

  async function loadComments(reset = true) {
    if (reset) { offset = 0; comments.value = [] }
    loading.value = true
    error.value = ''

    try {
      // Fetch top-level comments — LEFT join on user profile (not inner)
      let query = supabase
        .from('kinora_comments')
        .select(`
          id, body, status, likes_count, replies_count, is_edited, created_at, parent_id,
          user_id, user_name, users(display_name, avatar_url)
        `, { count: 'exact' })
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .is('parent_id', null)
        .in('status', ['published', 'deleted'])
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      let { data, error: err, count } = await query

      // Fallback: if relationship fails, query without join
      if (err) {
        console.warn('[WEB_COMMENTS] Profile join failed, using fallback:', err.message)
        const fallback = await supabase
          .from('kinora_comments')
          .select('id, body, status, likes_count, replies_count, is_edited, created_at, parent_id, user_id, user_name', { count: 'exact' })
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .is('parent_id', null)
          .in('status', ['published', 'deleted'])
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1)

        data = fallback.data
        count = fallback.count
        err = fallback.error
        if (err) throw err
      }

      const items = (data || []).map(c => ({
        ...c,
        display_name: c.users?.display_name || c.user_name || 'Pengguna Kinora',
        avatar_url: c.users?.avatar_url || null,
        replies: [],
        repliesLoaded: false,
      }))

      if (reset) {
        comments.value = items
      } else {
        comments.value.push(...items)
      }

      totalCount.value = count || 0
      offset += items.length
      hasMore.value = items.length === PAGE_SIZE

      if (import.meta.env.VITE_APP_ENV === 'development') {
        console.log('[WEB_COMMENTS][LOAD]', { contentId, contentType, status: 'published', count, itemsLoaded: items.length })
      }
    } catch (e) {
      error.value = e.message
      console.error('[WEB_COMMENTS][ERROR]', e.message)
    } finally {
      loading.value = false
    }
  }

  async function loadReplies(commentId) {
    let { data, error: err } = await supabase
      .from('kinora_comments')
      .select(`
        id, body, status, likes_count, is_edited, created_at, parent_id,
        user_id, user_name, users(display_name, avatar_url)
      `)
      .eq('parent_id', commentId)
      .in('status', ['published', 'deleted'])
      .order('created_at', { ascending: true })
      .limit(50)

    // Fallback without join
    if (err) {
      const fallback = await supabase
        .from('kinora_comments')
        .select('id, body, status, likes_count, is_edited, created_at, parent_id, user_id, user_name')
        .eq('parent_id', commentId)
        .in('status', ['published', 'deleted'])
        .order('created_at', { ascending: true })
        .limit(50)
      data = fallback.data
    }

    const replies = (data || []).map(c => ({
      ...c,
      display_name: c.users?.display_name || c.user_name || 'Pengguna Kinora',
      avatar_url: c.users?.avatar_url || null,
    }))

    const parent = comments.value.find(c => c.id === commentId)
    if (parent) {
      parent.replies = replies
      parent.repliesLoaded = true
    }
  }

  async function postComment(body, parentId = null) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error: err } = await supabase
      .from('kinora_comments')
      .insert({
        content_id: contentId,
        content_type: contentType,
        parent_id: parentId,
        user_id: user.id,
        body: sanitize(body),
      })
      .select(`
        id, body, status, likes_count, replies_count, is_edited, created_at, parent_id,
        user_id, users!inner(display_name, avatar_url)
      `)
      .single()

    if (err) throw err

    const comment = {
      ...data,
      display_name: data.users?.display_name || 'Pengguna',
      avatar_url: data.users?.avatar_url || null,
      replies: [],
      repliesLoaded: false,
    }

    if (!parentId) {
      comments.value.unshift(comment)
      totalCount.value++
    } else {
      const parent = comments.value.find(c => c.id === parentId)
      if (parent) {
        parent.replies.push(comment)
        parent.replies_count = (parent.replies_count || 0) + 1
      }
    }

    return comment
  }

  async function editComment(commentId, newBody) {
    const { error: err } = await supabase
      .from('kinora_comments')
      .update({ body: sanitize(newBody), is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', commentId)

    if (err) throw err

    // Update locally
    const c = findComment(commentId)
    if (c) { c.body = newBody; c.is_edited = true }
  }

  async function deleteComment(commentId) {
    const c = findComment(commentId)
    const hasReplies = c && (c.replies_count > 0 || c.replies?.length > 0)

    if (hasReplies) {
      // Soft delete - preserve thread
      await supabase.from('kinora_comments').update({ status: 'deleted', body: '' }).eq('id', commentId)
      if (c) { c.status = 'deleted'; c.body = '' }
    } else {
      await supabase.from('kinora_comments').delete().eq('id', commentId)
      // Remove from local state
      const idx = comments.value.findIndex(x => x.id === commentId)
      if (idx >= 0) {
        comments.value.splice(idx, 1)
        totalCount.value--
      } else {
        // Check in replies
        for (const parent of comments.value) {
          const rIdx = parent.replies.findIndex(r => r.id === commentId)
          if (rIdx >= 0) {
            parent.replies.splice(rIdx, 1)
            parent.replies_count = Math.max((parent.replies_count || 1) - 1, 0)
            break
          }
        }
      }
    }
  }

  async function toggleLike(commentId) {
    const { data } = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId })
    const c = findComment(commentId)
    if (c && data) {
      c.likes_count += data.liked ? 1 : -1
    }
    return data
  }

  async function reportComment(commentId, reason, description = '') {
    const { error: err } = await supabase
      .from('kinora_comment_reports')
      .insert({ comment_id: commentId, user_id: (await supabase.auth.getUser()).data.user.id, reason, description })
    if (err) throw err
  }

  function findComment(id) {
    const top = comments.value.find(c => c.id === id)
    if (top) return top
    for (const c of comments.value) {
      const reply = c.replies?.find(r => r.id === id)
      if (reply) return reply
    }
    return null
  }

  function sanitize(text) {
    return text.replace(/<[^>]*>/g, '').trim()
  }

  return {
    comments,
    totalCount,
    loading,
    hasMore,
    error,
    loadComments,
    loadReplies,
    postComment,
    editComment,
    deleteComment,
    toggleLike,
    reportComment,
  }
}
