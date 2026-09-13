import { supabase } from './supabase'

// The recruitment switch lives in a single row of public.app_settings.
// Anyone may read it; only a signed-in admin may flip it (see schema.sql).
const SETTINGS_ID = true

export const DEFAULT_CLOSED_MESSAGE =
  'Applications for LEAD Recruitments 2026-27 are now closed. Thank you to everyone who applied — shortlisted candidates will be contacted through the official channels.'

/**
 * Read the recruitment switch.
 * If the settings row or table is missing (an older database that has not run
 * the latest schema.sql yet), the form stays open rather than locking everyone
 * out of a recruitment drive because of a deployment order.
 */
export async function fetchFormStatus() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('forms_open, closed_message, updated_at')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (error || !data) {
    return {
      formsOpen: true,
      closedMessage: DEFAULT_CLOSED_MESSAGE,
      updatedAt: null,
      error: error ? error.message : '',
    }
  }

  return {
    formsOpen: data.forms_open,
    closedMessage: data.closed_message || DEFAULT_CLOSED_MESSAGE,
    updatedAt: data.updated_at,
    error: '',
  }
}

/** Open or close the recruitment form. Admin only. */
export async function setFormStatus({ formsOpen, closedMessage }) {
  const { data, error } = await supabase
    .from('app_settings')
    .update({
      forms_open: formsOpen,
      closed_message: closedMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SETTINGS_ID)
    .select('forms_open, closed_message, updated_at')
    .single()

  if (error) return { error: error.message || 'Could not update the form status.' }

  return {
    error: '',
    formsOpen: data.forms_open,
    closedMessage: data.closed_message || DEFAULT_CLOSED_MESSAGE,
    updatedAt: data.updated_at,
  }
}
