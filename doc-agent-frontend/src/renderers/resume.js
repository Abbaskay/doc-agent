function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function mdBold(t) {
  return t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export function renderResume(data) {
  const c = data
  const name = esc(c.full_name || c.name || 'Your Name')
  const phone = c.phone || ''
  const email = c.email || ''
  const linkedin = c.linkedin_url || ''
  const github = c.github_url || ''
  const location = c.location || ''

  let h = `<h1 class="r-name">${name}</h1>`

  const contactParts = []
  if (phone) contactParts.push(phone)
  if (email) contactParts.push(`<a href="mailto:${email}">${email}</a>`)
  if (linkedin) contactParts.push(`<a href="${linkedin}" target="_blank">${linkedin.replace(/^https?:\/\//, '')}</a>`)
  if (github) contactParts.push(`<a href="${github}" target="_blank">${github.replace(/^https?:\/\//, '')}</a>`)
  if (location) contactParts.push(location)
  if (contactParts.length) {
    h += `<p class="r-contact">${contactParts.join(' <span class="r-sep">|</span> ')}</p>`
  }

  if (c.professional_summary || c.summary) {
    h += `<h2 class="r-section">Professional Summary</h2>`
    h += `<p class="r-text">${esc(c.professional_summary || c.summary)}</p>`
  }

  const edus = Array.isArray(c.education) ? c.education : []
  if (edus.length) {
    h += `<h2 class="r-section">Education</h2>`
    edus.forEach(e => {
      h += `<div class="r-edu-block">`
      h += `<div class="r-edu-header"><span class="r-school"><strong>${esc(e.institution)}</strong></span><span class="r-edu-dates">${esc(e.location || '')}</span></div>`
      h += `<div class="r-degree"><em>${esc(e.degree || '')}</em>${e.year || e.dates ? ' — ' + esc(e.year || e.dates) : ''}</div>`
      if (Array.isArray(e.coursework) && e.coursework.length) {
        h += `<div class="r-coursework">${e.coursework.map(cw => esc(cw)).join(', ')}</div>`
      }
      h += `</div>`
    })
  }

  const exps = Array.isArray(c.experience) ? c.experience : []
  if (exps.length) {
    h += `<h2 class="r-section">Experience</h2>`
    exps.forEach(e => {
      h += `<div class="r-exp-block">`
      h += `<div class="r-exp-header"><span class="r-role"><strong>${esc(e.job_title || e.role || '')}</strong></span><span class="r-dates">${esc(e.start_date || e.dates || '')}${e.end_date ? ' — ' + esc(e.end_date) : ''}</span></div>`
      h += `<div class="r-company"><em>${esc(e.company || '')}</em>${e.location ? ' — ' + esc(e.location) : ''}</div>`
      const b = Array.isArray(e.bullets) ? e.bullets : (e.description ? e.description.split('\n').filter(Boolean) : [])
      if (b.length) {
        h += '<ul class="r-list">'
        b.forEach(x => { h += `<li>${mdBold(esc(x))}</li>` })
        h += '</ul>'
      }
      h += `</div>`
    })
  }

  const projects = Array.isArray(c.projects) ? c.projects : []
  if (projects.length) {
    h += `<h2 class="r-section">Projects</h2>`
    projects.forEach(p => {
      h += `<div class="r-exp-block">`
      let projLeft = `<strong>${esc(p.name || '')}</strong>`
      if (p.technologies) projLeft += ` <span class="r-sep">|</span> <em>${esc(p.technologies)}</em>`
      h += `<div class="r-exp-header"><span class="r-role">${projLeft}</span><span class="r-dates">${esc(p.date || '')}</span></div>`
      const b = Array.isArray(p.bullets) ? p.bullets : []
      if (b.length) {
        h += '<ul class="r-list">'
        b.forEach(x => { h += `<li>${mdBold(esc(x))}</li>` })
        h += '</ul>'
      }
      h += `</div>`
    })
  }

  const ts = c.technical_skills
  if (ts) {
    h += `<h2 class="r-section">Technical Skills</h2><div class="r-skills">`
    const cats = { languages: 'Languages', frameworks: 'Frameworks', developer_tools: 'Developer Tools', technologies_frameworks: 'Technologies/Frameworks', libraries: 'Libraries', tools: 'Tools' }
    let first = true
    for (const [key, label] of Object.entries(cats)) {
      const items = Array.isArray(ts[key]) ? ts[key] : []
      if (items.length) {
        if (!first) h += '<br>'
        h += `<strong>${label}:</strong> ${items.map(x => esc(x)).join(', ')}`
        first = false
      }
    }
    if (first) {
      const raw = c.skills
      let sks = Array.isArray(raw) ? raw.filter(s => typeof s === 'string') : (typeof raw === 'string' ? raw.split(',').map(x => x.trim()) : [])
      if (!sks.length && raw && typeof raw === 'object' && !Array.isArray(raw)) {
        sks = Object.values(raw).flat().filter(s => typeof s === 'string')
      }
      if (sks.length) h += sks.join(' · ')
    }
    h += '</div>'
  } else {
    const raw = c.skills
    let sks = Array.isArray(raw) ? raw.filter(s => typeof s === 'string') : (typeof raw === 'string' ? raw.split(',').map(x => x.trim()) : [])
    if (!sks.length && raw && typeof raw === 'object' && !Array.isArray(raw)) {
      sks = Object.values(raw).flat().filter(s => typeof s === 'string')
    }
    if (sks.length) {
      h += `<h2 class="r-section">Technical Skills</h2><div class="r-skills">${sks.join(' · ')}</div>`
    }
  }

  const leads = Array.isArray(c.leadership) ? c.leadership : []
  if (leads.length) {
    h += `<h2 class="r-section">Leadership / Extracurricular</h2>`
    leads.forEach(l => {
      h += `<div class="r-exp-block">`
      h += `<div class="r-exp-header"><span class="r-role"><strong>${esc(l.role || '')}</strong></span><span class="r-dates">${esc(l.dates || '')}</span></div>`
      h += `<div class="r-company"><em>${esc(l.organization || '')}</em>${l.location ? ' — ' + esc(l.location) : ''}</div>`
      const b = Array.isArray(l.bullets) ? l.bullets : []
      if (b.length) {
        h += '<ul class="r-list">'
        b.forEach(x => { h += `<li>${mdBold(esc(x))}</li>` })
        h += '</ul>'
      }
      h += `</div>`
    })
  }

  return h
}
