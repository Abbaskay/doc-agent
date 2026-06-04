function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function section(title, content) {
  return `<h2 class="ol-sec-title">${title}</h2>${content}`
}

export function renderDocumentation(data) {
  const c = data

  let h = `<div class="doc-wrapper">`
  h += `<div class="doc-title-page">`
  h += `<h1 class="doc-main-title">${esc(c.title)}</h1>`
  h += `<p class="doc-meta"><strong>Version:</strong> ${esc(c.version || '')} &nbsp;|&nbsp; <strong>Author:</strong> ${esc(c.author || '')} &nbsp;|&nbsp; <strong>Date:</strong> ${esc(c.date || '')}</p>`
  if (c.overview) h += `<p class="doc-overview">${esc(c.overview)}</p>`
  h += `</div>`

  const secs = Array.isArray(c.sections) ? c.sections : []
  secs.forEach(s => {
    h += section(s.heading || '', `<p>${esc(s.body || s.content || '')}</p>`)
    if (Array.isArray(s.subsections)) {
      s.subsections.forEach(sub => {
        h += `<h4 class="doc-sub">${esc(sub.heading || '')}</h4><p>${esc(sub.body || sub.content || '')}</p>`
      })
    }
    if (s.code) h += `<pre class="doc-code"><code>${esc(s.code)}</code></pre>`
  })

  if (c.conclusion) h += section('Conclusion', `<p>${esc(c.conclusion)}</p>`)
  h += `</div>`

  return h
}
