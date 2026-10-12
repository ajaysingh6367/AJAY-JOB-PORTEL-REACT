import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp, ArrowRight, BriefcaseBusiness, Building2, Check, ChevronDown,
  ChevronLeft, ChevronRight, Clock3, Compass, ExternalLink, Filter, Heart,
  MapPin, Menu, RefreshCw, Search, ShieldCheck, Sparkles, Users, X, Zap
} from 'lucide-react'

const API_URL = 'https://www.arbeitnow.com/api/job-board-api'
const PER_PAGE = 8

function normalizeJob(job, index) {
  return {
    id: String(job.slug || job.id || `${job.company_name || 'company'}-${job.title || 'role'}-${index}`),
    title: job.title || 'Untitled opportunity',
    company: job.company_name || job.company || 'Company not listed',
    location: job.location || 'Location not specified',
    remote: Boolean(job.remote),
    type: job.job_types?.[0] || job.job_type || 'Full-time',
    tags: Array.isArray(job.tags) ? job.tags.slice(0, 5) : [],
    description: job.description || 'Visit the original listing for the full job description and requirements.',
    url: job.url || '#',
    createdAt: job.created_at || '',
    source: 'Arbeitnow'
  }
}

function relativeDate(value) {
  if (!value) return 'Recently posted'
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently posted'
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [submittedLocation, setSubmittedLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All types')
  const [sortBy, setSortBy] = useState('Relevant')
  const [page, setPage] = useState(1)
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('careerhub-saved') || '[]') } catch { return [] }
  })
  const [showSaved, setShowSaved] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [email, setEmail] = useState('')
  const [profileName, setProfileName] = useState(() => localStorage.getItem('careerhub-profile') || '')
  const [toast, setToast] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  const notify = useCallback((message) => {
    setToast(message)
    window.clearTimeout(window.__careerHubToast)
    window.__careerHubToast = window.setTimeout(() => setToast(''), 2800)
  }, [])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setApiError('')
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Job service responded with ${response.status}`)
      const data = await response.json()
      const raw = Array.isArray(data.data) ? data.data : Array.isArray(data.jobs) ? data.jobs : []
      if (!raw.length) throw new Error('The job service returned no listings right now.')
      setJobs(raw.map(normalizeJob))
    } catch (error) {
      setApiError('We could not load live listings right now. Check your connection and try again.')
      console.error('Ajay Job Portal jobs API:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => {
    try { localStorage.setItem('careerhub-saved', JSON.stringify(savedIds)) } catch {}
  }, [savedIds])

  const toggleSaved = (job) => {
    const alreadySaved = savedIds.includes(job.id)
    setSavedIds(current => alreadySaved ? current.filter(id => id !== job.id) : [...current, job.id])
    notify(alreadySaved ? 'Removed from saved jobs' : 'Job saved to your list')
  }

  const filteredJobs = useMemo(() => {
    const q = submittedQuery.trim().toLowerCase()
    const loc = submittedLocation.trim().toLowerCase()
    let list = jobs.filter(job => {
      const searchable = `${job.title} ${job.company} ${job.location} ${job.tags.join(' ')}`.toLowerCase()
      const matchesQuery = !q || searchable.includes(q)
      const matchesLocation = !loc || job.location.toLowerCase().includes(loc)
      const matchesRemote = !remoteOnly || job.remote
      const matchesType = typeFilter === 'All types' || job.type.toLowerCase().includes(typeFilter.toLowerCase())
      const matchesSaved = !showSaved || savedIds.includes(job.id)
      return matchesQuery && matchesLocation && matchesRemote && matchesType && matchesSaved
    })
    if (sortBy === 'Company A–Z') list.sort((a, b) => a.company.localeCompare(b.company))
    if (sortBy === 'Title A–Z') list.sort((a, b) => a.title.localeCompare(b.title))
    if (sortBy === 'Remote first') list.sort((a, b) => Number(b.remote) - Number(a.remote))
    return list
  }, [jobs, submittedQuery, submittedLocation, remoteOnly, typeFilter, sortBy, showSaved, savedIds])

  useEffect(() => { setPage(1) }, [submittedQuery, submittedLocation, remoteOnly, typeFilter, sortBy, showSaved])
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PER_PAGE))
  const pageJobs = filteredJobs.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const runSearch = (event) => {
    event?.preventDefault()
    setSubmittedQuery(query)
    setSubmittedLocation(location)
    setShowSaved(false)
    document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clearFilters = () => {
    setQuery(''); setLocation(''); setSubmittedQuery(''); setSubmittedLocation('')
    setRemoteOnly(false); setTypeFilter('All types'); setShowSaved(false); setSortBy('Relevant')
  }

  const signIn = (event) => {
    event.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      notify('Enter a valid email address')
      return
    }
    const name = email.split('@')[0].replace(/[._-]+/g, ' ')
    const displayName = name.replace(/\b\w/g, letter => letter.toUpperCase())
    setProfileName(displayName)
    localStorage.setItem('careerhub-profile', displayName)
    setShowProfile(false)
    notify(`Welcome, ${displayName}! Demo profile is ready.`)
  }

  const signOut = () => {
    setProfileName('')
    localStorage.removeItem('careerhub-profile')
    notify('You have signed out of the demo profile')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); clearFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <span className="brand-mark"><BriefcaseBusiness size={20} /></span>
            <span>Ajay <span className="brand-accent">Job Portal</span></span>
          </a>
          <nav className={`nav-links ${mobileMenu ? 'nav-open' : ''}`}>
            <a href="#jobs" onClick={() => { setShowSaved(false); setMobileMenu(false) }}>Find jobs</a>
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a>
            <button className="nav-saved" onClick={() => { setShowSaved(true); setMobileMenu(false); document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }}>
              <Heart size={16} /> Saved <span className="saved-count">{savedIds.length}</span>
            </button>
          </nav>
          <div className="nav-actions">
            {profileName ? <button className="profile-chip" onClick={() => setShowProfile(true)}><span className="avatar">{profileName[0]}</span>{profileName.split(' ')[0]} <ChevronDown size={14}/></button> :
              <button className="text-button" onClick={() => setShowProfile(true)}>Log in</button>}
            <button className="button button-primary nav-cta" onClick={() => setShowProfile(true)}>{profileName ? 'My profile' : 'Get started'} <ArrowRight size={16}/></button>
            <button className="icon-button mobile-toggle" aria-label="Toggle menu" onClick={() => setMobileMenu(v => !v)}>{mobileMenu ? <X/> : <Menu/>}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={14}/> Your next chapter starts here</div>
              <h1>Find work that <span>moves you.</span></h1>
              <p className="hero-subtitle">Discover meaningful opportunities, connect with ambitious teams, and make your next move with confidence.</p>
              <form className="search-panel" onSubmit={runSearch}>
                <label className="search-field"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skill, or company" aria-label="Search jobs"/></label>
                <span className="search-divider"/>
                <label className="search-field location-field"><MapPin size={19}/><input value={location} onChange={e => setLocation(e.target.value)} placeholder="City or remote" aria-label="Location"/></label>
                <button className="button button-primary search-submit" type="submit">Search jobs <ArrowRight size={17}/></button>
              </form>
              <div className="hero-proof"><span><ShieldCheck size={16}/> Curated opportunities</span><span><Zap size={16}/> Fresh listings</span><span><Check size={16}/> Direct apply links</span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-a"/><div className="orbit orbit-b"/>
              <div className="floating-card card-main"><div className="mini-label"><span className="live-dot"/> OPPORTUNITY MATCH</div><div className="match-score">92<span>%</span></div><div className="match-title">Your next move looks good.</div><div className="match-bar"><i/></div><div className="match-foot"><span>Skills match</span><strong>Excellent</strong></div></div>
              <div className="floating-card card-small"><span className="float-icon"><BriefcaseBusiness size={18}/></span><div><strong>New roles</strong><small>Updated from live listings</small></div><span className="pulse">↗</span></div>
              <div className="hero-spark spark-a">✳</div><div className="hero-spark spark-b">✦</div>
            </div>
            <div className="hero-bottom-note"><span className="note-line"/> A better way to find your next opportunity</div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="trust-inner"><div className="trust-label">BUILT FOR YOUR NEXT MOVE</div><div className="trust-item"><Users size={18}/> People-first discovery</div><div className="trust-item"><Compass size={18}/> Opportunities worldwide</div><div className="trust-item"><ShieldCheck size={18}/> Apply at the source</div></div>
        </section>

        <section className="jobs-section section-wrap" id="jobs">
          <div className="section-heading">
            <div><div className="section-kicker"><span/> THE OPPORTUNITY BOARD</div><h2>{showSaved ? 'Your saved jobs' : 'Explore open roles'}<span className="heading-period">.</span></h2><p>{showSaved ? 'Your shortlist, all in one place.' : 'Find the role that fits your skills, ambition, and life.'}</p></div>
            <div className="heading-actions"><button className="button button-soft" onClick={fetchJobs} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''}/>{loading ? 'Refreshing' : 'Refresh jobs'}</button><button className={`button ${showFilters ? 'button-primary' : 'button-outline'}`} onClick={() => setShowFilters(v => !v)}><Filter size={16}/> Filters <ChevronDown size={15}/></button></div>
          </div>

          <div className="results-toolbar">
            <div className="results-count">{loading ? 'Finding opportunities…' : <><strong>{filteredJobs.length}</strong> {showSaved ? 'saved roles' : 'opportunities found'}</>}</div>
            <label className="sort-control"><ArrowDownUp size={15}/><span>Sort:</span><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option>Relevant</option><option>Remote first</option><option>Company A–Z</option><option>Title A–Z</option></select></label>
          </div>

          {showFilters && <div className="filter-panel">
            <div className="filter-title"><div><Filter size={17}/><strong>Refine your search</strong></div><button className="plain-link" onClick={clearFilters}>Clear all</button></div>
            <div className="filter-options">
              <label className="select-filter"><span>Employment type</span><select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option>All types</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Freelance</option></select></label>
              <label className="check-filter"><input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)}/><span className="custom-check"><Check size={12}/></span><span>Remote roles only</span></label>
              <button className="button button-primary apply-filters" onClick={() => { setSubmittedQuery(query); setSubmittedLocation(location); setShowSaved(false); setShowFilters(false) }}>Apply filters <ArrowRight size={15}/></button>
            </div>
          </div>}

          {apiError && <div className="error-panel"><div className="error-icon"><RefreshCw size={20}/></div><div><strong>Listings are taking a break</strong><p>{apiError} The public provider controls availability.</p></div><button className="button button-outline" onClick={fetchJobs}>Try again</button></div>}

          {loading && <div className="job-grid">{Array.from({ length: 6 }, (_, i) => <div className="job-skeleton" key={i}><div className="skeleton-row"><i/><b/></div><i className="skeleton-title"/><i className="skeleton-line"/><i className="skeleton-line short"/><i className="skeleton-footer"/></div>)}</div>}

          {!loading && !apiError && pageJobs.length > 0 && <div className="job-grid">
            {pageJobs.map((job, index) => <article className="job-card" key={job.id}>
              <div className="job-card-top"><div className={`company-logo logo-${index % 6}`}>{job.company.slice(0, 1).toUpperCase()}</div><button className={`save-button ${savedIds.includes(job.id) ? 'is-saved' : ''}`} aria-label={savedIds.includes(job.id) ? 'Remove saved job' : 'Save job'} title={savedIds.includes(job.id) ? 'Remove saved job' : 'Save job'} onClick={() => toggleSaved(job)}><Heart size={18} fill={savedIds.includes(job.id) ? 'currentColor' : 'none'}/></button></div>
              <div className="job-meta-top"><span className="job-company">{job.company}</span>{job.remote && <span className="remote-pill"><span/> Remote</span>}</div>
              <button className="job-title-button" onClick={() => setSelectedJob(job)}>{job.title}</button>
              <div className="job-location"><MapPin size={14}/>{job.location || 'Location not specified'}<span className="meta-dot">·</span><Clock3 size={14}/>{relativeDate(job.createdAt)}</div>
              <div className="job-tags">{(job.tags.length ? job.tags.slice(0, 3) : [job.type]).map(tag => <span key={tag}>{tag}</span>)}</div>
              <div className="job-card-bottom"><span className="job-type">{job.type}</span><button className="details-link" onClick={() => setSelectedJob(job)}>View details <ArrowRight size={15}/></button></div>
            </article>)}
          </div>}

          {!loading && !apiError && pageJobs.length === 0 && <div className="empty-state"><div className="empty-illustration"><Search size={30}/></div><h3>{showSaved ? 'No saved jobs yet' : 'No matching roles found'}</h3><p>{showSaved ? 'Tap the heart on any role to keep it here for later.' : 'Try another keyword or loosen your filters to discover more opportunities.'}</p><button className="button button-primary" onClick={() => { clearFilters(); if (showSaved) setShowSaved(false) }}>{showSaved ? 'Explore jobs' : 'Clear filters'} <ArrowRight size={16}/></button></div>}

          {!loading && !apiError && filteredJobs.length > PER_PAGE && <div className="pagination"><span>Showing <strong>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filteredJobs.length)}</strong> of <strong>{filteredJobs.length}</strong></span><div className="page-controls"><button aria-label="Previous page" disabled={page === 1} onClick={() => { setPage(p => p - 1); document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }}><ChevronLeft size={17}/></button><span>Page {page} of {totalPages}</span><button aria-label="Next page" disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }}><ChevronRight size={17}/></button></div></div>}
          <div className="data-note"><span className="live-dot"/> Listings loaded from a public job board API. Availability and freshness depend on the source.</div>
        </section>

        <section className="how-section" id="how-it-works"><div className="section-wrap"><div className="how-heading"><div className="section-kicker light-kicker"><span/> YOUR NEXT STEP</div><h2>Less scrolling.<br/><em>More possibility.</em></h2><p>Make your job search feel a little more focused — and a lot more human.</p></div><div className="steps-grid"><div className="step-card"><span className="step-number">01</span><div className="step-icon"><Search size={21}/></div><h3>Discover</h3><p>Search roles by title, skill, company, or location and narrow down what matters.</p></div><div className="step-card"><span className="step-number">02</span><div className="step-icon"><Heart size={21}/></div><h3>Shortlist</h3><p>Save opportunities you love and come back to them whenever you're ready.</p></div><div className="step-card"><span className="step-number">03</span><div className="step-icon"><ExternalLink size={21}/></div><h3>Make your move</h3><p>Open the original listing to review the details and apply directly at the source.</p></div></div></div></section>

        <section className="cta-section"><div className="cta-card"><div className="cta-orb"/><div className="cta-content"><div className="section-kicker"><span/> YOUR FUTURE IS OPEN</div><h2>Ready for your next<br/><em>great thing?</em></h2><p>Your next opportunity could be one search away.</p><button className="button button-primary cta-button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); document.querySelector('.search-field input')?.focus() }}>Find your next role <ArrowRight size={17}/></button></div><div className="cta-graphic" aria-hidden="true"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-star">✳</div><div className="graphic-bubble"><BriefcaseBusiness size={27}/></div></div></div></section>
      </main>

      <footer className="footer"><div className="footer-inner"><a className="brand footer-brand" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><span className="brand-mark"><BriefcaseBusiness size={18}/></span><span>Ajay <span className="brand-accent">Job Portal</span></span></a><p>Make room for what's next.</p><div className="footer-right"><span>Job data provided by Arbeitnow API</span><span>© {new Date().getFullYear()} Ajay Job Portal</span></div></div></footer>

      {selectedJob && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedJob(null) }}><section className="modal job-modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title"><button className="modal-close" aria-label="Close job details" onClick={() => setSelectedJob(null)}><X size={20}/></button><div className="modal-job-logo">{selectedJob.company.slice(0, 1).toUpperCase()}</div><div className="modal-kicker">{selectedJob.company}</div><h2 id="job-modal-title">{selectedJob.title}</h2><div className="modal-job-meta"><span><MapPin size={15}/>{selectedJob.location}</span><span><Clock3 size={15}/>{relativeDate(selectedJob.createdAt)}</span>{selectedJob.remote && <span className="remote-pill"><span/> Remote</span>}</div><div className="modal-description" dangerouslySetInnerHTML={{ __html: selectedJob.description }} /><div className="modal-tags">{selectedJob.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="modal-actions"><button className={`button ${savedIds.includes(selectedJob.id) ? 'button-soft' : 'button-outline'}`} onClick={() => toggleSaved(selectedJob)}><Heart size={16} fill={savedIds.includes(selectedJob.id) ? 'currentColor' : 'none'}/>{savedIds.includes(selectedJob.id) ? 'Saved' : 'Save job'}</button><a className="button button-primary" href={selectedJob.url} target="_blank" rel="noreferrer" onClick={() => notify('Opening the original job listing in a new tab')}>Apply at source <ExternalLink size={16}/></a></div><p className="source-disclaimer">You will leave Ajay Job Portal to view the original listing. Check details and availability with the employer.</p></section></div>}

      {showProfile && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowProfile(false) }}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="modal-close" aria-label="Close profile" onClick={() => setShowProfile(false)}><X size={20}/></button>{profileName ? <><div className="profile-avatar">{profileName[0]}</div><div className="modal-kicker">YOUR AJAY JOB PORTAL PROFILE</div><h2 id="profile-title">Hi, {profileName.split(' ')[0]}.</h2><p className="profile-copy">You're using a local demo profile. Your saved jobs stay in this browser.</p><div className="profile-stat"><Heart size={17}/><span>{savedIds.length} saved {savedIds.length === 1 ? 'job' : 'jobs'}</span><button className="plain-link" onClick={() => { setShowProfile(false); setShowSaved(true); document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' }) }}>View saved</button></div><button className="button button-outline full-button" onClick={signOut}>Sign out</button></> : <><div className="profile-avatar"><Users size={25}/></div><div className="modal-kicker">WELCOME TO AJAY JOB PORTAL</div><h2 id="profile-title">Make yourself at home.</h2><p className="profile-copy">Enter your email to create a local demo profile and keep your saved roles organized on this device.</p><form className="profile-form" onSubmit={signIn}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label><button className="button button-primary full-button" type="submit">Continue <ArrowRight size={16}/></button></form><p className="demo-note"><ShieldCheck size={14}/> Demo only — no password or account is created.</p></>}</section></div>}

      {toast && <div className="toast" role="status"><span className="toast-check"><Check size={15}/></span>{toast}<button aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15}/></button></div>}
    </div>
  )
}

export default App
