function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function mdBold(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export function renderCoverLetter(data) {
  const c = data
  const ps = Array.isArray(c.body_paragraphs) ? c.body_paragraphs : (Array.isArray(c.body) ? c.body : [])

  let h = `<div class="cl-wrapper">`
  h += `<div class="cl-sender">`
  h += `<div class="cl-name">${esc(c.full_name)}</div>`
  if (c.position_title) h += `<div class="cl-position">${esc(c.position_title)}</div>`
  const clContact = []
  if (c.email) clContact.push(`<a href="mailto:${c.email}">${esc(c.email)}</a>`)
  if (c.phone) clContact.push(esc(c.phone))
  if (clContact.length) h += `<div>${clContact.join(' | ')}</div>`
  h += `</div>`

  h += `<hr class="cl-divider">`

  if (c.date) h += `<div class="cl-date">${esc(c.date)}</div>`

  h += `<div class="cl-recipient">`
  if (c.recipient_name) h += `<div class="cl-recipient-name">${esc(c.recipient_name)}</div>`
  if (c.company_name) h += `<div class="cl-company">${esc(c.company_name)}</div>`
  h += `</div>`

  if (c.position) h += `<div class="cl-subject"><strong>Re:</strong> ${esc(c.position)}</div>`
  h += `<div class="cl-greeting">Dear ${esc(c.recipient_name || 'Hiring Manager')},</div>`
  h += `<div class="cl-body">`
  ps.forEach(p => { h += `<p>${mdBold(esc(p))}</p>` })
  h += `</div>`
  h += `<div class="cl-closing">${esc(c.closing || 'Sincerely')},</div>`
  h += `<div class="cl-signature">`
  h += `<div class="cl-sig-name">${esc(c.full_name)}</div>`
  h += `</div>`
  h += `</div>`

  return h
}
