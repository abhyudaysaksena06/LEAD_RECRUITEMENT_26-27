import { useState } from 'react'
import './Registration.css'
import { supabase } from '../../lib/supabase'

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

    const { error: insertError } = await supabase
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

    setSubmitting(false)

    if (insertError) {
      setError(insertError.message || 'Something went wrong. Please try again.')
      return
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
            <div className="reg-success__icon">✓</div>
            <h2 className="reg-success__title">Application Filed</h2>
            <p className="reg-success__text">
              Your application has been received. The LEAD team will review it
              and reach out to you shortly. Keep an eye on your Thapar email.
            </p>
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
