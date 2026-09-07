import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Admin.css'

// Mirrors the recruitment form's own choices, so an edit cannot produce a
// value the database constraints would reject.
const YEARS = ['1st Year', '2nd Year']
const DEPARTMENTS = [
  'Tech',
  'Media & PR',
  'Content',
  'Design',
  'Marketing',
  'Event & Management',
]

const COLUMNS = [
  { key: 'created_at', label: 'Submitted' },
  { key: 'name', label: 'Name' },
  { key: 'roll_no', label: 'Roll No.' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'branch', label: 'Branch' },
  { key: 'year', label: 'Year' },
  { key: 'departments', label: 'Departments' },
  { key: 'why_lead', label: 'Why LEAD' },
  { key: 'heard_from', label: 'Heard From' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'other_societies', label: 'Other Societies' },
  { key: 'anything_else', label: 'Anything Else' },
]

// Fields an admin may edit, and how each is rendered in the editor.
// created_at, id and the email bookkeeping columns are deliberately absent:
// they are records of what happened, not details to correct.
const EDITABLE = [
  { key: 'name', label: 'Full Name', type: 'text' },
  { key: 'roll_no', label: 'Roll No.', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'branch', label: 'Branch', type: 'text' },
  { key: 'year', label: 'Year', type: 'select', options: YEARS },
  { key: 'departments', label: 'Departments', type: 'departments' },
  { key: 'why_lead', label: 'Why LEAD', type: 'textarea' },
  { key: 'heard_from', label: 'Heard From', type: 'text' },
  { key: 'linkedin', label: 'LinkedIn', type: 'text' },
  { key: 'github', label: 'GitHub', type: 'text' },
  { key: 'skills', label: 'Skills', type: 'textarea' },
  { key: 'experience', label: 'Experience', type: 'textarea' },
  { key: 'other_societies', label: 'Other Societies', type: 'textarea' },
  { key: 'anything_else', label: 'Anything Else', type: 'textarea' },
]

const cellText = (row, key) => {
  const value = row[key]
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (key === 'created_at') return new Date(value).toLocaleString()
  return String(value)
}

