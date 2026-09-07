import { useState } from 'react'
import './Registration.css'
import { supabase } from '../../lib/supabase'
import { COMMUNITY_LINKS, HAS_WHATSAPP_COMMUNITY_URL } from '../../config/community'

const DEPARTMENTS = [
  'Tech',
  'Media & PR',
  'Content',
  'Design',
  'Marketing',
  'Event & Management',
]

const YEARS = ['1st Year', '2nd Year']

export default function Registration() {
  const [form, setForm] = useState({
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    branch: '',
    year: '1st Year',
    departments: [],
    whyLead: '',
    heardFrom: '',
    linkedin: '',
    github: '',
    skills: '',
    experience: '',
    otherSocieties: '',
    anythingElse: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const selectYear = (year) => () =>
    setForm((prev) => ({ ...prev, year }))

  const toggleDept = (dept) => () =>
    setForm((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.year) {
      setError('Please select your year of study.')
      return
    }
    if (form.departments.length === 0) {
      setError('Please select at least one department.')
      return
    }

    setSubmitting(true)

    const { data: inserted, error: insertError } = await supabase
      .from('registrations')
      .insert({
        name: form.name,
        roll_no: form.rollNo,
        email: form.email,
        phone: form.phone,
        branch: form.branch,
        year: form.year,
        departments: form.departments,
        why_lead: form.whyLead,
        heard_from: form.heardFrom,
        linkedin: form.linkedin,
        github: form.github,
        skills: form.skills,
        experience: form.experience,
        other_societies: form.otherSocieties,
        anything_else: form.anythingElse,
      })
      .select('id')
      .single()

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message || 'Something went wrong. Please try again.')
      return
    }

    // Fallback trigger for the confirmation email, in case the Supabase
    // Database Webhook is not configured or is delayed. The function claims
    // each registration atomically, so this never sends a second email.
    // Deliberately not awaited: the success screen should not wait on mail.
    if (inserted?.id) {
      supabase.functions
        .invoke('send-confirmation-email', { body: { id: inserted.id } })
        .catch((err) => {
          // Delivery is the webhook's job; log and move on.
          console.error('Confirmation email fallback failed:', err)
        })
    }

    setSubmitted(true)
  }

  return (
    <div className="reg-page">
      {/* ===== Header ===== */}
      <header className="reg-header">
        <p className="reg-subtitle">Recruitment Form // LEAD 2026</p>
        <h1 className="reg-title">
          Ready to <span className="reg-title__accent">LEAD</span>?
        </h1>
        <p className="reg-desc">
          One application per candidate. Fill in your details honestly — this
          helps us understand you better and find the right fit within the
          society. Fields marked with <span style={{ color: '#be1e1e' }}>*</span> are required.
        </p>
      </header>

      {/* ===== Parchment card ===== */}
      <div className="reg-parchment">
        <span className="reg-pin reg-pin--left" />
        <span className="reg-pin reg-pin--right" />

        {submitted ? (
          <div className="reg-success">
            <div className="reg-success__badge">
              <span className="reg-success__icon">✓</span>
            </div>
            <h2 className="reg-success__title">Application Received!</h2>
            <p className="reg-success__salute">
              Thank you, <strong>{form.name || 'Candidate'}</strong>. Your application for <strong>LEAD Recruitments 2026</strong> has been safely recorded.
            </p>

            <div className="reg-success__card">
              <span className="reg-success__tag">Crucial Next Step</span>
              <h3 className="reg-success__card-title">Join Official Recruitment Community</h3>
              <p className="reg-success__card-desc">
                All interview rounds, task allocations, time slots, and shortlists will be communicated <strong>exclusively</strong> in our WhatsApp community.
              </p>

              <div className="reg-success__actions">
                {HAS_WHATSAPP_COMMUNITY_URL ? (
                  <a
                    href={COMMUNITY_LINKS.whatsappCommunityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reg-btn reg-btn--whatsapp"
                  >
                    <svg className="reg-btn__icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span>Join WhatsApp Community</span>
                  </a>
                ) : (
                  <p className="reg-success__card-desc">
                    The community invite link will be shared with you over email shortly.
                  </p>
                )}

                <a
                  href={COMMUNITY_LINKS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reg-btn reg-btn--instagram"
                >
                  <svg className="reg-btn__icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Follow {COMMUNITY_LINKS.instagramHandle}</span>
                </a>
              </div>
            </div>

            <div className="reg-success__email-notice">
              <span className="reg-success__email-icon">✉️</span>
              <p>
                A confirmation email has been dispatched to <strong>{form.email}</strong>. If you do not see it within a few minutes, kindly check your Spam/Junk or Promotions tab.
              </p>
            </div>

            <button
              type="button"
              className="reg-success__reset-btn"
              onClick={() => {
                setForm({
                  name: '',
                  rollNo: '',
                  email: '',
                  phone: '',
                  branch: '',
                  year: '1st Year',
                  departments: [],
                  whyLead: '',
                  heardFrom: '',
                  linkedin: '',
                  github: '',
                  skills: '',
                  experience: '',
                  otherSocieties: '',
                  anythingElse: '',
                })
                setSubmitted(false)
              }}
            >
              ← Submit another response
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* ── Q1 — Personal Details ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">01 — Personal Details</h2>

              <div className="reg-row reg-row--2">
                <div className="reg-field">
                  <label className="reg-label">Full Name <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">Roll No. <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="text"
                    placeholder="e.g. 102203456"
                    value={form.rollNo}
                    onChange={set('rollNo')}
                    required
                  />
                </div>
              </div>

              <div className="reg-row reg-row--2">
                <div className="reg-field">
                  <label className="reg-label">Thapar Email <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="email"
                    placeholder="name@thapar.edu"
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">Phone Number <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChange={set('phone')}
                    required
                  />
                </div>
              </div>

              <div className="reg-row">
                <div className="reg-field">
                  <label className="reg-label">Branch <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="text"
                    placeholder="e.g. Computer Engineering"
                    value={form.branch}
                    onChange={set('branch')}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ── Q2 — Year of Study ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">02 — Year of Study <span className="reg-req">*</span></h2>
              <p className="reg-hint" style={{ marginTop: 0, marginBottom: '0.6rem' }}>Select exactly one.</p>
              <div className="reg-toggle-group">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`reg-toggle-btn ${form.year === year ? 'is-active' : ''}`}
                    onClick={selectYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Q3 — Department Preference ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">03 — Department to Join <span className="reg-req">*</span></h2>
              <p className="reg-hint" style={{ marginTop: 0, marginBottom: '0.6rem' }}>Select all departments you're interested in — at least one is required.</p>
              <div className="reg-toggle-group">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    className={`reg-toggle-btn ${form.departments.includes(dept) ? 'is-active' : ''}`}
                    onClick={toggleDept(dept)}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Q4 — Motivation ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">04 — Motivation</h2>

              <div className="reg-field" style={{ marginBottom: '1rem' }}>
                <label className="reg-label">Why do you want to join LEAD? <span className="reg-req">*</span></label>
                <textarea
                  className="reg-textarea"
                  placeholder="Tell us what drives you to be a part of LEAD..."
                  value={form.whyLead}
                  onChange={set('whyLead')}
                  rows={4}
                  required
                />
              </div>

              <div className="reg-field">
                <label className="reg-label">Where did you hear about LEAD? <span className="reg-req">*</span></label>
                <input
                  className="reg-input"
                  type="text"
                  placeholder="e.g. Instagram, a friend, campus event..."
                  value={form.heardFrom}
                  onChange={set('heardFrom')}
                  required
                />
              </div>
            </div>

            {/* ── Q5 — Links ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">05 — Professional Links</h2>

              <div className="reg-row reg-row--2">
                <div className="reg-field">
                  <label className="reg-label">LinkedIn Profile <span className="reg-req">*</span></label>
                  <input
                    className="reg-input"
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    value={form.linkedin}
                    onChange={set('linkedin')}
                    required
                  />
                </div>
                <div className="reg-field">
                  <label className="reg-label">GitHub Profile</label>
                  <input
                    className="reg-input"
                    type="url"
                    placeholder="https://github.com/your-username"
                    value={form.github}
                    onChange={set('github')}
                  />
                </div>
              </div>
            </div>

            {/* ── Q6 — Skills & Experience ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">06 — Skills & Experience</h2>

              <div className="reg-field" style={{ marginBottom: '1rem' }}>
                <label className="reg-label">
                  What skills do you have that make you a good fit for the society? <span className="reg-req">*</span>
                </label>
                <textarea
                  className="reg-textarea"
                  placeholder="Mention relevant skills, tools, or areas of expertise..."
                  value={form.skills}
                  onChange={set('skills')}
                  rows={3}
                  required
                />
              </div>

              <div className="reg-field">
                <label className="reg-label">
                  Any experience in the chosen department?
                </label>
                <textarea
                  className="reg-textarea"
                  placeholder="Past projects, roles, or relevant work — even personal..."
                  value={form.experience}
                  onChange={set('experience')}
                  rows={3}
                />
              </div>
            </div>

            {/* ── Q7 — Other Societies ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">07 — Other Commitments <span className="reg-req">*</span></h2>

              <div className="reg-field">
                <label className="reg-label">
                  Planning to join or already applied to other societies? If yes, which ones? <span className="reg-req">*</span>
                </label>
                <p className="reg-hint" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  If you haven't joined any society and aren't planning to, simply write "No".
                </p>
                <textarea
                  className="reg-textarea"
                  placeholder='List the societies you have applied to or are considering — or write "No"'
                  value={form.otherSocieties}
                  onChange={set('otherSocieties')}
                  rows={2}
                  required
                />
              </div>
            </div>

            {/* ── Q8 — Anything Else ── */}
            <div className="reg-section">
              <h2 className="reg-section__title">08 — Anything Else</h2>

              <div className="reg-field">
                <label className="reg-label">
                  What would you like to tell us about yourself that hasn't been
                  covered? (Projects, GitHub repos, portfolio links, etc.)
                </label>
                <textarea
                  className="reg-textarea"
                  placeholder="Share anything else — projects, achievements, GitHub repos, or anything you're proud of..."
                  value={form.anythingElse}
                  onChange={set('anythingElse')}
                  rows={4}
                />
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="reg-footer">
              {error && <p className="reg-error">{error}</p>}
              <button type="submit" className="reg-submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
              <span className="reg-deadline">
                Applications close soon
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
