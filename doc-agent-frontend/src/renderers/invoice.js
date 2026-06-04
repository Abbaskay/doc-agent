function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

export function renderInvoice(data) {
  const c = data
  const items = Array.isArray(c.items) ? c.items : []
  const amt = i => i.amount || (i.rate || 0) * (i.quantity || 0) - (i.discount || 0)
  const subtotal = c.subtotal || items.reduce((s, i) => s + amt(i), 0)
  const taxRate = c.tax_rate ? c.tax_rate / 100 : 0
  const tax = c.tax ?? subtotal * taxRate
  const total = c.total ?? subtotal + tax

  let h = `<div class="inv-wrapper">`
  h += `<div class="inv-header">`
  h += `<div class="inv-from">`
  if (c.logo_url) h += `<div><img src="${esc(c.logo_url)}" alt="Logo" style="height:1.98cm"></div>`
  h += `<div class="inv-company">${esc(c.business_name || 'Business Name')}</div>`
  if (c.business_email) h += `<div class="inv-muted">${esc(c.business_email)}</div>`
  if (c.business_phone) h += `<div class="inv-muted">${esc(c.business_phone)}</div>`
  h += `</div>`
  h += `<div class="inv-meta">`
  h += `<div class="inv-meta-label"><strong>INVOICE</strong></div>`
  h += `<div class="inv-number">#${esc(c.invoice_number || '')}</div>`
  h += `<div><strong>DATE</strong></div>`
  h += `<div>${esc(c.date || '')}</div>`
  if (c.due_date) { h += `<div><strong>DUE</strong></div><div>${esc(c.due_date)}</div>` }
  h += `</div></div>`

  h += `<hr class="inv-divider">`
  h += `<div class="inv-bill-section">`
  h += `<div class="inv-label">Bill To</div>`
  h += `<div class="inv-client"><strong>${esc(c.client_name || '')}</strong></div>`
  if (c.client_email) h += `<div class="inv-muted">${esc(c.client_email)}</div>`
  h += `</div>`

  h += `<table class="inv-table"><thead><tr>`
  h += `<th style="width:44%">Description</th><th class="inv-r" style="width:14%">Rate</th><th class="inv-r" style="width:10%">Qty</th><th class="inv-r" style="width:14%">Discount</th><th class="inv-r" style="width:18%">Amount</th>`
  h += `</tr></thead><tbody>`
  items.forEach(i => {
    const a = amt(i)
    h += `<tr>`
    h += `<td>${esc(i.description || i.service || '')}</td>`
    h += `<td class="inv-r">$${(i.rate || 0).toFixed(2)}</td>`
    h += `<td class="inv-r">${i.quantity || 0}</td>`
    h += `<td class="inv-r">${i.discount ? '$' + i.discount.toFixed(2) : '—'}</td>`
    h += `<td class="inv-r">$${a.toFixed(2)}</td>`
    h += `</tr>`
  })
  h += `</tbody></table>`

  h += `<div class="inv-totals">`
  h += `<div class="inv-line"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>`
  if (taxRate > 0) h += `<div class="inv-line"><span>Tax (${(taxRate * 100).toFixed(0)}%)</span><span>$${tax.toFixed(2)}</span></div>`
  if (c.payment_received) h += `<div class="inv-line"><span>Payment received</span><span>−$${c.payment_received.toFixed(2)}</span></div>`
  const bal = c.balance_due || (total - (c.payment_received || 0))
  h += `<div class="inv-grand"><span>Total Due</span><span>$${bal.toFixed(2)}</span></div>`
  h += `</div>`

  if (Array.isArray(c.payment_instructions) && c.payment_instructions.length) {
    h += `<h2 class="inv-label" style="margin-top:14px">Payment Instructions</h2>`
    c.payment_instructions.forEach(pi => {
      h += `<div class="inv-pi"><strong>${esc(pi.method)}:</strong> ${esc(pi.detail)}</div>`
    })
  }
  h += `</div>`

  return h
}
