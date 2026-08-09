import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const socialLinks = ref([])
const loaded = ref(false)
const loading = ref(false)

export function useSocialLinks() {
  async function loadSocialLinks() {
    if (loaded.value) return socialLinks.value
    if (loading.value) return socialLinks.value

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('kinora_social_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      socialLinks.value = data || []
      loaded.value = true
    } catch (e) {
      console.warn('[useSocialLinks] Failed to load:', e.message)
    } finally {
      loading.value = false
    }

    return socialLinks.value
  }

  function getByVisibility(placement) {
    return socialLinks.value.filter(l => {
      const vis = l.visibility || []
      return vis.includes('all') || vis.includes(placement)
    })
  }

  function getSocialMedia() {
    return socialLinks.value.filter(l => l.link_type === 'social_media' || l.link_type === 'official_channel')
  }

  function getCommunityGroups() {
    return socialLinks.value.filter(l => l.link_type === 'community_group' || l.link_type === 'support_channel' || l.link_type === 'other')
  }

  function getFeatured() {
    return socialLinks.value.find(l => l.is_featured)
  }

  return {
    socialLinks,
    loaded,
    loading,
    loadSocialLinks,
    getByVisibility,
    getSocialMedia,
    getCommunityGroups,
    getFeatured,
  }
}
