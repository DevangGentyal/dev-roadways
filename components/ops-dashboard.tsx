'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

type Role = 'Coordinator' | 'Operations' | 'Driver'
type RequestStatus = 'Pending' | 'Accepted' | 'Rejected'
type TripStatus = 'Scheduled' | 'In progress' | 'Completed'
type ExtraType = 'Fuel' | 'Cash' | 'AdBlue' | 'Other'
type FuelStatus = 'Waiting' | 'Sent'
type Request = {
  id: string
  reference: string
  customer: string
  origin: string
  destination: string
  date: string
  time: string
  requestedDeliveryDate?: string
  requestedDeliveryTime?: string
  createdAt: string
  passengers: number
  cargoMaterial?: string
  cargoCompany?: string
  cargoWeight?: string
  cargoType?: 'Bagged' | 'Loose'
  noOfBags?: string
  status: RequestStatus
  driver?: string
  driverNumber?: string
}

type Extra = {
  id: string
  type: ExtraType
  amount: string
  note: string
  status: 'Submitted' | 'Approved' | 'Pending approval'
}

type Trip = Request & {
  tripStatus: TripStatus
  extras: Extra[]
  pickupDate: string
  pickupTime: string
  estimatedDropDate: string
  estimatedDropTime: string
  actualDropDate?: string
  actualDropTime?: string
  cargo: Cargo
  truck: Truck
  fuel: FuelDetails
  cash: CashDetails
  documents: TripDocument[]
}

type Cargo = {
  material: string
  company: string
  quantity: string
  noOfBags?: string
  loadType: 'Bagged' | 'Loose'
}

type Truck = {
  number: string
  type: 'Body' | 'Open'
  configuration: '10 tyre' | '12 tyre' | '14 tyre' | '16 tyre'
  brand: string
}

type FuelDetails = {
  assigned: string
  received: string
  station: string
  fulfilledAt: string
}

type CashDetails = {
  advance: string
  paymentMode: 'Cash' | 'UPI'
}

type TripDocument = {
  id: string
  name: string
  type: 'LR' | 'WB' | 'Invoice' | 'Other'
  uploadedAt: string
}

type Followup = {
  id: string
  tripId: string
  driverName: string
  driverNumber: string
  date: string
  time: string
  note: string
  status: 'Upcoming' | 'Completed'
  createdAt: string
}

type FuelTransaction = {
  id: string
  tripId: string
  tripName: string
  customer: string
  fuelAmount: string
  pumpName: string
  status: FuelStatus
}

const seedRequests: Request[] = [
  { id: 'req-1048', reference: 'DR-1048', customer: 'Ultratech Cement', origin: 'Wadgaon, Pune', destination: 'Nashik MIDC', date: '18 Aug 2026', time: '08:30', createdAt: '16 Aug 2026 · 10:15 AM', passengers: 28, status: 'Pending' },
  { id: 'req-1047', reference: 'DR-1047', customer: 'Chettinad Cement', origin: 'Ariyalur Plant', destination: 'Coimbatore', date: '19 Aug 2026', time: '10:00', createdAt: '16 Aug 2026 · 11:40 AM', passengers: 30, status: 'Pending' },
  { id: 'req-1046', reference: 'DR-1046', customer: 'Dalmia Cement', origin: 'Rajgangpur Plant', destination: 'Bhubaneswar', date: '17 Aug 2026', time: '13:15', createdAt: '16 Aug 2026 · 09:20 AM', passengers: 28, status: 'Accepted', driver: 'Ramesh Yadav', driverNumber: '9421659207' },
  { id: 'req-1045', reference: 'DR-1045', customer: 'Shree Cement', origin: 'Beawar Plant', destination: 'Jaipur', date: '16 Aug 2026', time: '07:45', createdAt: '15 Aug 2026 · 04:05 PM', passengers: 26, status: 'Rejected' }
]

const seedTrips: Trip[] = [{
  ...seedRequests[2],
  tripStatus: 'In progress',
  pickupDate: '17 Aug 2026',
  pickupTime: '13:15',
  estimatedDropDate: '17 Aug 2026',
  estimatedDropTime: '18:30',
  cargo: { material: 'Cement', company: 'Dalmia Cement', quantity: '28 tonnes', noOfBags: '560 bags', loadType: 'Bagged' },
  truck: { number: 'OD 14 AB 4721', type: 'Body', configuration: '12 tyre', brand: 'Tata Motors' },
  fuel: { assigned: '120 L', received: '120 L', station: 'Indian Oil, Cuttack Bypass', fulfilledAt: '17 Aug 2026 · 13:35' },
  cash: { advance: '₹25,000', paymentMode: 'UPI' },
  documents: [{ id: 'doc-1', name: 'DR-1046-LR.pdf', type: 'LR', uploadedAt: '17 Aug 2026 · 13:35' }],
  extras: [{ id: 'ex-1', type: 'Fuel', amount: '₹8,400', note: 'Fuel and maintenance request', status: 'Submitted' }]
}]

const seedFuelTransactions: FuelTransaction[] = [
  { id: 'fuel-1001', tripId: 'DR-1046', tripName: 'Dalmia Cement Route', customer: 'Dalmia Cement', fuelAmount: '₹8,400', pumpName: 'Indian Oil, Cuttack Bypass', status: 'Waiting' },
  { id: 'fuel-1002', tripId: 'DR-1047', tripName: 'Chettinad Cement Route', customer: 'Chettinad Cement', fuelAmount: '₹9,150', pumpName: 'HPCL, Madurai Hub', status: 'Waiting' },
  { id: 'fuel-1003', tripId: 'DR-1048', tripName: 'Ultratech Cement Route', customer: 'Ultratech Cement', fuelAmount: '₹7,650', pumpName: 'Bharat Petroleum, Pune West', status: 'Sent' }
]

const buildDateTime = (date: string, time: string) => new Date(`${date} ${time}`)

