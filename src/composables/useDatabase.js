import { supabase } from '../lib/supabase.js'

export function useDatabase() {
  async function getAll(table, { columns = '*', filters = {}, orderBy = null, limit = null } = {}) {
    let query = supabase.from(table).select(columns)

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    return { data, error }
  }

  async function getById(table, id, columns = '*') {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('id', id)
      .single()
    return { data, error }
  }

  async function insert(table, payload) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
    return { data, error }
  }

  async function update(table, id, payload) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', id)
      .select()
    return { data, error }
  }

  async function remove(table, id) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
    return { data, error }
  }

  async function upsert(table, payload) {
    const { data, error } = await supabase
      .from(table)
      .upsert(payload)
      .select()
    return { data, error }
  }

  function subscribe(table, callback, filter = null) {
    let channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => callback(payload)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  return {
    getAll,
    getById,
    insert,
    update,
    remove,
    upsert,
    subscribe,
  }
}
