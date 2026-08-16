'use client'

import { useEffect, useMemo, useState } from 'react'

type Role = 'Coordinator' | 'Operations' | 'Driver' | 'Super Admin'
type RequestStatus = 'Pending' | 'Accepted' | 'Rejected'
type TripStatus = 'Scheduled' | 'In progress' | 'Completed'
type Request = { id: string; reference: string; customer: string; origin: string; destination: string; date: string; time: string; requestedDeliveryDate?: string; requestedDeliveryTime?: string; createdAt: string; passengers: number; cargoMaterial?: string; cargoCompany?: string; cargoWeight?: string; cargoType?: 'Bagged' | 'Loose'; noOfBags?: string; status: RequestStatus; driver?: string; driverNumber?: string }
type Trip = Request & { tripStatus: TripStatus; extras: Extra[]; pickupDate: string; pickupTime: string; estimatedDropDate: string; estimatedDropTime: string; actualDropDate?: string; actualDropTime?: string; cargo: Cargo; truck: Truck; fuel: FuelDetails; cash: CashDetails; documents: TripDocument[] }
type Extra = { id: string; type: 'Fuel' | 'Cash' | 'AdBlue'; amount: string; note: string; status: 'Submitted' | 'Approved' }
type Cargo = { material: string; company: string; quantity: string; noOfBags?: string; loadType: 'Bagged' | 'Loose' }
type Truck = { number: string; type: 'Body' | 'Open'; configuration: '10 tyre' | '12 tyre' | '14 tyre' | '16 tyre'; brand: string }
type FuelDetails = { assigned: string; received: string; station: string; fulfilledAt: string }
type CashDetails = { advance: string; paymentMode: 'Cash' | 'UPI' }
type TripDocument = { id: string; name: string; type: 'LR' | 'WB' | 'Invoice' | 'Other'; uploadedAt: string }

  const seedRequests: Request[] = [
  { id: 'req-1048', reference: 'DR-1048', customer: 'Ultratech Cement', origin: 'Wadgaon, Pune', destination: 'Nashik MIDC', date: '18 Aug 2026', time: '08:30', createdAt: '16 Aug 2026 · 10:15 AM', passengers: 28, status: 'Pending' },
  { id: 'req-1047', reference: 'DR-1047', customer: 'Chettinad Cement', origin: 'Ariyalur Plant', destination: 'Coimbatore', date: '19 Aug 2026', time: '10:00', createdAt: '16 Aug 2026 · 11:40 AM', passengers: 30, status: 'Pending' },
  { id: 'req-1046', reference: 'DR-1046', customer: 'Dalmia Cement', origin: 'Rajgangpur Plant', destination: 'Bhubaneswar', date: '17 Aug 2026', time: '13:15', createdAt: '16 Aug 2026 · 09:20 AM', passengers: 28, status: 'Accepted', driver: 'Ramesh Yadav', driverNumber: 'DRV-021' },
  { id: 'req-1045', reference: 'DR-1045', customer: 'Shree Cement', origin: 'Beawar Plant', destination: 'Jaipur', date: '16 Aug 2026', time: '07:45', createdAt: '15 Aug 2026 · 04:05 PM', passengers: 26, status: 'Rejected' },
  ]
  const seedTrips: Trip[] = [{ ...seedRequests[2], tripStatus: 'In progress', pickupDate: '17 Aug 2026', pickupTime: '13:15', estimatedDropDate: '17 Aug 2026', estimatedDropTime: '18:30', cargo: { material: 'Cement', company: 'Dalmia Cement', quantity: '28 tonnes', noOfBags: '560 bags', loadType: 'Bagged' }, truck: { number: 'OD 14 AB 4721', type: 'Body', configuration: '12 tyre', brand: 'Tata Motors' }, fuel: { assigned: '120 L', received: '120 L', station: 'Indian Oil, Cuttack Bypass', fulfilledAt: '17 Aug 2026 · 13:35' }, cash: { advance: '₹25,000', paymentMode: 'UPI' }, documents: [{ id: 'doc-1', name: 'DR-1046-LR.pdf', type: 'LR', uploadedAt: '17 Aug 2026 · 13:35' }], extras: [{ id: 'ex-1', type: 'Fuel', amount: '₹8,400', note: 'Refuelled near Cuttack bypass', status: 'Submitted' }] }]

