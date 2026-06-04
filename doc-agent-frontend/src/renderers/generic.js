function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function mdBold(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function section(title, content) {
  return `<h2 class="ol-sec-title">${title}</h2>${content}`
}

export function renderGeneric(data) {
  const d = data

  let h = `<div class="gen-wrapper">`
  if (d.title) h += `<h1 class="gen-main-title">${esc(d.title)}</h1>`
  if (d.author || d.date) {
    h += `<p class="gen-meta">`
    if (d.author) h += esc(d.author)
    if (d.author && d.date) h += ' &nbsp;|&nbsp; '
    if (d.date) h += esc(d.date)
    h += `</p>`
  }

  const secs = Array.isArray(d.sections) ? d.sections : []
  secs.forEach(s => { h += section(s.heading || s.title || '', `<p>${mdBold(esc(s.body || s.content || ''))}</p>`) })
  if (d.content) h += section('Content', `<p>${mdBold(esc(d.content))}</p>`)
  if (d.summary) h += section('Summary', `<p>${esc(d.summary)}</p>`)
  if (d.conclusion) h += section('Conclusion', `<p>${esc(d.conclusion)}</p>`)
  h += `</div>`

  return h
}
