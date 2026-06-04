function esc(s) {
  if (!s && s !== 0) return ''
  const d = document.createElement('div')
  d.textContent = String(s)
  return d.innerHTML
}

function safeUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return esc(url)
    }
  } catch { /* invalid URL */ }
  return ''
}

export function renderJakesResume(data) {
  const c = data
  const name = esc(c.full_name || c.name || 'Your Name')
  const phone = esc(c.phone || '')
  const email = esc(c.email || '')
  const linkedin = safeUrl(c.linkedin_url || '')
  const github = safeUrl(c.github_url || '')
  const website = safeUrl(c.website || '')
  const location = esc(c.location || '')

  // ── LEFT SIDEBAR ──
  let left = ''

  // Name + Contact in sidebar
  left += `<div class="jr-sidebar-header">`
  left += `<div class="jr-name">${name}</div>`
  left += `<div class="jr-title">${esc(c.job_title || c.desired_role || '')}</div>`
  left += `</div>`

  // Contact section
  let contactItems = []
  if (phone) contactItems.push(`<span class="jr-contact-item">${phone}</span>`)
  if (email) contactItems.push(`<span class="jr-contact-item">${email}</span>`)
  if (location) contactItems.push(`<span class="jr-contact-item">${location}</span>`)
  if (linkedin) contactItems.push(`<a class="jr-contact-item jr-link" href="${linkedin}" target="_blank">${linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a>`)
  if (github) contactItems.push(`<a class="jr-contact-item jr-link" href="${github}" target="_blank">${github.replace(/^https?:\/\/(www\.)?/, '')}</a>`)
  if (website) contactItems.push(`<a class="jr-contact-item jr-link" href="${website}" target="_blank">${website.replace(/^https?:\/\//, '')}</a>`)

  if (contactItems.length) {
    left += `<div class="jr-section"><div class="jr-section-title">Contact</div>`
    left += contactItems.join('')
    left += `</div>`
  }

  // Education in sidebar
  const edus = Array.isArray(c.education) ? c.education : []
  if (edus.length) {
    left += `<div class="jr-section"><div class="jr-section-title">Education</div>`
    edus.forEach(e => {
      left += `<div class="jr-edu-item">`
      left += `<div class="jr-edu-degree">${esc(e.degree || '')}</div>`
      left += `<div class="jr-edu-school">${esc(e.institution || '')}</div>`
      if (e.year || e.dates) left += `<div class="jr-edu-date">${esc(e.year || e.dates)}</div>`
      if (e.gpa) left += `<div class="jr-edu-gpa">GPA: ${esc(e.gpa)}</div>`
      left += `</div>`
    })
    left += `</div>`
  }

  // Skills in sidebar
  const skillText = c.skills_text || ''
  const skillArr = Array.isArray(c.skills) ? c.skills : []
  const techSkills = c.technical_skills
  if (skillText || skillArr.length || techSkills) {
    left += `<div class="jr-section"><div class="jr-section-title">Skills</div><div class="jr-skills">`
    if (skillText) {
      left += `<span class="jr-skill-tag">${esc(skillText)}</span>`
    } else if (techSkills) {
      const cats = { languages: 'Languages', frameworks: 'Frameworks', tools: 'Tools', libraries: 'Libraries', developer_tools: 'Developer Tools', technologies_frameworks: 'Technologies & Frameworks' }
      for (const [, label] of Object.entries(cats)) {
        const items = Array.isArray(techSkills[label.toLowerCase()] || techSkills[Object.keys(cats).find(k => cats[k] === label)] || []) ? [] : []
      }
      // Flatten all technical skills into tags
      const allSkills = []
      if (Array.isArray(techSkills.languages)) allSkills.push(...techSkills.languages)
      if (Array.isArray(techSkills.frameworks)) allSkills.push(...techSkills.frameworks)
      if (Array.isArray(techSkills.tools)) allSkills.push(...techSkills.tools)
      if (Array.isArray(techSkills.libraries)) allSkills.push(...techSkills.libraries)
      if (Array.isArray(techSkills.developer_tools)) allSkills.push(...techSkills.developer_tools)
      if (Array.isArray(techSkills.technologies_frameworks)) allSkills.push(...techSkills.technologies_frameworks)
      allSkills.forEach(s => { left += `<span class="jr-skill-tag">${esc(s)}</span>` })
    } else {
      skillArr.forEach(s => { left += `<span class="jr-skill-tag">${esc(s)}</span>` })
    }
    left += `</div></div>`
  }

  // ── RIGHT MAIN CONTENT ──
  let right = ''

  // Summary
  if (c.professional_summary || c.summary) {
    right += `<div class="jr-section-main"><div class="jr-section-title-main">Professional Summary</div>`
    right += `<p class="jr-text">${esc(c.professional_summary || c.summary)}</p></div>`
  }

  // Experience
  const exps = Array.isArray(c.experience) ? c.experience : []
  if (exps.length) {
    right += `<div class="jr-section-main"><div class="jr-section-title-main">Experience</div>`
    exps.forEach(e => {
      right += `<div class="jr-exp-item">`
      right += `<div class="jr-exp-header">`
      right += `<span class="jr-exp-role">${esc(e.job_title || e.role || '')}</span>`
      right += `<span class="jr-exp-company">${esc(e.company || '')}</span>`
      right += `<span class="jr-exp-dates">${esc(e.start_date || e.dates || '')}${e.end_date ? ' — ' + esc(e.end_date) : ''}</span>`
      right += `</div>`
      const b = Array.isArray(e.bullets) ? e.bullets : (e.description ? e.description.split('\n').filter(Boolean) : [])
      if (b.length) {
        right += '<ul class="jr-list">'
        b.forEach(x => { right += `<li>${esc(x)}</li>` })
        right += '</ul>'
      }
      right += `</div>`
    })
    right += `</div>`
  }

  // Projects
  const projects = Array.isArray(c.projects) ? c.projects : []
  if (projects.length) {
    right += `<div class="jr-section-main"><div class="jr-section-title-main">Projects</div>`
    projects.forEach(p => {
      right += `<div class="jr-exp-item">`
      const projHeader = `<span class="jr-exp-role">${esc(p.name || '')}</span>`
      right += `<div class="jr-exp-header">${projHeader}<span class="jr-exp-dates">${esc(p.date || '')}</span></div>`
      if (p.technologies) right += `<div class="jr-tech">${esc(p.technologies)}</div>`
      const b = Array.isArray(p.bullets) ? p.bullets : []
      if (b.length) {
        right += '<ul class="jr-list">'
        b.forEach(x => { right += `<li>${esc(x)}</li>` })
        right += '</ul>'
      }
      right += `</div>`
    })
    right += `</div>`
  }

  // ── WRAP IN TWO-COLUMN LAYOUT ──
  return `<div class="jr-layout"><div class="jr-sidebar">${left}</div><div class="jr-main">${right}</div></div>`
}
