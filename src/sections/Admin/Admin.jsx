import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './Admin.css'

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

function Dashboard({ session }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)

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

      <p className="admin-foot">Click a row to expand its full text.</p>
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
