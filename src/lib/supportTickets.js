import { supabase, envInfo } from './supabase.js'

const SUPPORT_TABLE = 'support_tickets'
const ATTACHMENT_BUCKET = 'articles'
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateSupportAttachment(file) {
  if (!file) return ''
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) return 'Format attachment tidak didukung.'
  if (file.size > MAX_ATTACHMENT_BYTES) return 'Ukuran attachment maksimal 5MB.'
  return ''
}

export function logSupportError(operation, target, err, extra = {}) {
  if (!envInfo.isDevelopment || !err) return
  console.error('[KINORA_SUPPORT_SUBMIT]', {
    operation,
    target,
    code: err.code || '',
    message: err.message || String(err),
    details: err.details || null,
    hint: err.hint || null,
    status: err.status || extra.status || null,
  })
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    logSupportError('auth.getUser', 'supabase.auth', error)
    throw new Error('AUTH_REQUIRED')
  }
  if (!data.user) throw new Error('AUTH_REQUIRED')
  return data.user
}

async function generateTicketNumber(type) {
  const { data, error } = await supabase.rpc('generate_ticket_number', { p_type: type })
  if (error) logSupportError('rpc.generate_ticket_number', 'generate_ticket_number', error)
  return data || `${type === 'bug' ? 'KNR-BUG' : 'KNR-FT'}-${Date.now().toString(36).toUpperCase()}`
}

async function uploadAttachment(ticketNumber, file) {
  if (!file) return []

  const validation = validateSupportAttachment(file)
  if (validation) throw new Error(validation)

  const extension = file.name.split('.').pop() || 'jpg'
  const path = `tickets/${ticketNumber}/${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    logSupportError('storage.upload', ATTACHMENT_BUCKET, error)
    throw new Error('UPLOAD_FAILED')
  }

  const { data } = supabase.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path)
  return [{ name: file.name, path, url: data.publicUrl, size: file.size, type: file.type }]
}

export async function createSupportTicket({ type, title, description, priority = 'normal', contactEmail = '', contactName = '', category = '', attachment = null, fields = {}, metadata = {} }) {
  const user = await getCurrentUser()
  const ticketNumber = await generateTicketNumber(type)
  const attachments = await uploadAttachment(ticketNumber, attachment)

  const payload = {
    ticket_number: ticketNumber,
    user_id: user.id,
    type,
    status: 'open',
    priority,
    title,
    description,
    category: category || null,
    contact_email: contactEmail || user.email || null,
    contact_name: contactName || null,
    attachments,
    metadata: {
      source: 'web',
      user_email: user.email || null,
      ...metadata,
    },
    ...fields,
  }

  const { data, error } = await supabase.from(SUPPORT_TABLE).insert(payload).select('id, ticket_number').single()
  if (error) {
    logSupportError('insert', SUPPORT_TABLE, error)
    throw new Error('SUBMIT_FAILED')
  }

  return data
}
