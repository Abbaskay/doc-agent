function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function section(title, content) {
  return `<h2 class="ol-sec-title">${title}</h2>${content}`
}

export function renderProposal(data) {
  const c = data

  let h = `<div class="prop-wrapper">`
  h += `<div class="prop-cover-page">`
  h += `<h1 class="prop-title">${esc(c.project_title || c.title)}</h1>`
  h += `<div class="prop-meta"><strong>Prepared by:</strong> ${esc(c.prepared_by || c.author || '')}<br>`
  h += `<strong>For:</strong> ${esc(c.prepared_for || c.client_name || '')}<br>`
  h += `<strong>Date:</strong> ${esc(c.date || '')}</div>`
  h += `</div>`

  if (c.executive_summary) h += section('Executive Summary', `<p>${esc(c.executive_summary)}</p>`)
  if (c.problem_statement) h += section('Problem Statement', `<p>${esc(c.problem_statement)}</p>`)
  if (c.proposed_solution) h += section('Proposed Solution', `<p>${esc(c.proposed_solution)}</p>`)

  const scope = Array.isArray(c.scope_of_work) ? c.scope_of_work : []
  if (scope.length) {
    let scopeHtml = scope.map(s =>
      `<div class="prop-card"><div class="prop-card-title"><strong>${esc(s.heading || '')}</strong></div><div>${esc(s.description || s.content || '')}</div></div>`
    ).join('')
    h += section('Scope of Work', scopeHtml)
  }

  if (c.pricing) {
    let pricingHtml = `<p>${esc(c.pricing)}</p>`
    if (Array.isArray(c.pricing_items)) {
      pricingHtml = `<table class="prop-pricing-table"><thead><tr><th>Item</th><th class="inv-r">Cost</th></tr></thead><tbody>`
      c.pricing_items.forEach(pi => {
        pricingHtml += `<tr><td>${esc(pi.item || pi.description || '')}</td><td class="inv-r">${pi.cost ? '$' + Number(pi.cost).toFixed(2) : ''}</td></tr>`
      })
      pricingHtml += `</tbody></table>`
    }
    h += section('Investment', pricingHtml)
  }

  const tl = Array.isArray(c.timeline) ? c.timeline : []
  if (tl.length) {
    let tlHtml = tl.map(t =>
      `<p class="prop-tl"><strong>${esc(t.phase || t.heading)}</strong> — ${esc(t.duration || '')}<br>${esc(t.deliverables || t.description || '')}</p>`
    ).join('')
    h += section('Timeline', tlHtml)
  }

  h += `</div>`
  return h
}