export default function OpsDashboard() {
  const [role, setRole] = useState<Role>('Coordinator')
  const [requests, setRequests] = useState<Request[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState('')
  useEffect(() => { fetch('/api/mock-db').then((response) => { if (!response.ok) throw new Error('Mock database unavailable'); return response.json() }).then((data) => { setRequests(data.requests); setTrips(data.trips); setDbReady(true) }).catch(() => setDbError('Unable to load mock database')) }, [])
  async function persist(collection: 'requests' | 'trips' | 'extras' | 'documents', data: unknown) { const response = await fetch('/api/mock-db', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection, data }) }); if (!response.ok) throw new Error('Mock database write failed'); return response.json() }
  const [view, setView] = useState('dashboard')
  const [selected, setSelected] = useState<Request | Trip | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showDocument, setShowDocument] = useState(false)
  const [editTarget, setEditTarget] = useState<Request | Trip | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')

  const pending = requests.filter((r) => r.status === 'Pending')
  const accepted = requests.filter((r) => r.status === 'Accepted')
  const visibleRequests = role === 'Driver' ? [] : requests
  const visibleTrips = role === 'Driver' ? trips.filter((t) => t.driver === 'Ramesh Yadav') : trips
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800) }

  function acceptRequest(request: Request, driver = 'Ramesh Yadav') {
    const updated = { ...request, status: 'Accepted' as RequestStatus, driver, driverNumber: 'DRV-021' }
    const nextRequests = requests.map((item) => item.id === request.id ? updated : item)
    const nextTrips = [...trips.filter((item) => item.id !== request.id), { ...updated, tripStatus: 'Scheduled' as TripStatus, pickupDate: request.date, pickupTime: request.time, estimatedDropDate: request.date, estimatedDropTime: request.time, cargo: { material: 'Cement', company: request.customer, quantity: '28 tonnes', loadType: 'Bagged' as const }, truck: { number: 'Pending assignment', type: 'Body' as const, configuration: '12 tyre' as const, brand: 'Tata Motors' }, fuel: { assigned: '120 L', received: 'Awaiting receipt', station: 'To be assigned', fulfilledAt: 'Not fulfilled' }, cash: { advance: '₹0', paymentMode: 'UPI' as const }, documents: [], extras: [] }]
    setRequests(nextRequests); setTrips(nextTrips); void Promise.all([persist('requests', nextRequests), persist('trips', nextTrips)]); setSelected(updated); notify(`${request.reference} accepted and trip created`)
  }
  function rejectRequest(request: Request) { const next = requests.map((item) => item.id === request.id ? { ...item, status: 'Rejected' as RequestStatus } : item); setRequests(next); void persist('requests', next); setSelected({ ...request, status: 'Rejected' }); notify(`${request.reference} rejected`) }
  function addRequest(data: Request) { const next = [data, ...requests]; setRequests(next); void persist('requests', next); setShowCreate(false); notify('Trip request created') }
  function sendReminder(request: Request) { notify(`Reminder sent to Operations for ${request.reference}`) }
  async function updateEntity(data: Partial<Request>) { if (!editTarget) return; const updated = { ...editTarget, ...data }; const nextRequests = requests.map((item) => item.id === updated.id ? { ...item, ...data } : item); const nextTrips = trips.map((item) => item.id === updated.id ? { ...item, ...data, pickupDate: data.date || item.pickupDate, pickupTime: data.time || item.pickupTime } : item); setRequests(nextRequests); setTrips(nextTrips); setSelected(updated); await persist('requests', nextRequests); if ('tripStatus' in updated) await persist('trips', nextTrips); setEditTarget(null); notify(`${updated.reference} updated`) }
  async function addExtra(data: Extra) { const tripId = selected?.id; if (!tripId) return; const entity = { ...data, tripId }; const currentExtras = trips.flatMap((trip) => trip.extras.map((extra) => ({ ...extra, tripId: trip.id }))); const nextExtras = [...currentExtras, entity]; const result = await persist('extras', nextExtras); const hydratedTrip = result.trip as Trip | undefined; const nextTrips = trips.map((trip) => trip.id === tripId ? { ...trip, extras: hydratedTrip?.extras || [...trip.extras, data] } : trip); setTrips(nextTrips); setSelected(nextTrips.find((trip) => trip.id === tripId) || selected); setShowExtra(false); notify(`${data.type} request submitted`) }
  async function addDocument(data: TripDocument) { const tripId = selected?.id; if (!tripId) return; const entity = { ...data, tripId }; const currentDocuments = trips.flatMap((trip) => trip.documents.map((document) => ({ ...document, tripId: trip.id }))); const nextDocuments = [...currentDocuments, entity]; const result = await persist('documents', nextDocuments); const hydratedTrip = result.trip as Trip | undefined; const nextTrips = trips.map((trip) => trip.id === tripId ? { ...trip, documents: hydratedTrip?.documents || [...trip.documents, data] } : trip); setTrips(nextTrips); setSelected(nextTrips.find((trip) => trip.id === tripId) || selected); setShowDocument(false); notify(`${data.type} document uploaded`) }

  const title = view === 'dashboard' ? 'Good morning, Alex' : view === 'requests' || view === 'request-detail' ? 'Trip requests' : view === 'trips' || view === 'trip-detail' ? 'Trips' : view === 'reports-ops' ? 'Trip Operations Report' : view === 'reports-fuel' ? 'Fuel & Trip Expense Report' : 'Overview'
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">D</span><span>Dev Roadways</span></div><div className="workspace">Operations workspace <span>⌄</span></div><nav>{role === 'Super Admin' ? <><NavItem active={view === 'reports-ops'} label="Trip Operations" onClick={() => setView('reports-ops')} icon="◉" /><NavItem active={view === 'reports-fuel'} label="Fuel & Expenses" onClick={() => setView('reports-fuel')} icon="◈" /></> : <>{role !== 'Driver' && <><NavItem active={view === 'dashboard'} label="Overview" onClick={() => setView('dashboard')} icon="⌂" /><NavItem active={view === 'requests'} label="Trip requests" count={pending.length} onClick={() => setView('requests')} icon="▣" /></>}<NavItem active={view === 'trips'} label="Trips" onClick={() => setView('trips')} icon="↗" /></>}</nav><div className="sidebar-bottom"><div className="help">?<span>Help centre</span></div><div className="profile"><span className="avatar">AC</span><span><b>Alex Cooper</b><small>{role}</small></span><span className="more">•••</span></div></div></aside>
    <main className="main"><header className="topbar"><button className="mobile-menu" aria-label="Open menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>☰</button><div className="crumb">{role === 'Super Admin' ? 'Admin' : 'Operations'} <span>/</span> {view === 'dashboard' ? 'Overview' : title}</div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧</button><div className="role-switch"><span>Viewing as</span><select value={role} onChange={(e) => { setRole(e.target.value as Role); setView(e.target.value === 'Driver' ? 'trips' : e.target.value === 'Super Admin' ? 'reports-ops' : 'dashboard') }} aria-label="Select role"><option>Coordinator</option><option>Operations</option><option>Driver</option><option>Super Admin</option></select></div></div></header>
      <div className="content">{!dbReady && !dbError && <div className="panel db-state">Loading mock database…</div>}{dbError && <div className="panel db-state error">{dbError}</div>}{dbReady && <><div className="page-heading"><div><h1>{title}</h1>{view === 'dashboard' && <p className="subheading">Keep every journey moving, from request to arrival.</p>}</div>{role === 'Coordinator' && view === 'dashboard' && <div className="heading-actions"><button className="button secondary" onClick={() => setShowImport(true)}>↥ <span>Import Excel</span></button><button className="button primary" onClick={() => setShowCreate(true)}>＋ <span>New request</span></button></div>}</div>
      {view === 'dashboard' && role !== 'Driver' && <Dashboard pending={pending} accepted={accepted} requests={requests} trips={trips} onOpen={(r) => { setSelected(r); setView('request-detail') }} onOpenTrip={(t) => { setSelected(t); setView('trip-detail') }} onViewAll={() => setView('trips')} onViewAllRequests={() => setView('requests')} />}
      {view === 'requests' && role !== 'Driver' && <RequestList requests={visibleRequests} onOpen={(r) => { setSelected(r); setView('request-detail') }} onCreate={() => setShowCreate(true)} onImport={() => setShowImport(true)} />}
      {view === 'request-detail' && selected && <RequestDetail request={selected as Request} role={role} onBack={() => setView('requests')} onAccept={acceptRequest} onReject={rejectRequest} onReminder={() => sendReminder(selected as Request)} onEdit={() => { if (role !== 'Driver') setEditTarget(selected as Request) }} />}
      {view === 'trips' && <TripList trips={visibleTrips} onOpen={(t) => { setSelected(t); setView('trip-detail') }} />}
      {view === 'trip-detail' && selected && <><TripDetail trip={selected as Trip} role={role} onBack={() => setView('trips')} onExtra={() => setShowExtra(true)} onDocument={() => setShowDocument(true)} onEdit={() => { if (role !== 'Driver') setEditTarget(selected as Trip) }} /></>}{view === 'reports-ops' && <TripOpsReport trips={trips} />}{view === 'reports-fuel' && <FuelExpenseReport trips={trips} />}
      </>}</div>
    </main>
    {mobileNavOpen && <div className="mobile-nav-layer" role="presentation" onClick={() => setMobileNavOpen(false)}><aside className="mobile-drawer" role="dialog" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}><div className="mobile-drawer-header"><div className="brand"><span className="brand-mark">D</span><span>Dev Roadways</span></div><button className="drawer-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>×</button></div><div className="workspace">Operations workspace <span>⌄</span></div><nav>{role === 'Super Admin' ? <><NavItem active={view === 'reports-ops'} label="Trip Operations" onClick={() => { setView('reports-ops'); setMobileNavOpen(false) }} icon="◉" /><NavItem active={view === 'reports-fuel'} label="Fuel & Expenses" onClick={() => { setView('reports-fuel'); setMobileNavOpen(false) }} icon="◈" /></> : <>{role !== 'Driver' && <><NavItem active={view === 'dashboard'} label="Overview" onClick={() => { setView('dashboard'); setMobileNavOpen(false) }} icon="⌂" /><NavItem active={view === 'requests'} label="Trip requests" count={pending.length} onClick={() => { setView('requests'); setMobileNavOpen(false) }} icon="▣" /></>}<NavItem active={view === 'trips'} label="Trips" onClick={() => { setView('trips'); setMobileNavOpen(false) }} icon="↗" /></>}</nav><div className="mobile-drawer-footer"><div className="help">?<span>Help centre</span></div><div className="profile"><span className="avatar">AC</span><span><b>Alex Cooper</b><small>{role}</small></span></div></div></aside></div>}
    {toast && <div className="toast">✓ {toast}</div>}
    {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={addRequest} />}{showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); notify('Excel preview validated — 2 requests ready') }} />}{showExtra && <ExtraModal onClose={() => setShowExtra(false)} onCreate={addExtra} />}{showDocument && <DocumentModal onClose={() => setShowDocument(false)} onCreate={addDocument} />}{editTarget && <EditModal entity={editTarget} onClose={() => setEditTarget(null)} onSave={updateEntity} />}
  </div>
}
function NavItem({ label, icon, count, active, onClick }: { label: string; icon: string; count?: number; active?: boolean; onClick: () => void }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span>{label}{count ? <em>{count}</em> : null}</button> }
function Status({ children }: { children: string }) { return <span className={`status ${children.toLowerCase().replace(' ', '-')}`}>{children}</span> }
function Dashboard({ pending, accepted, requests, trips, onOpen, onOpenTrip, onViewAll, onViewAllRequests }: { pending: Request[]; accepted: Request[]; requests: Request[]; trips: Trip[]; onOpen: (r: Request) => void; onOpenTrip: (t: Trip) => void; onViewAll: () => void; onViewAllRequests: () => void }) { const recentTrips = [...trips].sort((a, b) => b.date.localeCompare(a.date)); const recentRequests = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1); return <><section className="stats"><Stat label="Pending requests" value={pending.length} tone="blue" hint="Needs review" /><Stat label="Trips this week" value={accepted.length + 2} tone="green" hint="Across all drivers" /><Stat label="Active trips" value={trips.filter((t) => t.tripStatus === 'In progress').length} tone="purple" hint="Currently moving" /></section><section className="section-grid"><div className="panel"><div className="panel-header"><div><h2>Trip requests</h2><p>Requests awaiting review or action.</p></div><button className="text-button" onClick={onViewAllRequests}>View all →</button></div><div className="request-stack">{recentRequests.map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpen(request)} />)}</div>{!recentRequests.length && <Empty label="No trip requests yet" />}</div><div className="panel"><div className="panel-header"><div><h2>Trips</h2><p>Recently created and scheduled journeys.</p></div><button className="text-button" onClick={onViewAll}>View all →</button></div><div className="request-stack">{recentTrips.map((trip) => <TripRow key={trip.id} trip={trip} onClick={() => onOpenTrip(trip)} />)}</div>{!recentTrips.length && <Empty label="No trips yet" />}</div></section></> }
function Stat({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone: string }) { return <div className="stat"><span className={`stat-icon ${tone}`}>{tone === 'blue' ? '◷' : tone === 'green' ? '↗' : '▣'}</span><div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div></div> }
function TripRow({ trip, onClick }: { trip: Trip; onClick: () => void }) { return <button className="trip-card" onClick={onClick}><span className="trip-date"><b>{trip.date.split(' ')[0]}</b><small>{trip.date.split(' ')[1]}</small></span><span className="request-main"><b>{trip.reference} · {trip.customer}</b><small>{trip.origin} <i>→</i> {trip.destination}</small></span><Status>{trip.tripStatus}</Status><span className="chevron">›</span></button> }
function RequestRow({ request, onClick }: { request: Request; onClick: () => void }) { return <button className="request-row" onClick={onClick}><span className="request-icon">↗</span><span className="request-main"><b>{request.reference}</b><small>{request.origin} <i>→</i> {request.destination}</small></span><span className="request-date"><b>{request.date}</b><small>{request.time} · {request.passengers} passengers</small></span><Status>{request.status}</Status><span className="chevron">›</span></button> }
function RequestCard({ request, onClick }: { request: Request; onClick: () => void }) { return <button className="request-card" onClick={onClick}><span className="request-icon">↗</span><span className="request-main"><b>{request.reference} · {request.customer}</b><small>{request.origin} <i>→</i> {request.destination}</small><small>{request.date} · {request.time} · {request.passengers} bags</small></span><Status>{request.status}</Status><span className="chevron">›</span></button> }
function RequestList({ requests, onOpen, onCreate, onImport }: { requests: Request[]; onOpen: (r: Request) => void; onCreate: () => void; onImport: () => void }) { const [filter, setFilter] = useState('All'); const [query, setQuery] = useState(''); const filtered = requests.filter((r) => (filter === 'All' || r.status === filter) && `${r.reference} ${r.customer} ${r.origin} ${r.destination}`.toLowerCase().includes(query.toLowerCase())); return <section className="panel list-panel"><div className="panel-header"><div><h2>All requests</h2></div><div className="panel-header-actions"><button className="icon-create" aria-label="Upload Excel" title="Upload Excel" onClick={onImport}>↥</button><button className="icon-create" aria-label="New request" title="New request" onClick={onCreate}>＋</button></div></div><div className="filters"><div className="search">⌕ <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference or customer" /></div><div className="filter-group">{['All', 'Pending', 'Accepted', 'Rejected'].map((f) => <button key={f} className={filter === f ? 'filter active' : 'filter'} onClick={() => setFilter(f)}>{f}</button>)}</div></div>{filtered.map((r) => <div key={r.id}><RequestCard request={r} onClick={() => onOpen(r)} /></div>)}</section> }
function RequestDetail({ request, role, onBack, onAccept, onReject, onReminder, onEdit }: { request: Request; role: Role; onBack: () => void; onAccept: (r: Request) => void; onReject: (r: Request) => void; onReminder: () => void; onEdit: () => void }) { return <section className="detail"><button className="back" onClick={onBack}>← Back to requests</button><div className="detail-heading"><div><p className="eyebrow">Trip request</p><h1>{request.reference}</h1><p className="subheading">{request.customer} · Created {request.createdAt}</p></div><div className="detail-heading-right"><button className="quick-action-icon" aria-label="Edit request" title="Edit request" onClick={onEdit}>✎</button><Status>{request.status}</Status></div></div><div className="detail-grid"><div className="panel"><h2>Journey details</h2><div className="journey journey-times"><div><small>Pickup</small><b>{request.origin}</b><span><em>Requested</em><b>{request.date}</b><b>{to12Hour(request.time)}</b></span></div><i>→</i><div><small>Drop-off</small><b>{request.destination}</b><span><em>Requested delivery</em><b>{request.requestedDeliveryDate || request.date}</b><b>{to12Hour(request.requestedDeliveryTime || request.time)}</b></span></div></div><div className="info-grid"><Info label="Customer" value={request.customer} /><Info label="No. of bags" value={request.noOfBags || `${request.passengers} bags`} /><Info label="Requested delivery" value={`${request.requestedDeliveryDate || request.date} · ${to12Hour(request.requestedDeliveryTime || request.time)}`} /><Info label="Reference" value={request.reference} /><Info label="Material" value={request.cargoMaterial || 'Cement'} /><Info label="Cargo weight" value={request.cargoWeight || '—'} /><Info label="Cargo type" value={request.cargoType || 'Bagged'} /></div>{role === 'Coordinator' && request.status !== 'Accepted' && <button className="button secondary wide" onClick={onReminder}>Send reminder to Operations</button>}</div>{request.driver && <div className="panel action-panel"><h2>Assigned driver</h2><div className="assigned"><b>{request.driver}</b><span>{request.driverNumber}</span></div></div>}{role === 'Operations' && request.status === 'Pending' && <div className="panel action-panel"><h2>Review</h2><button className="button primary wide" onClick={() => onAccept(request)}>Accept request</button><button className="button danger wide" onClick={() => onReject(request)}>Reject request</button></div>}</div></section> }
function to12Hour(time: string) { const [hours, minutes] = time.split(':').map(Number); if (Number.isNaN(hours) || Number.isNaN(minutes)) return time; const suffix = hours >= 12 ? 'PM' : 'AM'; const hour = hours % 12 || 12; return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}` }
function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><b>{value}</b></div> }
function TripList({ trips, onOpen }: { trips: Trip[]; onOpen: (t: Trip) => void }) { return <section className="panel list-panel"><div className="panel-header"><div><h2>{trips.length} trips</h2></div></div>{trips.map((t) => <div key={t.id}><TripRow trip={t} onClick={() => onOpen(t)} /></div>)}{!trips.length && <Empty label="No trips assigned to you" />}</section> }
function TripDetail({ trip, role, onBack, onExtra, onDocument, onEdit }: { trip: Trip; role: Role; onBack: () => void; onExtra: () => void; onDocument: () => void; onEdit: () => void }) { return <section className="detail"><button className="back" onClick={onBack}>← Back to trips</button><div className="detail-heading"><div><p className="eyebrow">Trip details</p><h1>{trip.reference}</h1><p className="subheading">{trip.customer} · Created {trip.createdAt}</p></div><div className="detail-heading-right">{(role === 'Coordinator' || role === 'Operations') && <button className="quick-action-icon" aria-label="Edit trip" title="Edit trip" onClick={onEdit}>✎</button>}{role === 'Driver' && <div className="detail-quick-actions"><button className="quick-action-icon" aria-label="Upload trip document" title="Upload trip document" onClick={onDocument}>↥</button><button className="quick-action-icon" aria-label="Submit extra request" title="Submit extra request" onClick={onExtra}>＋</button></div>}<Status>{trip.tripStatus}</Status></div></div><div className="detail-grid"><div className="panel"><h2>Journey</h2><div className="journey journey-times"><div><small>Pickup</small><b>{trip.origin}</b><span><em>Scheduled</em><b>{trip.pickupDate}</b><b>{to12Hour(trip.pickupTime)}</b></span><span><em>Actual</em><b>{trip.pickupDate}</b><b>{to12Hour(trip.pickupTime)}</b></span></div><i>→</i><div><small>Drop-off</small><b>{trip.destination}</b><span><em>Requested</em><b>{trip.date}</b><b>{to12Hour(trip.time)}</b></span><span><em>Estimated</em><b>{trip.estimatedDropDate}</b><b>{to12Hour(trip.estimatedDropTime)}</b></span><span><em>Actual</em>{trip.actualDropDate ? <><b>{trip.actualDropDate}</b><b>{to12Hour(trip.actualDropTime || '')}</b></> : <b>Awaiting delivery</b>}</span></div></div><InfoSection title="Cargo details"><Info label="Material" value={trip.cargo.material} /><Info label="Cement company" value={trip.cargo.company} /><Info label="Cargo weight" value={trip.cargo.quantity} /><Info label="Cargo type" value={trip.cargo.loadType} />{trip.cargo.loadType === 'Bagged' && <Info label="No. of bags" value={trip.cargo.noOfBags || '—'} />}</InfoSection><InfoSection title="Truck details"><Info label="Truck number" value={trip.truck.number} /><Info label="Truck type" value={trip.truck.type} /><Info label="Configuration" value={trip.truck.configuration} /><Info label="Truck brand" value={trip.truck.brand} /></InfoSection><InfoSection title="Driver details"><Info label="Driver name" value={trip.driver || 'Unassigned'} /><Info label="Phone number" value={trip.driverNumber || 'Not available'} /></InfoSection><InfoSection title="Fuel details"><Info label="Assigned fuel" value={trip.fuel.assigned} /><Info label="Received fuel" value={trip.fuel.received} /><Info label="Station name" value={trip.fuel.station} /><Info label="Fulfilled at" value={trip.fuel.fulfilledAt} /></InfoSection><InfoSection title="Cash details"><Info label="Advanced amount" value={trip.cash.advance} /><Info label="Payment mode" value={trip.cash.paymentMode} /></InfoSection><h2 className="activity-title section-title">Extra expense</h2>{trip.extras.map((extra) => <div className="extra-row" key={extra.id}><span className="extra-icon">{extra.type === 'Fuel' ? '◉' : extra.type === 'Cash' ? '₹' : '◆'}</span><div><b>Extra {extra.type} request</b><p>{extra.note}</p></div><strong>{extra.amount}</strong></div>)}{!trip.extras.length && <Empty label="No extra expenses" />}<h2 className="activity-title">Trip documents</h2>{trip.documents.map((doc) => <div className="extra-row" key={doc.id}><span className="extra-icon">▤</span><div><b>{doc.name}</b><p>{doc.type} · {doc.uploadedAt}</p></div><Status>Approved</Status></div>)}{!trip.documents.length && <Empty label="No documents uploaded" />}</div><div className="panel action-panel"><h2>Driver actions</h2><p>Submit an expense or operational request linked to this trip.</p>{role === 'Driver' && <><button className="button primary wide" onClick={onDocument}>↥ Upload trip document</button><button className="button primary wide" onClick={onExtra}>＋ Extra request</button></>}</div></div></section> }
function InfoSection({ title, children }: { title: string; children: React.ReactNode }) { return <><h2 className="activity-title section-title">{title}</h2><div className="info-grid compact-grid">{children}</div></> }
function DriverDetails({ trip }: { trip: Trip }) { return <section className="panel driver-details-panel"><InfoSection title="Driver details"><Info label="Driver name" value={trip.driver || 'Unassigned'} /><Info label="Phone number" value={trip.driverNumber || 'Not available'} /></InfoSection></section> }
function Empty({ label }: { label: string }) { return <div className="empty">{label}</div> }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close">×</button></div>{children}</div></div> }
function EditModal({ entity, onClose, onSave }: { entity: Request | Trip; onClose: () => void; onSave: (data: Partial<Request>) => void }) { const [reference, setReference] = useState(entity.reference); const [customer, setCustomer] = useState(entity.customer); const [origin, setOrigin] = useState(entity.origin); const [destination, setDestination] = useState(entity.destination); const [date, setDate] = useState(entity.date); const [time, setTime] = useState(entity.time); const [deliveryDate, setDeliveryDate] = useState(entity.requestedDeliveryDate || entity.date); const [deliveryTime, setDeliveryTime] = useState(entity.requestedDeliveryTime || entity.time); const [cargoMaterial, setCargoMaterial] = useState(entity.cargoMaterial || 'Cement'); const [cargoCompany, setCargoCompany] = useState(entity.cargoCompany || entity.customer); const [cargoWeight, setCargoWeight] = useState(entity.cargoWeight || ''); const [cargoType, setCargoType] = useState<Request['cargoType']>(entity.cargoType || 'Bagged'); const [noOfBags, setNoOfBags] = useState(entity.noOfBags || ''); return <Modal title={`Edit ${'tripStatus' in entity ? 'trip' : 'request'}`} onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onSave({ reference, customer, origin, destination, date, time, requestedDeliveryDate: deliveryDate, requestedDeliveryTime: deliveryTime, cargoMaterial, cargoCompany, cargoWeight, cargoType, noOfBags, passengers: Number(noOfBags) || entity.passengers }) }}><label>Reference<input value={reference} onChange={(e) => setReference(e.target.value)} /></label><label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label><div className="form-row"><label>Pickup<input value={origin} onChange={(e) => setOrigin(e.target.value)} /></label><label>Drop-off<input value={destination} onChange={(e) => setDestination(e.target.value)} /></label></div><div className="form-row"><label>Requested date<input value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Requested time<input value={time} onChange={(e) => setTime(e.target.value)} /></label></div><div className="form-row"><label>Delivery date<input value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></label><label>Delivery time<input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} /></label></div><label>Material<input value={cargoMaterial} onChange={(e) => setCargoMaterial(e.target.value)} /></label><div className="form-row"><label>Cargo weight<input value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="28 tonnes" /></label><label>Cargo type<select value={cargoType} onChange={(e) => setCargoType(e.target.value as Request['cargoType'])}><option value="Bagged">Bagged</option><option value="Loose">Loose</option></select></label></div><label>No. of bags<input value={noOfBags} onChange={(e) => setNoOfBags(e.target.value)} placeholder="560 bags" /></label><button className="button primary wide" type="submit">Save changes</button></form></Modal> }
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (r: Request) => void }) { const [reference, setReference] = useState(''); const [customer, setCustomer] = useState(''); const [origin, setOrigin] = useState(''); const [destination, setDestination] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [deliveryDate, setDeliveryDate] = useState(''); const [deliveryTime, setDeliveryTime] = useState(''); const [cargoMaterial, setCargoMaterial] = useState('Cement'); const [cargoCompany, setCargoCompany] = useState(''); const [cargoWeight, setCargoWeight] = useState(''); const [cargoType, setCargoType] = useState<Request['cargoType']>('Bagged'); const [noOfBags, setNoOfBags] = useState(''); const submit = (e: React.FormEvent) => { e.preventDefault(); onCreate({ id: `req-${Date.now()}`, reference: reference || `DR-${1050 + Math.floor(Math.random() * 20)}`, customer: customer || 'New customer', origin: origin || 'Wadgaon, Pune', destination: destination || 'Nashik MIDC', date: date || '20 Aug 2026', time: time || '09:00', requestedDeliveryDate: deliveryDate || date || '20 Aug 2026', requestedDeliveryTime: deliveryTime || time || '09:00', cargoMaterial, cargoCompany: cargoCompany || customer, cargoWeight, cargoType, noOfBags: noOfBags || '1 bag', createdAt: (() => { const now = new Date(); const day = now.getDate(); const month = now.toLocaleString('en-GB', { month: 'short' }); const year = now.getFullYear(); const hours = now.getHours(); const minutes = String(now.getMinutes()).padStart(2, '0'); const suffix = hours >= 12 ? 'PM' : 'AM'; const hour12 = hours % 12 || 12; return `${day} ${month} ${year} · ${hour12}:${minutes} ${suffix}`; })(), passengers: Number(noOfBags) || 1, status: 'Pending' }) }; return <Modal title="Create trip request" onClose={onClose}><form onSubmit={submit}><label>Reference<input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="DR-1049" /></label><label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Company or person" /></label><div className="form-row"><label>Pickup<input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="City or address" /></label><label>Drop-off<input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or address" /></label></div><div className="form-row"><label>Requested date<input value={date} onChange={(e) => setDate(e.target.value)} placeholder="19 Aug 2026" /></label><label>Requested time<input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM" /></label></div><div className="form-row"><label>Delivery date<input value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} placeholder="19 Aug 2026" /></label><label>Delivery time<input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="10:00 AM" /></label></div><div className="form-row"><label>Cargo weight<input value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="28 tonnes" /></label><label>Cargo type<select value={cargoType} onChange={(e) => setCargoType(e.target.value as Request['cargoType'])}><option value="Bagged">Bagged</option><option value="Loose">Loose</option></select></label></div><label>No. of bags<input value={noOfBags} onChange={(e) => setNoOfBags(e.target.value)} placeholder="560 bags" /></label><button className="button primary wide" type="submit">Create request</button></form></Modal> }
function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) { return <Modal title="Import requests" onClose={onClose}><div className="upload"><span>↥</span><b>Drop your Excel file here</b><p>or choose a .xlsx file from your device</p><button className="button secondary">Choose file</button></div><div className="import-preview"><b>Preview ready</b><span>2 valid requests · 0 errors</span></div><button className="button primary wide" onClick={onDone}>Validate and import</button></Modal> }
function ExtraModal({ onClose, onCreate }: { onClose: () => void; onCreate: (x: Extra) => void }) { const [type, setType] = useState<Extra['type']>('Fuel'); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); return <Modal title="Submit extra request" onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onCreate({ id: `ex-${Date.now()}`, type, amount: amount.trim() ? `₹${amount.trim()}` : '₹0', note: note.trim() || 'Submitted by driver for review', status: 'Submitted' }) }}><label>Request type<select value={type} onChange={(e) => setType(e.target.value as Extra['type'])}><option>Fuel</option><option>Cash</option><option>AdBlue</option></select></label><label>Amount<input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="5000" /></label><label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note" rows={3} /></label><button className="button primary wide" type="submit">Submit request</button></form></Modal> }
function DocumentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (x: TripDocument) => void }) { const [type, setType] = useState<TripDocument['type']>('LR'); const [name, setName] = useState(''); return <Modal title="Upload trip document" onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onCreate({ id: `doc-${Date.now()}`, name: name || `Trip-document-${type}.pdf`, type, uploadedAt: 'Just now' }) }}><div className="upload"><span>↥</span><b>Select a document</b><p>PDF, JPG, or PNG up to 10 MB</p><input type="file" onChange={(e) => setName(e.target.files?.[0]?.name || '')} /></div><label>Document type<select value={type} onChange={(e) => setType(e.target.value as TripDocument['type'])}><option>LR</option><option>WB</option><option>Invoice</option><option>Other</option></select></label><button className="button primary wide" type="submit">Upload document</button></form></Modal> }

function TripOpsReport({ trips }: { trips: Trip[] }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [driverFilter, setDriverFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  // Summary — all from real trips data
  const total     = trips.length
  const accepted  = trips.filter(t => t.status === 'Accepted').length
  const rejected  = trips.filter(t => t.status === 'Rejected').length
  const active    = trips.filter(t => t.tripStatus === 'In progress').length
  const completed = trips.filter(t => t.tripStatus === 'Completed').length
  const pending   = trips.filter(t => t.tripStatus === 'Scheduled').length

  // Table rows — mapped from real trips
  const rows = trips.map(t => ({
    id:          t.reference,
    source:      t.origin,
    destination: t.destination,
    loadType:    t.cargo?.loadType ?? '—',
    weight:      t.cargo?.quantity ?? '—',
    driver:      t.driver || 'Unassigned',
    status:      t.tripStatus,
    delivery:    t.estimatedDropDate || t.date,
  }))

  const filteredRows = rows.filter(r =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (!driverFilter || r.driver.toLowerCase().includes(driverFilter.toLowerCase())) &&
    (!sourceFilter || r.source.toLowerCase().includes(sourceFilter.toLowerCase()))
  )

  const handleDownloadExcel = async () => {
    const XLSX = await import('xlsx');
    const data = filteredRows.map(r => ({
      'Trip ID': r.id,
      'Source': r.source,
      'Destination': r.destination,
      'Load Type': r.loadType,
      'Weight': r.weight,
      'Driver': r.driver,
      'Status': r.status,
      'Est. Delivery': r.delivery
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips');
    XLSX.writeFile(workbook, `Trip_Operations_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Bar chart — real counts
  const dist = [
    { label: 'Pending',     count: pending,    color: '#3b82f6' },
    { label: 'In progress', count: active,      color: '#8b5cf6' },
    { label: 'Completed',   count: completed,   color: '#10b981' },
  ]
  const maxCount = Math.max(...dist.map(d => d.count), 1)

  const statusChip = (s: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      'Completed':   { bg: '#dcfce7', color: '#166534' },
      'In progress': { bg: '#ede9fe', color: '#5b21b6' },
      'Scheduled':   { bg: '#dbeafe', color: '#1d4ed8' },
    }
    const c = map[s] ?? { bg: '#f1f5f9', color: '#475569' }
    return <span style={{ padding: '0.25rem 0.625rem', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, background: c.bg, color: c.color }}>{s}</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Total Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{total}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>All time</small>
        </div>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Accepted Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{accepted}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>Converted from requests</small>
        </div>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Rejected Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{rejected}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>Declined</small>
        </div>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Active Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{active}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>Currently moving</small>
        </div>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Completed Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{completed}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>Delivered</small>
        </div>
        <div className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>Pending Trips</p>
          <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{pending}</strong>
          <small style={{ color: '#8993a2', fontSize: '10px' }}>Scheduled, not started</small>
        </div>
      </section>

      <div className="panel">
        <div className="panel-header" style={{ alignItems: 'center' }}>
          <div><h2>All Trips</h2><p>Live data from trips</p></div>
          <button className="icon-create" onClick={handleDownloadExcel} title="Download Excel (.xlsx)" aria-label="Download Excel">
            ⤓
          </button>
        </div>
        <div className="filters" style={{ flexWrap: 'wrap' }}>
          <div className="search"><input value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} placeholder="⌕ Source / origin" style={{ minWidth: 160 }} /></div>
          <div className="search"><input value={driverFilter} onChange={e => setDriverFilter(e.target.value)} placeholder="⌕ Driver" style={{ minWidth: 120 }} /></div>
          <div className="filter-group">{['All', 'Scheduled', 'In progress', 'Completed'].map(s => <button key={s} className={statusFilter === s ? 'filter active' : 'filter'} onClick={() => setStatusFilter(s)}>{s}</button>)}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Trip ID', 'Source', 'Destination', 'Load Type', 'Weight', 'Driver', 'Status', 'Est. Delivery'].map(h =>
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{row.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.source}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.destination}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.loadType}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', textAlign: 'right' }}>{row.weight}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.driver}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{statusChip(row.status)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', whiteSpace: 'nowrap' }}>{row.delivery}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No trips match the filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Trip Status Distribution</h2><p>Breakdown of all trips by current status</p></div></div>
        <div style={{ padding: '0 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dist.map(d => (
            <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 44px', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{d.label}</span>
              <div style={{ background: '#f1f5f9', borderRadius: 9999, height: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((d.count / maxCount) * 100)}%`, background: d.color, borderRadius: 9999, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
          {total === 0 && <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No trip data available.</p>}
        </div>
      </div>
    </div>
  )
}

function FuelExpenseReport({ trips }: { trips: Trip[] }) {
  const [driverFilter, setDriverFilter] = useState('')
  const [tripFilter, setTripFilter] = useState('')

  const dummyRows = [
    { trip: 'TR-001', driver: 'Rahul', truck: 'MH13AB1234', fuelAuth: '120 L', fuelRec: '115 L', authN: 120, recN: 115, cash: '₹2,000', extraFuel: false },
    { trip: 'TR-002', driver: 'Amit',  truck: 'MH13CD5678', fuelAuth: '100 L', fuelRec: '102 L', authN: 100, recN: 102, cash: '₹1,500', extraFuel: true  },
    { trip: 'TR-003', driver: 'Sagar', truck: 'MH13EF9012', fuelAuth: '130 L', fuelRec: '125 L', authN: 130, recN: 125, cash: '₹2,500', extraFuel: false },
  ]

  const filteredRows = dummyRows.filter(r =>
    (!driverFilter || r.driver.toLowerCase().includes(driverFilter.toLowerCase())) &&
    (!tripFilter   || r.trip.toLowerCase().includes(tripFilter.toLowerCase()))
  )

  const totalAuth = dummyRows.reduce((s, r) => s + r.authN, 0)
  const totalRec  = dummyRows.reduce((s, r) => s + r.recN,  0)
  const extraCount = dummyRows.filter(r => r.extraFuel).length
  const maxFuel = Math.max(totalAuth, totalRec, 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="stats">
        <div className="stat"><span className="stat-icon blue">◉</span><div><p>Fuel Authorized</p><strong>{totalAuth} L</strong><small>Across all trips</small></div></div>
        <div className="stat"><span className="stat-icon green">✓</span><div><p>Fuel Recorded</p><strong>{totalRec} L</strong><small>Actual consumption</small></div></div>
        <div className="stat"><span className="stat-icon purple">₹</span><div><p>Cash Advances</p><strong>₹6,000</strong><small>{dummyRows.length} trips</small></div></div>
        <div className="stat"><span className="stat-icon blue">◷</span><div><p>Fuel Transactions</p><strong>{dummyRows.length}</strong><small>This period</small></div></div>
        <div className="stat"><span style={{ background: '#fef3c7', color: '#d97706', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, flexShrink: 0 }}>!</span><div><p>Extra Fuel Requests</p><strong>{extraCount}</strong><small>Pending review</small></div></div>
      </section>

      <div className="panel">
        <div className="panel-header"><div><h2>Fuel & Expense Breakdown</h2><p>Per-trip fuel and cash advance summary</p></div></div>
        <div className="filters" style={{ flexWrap: 'wrap' }}>
          <div className="search"><input value={driverFilter} onChange={e => setDriverFilter(e.target.value)} placeholder="⌕ Driver" style={{ minWidth: 140 }} /></div>
          <div className="search"><input value={tripFilter} onChange={e => setTripFilter(e.target.value)} placeholder="⌕ Trip ID" style={{ minWidth: 120 }} /></div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Trip', 'Driver', 'Truck', 'Fuel Authorized', 'Fuel Recorded', 'Cash Advance', 'Extra Fuel'].map(h =>
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.trip} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{row.trip}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.driver}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.truck}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.fuelAuth}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.fuelRec}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.cash}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{row.extraFuel ? <span style={{ color: '#d97706', fontWeight: 600 }}>Yes</span> : <span style={{ color: '#94a3b8' }}>No</span>}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No records match the filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Fuel Authorized vs Recorded</h2><p>Planned vs actual consumption comparison</p></div></div>
        <div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Authorized', value: totalAuth, color: '#3b82f6' },
            { label: 'Recorded',   value: totalRec,  color: '#10b981' },
          ].map(bar => (
            <div key={bar.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{bar.label}</span>
              <div style={{ background: '#f1f5f9', borderRadius: 9999, height: 14, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((bar.value / maxFuel) * 100)}%`, background: bar.color, borderRadius: 9999, transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{bar.value} L</span>
            </div>
          ))}
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
            Variance: <strong style={{ color: totalAuth - totalRec > 0 ? '#ef4444' : '#10b981' }}>
              {totalAuth - totalRec > 0 ? '−' : '+'}{Math.abs(totalAuth - totalRec)} L
            </strong> {totalAuth - totalRec > 0 ? 'under recorded vs authorized' : 'over recorded vs authorized'}.
          </p>
        </div>
      </div>
    </div>
  )
}

