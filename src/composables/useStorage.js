import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

/**
 * Storage composable with quota enforcement.
 * Uses backend RPC `check_family_can_upload` before upload.
 */
export function useStorage(bucket = 'default') {
  const uploading = ref(false)
  const uploadError = ref('')
  const storageInfo = ref(null)

  /**
   * Upload with storage quota check.
   * @param {string} path - Storage path
   * @param {File} file - File to upload
   * @param {object} options - { familyId, upsert, cacheControl, onProgress }
   */
  async function uploadWithCheck(path, file, options = {}) {
    uploading.value = true
    uploadError.value = ''

    const { familyId, ...uploadOpts } = options

    // Pre-upload validation
    if (familyId && file.size) {
      const { data: check, error: checkErr } = await supabase.rpc('check_family_can_upload', {
        p_family_id: familyId,
        p_bytes: file.size
      })

      if (checkErr) {
        uploading.value = false
        uploadError.value = 'Gagal memeriksa kapasitas penyimpanan.'
        return { data: null, error: { message: uploadError.value } }
      }

      if (check && !check.allowed) {
        uploading.value = false
        storageInfo.value = check
        uploadError.value = check.message || 'Penyimpanan penuh. Hapus file atau upgrade paket.'
        return { data: null, error: { message: uploadError.value, code: 'STORAGE_LIMIT_REACHED', storageInfo: check } }
      }

      storageInfo.value = check
    }

    // Proceed with upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...uploadOpts,
      })

    uploading.value = false

    if (error) {
      uploadError.value = error.message
    }

    return { data, error }
  }

  /**
   * Simple upload without quota check (for system uploads, avatars, etc.)
   */
  async function upload(path, file, options = {}) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options,
      })
    return { data, error }
  }

  async function download(path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    return { data, error }
  }

  function getPublicUrl(path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }

  async function remove(paths) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(Array.isArray(paths) ? paths : [paths])
    return { data, error }
  }

  async function list(folder = '', options = {}) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, options)
    return { data, error }
  }

  async function createSignedUrl(path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    return { data, error }
  }

  /**
   * Get storage overview for a family (usage, limit, breakdown).
   */
  async function getStorageOverview(familyId) {
    const { data, error } = await supabase.rpc('get_family_storage_overview', {
      p_family_id: familyId
    })
    if (!error && data) storageInfo.value = data
    return { data, error }
  }

  /**
   * Quick check if upload is possible.
   */
  async function canUpload(familyId, fileSize) {
    const { data, error } = await supabase.rpc('check_family_can_upload', {
      p_family_id: familyId,
      p_bytes: fileSize
    })
    return { allowed: data?.allowed ?? false, info: data, error }
  }

  return {
    upload,
    uploadWithCheck,
    download,
    getPublicUrl,
    remove,
    list,
    createSignedUrl,
    getStorageOverview,
    canUpload,
    uploading,
    uploadError,
    storageInfo,
  }
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === null || bytes === undefined) return '0 B'
  if (bytes === -1) return 'Tidak terbatas'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}
