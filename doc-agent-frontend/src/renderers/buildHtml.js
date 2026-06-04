import { renderResume } from './resume.js'
import { renderCoverLetter } from './cover-letter.js'
import { renderInvoice } from './invoice.js'
import { renderEmail } from './email.js'
import { renderProposal } from './proposal.js'
import { renderReport } from './report.js'
import { renderDocumentation } from './documentation.js'
import { renderGeneric } from './generic.js'
import { renderJakesResume } from './jakesResume.js'

const renderers = {
  resume: renderResume,
  cover_letter: renderCoverLetter,
  invoice: renderInvoice,
  email: renderEmail,
  proposal: renderProposal,
  report: renderReport,
  documentation: renderDocumentation,
  generic: renderGeneric,
  jakes_resume: renderJakesResume,
}

export function renderDocument(data, type) {
  if (!data || typeof data !== 'object') return ''
  const fn = renderers[type] || renderGeneric
  return fn(data)
}