export default function OpsDashboard() {
  const [role, setRole] = useState<Role>('Coordinator')
  const [requests, setRequests] = useState<Request[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [followups, setFollowups] = useState<Followup[]>([])
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>(seedFuelTransactions)
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState('')
  const [view, setView] = useState('dashboard')
  const [selected, setSelected] = useState<Request | Trip | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showDocument, setShowDocument] = useState(false)
  const [showFollowup, setShowFollowup] = useState(false)
  const [followupContextTripId, setFollowupContextTripId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Request | Trip | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [selectedDriverRequests, setSelectedDriverRequests] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/mock-db')
      .then((response) => {
        if (!response.ok) throw new Error('Mock database unavailable')
        return response.json()
      })
      .then((data) => {
        setRequests(data.requests?.length ? data.requests : seedRequests)
        setTrips(data.trips?.length ? data.trips : seedTrips)
        setFollowups(data.followups || [])
        setDbReady(true)
      })
      .catch(() => {
        setRequests(seedRequests)
        setTrips(seedTrips)
        setFollowups([])
        setDbError('Unable to load mock database')
      })
  }, [])

  async function persist(collection: 'requests' | 'trips' | 'extras' | 'documents' | 'followups', nextData: unknown) {
    const response = await fetch('/api/mock-db', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection, data: nextData })
    })

    if (!response.ok) throw new Error('Mock database write failed')
    return response.json()
  }

  const pending = requests.filter((request) => request.status === 'Pending')
  const accepted = requests.filter((request) => request.status === 'Accepted')
  const visibleRequests = role === 'Driver' ? [] : requests
  const visibleTrips = role === 'Driver' ? trips.filter((trip) => trip.driver === 'Ramesh Yadav') : trips

  const driverExtraRequests = useMemo(
    () =>
      trips.flatMap((trip) =>
        (trip.extras || []).map((extra) => ({
          ...extra,
          tripId: trip.id,
          tripReference: trip.reference,
          customer: trip.customer,
          driver: trip.driver || 'Unassigned'
        }))
      ),
    [trips]
  )

  const sortedFollowups = useMemo(() => {
    const scoped = followupContextTripId ? followups.filter((item) => item.tripId === followupContextTripId) : followups
    return [...scoped].sort((a, b) => buildDateTime(a.date, a.time).getTime() - buildDateTime(b.date, b.time).getTime())
  }, [followupContextTripId, followups])

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function acceptRequest(request: Request, driver = 'Ramesh Yadav') {
    const updated = {
      ...request,
      status: 'Accepted' as RequestStatus,
      driver,
      driverNumber: '9421659207'
    }

    const nextRequests = requests.map((item) => (item.id === request.id ? updated : item))
    const nextTrips = [
      ...trips.filter((item) => item.id !== request.id),
      {
        ...updated,
        tripStatus: 'Scheduled' as TripStatus,
        pickupDate: request.date,
        pickupTime: request.time,
        estimatedDropDate: request.date,
        estimatedDropTime: request.time,
        cargo: {
          material: request.cargoMaterial || 'Cement',
          company: request.cargoCompany || request.customer,
          quantity: request.cargoWeight || '28 tonnes',
          noOfBags: request.noOfBags || '560 bags',
          loadType: 'Bagged' as const
        },
        truck: {
          number: 'Pending assignment',
          type: 'Body' as const,
          configuration: '12 tyre' as const,
          brand: 'Tata Motors'
        },
        fuel: {
          assigned: '120 L',
          received: 'Awaiting receipt',
          station: 'To be assigned',
          fulfilledAt: 'Not fulfilled'
        },
        cash: { advance: '₹0', paymentMode: 'UPI' as const },
        documents: [],
        extras: []
      }
    ]

    setRequests(nextRequests)
    setTrips(nextTrips)
    void Promise.all([persist('requests', nextRequests), persist('trips', nextTrips)])
    setSelected(updated)
    notify(`${request.reference} accepted and trip created`)
  }

  function rejectRequest(request: Request) {
    const nextRequests = requests.map((item) => (item.id === request.id ? { ...item, status: 'Rejected' as RequestStatus } : item))
    setRequests(nextRequests)
    void persist('requests', nextRequests)
    setSelected({ ...request, status: 'Rejected' })
    notify(`${request.reference} rejected`)
  }

  function addRequest(data: Request) {
    const nextRequests = [data, ...requests]
    setRequests(nextRequests)
    void persist('requests', nextRequests)
    setShowCreate(false)
    notify('Trip request created')
  }

  function sendReminder(request: Request) {
    notify(`Reminder sent to Operations for ${request.reference}`)
  }

  async function updateEntity(data: Partial<Request>) {
    if (!editTarget) return
    const updated = { ...editTarget, ...data }
    const nextRequests = requests.map((item) => (item.id === updated.id ? { ...item, ...data } : item))
    const nextTrips = trips.map((item) =>
      item.id === updated.id
        ? { ...item, ...data, pickupDate: data.date || item.pickupDate, pickupTime: data.time || item.pickupTime }
        : item
    )

    setRequests(nextRequests)
    setTrips(nextTrips)
    setSelected(updated)
    await persist('requests', nextRequests)
    if ('tripStatus' in updated) await persist('trips', nextTrips)
    setEditTarget(null)
    notify(`${updated.reference} updated`)
  }

  async function addExtra(data: Extra) {
    const tripId = selected?.id
    if (!tripId) return

    const entity = { ...data, tripId }
    const currentExtras = trips.flatMap((trip) => (trip.extras || []).map((extra) => ({ ...extra, tripId: trip.id })))
    const nextExtras = [...currentExtras, entity]
    await persist('extras', nextExtras)

    const nextTrips = trips.map((trip) =>
      trip.id === tripId ? { ...trip, extras: [...(trip.extras || []), data] } : trip
    )

    setTrips(nextTrips)
    setSelected(nextTrips.find((trip) => trip.id === tripId) || selected)
    setShowExtra(false)
    notify(`${data.type} request submitted`)
  }

  async function addDocument(data: TripDocument) {
    const tripId = selected?.id
    if (!tripId) return

    const entity = { ...data, tripId }
    const currentDocuments = trips.flatMap((trip) => (trip.documents || []).map((document) => ({ ...document, tripId: trip.id })))
    const nextDocuments = [...currentDocuments, entity]
    await persist('documents', nextDocuments)

    const nextTrips = trips.map((trip) =>
      trip.id === tripId ? { ...trip, documents: [...(trip.documents || []), data] } : trip
    )

    setTrips(nextTrips)
    setSelected(nextTrips.find((trip) => trip.id === tripId) || selected)
    setShowDocument(false)
    notify(`${data.type} document uploaded`)
  }

  function createFollowup(data: Omit<Followup, 'id' | 'createdAt'>) {
    const next = [
      {
        ...data,
        id: `fu-${Date.now()}`,
        createdAt: new Date().toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      ...followups
    ]

    setFollowups(next)
    void persist('followups', next)
    setShowFollowup(false)
    notify('Follow-up created')
  }

  function titleFromView(currentView: string) {
    if (currentView === 'dashboard') return 'Good morning, Alex'
    if (currentView === 'requests' || currentView === 'request-detail') return 'Trip requests'
    if (currentView === 'trips' || currentView === 'trip-detail') return 'Trips'
    if (currentView === 'fuels') return 'Fuel transactions'
    if (currentView === 'followups') return 'Followups'
    if (currentView === 'driver-requests') return 'Driver requests'
    return 'Overview'
  }

  const pageTitle = titleFromView(view)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Dev Roadways</span>
        </div>
        <div className="workspace">Operations workspace <span>⌄</span></div>
        <nav>
          {role !== 'Driver' && (
            <>
              <NavItem active={view === 'dashboard'} label="Overview" onClick={() => setView('dashboard')} icon="⌂" />
              <NavItem active={view === 'requests'} label="Trip requests" count={pending.length} onClick={() => setView('requests')} icon="▣" />
              <NavItem active={view === 'fuels'} label="Fuel transactions" count={fuelTransactions.filter((item) => item.status === 'Waiting').length} onClick={() => setView('fuels')} icon="▣" />
            </>
          )}
          <NavItem active={view === 'trips'} label="Trips" onClick={() => setView('trips')} icon="↗" />
          {role === 'Operations' && (
            <NavItem active={view === 'followups'} label="Followups" onClick={() => { setFollowupContextTripId(null); setView('followups') }} icon="⏱" />
          )}
          {role !== 'Driver' && (
            <NavItem
              active={view === 'driver-requests'}
              label="Driver requests"
              count={driverExtraRequests.filter((item) => item.status === 'Submitted').length}
              onClick={() => setView('driver-requests')}
              icon="✉"
            />
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help">?<span>Help centre</span></div>
          <div className="profile">
            <span className="avatar">AC</span>
            <span>
              <b>Alex Cooper</b>
              <small>{role}</small>
            </span>
            <span className="more">•••</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}>
            ☰
          </button>
          <div className="crumb">
            Operations <span>/</span> {view === 'dashboard' ? 'Overview' : pageTitle}
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">♧</button>
            <div className="role-switch">
              <span>Viewing as</span>
              <select
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as Role
                  setRole(nextRole)
                  setView(nextRole === 'Driver' ? 'trips' : 'dashboard')
                }}
                aria-label="Select role"
              >
                <option>Coordinator</option>
                <option>Operations</option>
                <option>Driver</option>
              </select>
            </div>
          </div>
        </header>

        <div className="content">
          {!dbReady && !dbError && <div className="panel db-state">Loading mock database…</div>}
          {dbError && <div className="panel db-state error">{dbError}</div>}

          {dbReady && (
            <>
              <div className="page-heading">
                <div>
                  <h1>{pageTitle}</h1>
                  {view === 'dashboard' && <p className="subheading">Keep every journey moving, from request to arrival.</p>}
                </div>
                {role === 'Coordinator' && view === 'dashboard' && (
                  <div className="heading-actions">
                    <button className="button secondary" onClick={() => setShowImport(true)}>
                      ↥ <span>Import Excel</span>
                    </button>
                    <button className="button primary" onClick={() => setShowCreate(true)}>
                      ＋ <span>New request</span>
                    </button>
                  </div>
                )}
              </div>

              {view === 'dashboard' && role !== 'Driver' && (
                <Dashboard
                  pending={pending}
                  accepted={accepted}
                  requests={requests}
                  trips={trips}
                  onOpen={(request) => {
                    setSelected(request)
                    setView('request-detail')
                  }}
                  onOpenTrip={(trip) => {
                    setSelected(trip)
                    setView('trip-detail')
                  }}
                  onViewAll={() => setView('trips')}
                  onViewAllRequests={() => setView('requests')}
                />
              )}

              {view === 'requests' && role !== 'Driver' && (
                <RequestList
                  requests={visibleRequests}
                  onOpen={(request) => {
                    setSelected(request)
                    setView('request-detail')
                  }}
                  onCreate={() => setShowCreate(true)}
                  onImport={() => setShowImport(true)}
                />
              )}

              {view === 'request-detail' && selected && (
                <RequestDetail
                  request={selected as Request}
                  role={role}
                  onBack={() => setView('requests')}
                  onAccept={acceptRequest}
                  onReject={rejectRequest}
                  onReminder={() => sendReminder(selected as Request)}
                  onEdit={() => {
                    if (role !== 'Driver') setEditTarget(selected as Request)
                  }}
                />
              )}

              {view === 'fuels' && (
                <FuelTransactionsPage
                  transactions={fuelTransactions}
                  onSendToPump={(transaction) => {
                    const next = fuelTransactions.map((item) =>
                      item.id === transaction.id ? { ...item, status: 'Sent' } : item
                    )
                    setFuelTransactions(next)
                    notify(`${transaction.tripId} sent to pump`)
                  }}
                />
              )}

              {view === 'trips' && (
                <TripList
                  trips={visibleTrips}
                  onOpen={(trip) => {
                    setSelected(trip)
                    setView('trip-detail')
                  }}
                />
              )}

              {view === 'trip-detail' && selected && (
                <TripDetail
                  trip={selected as Trip}
                  role={role}
                  onBack={() => setView('trips')}
                  onExtra={() => setShowExtra(true)}
                  onDocument={() => setShowDocument(true)}
                  onFollowup={(trip) => {
                    setFollowupContextTripId(trip.id)
                    setView('followups')
                  }}
                  onEdit={() => {
                    if (role !== 'Driver') setEditTarget(selected as Trip)
                  }}
                />
              )}

              {view === 'followups' && (
                <FollowupsPage
                  trips={trips}
                  followups={sortedFollowups}
                  selectedTripId={followupContextTripId}
                  onCreate={() => setShowFollowup(true)}
                  onOpenTrip={(trip) => {
                    setSelected(trip)
                    setView('trip-detail')
                  }}
                  onCall={(followup) => {
                    const number = trips.find((trip) => trip.id === followup.tripId)?.driverNumber || followup.driverNumber
                    if (number) window.location.href = `tel:${number.replace(/[^\d+]/g, '')}`
                  }}
                  onClearFilter={() => setFollowupContextTripId(null)}
                />
              )}

              {view === 'driver-requests' && (
                <DriverRequestTable
                  rows={driverExtraRequests}
                  selected={selectedDriverRequests}
                  onToggle={(id) => {
                    setSelectedDriverRequests((current) =>
                      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
                    )
                  }}
                  onSendForApproval={() => {
                    if (!selectedDriverRequests.length) {
                      notify('Select at least one request before sending for approval')
                      return
                    }

                    const nextTrips = trips.map((trip) => ({
                      ...trip,
                      extras: trip.extras.map((extra) =>
                        selectedDriverRequests.includes(extra.id)
                          ? { ...extra, status: 'Pending approval' as const }
                          : extra
                      )
                    }))

                    setTrips(nextTrips)
                    setSelectedDriverRequests([])
                    void persist('trips', nextTrips)
                    notify(`${selectedDriverRequests.length} driver requests sent for approval`)
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {mobileNavOpen && (
        <div className="mobile-nav-layer" role="presentation" onClick={() => setMobileNavOpen(false)}>
          <aside className="mobile-drawer" role="dialog" aria-label="Mobile navigation" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand">
                <span className="brand-mark">D</span>
                <span>Dev Roadways</span>
              </div>
              <button className="drawer-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}>
                ×
              </button>
            </div>
            <div className="workspace">Operations workspace <span>⌄</span></div>
            <nav>
              {role !== 'Driver' && (
                <>
                  <NavItem active={view === 'dashboard'} label="Overview" onClick={() => { setView('dashboard'); setMobileNavOpen(false) }} icon="⌂" />
                  <NavItem active={view === 'requests'} label="Trip requests" count={pending.length} onClick={() => { setView('requests'); setMobileNavOpen(false) }} icon="▣" />
                  <NavItem active={view === 'fuels'} label="Fuel transactions" count={fuelTransactions.filter((item) => item.status === 'Waiting').length} onClick={() => { setView('fuels'); setMobileNavOpen(false) }} icon="▣" />
                </>
              )}
              <NavItem active={view === 'trips'} label="Trips" onClick={() => { setView('trips'); setMobileNavOpen(false) }} icon="↗" />
              {role === 'Operations' && (
                <NavItem active={view === 'followups'} label="Followups" onClick={() => { setFollowupContextTripId(null); setView('followups'); setMobileNavOpen(false) }} icon="⏱" />
              )}
              {role !== 'Driver' && (
                <NavItem active={view === 'driver-requests'} label="Driver requests" count={driverExtraRequests.filter((item) => item.status === 'Submitted').length} onClick={() => { setView('driver-requests'); setMobileNavOpen(false) }} icon="✉" />
              )}
            </nav>
            <div className="mobile-drawer-footer">
              <div className="help">?<span>Help centre</span></div>
              <div className="profile">
                <span className="avatar">AC</span>
                <span>
                  <b>Alex Cooper</b>
                  <small>{role}</small>
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="toast">✓ {toast}</div>}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={addRequest} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); notify('Excel preview validated — 2 requests ready') }} />}
      {showExtra && <ExtraModal onClose={() => setShowExtra(false)} onCreate={addExtra} />}
      {showDocument && <DocumentModal onClose={() => setShowDocument(false)} onCreate={addDocument} />}
      {showFollowup && (
        <FollowupModal
          trips={trips}
          defaultTripId={followupContextTripId || undefined}
          onClose={() => setShowFollowup(false)}
          onCreate={createFollowup}
        />
      )}
      {editTarget && <EditModal entity={editTarget} onClose={() => setEditTarget(null)} onSave={updateEntity} />}
    </div>
  )
}

function NavItem({ label, icon, count, active, onClick }: { label: string; icon: string; count?: number; active?: boolean; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{icon}</span>
      {label}
      {count ? <em>{count}</em> : null}
    </button>
  )
}

function Status({ children }: { children: string }) {
  return <span className={`status ${children.toLowerCase().replace(' ', '-')}`}>{children}</span>
}

function Dashboard({ pending, accepted, requests, trips, onOpen, onOpenTrip, onViewAll, onViewAllRequests }: {
  pending: Request[]
  accepted: Request[]
  requests: Request[]
  trips: Trip[]
  onOpen: (request: Request) => void
  onOpenTrip: (trip: Trip) => void
  onViewAll: () => void
  onViewAllRequests: () => void
}) {
  const recentTrips = [...trips].sort((a, b) => b.date.localeCompare(a.date))
  const recentRequests = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2)

  return (
    <>
      <section className="stats">
        <Stat label="Pending requests" value={pending.length} tone="blue" hint="Needs review" />
        <Stat label="Trips this week" value={accepted.length + 2} tone="green" hint="Across all drivers" />
        <Stat label="Active trips" value={trips.filter((trip) => trip.tripStatus === 'In progress').length} tone="purple" hint="Currently moving" />
      </section>

      <section className="section-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Trip requests</h2>
              <p>Requests awaiting review or action.</p>
            </div>
            <button className="text-button" onClick={onViewAllRequests}>View all →</button>
          </div>
          <div className="request-stack">
            {recentRequests.map((request) => (
              <RequestCard key={request.id} request={request} onClick={() => onOpen(request)} />
            ))}
          </div>
          {!recentRequests.length && <Empty label="No trip requests yet" />}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Trips</h2>
              <p>Recently created and scheduled journeys.</p>
            </div>
            <button className="text-button" onClick={onViewAll}>View all →</button>
          </div>
          <div className="request-stack">
            {recentTrips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onClick={() => onOpenTrip(trip)} />
            ))}
          </div>
          {!recentTrips.length && <Empty label="No trips yet" />}
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, hint, tone }: { label: string; value: string | number; hint: string; tone: string }) {
  return (
    <div className="stat">
      <span className={`stat-icon ${tone}`}>{tone === 'blue' ? '◷' : tone === 'green' ? '↗' : '▣'}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  )
}