function LoginPanel({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setBusy(false)

    if (authError) {
      setError(authError.message || 'Sign in failed.')
      return
    }
    onSignedIn(data.session)
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleLogin}>
        <p className="admin-kicker">Restricted // LEAD 2026</p>
        <h1 className="admin-login__title">Admin Console</h1>
        <p className="admin-login__hint">
          Sign in with your Supabase admin account to review applications.
        </p>

        <label className="admin-label" htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          className="admin-input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="admin-label" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="admin-error">{error}</p>}

        <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

/**
 * Edit one application. Saves only the fields that actually changed, so two
 * admins working on different fields of the same row do not clobber each other.
 */
function EditPanel({ row, onClose, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(row)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Deleting is irreversible, so it takes two clicks rather than one.
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const setField = (key) => (e) =>
    setDraft((prev) => ({ ...prev, [key]: e.target.value }))

  const toggleDept = (dept) => () =>
    setDraft((prev) => {
      const current = prev.departments || []
      return {
        ...prev,
        departments: current.includes(dept)
          ? current.filter((d) => d !== dept)
          : [...current, dept],
      }
    })

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')

    const changes = {}
    for (const field of EDITABLE) {
      const before = row[field.key]
      const after = draft[field.key]
      const differs = Array.isArray(after)
        ? JSON.stringify(after) !== JSON.stringify(before || [])
        : after !== before
      if (differs) changes[field.key] = after
    }

    if (Object.keys(changes).length === 0) {
      onClose()
      return
    }

    if ((draft.departments || []).length === 0) {
      setError('At least one department is required.')
      return
    }

    setSaving(true)
    const { data, error: updateError } = await supabase
      .from('registrations')
      .update(changes)
      .eq('id', row.id)
      .select()
      .single()
    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Could not save the changes.')
      return
    }
    onSaved(data)
  }

  const handleDelete = async () => {
    setError('')
    setSaving(true)

    const { error: deleteError } = await supabase
      .from('registrations')
      .delete()
      .eq('id', row.id)

    setSaving(false)

    if (deleteError) {
      setError(deleteError.message || 'Could not delete this application.')
      setConfirmingDelete(false)
      return
    }
    onDeleted(row.id)
  }

  return (
    <div className="admin-modal" role="dialog" aria-modal="true">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <form className="admin-modal__panel" onSubmit={handleSave}>
        <header className="admin-modal__head">
          <div>
            <p className="admin-kicker">Editing application</p>
            <h2 className="admin-modal__title">{row.name}</h2>
            <p className="admin-dash__meta">
              Submitted {new Date(row.created_at).toLocaleString()}
            </p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="admin-modal__body">
          {EDITABLE.map((field) => (
            <div className="admin-field" key={field.key}>
              <label className="admin-label" htmlFor={`edit-${field.key}`}>
                {field.label}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={`edit-${field.key}`}
                  className="admin-input"
                  rows={3}
                  value={draft[field.key] || ''}
                  onChange={setField(field.key)}
                />
              ) : field.type === 'select' ? (
                <select
                  id={`edit-${field.key}`}
                  className="admin-input"
                  value={draft[field.key] || ''}
                  onChange={setField(field.key)}
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : field.type === 'departments' ? (
                <div className="admin-chips">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      type="button"
                      key={dept}
                      className={`admin-chip ${(draft.departments || []).includes(dept) ? 'is-active' : ''}`}
                      onClick={toggleDept(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  id={`edit-${field.key}`}
                  className="admin-input"
                  type="text"
                  value={draft[field.key] || ''}
                  onChange={setField(field.key)}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="admin-error">{error}</p>}

        <footer className="admin-modal__foot">
          <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" className="admin-btn" onClick={onClose}>
            Cancel
          </button>

          <span className="admin-modal__spacer" />

          {confirmingDelete ? (
            <>
              <span className="admin-modal__warn">Delete permanently?</span>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setConfirmingDelete(false)}
              >
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </button>
          )}
        </footer>
      </form>
    </div>
  )
}

function Dashboard({ session }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })

    setLoading(false)

    if (fetchError) {
      setError(fetchError.message || 'Could not load registrations.')
      return
    }
    setRows(data || [])
  }, [])

  useEffect(() => {
    // Fetch on mount. The loading flag is set inside load(), which the lint rule
    // reads as a synchronous setState; it is the intended fetch-on-mount pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      COLUMNS.some((col) => cellText(row, col.key).toLowerCase().includes(q))
    )
  }, [rows, query])

  const exportCsv = () => {
    const escape = (value) => '"' + value.replace(/"/g, '""') + '"'
    const lines = [
      COLUMNS.map((col) => escape(col.label)).join(','),
      ...filtered.map((row) =>
        COLUMNS.map((col) => escape(cellText(row, col.key))).join(',')
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lead-registrations-' + new Date().toISOString().slice(0, 10) + '.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="admin-dash">
      <header className="admin-dash__head">
        <div>
          <p className="admin-kicker">Applications // LEAD 2026</p>
          <h1 className="admin-dash__title">Admin Console</h1>
          <p className="admin-dash__meta">
            Signed in as {session.user.email} · {filtered.length} of {rows.length} shown
          </p>
        </div>

        <div className="admin-dash__actions">
          <button className="admin-btn" type="button" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="admin-btn"
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      </header>

      <input
        className="admin-input admin-search"
        type="search"
        placeholder="Search by name, roll no., email, department…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="admin-error">{error}</p>}

      {loading && rows.length === 0 ? (
        <p className="admin-empty">Loading applications…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No applications to show.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th />
                {COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={expanded === row.id ? 'is-expanded' : ''}
                  onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                >
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--tiny"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditing(row)
                      }}
                    >
                      Edit
                    </button>
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} title={cellText(row, col.key)}>
                      {cellText(row, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-foot">
        Click a row to expand its full text, or Edit to change an application.
      </p>

      {editing && (
        <EditPanel
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
            setEditing(null)
          }}
          onDeleted={(id) => {
            setRows((prev) => prev.filter((r) => r.id !== id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <div className="admin-page">
      {checking ? (
        <p className="admin-empty">Checking session…</p>
      ) : session ? (
        <Dashboard session={session} />
      ) : (
        <LoginPanel onSignedIn={setSession} />
      )}
    </div>
  )
}
