function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function mdBold(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export function renderEmail(data) {
  const c = data
  const bd = Array.isArray(c.body) ? c.body : (c.body ? [c.body] : [])

  let h = `<div class="em-wrapper">`
  h += `<div class="em-header-bar"></div>`
  h += `<div class="em-outer">`
  h += `<div class="em-subject-line"><strong>Subject:</strong> ${esc(c.subject || 'No Subject')}</div>`
  h += `<div class="em-to-line"><strong>To:</strong> ${esc(c.to || '')}</div>`
  if (c.cc) h += `<div class="em-to-line"><strong>Cc:</strong> ${esc(c.cc)}</div>`
  h += `<hr class="em-divider">`
  if (c.greeting) h += `<div class="em-greeting-text">${esc(c.greeting)}</div>`
  h += `<div class="em-body-content">`
  bd.forEach(p => { h += `<p>${mdBold(esc(p))}</p>` })
  h += `</div>`
  if (c.closing) h += `<div class="em-closing-text">${esc(c.closing)}</div>`
  h += `<div class="em-sig-block">`
  h += `<div class="em-sig-name">${esc(c.sender_name || c.full_name || '')}</div>`
  if (c.sender_title) h += `<div class="em-sig-detail">${esc(c.sender_title)}</div>`
  if (c.sender_email) h += `<div class="em-sig-detail">${esc(c.sender_email)}</div>`
  h += `</div></div></div>`

  return h
}