function TripRow({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const dateParts = trip.date.split(' ')
  return (
    <button className="trip-card" onClick={onClick}>
      <span className="trip-date">
        <b>{dateParts[0]}</b>
        <small>{dateParts[1]}</small>
      </span>
      <span className="request-main">
        <b>{trip.reference} · {trip.customer}</b>
        <small>{trip.origin} <i>→</i> {trip.destination}</small>
      </span>
      <Status>{trip.tripStatus}</Status>
      <span className="chevron">›</span>
    </button>
  )
}

function RequestCard({ request, onClick }: { request: Request; onClick: () => void }) {
  return (
    <button className="request-card" onClick={onClick}>
      <span className="request-icon">↗</span>
      <span className="request-main">
        <b>{request.reference} · {request.customer}</b>
        <small>{request.origin} <i>→</i> {request.destination}</small>
        <small>{request.date} · {request.time} · {request.passengers} bags</small>
      </span>
      <Status>{request.status}</Status>
      <span className="chevron">›</span>
    </button>
  )
}

function RequestList({ requests, onOpen, onCreate, onImport }: { requests: Request[]; onOpen: (request: Request) => void; onCreate: () => void; onImport: () => void }) {
  const [filter, setFilter] = useState<'All' | RequestStatus>('All')
  const [query, setQuery] = useState('')

  const filtered = requests.filter(
    (request) =>
      (filter === 'All' || request.status === filter) &&
      `${request.reference} ${request.customer} ${request.origin} ${request.destination}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>All requests</h2>
        </div>
        <div className="panel-header-actions">
          <button className="icon-create" aria-label="Import Excel" title="Import Excel" onClick={onImport}>↥</button>
          <button className="icon-create" aria-label="New request" title="New request" onClick={onCreate}>＋</button>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          ⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference or customer" />
        </div>
        <div className="filter-group">
          {(['All', 'Pending', 'Accepted', 'Rejected'] as const).map((option) => (
            <button key={option} className={filter === option ? 'filter active' : 'filter'} onClick={() => setFilter(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      {filtered.map((request) => (
        <div key={request.id}>
          <RequestCard request={request} onClick={() => onOpen(request)} />
        </div>
      ))}
    </section>
  )
}

function RequestDetail({ request, role, onBack, onAccept, onReject, onReminder, onEdit }: { request: Request; role: Role; onBack: () => void; onAccept: (request: Request) => void; onReject: (request: Request) => void; onReminder: () => void; onEdit: () => void }) {
  return (
    <section className="detail">
      <button className="back" onClick={onBack}>← Back to requests</button>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Trip request</p>
          <h1>{request.reference}</h1>
          <p className="subheading">{request.customer} · Created {request.createdAt}</p>
        </div>
        <div className="detail-heading-right">
          <button className="quick-action-icon" aria-label="Edit request" title="Edit request" onClick={onEdit}>✎</button>
          <Status>{request.status}</Status>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2>Journey details</h2>
          <div className="journey journey-times">
            <div>
              <small>Pickup</small>
              <b>{request.origin}</b>
              <span>
                <em>Requested</em>
                <b>{request.date}</b>
                <b>{to12Hour(request.time)}</b>
              </span>
            </div>
            <i>→</i>
            <div>
              <small>Drop-off</small>
              <b>{request.destination}</b>
              <span>
                <em>Requested delivery</em>
                <b>{request.requestedDeliveryDate || request.date}</b>
                <b>{to12Hour(request.requestedDeliveryTime || request.time)}</b>
              </span>
            </div>
          </div>

          <div className="info-grid">
            <Info label="Customer" value={request.customer} />
            <Info label="Requested delivery" value={`${request.requestedDeliveryDate || request.date} · ${to12Hour(request.requestedDeliveryTime || request.time)}`} />
            <Info label="Material" value={request.cargoMaterial || 'Cement'} />
            <Info label="Cement company" value={request.cargoCompany || request.customer} />
            <Info label="Cargo weight" value={request.cargoWeight || '—'} />
            <Info label="Cargo type" value={request.cargoType || 'Bagged'} />
            <Info label="No. of bags" value={request.noOfBags || `${request.passengers} bags`} />
            <Info label="Reference" value={request.reference} />
          </div>
        </div>

        <div className="panel action-panel">
          <h2>Actions</h2>
          <p>Review trip request before dispatch.</p>
          <div className="action-stack">
            {request.status === 'Pending' && (role === 'Coordinator' || role === 'Operations') && (
              <>
                <button className="button primary" onClick={() => onAccept(request)}>Accept request</button>
                <button className="button danger" onClick={() => onReject(request)}>Reject request</button>
              </>
            )}
            {request.status !== 'Pending' && <button className="button secondary" onClick={onReminder}>Send reminder</button>}
          </div>
        </div>
      </div>
    </section>
  )
}

function TripList({ trips, onOpen }: { trips: Trip[]; onOpen: (trip: Trip) => void }) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{trips.length} trips</h2>
        </div>
      </div>

      {trips.map((trip) => (
        <div key={trip.id}>
          <TripRow trip={trip} onClick={() => onOpen(trip)} />
        </div>
      ))}
      {!trips.length && <Empty label="No trips assigned to you" />}
    </section>
  )
}

function TripDetail({ trip, role, onBack, onExtra, onDocument, onFollowup, onEdit }: { trip: Trip; role: Role; onBack: () => void; onExtra: () => void; onDocument: () => void; onFollowup: (trip: Trip) => void; onEdit: () => void }) {
  return (
    <section className="detail">
      <button className="back" onClick={onBack}>← Back to trips</button>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Trip details</p>
          <h1>{trip.reference}</h1>
          <p className="subheading">{trip.customer} · Created {trip.createdAt}</p>
        </div>
        <div className="detail-heading-right">
          {(role === 'Coordinator' || role === 'Operations') && (
            <>
              <button className="quick-action-icon" aria-label="Create follow-up" title="Create follow-up" onClick={() => onFollowup(trip)}>⏱</button>
              <button className="quick-action-icon" aria-label="Edit trip" title="Edit trip" onClick={onEdit}>✎</button>
            </>
          )}
          {role === 'Driver' && (
            <div className="detail-quick-actions">
              <button className="quick-action-icon" aria-label="Upload document" title="Upload document" onClick={onDocument}>↥</button>
              <button className="quick-action-icon" aria-label="Submit extra request" title="Submit extra request" onClick={onExtra}>＋</button>
            </div>
          )}
          <Status>{trip.tripStatus}</Status>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <h2>Journey</h2>
          <div className="journey journey-times">
            <div>
              <small>Pickup</small>
              <b>{trip.origin}</b>
              <span>
                <em>Scheduled</em>
                <b>{trip.pickupDate}</b>
                <b>{to12Hour(trip.pickupTime)}</b>
              </span>
              <span>
                <em>Actual</em>
                <b>{trip.pickupDate}</b>
                <b>{to12Hour(trip.pickupTime)}</b>
              </span>
            </div>
            <i>→</i>
            <div>
              <small>Drop-off</small>
              <b>{trip.destination}</b>
              <span>
                <em>Requested</em>
                <b>{trip.date}</b>
                <b>{to12Hour(trip.time)}</b>
              </span>
              <span>
                <em>Estimated</em>
                <b>{trip.estimatedDropDate}</b>
                <b>{to12Hour(trip.estimatedDropTime)}</b>
              </span>
              <span>
                <em>Actual</em>
                {trip.actualDropDate ? <><b>{trip.actualDropDate}</b><b>{to12Hour(trip.actualDropTime || '')}</b></> : <b>Awaiting delivery</b>}
              </span>
            </div>
          </div>

          <InfoSection title="Cargo details">
            <Info label="Material" value={trip.cargo.material} />
            <Info label="Cement company" value={trip.cargo.company} />
            <Info label="Cargo weight" value={trip.cargo.quantity} />
            <Info label="Load type" value={trip.cargo.loadType} />
          </InfoSection>

          <InfoSection title="Trip costs">
            <Info label="Fuel assigned" value={trip.fuel.assigned} />
            <Info label="Fuel received" value={trip.fuel.received} />
            <Info label="Fuel station" value={trip.fuel.station} />
            <Info label="Advance cash" value={trip.cash.advance} />
          </InfoSection>
        </div>

        <div className="panel action-panel">
          <h2>Driver & documents</h2>
          <DriverDetails trip={trip} />

          <div className="documents-box">
            <h3>Trip documents</h3>
            {trip.documents.length ? (
              trip.documents.map((document) => (
                <div key={document.id} className="document-item">
                  <span>{document.type}</span>
                  <strong>{document.name}</strong>
                  <small>{document.uploadedAt}</small>
                </div>
              ))
            ) : (
              <p className="empty-note">No trip documents uploaded yet.</p>
            )}
          </div>

          <div className="documents-box">
            <h3>Extra requests</h3>
            {trip.extras.length ? (
              trip.extras.map((extra) => (
                <div key={extra.id} className="document-item">
                  <span>{extra.type}</span>
                  <strong>{extra.amount}</strong>
                  <small>{extra.note}</small>
                </div>
              ))
            ) : (
              <p className="empty-note">No extra requests provided.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DriverDetails({ trip }: { trip: Trip }) {
  return (
    <section className="panel driver-details-panel">
      <InfoSection title="Driver details">
        <Info label="Driver name" value={trip.driver || 'Unassigned'} />
        <Info label="Phone number" value={trip.driverNumber || 'Not available'} />
      </InfoSection>
    </section>
  )
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h2 className="activity-title section-title">{title}</h2>
      <div className="info-grid compact-grid">{children}</div>
    </>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="empty">{label}</div>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function EditModal({ entity, onClose, onSave }: { entity: Request | Trip; onClose: () => void; onSave: (data: Partial<Request>) => void }) {
  const [reference, setReference] = useState(entity.reference)
  const [customer, setCustomer] = useState(entity.customer)
  const [origin, setOrigin] = useState(entity.origin)
  const [destination, setDestination] = useState(entity.destination)
  const [date, setDate] = useState(entity.date)
  const [time, setTime] = useState(entity.time)
  const [deliveryDate, setDeliveryDate] = useState(entity.requestedDeliveryDate || entity.date)
  const [deliveryTime, setDeliveryTime] = useState(entity.requestedDeliveryTime || entity.time)
  const [cargoMaterial, setCargoMaterial] = useState(entity.cargoMaterial || 'Cement')
  const [cargoCompany, setCargoCompany] = useState(entity.cargoCompany || entity.customer)
  const [cargoWeight, setCargoWeight] = useState(entity.cargoWeight || '')
  const [cargoType, setCargoType] = useState<Request['cargoType']>(entity.cargoType || 'Bagged')
  const [noOfBags, setNoOfBags] = useState(entity.noOfBags || '')

  return (
    <Modal title={`Edit ${'tripStatus' in entity ? 'trip' : 'request'}`} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSave({
            reference,
            customer,
            origin,
            destination,
            date,
            time,
            requestedDeliveryDate: deliveryDate,
            requestedDeliveryTime: deliveryTime,
            cargoMaterial,
            cargoCompany,
            cargoWeight,
            cargoType,
            noOfBags,
            passengers: Number(noOfBags) || entity.passengers
          })
        }}
      >
        <label>
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} />
        </label>
        <label>
          Customer
          <input value={customer} onChange={(event) => setCustomer(event.target.value)} />
        </label>
        <div className="form-row">
          <label>
            Pickup
            <input value={origin} onChange={(event) => setOrigin(event.target.value)} />
          </label>
          <label>
            Drop-off
            <input value={destination} onChange={(event) => setDestination(event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            Time
            <input value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Delivery date
            <input value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
          </label>
          <label>
            Delivery time
            <input value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Material
            <input value={cargoMaterial} onChange={(event) => setCargoMaterial(event.target.value)} />
          </label>
          <label>
            Company
            <input value={cargoCompany} onChange={(event) => setCargoCompany(event.target.value)} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Cargo weight
            <input value={cargoWeight} onChange={(event) => setCargoWeight(event.target.value)} />
          </label>
          <label>
            Cargo type
            <select value={cargoType} onChange={(event) => setCargoType(event.target.value as Request['cargoType'])}>
              <option value="Bagged">Bagged</option>
              <option value="Loose">Loose</option>
            </select>
          </label>
        </div>
        <label>
          Bags
          <input value={noOfBags} onChange={(event) => setNoOfBags(event.target.value)} />
        </label>
        <button className="button primary wide" type="submit">Save changes</button>
      </form>
    </Modal>
  )
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (request: Request) => void }) {
  const [reference, setReference] = useState('')
  const [customer, setCustomer] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [cargoMaterial, setCargoMaterial] = useState('Cement')
  const [cargoCompany, setCargoCompany] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [cargoType, setCargoType] = useState<Request['cargoType']>('Bagged')
  const [noOfBags, setNoOfBags] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    onCreate({
      id: `req-${Date.now()}`,
      reference: reference || `DR-${1050 + Math.floor(Math.random() * 20)}`,
      customer: customer || 'New customer',
      origin: origin || 'Wadgaon, Pune',
      destination: destination || 'Nashik MIDC',
      date: date || '20 Aug 2026',
      time: time || '09:00',
      requestedDeliveryDate: deliveryDate || date || '20 Aug 2026',
      requestedDeliveryTime: deliveryTime || time || '09:00',
      cargoMaterial,
      cargoCompany: cargoCompany || customer || 'New customer',
      cargoWeight,
      cargoType,
      noOfBags: noOfBags || '1 bag',
      createdAt: '16 Aug 2026 · 12:00 PM',
      passengers: Number(noOfBags) || 1,
      status: 'Pending'
    })
  }

  return (
    <Modal title="Create trip request" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="DR-1049" />
        </label>
        <label>
          Customer
          <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Company or person" />
        </label>
        <div className="form-row">
          <label>
            Pickup
            <input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="City or address" />
          </label>
          <label>
            Drop-off
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} placeholder="20 Aug 2026" />
          </label>
          <label>
            Time
            <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="09:00" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Delivery date
            <input value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} placeholder="20 Aug 2026" />
          </label>
          <label>
            Delivery time
            <input value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} placeholder="15:00" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Material
            <input value={cargoMaterial} onChange={(event) => setCargoMaterial(event.target.value)} placeholder="Cement" />
          </label>
          <label>
            Company
            <input value={cargoCompany} onChange={(event) => setCargoCompany(event.target.value)} placeholder="Supplier" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Cargo weight
            <input value={cargoWeight} onChange={(event) => setCargoWeight(event.target.value)} placeholder="28 tonnes" />
          </label>
          <label>
            Type
            <select value={cargoType} onChange={(event) => setCargoType(event.target.value as Request['cargoType'])}>
              <option value="Bagged">Bagged</option>
              <option value="Loose">Loose</option>
            </select>
          </label>
        </div>
        <label>
          Number of bags
          <input value={noOfBags} onChange={(event) => setNoOfBags(event.target.value)} placeholder="560" />
        </label>
        <button className="button primary wide" type="submit">Create request</button>
      </form>
    </Modal>
  )
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  return (
    <Modal title="Import requests" onClose={onClose}>
      <div className="upload">
        <span>↥</span>
        <b>Drop your Excel file here</b>
        <p>or choose a .xlsx file from your device</p>
        <button className="button secondary">Choose file</button>
      </div>
      <div className="import-preview">
        <b>Preview ready</b>
        <span>2 valid requests · 0 errors</span>
      </div>
      <button className="button primary wide" onClick={onDone}>Validate and import</button>
    </Modal>
  )
}

function ExtraModal({ onClose, onCreate }: { onClose: () => void; onCreate: (extra: Extra) => void }) {
  const [type, setType] = useState<ExtraType>('Fuel')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  return (
    <Modal title="Submit extra request" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onCreate({
            id: `ex-${Date.now()}`,
            type,
            amount: amount.trim() ? `₹${amount.trim()}` : '₹0',
            note: note.trim() || 'Submitted by driver for review',
            status: 'Submitted'
          })
        }}
      >
        <label>
          Request type
          <select value={type} onChange={(event) => setType(event.target.value as ExtraType)}>
            <option>Fuel</option>
            <option>Cash</option>
            <option>AdBlue</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Amount
          <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="5000" />
        </label>
        <label>
          Note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a short note" rows={3} />
        </label>
        <button className="button primary wide" type="submit">Submit request</button>
      </form>
    </Modal>
  )
}

function DocumentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (document: TripDocument) => void }) {
  const [type, setType] = useState<TripDocument['type']>('LR')
  const [name, setName] = useState('')

  return (
    <Modal title="Upload trip document" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onCreate({
            id: `doc-${Date.now()}`,
            name: name || `Trip-document-${type}.pdf`,
            type,
            uploadedAt: 'Just now'
          })
        }}
      >
        <div className="upload">
          <span>↥</span>
          <b>Select a document</b>
          <p>PDF, JPG, or PNG up to 10 MB</p>
          <input type="file" onChange={(event) => setName(event.target.files?.[0]?.name || '')} />
        </div>
        <label>
          Document type
          <select value={type} onChange={(event) => setType(event.target.value as TripDocument['type'])}>
            <option>LR</option>
            <option>WB</option>
            <option>Invoice</option>
            <option>Other</option>
          </select>
        </label>
        <button className="button primary wide" type="submit">Upload document</button>
      </form>
    </Modal>
  )
}

function FuelTransactionsPage({ transactions, onSendToPump }: {
  transactions: FuelTransaction[]
  onSendToPump: (transaction: FuelTransaction) => void
}) {
  const [filter, setFilter] = useState<'All' | FuelStatus>('All')
  const [query, setQuery] = useState('')

  const filtered = transactions.filter(
    (transaction) =>
      (filter === 'All' || transaction.status === filter) &&
      `${transaction.tripId} ${transaction.tripName} ${transaction.customer} ${transaction.pumpName}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Fuel transactions</h2>
          <p>Track every fuel payout, pump update, and delivery status.</p>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          ⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trip or pump" />
        </div>
        <div className="filter-group">
          {(['All', 'Waiting', 'Sent'] as const).map((option) => (
            <button key={option} className={filter === option ? 'filter active' : 'filter'} onClick={() => setFilter(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="request-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Name</th>
              <th>Fuel amount</th>
              <th>Pump name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.tripId}</strong>
                    <small>{transaction.customer}</small>
                  </td>
                  <td>{transaction.tripName}</td>
                  <td>{transaction.fuelAmount}</td>
                  <td>{transaction.pumpName}</td>
                  <td><Status>{transaction.status}</Status></td>
                  <td>
                    <button className="button primary compact" onClick={() => onSendToPump(transaction)}>
                      {transaction.status === 'Sent' ? 'Resend' : 'Send to pump'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <Empty label="No fuel transactions match the selected filter" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function FollowupsPage({ trips, followups, selectedTripId, onCreate, onOpenTrip, onCall, onClearFilter }: {
  trips: Trip[]
  followups: Followup[]
  selectedTripId: string | null
  onCreate: () => void
  onOpenTrip: (trip: Trip) => void
  onCall: (followup: Followup) => void
  onClearFilter: () => void
}) {
  const tripName = selectedTripId ? trips.find((trip) => trip.id === selectedTripId)?.reference : null

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{tripName ? `Follow-ups for ${tripName}` : 'Upcoming follow-ups'}</h2>
          <p>{tripName ? 'Only this trip is currently in view.' : 'All upcoming follow-ups sorted by date and time.'}</p>
        </div>
        <div className="panel-header-actions">
          {selectedTripId && <button className="button secondary compact" onClick={onClearFilter}>Clear filter</button>}
          <button className="button primary compact" onClick={onCreate}>＋ New follow-up</button>
        </div>
      </div>

      <div className="followup-list">
        {followups.length ? (
          followups.map((followup) => {
            const trip = trips.find((item) => item.id === followup.tripId)
            return (
              <div key={followup.id} className="followup-item">
                <div className="followup-main">
                  <span className="followup-badge">{followup.status}</span>
                  <strong>{trip?.reference || 'Trip not found'}</strong>
                  <small>{trip?.customer || 'Customer unavailable'} · {trip?.origin || 'Origin'} → {trip?.destination || 'Destination'}</small>
                  <p>{followup.note}</p>
                </div>
                <div className="followup-meta">
                  <span>{followup.date}</span>
                  <span>{followup.time}</span>
                  <span>{followup.driverName}</span>
                </div>
                <div className="followup-actions">
                  <button className="quick-action-icon" aria-label="Call driver" title="Call driver" onClick={() => onCall(followup)}>☎</button>
                  {trip && <button className="button secondary compact" onClick={() => onOpenTrip(trip)}>Trip</button>}
                </div>
              </div>
            )
          })
        ) : (
          <Empty label={selectedTripId ? 'No follow-ups for this trip yet' : 'No upcoming follow-ups'} />
        )}
      </div>
    </section>
  )
}

function FollowupModal({ trips, defaultTripId, onClose, onCreate }: {
  trips: Trip[]
  defaultTripId?: string
  onClose: () => void
  onCreate: (data: Omit<Followup, 'id' | 'createdAt'>) => void
}) {
  const [tripId, setTripId] = useState(defaultTripId || trips[0]?.id || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const chosenTrip = trips.find((trip) => trip.id === tripId)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (!tripId || !date || !time || !note.trim()) return

    onCreate({
      tripId,
      driverName: chosenTrip?.driver || 'Unassigned driver',
      driverNumber: chosenTrip?.driverNumber || 'Not available',
      date,
      time,
      note: note.trim(),
      status: 'Upcoming'
    })
  }

  return (
    <Modal title="Create follow-up" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Trip
          <select value={tripId} onChange={(event) => setTripId(event.target.value)} disabled={Boolean(defaultTripId)}>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.reference} · {trip.customer}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Date
            <input value={date} onChange={(event) => setDate(event.target.value)} placeholder="18 Aug 2026" />
          </label>
          <label>
            Time
            <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="09:30" />
          </label>
        </div>
        <label>
          Note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Driver follow-up note" />
        </label>
        <button className="button primary wide" type="submit">Create follow-up</button>
      </form>
    </Modal>
  )
}

function DriverRequestTable({ rows, selected, onToggle, onSendForApproval }: {
  rows: Array<Extra & { tripId: string; tripReference: string; customer: string; driver: string }>
  selected: string[]
  onToggle: (id: string) => void
  onSendForApproval: () => void
}) {
  const [filter, setFilter] = useState<'All' | ExtraType>('All')
  const filteredRows = filter === 'All' ? rows : rows.filter((row) => row.type === filter)

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Driver extra requests</h2>
          <p>Review all driver-submitted requests and send for approval.</p>
        </div>
        <button className="button primary compact" onClick={onSendForApproval} disabled={!selected.length}>
          Send for approval
        </button>
      </div>

      <div className="filters">
        <div className="filter-group">
          {(['All', 'Fuel', 'Cash', 'AdBlue', 'Other'] as const).map((option) => (
            <button key={option} className={filter === option ? 'filter active' : 'filter'} onClick={() => setFilter(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="request-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Trip</th>
              <th>Driver</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(row.id)} onChange={() => onToggle(row.id)} />
                  </td>
                  <td>
                    <strong>{row.tripReference}</strong>
                    <small>{row.customer}</small>
                  </td>
                  <td>
                    <strong>{row.driver}</strong>
                  </td>
                  <td>{row.type}</td>
                  <td>{row.amount}</td>
                  <td>{row.note}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <Empty label="No driver requests match the current filter" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function to12Hour(time: string) {
  if (!time) return '—'
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  )
}
