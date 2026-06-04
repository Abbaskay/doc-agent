function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function section(title, content) {
  return `<h2 class="ol-sec-title">${title}</h2>${content}`
}

export function renderReport(data) {
  const c = data

  let h = `<div class="rpt-wrapper">`
  h += `<div class="rpt-title-page">`
  h += `<h1 class="rpt-main-title">${esc(c.title)}</h1>`
  if (c.author) h += `<p class="rpt-author">${esc(c.author)}</p>`
  if (c.date) h += `<p class="rpt-date">${esc(c.date)}</p>`
  h += `</div>`

  if (c.abstract) {
    h += `<div class="rpt-abstract"><span class="rpt-abstract-label">Abstract</span><p class="rpt-abstract-body">${esc(c.abstract)}</p></div>`
  }
  if (c.executive_summary && !c.abstract) {
    h += `<div class="rpt-abstract"><span class="rpt-abstract-label">Executive Summary</span><p class="rpt-abstract-body">${esc(c.executive_summary)}</p></div>`
  }

  if (c.introduction) h += section('Introduction', `<p>${esc(c.introduction)}</p>`)
  if (c.objectives) h += section('Objectives', `<p>${esc(c.objectives)}</p>`)
  if (c.methodology) h += section('Methodology', `<p>${esc(c.methodology)}</p>`)
  if (c.findings) h += section('Findings', `<p>${esc(c.findings)}</p>`)

  if (Array.isArray(c.conclusions) && c.conclusions.length) {
    h += section('Conclusions', c.conclusions.map(x => `<p>• ${esc(x)}</p>`).join(''))
  } else if (c.conclusions && typeof c.conclusions === 'string') {
    h += section('Conclusions', `<p>${esc(c.conclusions)}</p>`)
  }

  if (Array.isArray(c.recommendations) && c.recommendations.length) {
    h += section('Recommendations', c.recommendations.map(x => `<p>• ${esc(x)}</p>`).join(''))
  } else if (c.recommendations && typeof c.recommendations === 'string') {
    h += section('Recommendations', `<p>${esc(c.recommendations)}</p>`)
  }

  const ss = Array.isArray(c.sections) ? c.sections : []
  ss.forEach(s => { h += section(s.heading || s.title || '', `<p>${esc(s.content || s.body || '')}</p>`) })

  h += `</div>`
  return h
}
