// The recruitment switch — frontend only, no database involved.
//
// Flip FORMS_OPEN to reopen recruitment, then redeploy. While it is false the
// public form is not rendered at all: there is nothing to fill in and nothing
// to submit.

export const FORMS_OPEN = false

export const CLOSED_MESSAGE =
  'Applications for LEAD Recruitments 2026-27 are now closed. Thank you to everyone who applied — shortlisted candidates will be contacted through the official channels.'
