const schemas = {
  resume: {
    required: ['full_name', 'email', 'professional_summary'],
    optional: ['phone', 'location'],
    arrays: {
      experience: { minItems: 1, fields: ['job_title', 'company', 'start_date', 'bullets'] },
      education: { minItems: 0, fields: ['institution', 'degree'] },
      skills: { minItems: 1 },
    },
  },
  cover_letter: {
    required: ['full_name', 'email', 'date', 'company_name', 'position', 'body_paragraphs', 'closing'],
    optional: ['phone', 'recipient_name'],
    arrays: {
      body_paragraphs: { minItems: 1 },
    },
  },
  invoice: {
    required: ['business_name', 'business_email', 'invoice_number', 'date', 'client_name', 'items'],
    optional: ['client_email', 'tax_rate', 'notes'],
    arrays: {
      items: { minItems: 1, fields: ['description', 'quantity', 'unit_price'] },
    },
  },
  email: {
    required: ['to', 'subject', 'greeting', 'body', 'closing', 'sender_name'],
    optional: ['sender_title', 'sender_email'],
    arrays: {
      body: { minItems: 1 },
    },
  },
  proposal: {
    required: ['project_title', 'prepared_by', 'prepared_for', 'date', 'executive_summary', 'scope_of_work'],
    optional: ['problem_statement', 'proposed_solution', 'pricing', 'timeline'],
    arrays: {
      scope_of_work: { minItems: 1, fields: ['heading', 'description'] },
      timeline: { minItems: 0, fields: ['phase', 'duration'] },
    },
  },
  report: {
    required: ['title', 'author', 'date'],
    optional: ['abstract', 'methodology', 'findings', 'conclusions', 'recommendations'],
    arrays: {
      conclusions: { minItems: 0 },
      recommendations: { minItems: 0 },
    },
  },
  documentation: {
    required: ['title', 'author', 'version', 'date', 'overview', 'sections'],
    optional: ['conclusion'],
    arrays: {
      sections: { minItems: 1, fields: ['heading', 'body'] },
    },
  },
  generic: {
    required: ['title'],
    optional: ['summary', 'conclusion'],
    arrays: {
      sections: { minItems: 0, fields: ['heading', 'body'] },
    },
  },
}

export function validateDoc(data, type) {
  const schema = schemas[type] || schemas.generic
  const issues = []

  if (!data || typeof data !== 'object') {
    return { valid: false, issues: [{ field: '', message: 'Response is not valid JSON object', severity: 'error' }], score: 0 }
  }

  for (const field of schema.required) {
    const val = data[field]
    if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
      issues.push({ field, message: `Missing required field: ${field}`, severity: 'error' })
    }
  }

  for (const [key, rules] of Object.entries(schema.arrays || {})) {
    const arr = data[key]
    if (arr !== undefined) {
      if (!Array.isArray(arr)) {
        issues.push({ field: key, message: `"${key}" should be an array`, severity: 'error' })
      } else if (rules.minItems > 0 && arr.length < rules.minItems) {
        issues.push({ field: key, message: `"${key}" needs at least ${rules.minItems} item(s)`, severity: 'warning', current: arr.length, min: rules.minItems })
      }
      if (rules.fields && Array.isArray(arr)) {
        arr.forEach((item, i) => {
          for (const f of rules.fields) {
            if (!item[f] || (typeof item[f] === 'string' && !item[f].trim())) {
              issues.push({ field: `${key}[${i}].${f}`, message: `"${key}" item ${i + 1} missing "${f}"`, severity: 'warning' })
            }
          }
        })
      }
    }
  }

  const score = Math.max(0, 100 - issues.reduce((p, i) => p + (i.severity === 'error' ? 25 : 10), 0))
  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues, score }
}

const commonAliases = {
  name: 'full_name',
  summary: 'professional_summary',
  role: 'job_title',
  client: 'client_name',
  business: 'business_name',
  sender: 'sender_name',
  heading: 'title',
  body_content: 'body',
  dates: 'start_date',
  date: 'start_date',
}

const scalarDefaults = {
  full_name: 'Your Name',
  email: 'email@example.com',
  date: () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  professional_summary: '',
  title: 'Document',
  author: 'Author',
  business_name: 'Business Name',
  business_email: 'business@example.com',
  invoice_number: 'INV-001',
  client_name: 'Client',
  project_title: 'Project Title',
  prepared_by: 'Your Name',
  prepared_for: 'Client',
  executive_summary: '',
  company_name: 'Company',
  position: 'Position',
  closing: 'Sincerely',
  greeting: 'Dear',
  sender_name: 'Your Name',
  to: 'recipient@example.com',
  subject: 'Subject',
  version: '1.0',
  overview: '',
  summary: '',
  conclusion: '',
  phone: '',
  location: '',
  recipient_name: 'Hiring Manager',
  abstract: '',
  methodology: '',
  findings: '',
  problem_statement: '',
  proposed_solution: '',
  pricing: '',
  sender_title: '',
  sender_email: '',
  notes: '',
  source: '',
  setup: '',
}

export function normalizeDocData(data, type) {
  if (!data || typeof data !== 'object') {
    return { title: 'Document', sections: [] }
  }

  const schema = schemas[type] || schemas.generic
  const result = { ...data }

  for (const [alias, canonical] of Object.entries(commonAliases)) {
    if (result[alias] !== undefined && (result[canonical] === undefined || result[canonical] === '')) {
      result[canonical] = result[alias]
      if (alias !== canonical) delete result[alias]
    }
  }

  for (const field of schema.required) {
    const val = result[field]
    if (val === undefined || val === null || val === '') {
      if (schema.arrays?.[field]) {
        result[field] = []
      } else {
        const def = scalarDefaults[field]
        result[field] = typeof def === 'function' ? def() : (def || '')
      }
    }
  }

  for (const [key, rules] of Object.entries(schema.arrays || {})) {
    if (result[key] === undefined || result[key] === null) {
      result[key] = []
    } else if (!Array.isArray(result[key])) {
      if (result[key] !== null && typeof result[key] === 'object' && !rules.fields) {
      } else {
        result[key] = result[key] ? [result[key]] : []
      }
    }
    const template = {}
    if (rules.fields) {
      for (const f of rules.fields) {
        template[f] = ''
      }
    }
    if (rules.minItems > 0 && result[key].length < rules.minItems) {
      while (result[key].length < rules.minItems) {
        result[key].push({ ...template })
      }
    }
    if (rules.fields && Array.isArray(result[key])) {
      result[key] = result[key].map(item => {
        if (typeof item !== 'object' || item === null) return { ...template }
        for (const f of rules.fields) {
          if (item[f] === undefined || item[f] === null) item[f] = ''
        }
        return item
      })
    }
  }

  return result
}
