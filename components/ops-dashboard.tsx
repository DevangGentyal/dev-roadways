'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  House,
  Truck,
  ChartPie,
  GasPump,
  List,
  CaretDown,
  Bell,
  UploadSimple,
  Plus,
  PencilSimple,
  DownloadSimple,
  ArrowLeft,
  MagnifyingGlass,
  CaretRight,
  ArrowRight,
  X,
  QuestionMark,
  DotsThree,
  Check,
  WarningCircle,
  CurrencyInr,
  Drop,
  FileText,
  Clock,
} from '@phosphor-icons/react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'Coordinator' | 'Operations' | 'Driver' | 'Super Admin'

type TripStatus =
  | 'NEW'
  | 'APPROVED'
  | 'OP_REJECTED'
  | 'ACCEPTED'
  | 'DV_REJECTED'
  | 'DOCUMENT_UPLOADED'
  | 'TRIP_STARTED'
  | 'TRIP_ON_HOLD'
  | 'REACHED'
  | 'TRIP_COMPLETED'

type Trip = {
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
  status: TripStatus
  driver?: string
  driverNumber?: string
  pickupDate?: string
  pickupTime?: string
  estimatedDropDate?: string
  estimatedDropTime?: string
  actualDropDate?: string
  actualDropTime?: string
  cargo?: Cargo
  truck?: TruckInfo
  fuel?: FuelDetails
  cash?: CashDetails
  documents: TripDocument[]
  extras: Extra[]
}

type Extra = { id: string; type: 'Fuel' | 'Cash' | 'AdBlue'; amount: string; note: string; status: 'Submitted' | 'Approved' }
type Cargo = { material: string; company: string; quantity: string; noOfBags?: string; loadType: 'Bagged' | 'Loose' }
type TruckInfo = { number: string; type: 'Body' | 'Open'; configuration: '10 tyre' | '12 tyre' | '14 tyre' | '16 tyre'; brand: string }
type FuelDetails = { assigned: string; received: string; station: string; fulfilledAt: string }
type CashDetails = { advance: string; paymentMode: 'Cash' | 'UPI' }
type TripDocument = { id: string; name: string; type: 'LR' | 'WB' | 'Invoice' | 'Other'; uploadedAt: string }
type Followup = { id: string; tripId: string; tripRef: string; driver: string; driverPhone: string; note: string; dueDate: string; dueTime: string; createdAt: string; status: 'Open' | 'Done' }
type FuelTransaction = { id: string; tripId: string; tripRef: string; driver: string; station: string; amount: string; litres: string; status: 'Pending' | 'Sent' | 'Resent' }
type Driver = { id: string; name: string; phone_number: number; truck_id: string; status: 'available' | 'unavailable'; source_location: string; documents: unknown[] }
type Vehicle = { truck_id: string; brand: string; model_name: string; BS6: 'yes' | 'no'; tires_count: number; mileage_kmpl: number; load_capacity: string; type: 'Body' | 'Bulker' | 'Open' }

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  NEW: 'New',
  APPROVED: 'Approved',
  OP_REJECTED: 'Rejected (Ops)',
  ACCEPTED: 'Accepted',
  DV_REJECTED: 'Rejected (Driver)',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  TRIP_STARTED: 'Trip Started',
  TRIP_ON_HOLD: 'Trip On Hold',
  REACHED: 'Reached',
  TRIP_COMPLETED: 'Trip Completed',
}

const STATUS_COLORS: Record<TripStatus, { bg: string; color: string }> = {
  NEW: { bg: '#fef3c7', color: '#d97706' },
  APPROVED: { bg: '#dbeafe', color: '#1d4ed8' },
  OP_REJECTED: { bg: '#fee2e2', color: '#dc2626' },
  ACCEPTED: { bg: '#dbeafe', color: '#1d4ed8' },
  DV_REJECTED: { bg: '#fee2e2', color: '#dc2626' },
  DOCUMENT_UPLOADED: { bg: '#e0f2fe', color: '#0369a1' },
  TRIP_STARTED: { bg: '#ede9fe', color: '#5b21b6' },
  TRIP_ON_HOLD: { bg: '#fef3c7', color: '#b45309' },
  REACHED: { bg: '#dcfce7', color: '#166534' },
  TRIP_COMPLETED: { bg: '#dcfce7', color: '#15803d' },
}

function getStatusLabel(s: string): string {
  return STATUS_LABELS[s as TripStatus] ?? s
}

function getStatusColors(s: string): { bg: string; color: string } {
  return STATUS_COLORS[s as TripStatus] ?? { bg: '#f1f5f9', color: '#475569' }
}

// ─── Seed data (fallback) ──────────────────────────────────────────────────────

const seedTrips: Trip[] = [
  {
    id: 'req-1', reference: 'DR-101', customer: 'Ultratech Cement', origin: 'Solapur MIDC', destination: 'Koregaon Village',
    date: '18 Aug 2026', time: '08:30', requestedDeliveryDate: '19 Aug 2026', requestedDeliveryTime: '12:00',
    cargoMaterial: 'Portland Cement', cargoCompany: 'Ultratech Cement', cargoWeight: '15 tons', cargoType: 'Bagged', noOfBags: '300 bags',
    createdAt: '16 Aug 2026 · 10:15 AM', passengers: 300, status: 'TRIP_STARTED', driver: 'Ramesh Yadav', driverNumber: 'DRV-021',
    pickupDate: '18 Aug 2026', pickupTime: '08:30', estimatedDropDate: '19 Aug 2026', estimatedDropTime: '12:00',
    cargo: { material: 'Portland Cement', company: 'Ultratech Cement', quantity: '15 tons', noOfBags: '300 bags', loadType: 'Bagged' },
    truck: { number: 'MH-01-AB-1234', type: 'Body', configuration: '12 tyre', brand: 'Tata Motors' },
    fuel: { assigned: '120 L', received: '120 L', station: 'BPCL Hotgi Road', fulfilledAt: '18 Aug 2026 · 09:00' },
    cash: { advance: '₹25,000', paymentMode: 'UPI' }, documents: [], extras: [],
  },
  {
    id: 'req-3', reference: 'DR-103', customer: 'Shree Cement', origin: 'Hotgi Road, Solapur', destination: 'Tuljapur Village',
    date: '19 Aug 2026', time: '14:15', createdAt: '16 Aug 2026 · 09:20 AM', passengers: 0, status: 'NEW',
    documents: [], extras: [],
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpsDashboard() {
  const [role, setRole] = useState<Role>('Coordinator')
  const [trips, setTrips] = useState<Trip[]>([])
  const [followups, setFollowups] = useState<Followup[]>([])
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState('')

  useEffect(() => {
    fetch('/api/mock-db')
      .then((r) => { if (!r.ok) throw new Error('DB unavailable'); return r.json() })
      .then((data) => {
        setTrips(data.trips || [])
        setFollowups(data.followups || [])
        setFuelTransactions(data.fuelTransactions || [])
        setDrivers(data.drivers || [])
        setVehicles(data.vehicles || [])
        setDbReady(true)
      })
      .catch(() => setDbError('Unable to load mock database'))
  }, [])

  async function persist(collection: 'trips' | 'extras' | 'documents' | 'followups' | 'fuel-transactions' | 'drivers', data: unknown) {
    const response = await fetch('/api/mock-db', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ collection, data }) })
    if (!response.ok) throw new Error('Mock database write failed')
    return response.json()
  }

  const [view, setView] = useState('dashboard')
  const [selected, setSelected] = useState<Trip | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExtra, setShowExtra] = useState(false)
  const [showDocument, setShowDocument] = useState(false)
  const [showFollowup, setShowFollowup] = useState(false)
  const [followupTripFilter, setFollowupTripFilter] = useState('')
  const [editTarget, setEditTarget] = useState<Trip | null>(null)
  const [approvePendingTrip, setApprovePendingTrip] = useState<Trip | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')

  const notify = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2800) }

  const newCount = trips.filter((t) => t.status === 'NEW').length
  const visibleTrips = role === 'Driver' ? trips.filter((t) => t.driver === 'Ramesh Yadav') : trips

  // ─── Status Transition Handlers ──────────────────────────────────────────

  function updateTripStatus(tripId: string, status: TripStatus, extra?: Partial<Trip>) {
    const next = trips.map((t) => t.id === tripId ? { ...t, status, ...extra } : t)
    setTrips(next)
    void persist('trips', next)
    const updated = next.find((t) => t.id === tripId)
    if (updated) setSelected(updated)
    return updated
  }

  // Operations: approve → opens AssignDriverModal
  function approveTrip(trip: Trip, driverObj?: Driver) {
    const driverName = driverObj?.name
    const driverId = driverObj?.id ?? ''
    const vehicleRecord = driverObj ? vehicles.find((v) => v.truck_id === driverObj.truck_id) : undefined
    const extra: Partial<Trip> = {
      status: 'APPROVED',
      driver: driverName ?? trip.driver,
      driverNumber: driverId || trip.driverNumber,
      pickupDate: trip.pickupDate || trip.date,
      pickupTime: trip.pickupTime || trip.time,
      estimatedDropDate: trip.estimatedDropDate || trip.date,
      estimatedDropTime: trip.estimatedDropTime || trip.time,
      cargo: trip.cargo ?? { material: trip.cargoMaterial || 'Cement', company: trip.customer, quantity: trip.cargoWeight || '—', loadType: trip.cargoType ?? 'Bagged' },
      truck: trip.truck ?? { number: driverObj?.truck_id || 'Pending assignment', type: (vehicleRecord?.type === 'Bulker' ? 'Open' : 'Body') as 'Body' | 'Open', configuration: `${vehicleRecord?.tires_count ?? 12} tyre` as '10 tyre' | '12 tyre' | '14 tyre' | '16 tyre', brand: vehicleRecord?.brand || 'Tata Motors' },
      fuel: trip.fuel ?? { assigned: '120 L', received: 'Awaiting receipt', station: 'To be assigned', fulfilledAt: 'Not fulfilled' },
      cash: trip.cash ?? { advance: '₹0', paymentMode: 'UPI' as const },
    }
    const next = trips.map((t) => t.id === trip.id ? { ...t, ...extra } : t)
    setTrips(next)
    if (driverObj) {
      const nextDrivers = drivers.map((d) => d.id === driverObj.id ? { ...d, status: 'unavailable' as const } : d)
      setDrivers(nextDrivers)
      void persist('drivers', nextDrivers)
    }
    void persist('trips', next)
    setSelected(next.find((t) => t.id === trip.id) ?? null)
    notify(`${trip.reference} approved${driverObj ? ` · ${driverObj.name} assigned` : ''}`)
  }

  function rejectTripByOps(trip: Trip) { updateTripStatus(trip.id, 'OP_REJECTED'); notify(`${trip.reference} rejected by Operations`) }
  function acceptTripByDriver(trip: Trip) { updateTripStatus(trip.id, 'ACCEPTED'); notify(`${trip.reference} accepted by driver`) }
  function rejectTripByDriver(trip: Trip) { updateTripStatus(trip.id, 'DV_REJECTED'); notify(`${trip.reference} rejected by driver`) }
  function startTrip(trip: Trip) { updateTripStatus(trip.id, 'TRIP_STARTED'); notify(`${trip.reference} — journey started`) }
  function holdTrip(trip: Trip) { updateTripStatus(trip.id, 'TRIP_ON_HOLD'); notify(`${trip.reference} put on hold`) }
  function reachTrip(trip: Trip) { updateTripStatus(trip.id, 'REACHED'); notify(`${trip.reference} — driver reached destination`) }

  function addTrip(data: Trip) {
    const next = [data, ...trips]
    setTrips(next)
    void persist('trips', next)
    setShowCreate(false)
    notify('Trip created')
  }

  function sendReminder(trip: Trip) { notify(`Reminder sent to Operations for ${trip.reference}`) }

  async function updateTrip(data: Partial<Trip>) {
    if (!editTarget) return
    const updated = { ...editTarget, ...data }
    const next = trips.map((t) => t.id === updated.id ? updated : t)
    setTrips(next)
    setSelected(updated)
    await persist('trips', next)
    setEditTarget(null)
    notify(`${updated.reference} updated`)
  }

  function createFollowup(data: Omit<Followup, 'id' | 'createdAt' | 'status'>) {
    const now = new Date()
    const ts = `${now.getDate()} ${now.toLocaleString('en-GB', { month: 'short' })} ${now.getFullYear()} · ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`
    const fu: Followup = { ...data, id: `fu-${Date.now()}`, createdAt: ts, status: 'Open' }
    const next = [fu, ...followups]
    setFollowups(next)
    void persist('followups', next)
    setShowFollowup(false)
    notify('Follow-up created')
  }

  function sendToPump(tx: FuelTransaction) { const next = fuelTransactions.map((t) => t.id === tx.id ? { ...t, status: 'Sent' as const } : t); setFuelTransactions(next); void persist('fuel-transactions', next); notify(`Fuel sent to pump for ${tx.tripRef}`) }
  function resendToPump(tx: FuelTransaction) { const next = fuelTransactions.map((t) => t.id === tx.id ? { ...t, status: 'Resent' as const } : t); setFuelTransactions(next); void persist('fuel-transactions', next); notify(`Fuel resent to pump for ${tx.tripRef}`) }

  async function addExtra(data: Extra) {
    const tripId = selected?.id; if (!tripId) return
    const entity = { ...data, tripId }
    const currentExtras = trips.flatMap((t) => t.extras.map((e) => ({ ...e, tripId: t.id })))
    const nextExtras = [...currentExtras, entity]
    const result = await persist('extras', nextExtras)
    const hydratedTrip = result.trip as Trip | undefined
    const next = trips.map((t) => t.id === tripId ? { ...t, extras: hydratedTrip?.extras || [...t.extras, data] } : t)
    setTrips(next); setSelected(next.find((t) => t.id === tripId) || selected); setShowExtra(false); notify(`${data.type} request submitted`)
  }

  async function addDocument(data: TripDocument) {
    const tripId = selected?.id; if (!tripId) return
    const entity = { ...data, tripId }
    const currentDocuments = trips.flatMap((t) => t.documents.map((d) => ({ ...d, tripId: t.id })))
    const nextDocuments = [...currentDocuments, entity]
    const result = await persist('documents', nextDocuments)
    const hydratedTrip = result.trip as Trip | undefined
    // If driver uploads a document and trip is ACCEPTED, promote to DOCUMENT_UPLOADED
    const next = trips.map((t) => {
      if (t.id !== tripId) return t
      const updatedDocs = hydratedTrip?.documents || [...t.documents, data]
      const newStatus: TripStatus = t.status === 'ACCEPTED' ? 'DOCUMENT_UPLOADED' : t.status
      return { ...t, documents: updatedDocs, status: newStatus }
    })
    setTrips(next); setSelected(next.find((t) => t.id === tripId) || selected); setShowDocument(false); notify(`${data.type} document uploaded`)
  }

  // Complete trip after stamped doc upload (from REACHED)
  async function uploadStampedDoc(data: TripDocument) {
    const tripId = selected?.id; if (!tripId) return
    const entity = { ...data, tripId }
    const currentDocuments = trips.flatMap((t) => t.documents.map((d) => ({ ...d, tripId: t.id })))
    const nextDocuments = [...currentDocuments, entity]
    const result = await persist('documents', nextDocuments)
    const hydratedTrip = result.trip as Trip | undefined
    const next = trips.map((t) => {
      if (t.id !== tripId) return t
      return { ...t, documents: hydratedTrip?.documents || [...t.documents, data], status: 'TRIP_COMPLETED' as TripStatus }
    })
    setTrips(next); setSelected(next.find((t) => t.id === tripId) || selected); setShowDocument(false); notify('Stamped document uploaded — Trip completed!')
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const title = view === 'dashboard' ? 'Good morning, Alex'
    : view === 'trips' || view === 'trip-detail' ? 'Trips'
    : view === 'followups' ? 'Follow-ups'
    : view === 'fuel' ? 'Fuel transactions'
    : view === 'reports-ops' ? 'Trip Operations Report'
    : view === 'reports-fuel' ? 'Fuel & Trip Expense Report'
    : 'Overview'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">D</span><span>Dev Roadways</span></div>
        <div className="workspace">Operations workspace <CaretDown size={14} style={{ display: 'inline', marginLeft: 4 }} /></div>
        <nav>
          {role === 'Super Admin' ? (
            <>
              <NavItem active={view === 'reports-ops'} label="Trip Operations" onClick={() => setView('reports-ops')} icon={<ChartPie size={18} />} />
              <NavItem active={view === 'reports-fuel'} label="Fuel &amp; Expenses" onClick={() => setView('reports-fuel')} icon={<GasPump size={18} />} />
            </>
          ) : (
            <>
              {role !== 'Driver' && <NavItem active={view === 'dashboard'} label="Overview" onClick={() => setView('dashboard')} icon={<House size={18} />} />}
              <NavItem active={view === 'trips'} label="Trips" count={newCount || undefined} onClick={() => setView('trips')} icon={<Truck size={18} />} />
              {role === 'Operations' && <NavItem active={view === 'followups'} label="Follow-ups" count={followups.filter((f) => f.status === 'Open').length || undefined} onClick={() => setView('followups')} icon={<Clock size={18} />} />}
              {role !== 'Driver' && <NavItem active={view === 'fuel'} label="Fuel transactions" onClick={() => setView('fuel')} icon={<GasPump size={18} />} />}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help"><QuestionMark size={16} /><span>Help centre</span></div>
          <div className="profile"><span className="avatar">AC</span><span><b>Alex Cooper</b><small>{role}</small></span><span className="more"><DotsThree size={18} /></span></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open menu" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><List size={20} /></button>
          <div className="crumb">{role === 'Super Admin' ? 'Admin' : 'Operations'} <span>/</span> {view === 'dashboard' ? 'Overview' : title}</div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
            <div className="role-switch">
              <span>Viewing as</span>
              <select value={role} onChange={(e) => { setRole(e.target.value as Role); setView(e.target.value === 'Driver' ? 'trips' : e.target.value === 'Super Admin' ? 'reports-ops' : 'dashboard') }} aria-label="Select role">
                <option>Coordinator</option>
                <option>Operations</option>
                <option>Driver</option>
                <option>Super Admin</option>
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
                  <h1>{title}</h1>
                  {view === 'dashboard' && <p className="subheading">Keep every journey moving, from request to arrival.</p>}
                </div>
                {role === 'Coordinator' && (view === 'dashboard' || view === 'trips') && (
                  <div className="heading-actions">
                    <button className="button secondary" onClick={() => setShowImport(true)}><UploadSimple size={16} style={{ display: 'inline', marginRight: 6 }} /><span>Import Excel</span></button>
                    <button className="button primary" onClick={() => setShowCreate(true)}><Plus size={16} style={{ display: 'inline', marginRight: 6 }} /><span>New trip</span></button>
                  </div>
                )}
              </div>

              {view === 'dashboard' && role !== 'Driver' && (
                <Dashboard trips={trips} onOpenTrip={(t) => { setSelected(t); setView('trip-detail') }} onViewAll={() => setView('trips')} />
              )}
              {view === 'trips' && (
                <TripList trips={visibleTrips} role={role} onOpen={(t) => { setSelected(t); setView('trip-detail') }} onCreate={() => setShowCreate(true)} onImport={() => setShowImport(true)} />
              )}
              {view === 'trip-detail' && selected && (
                <TripDetail
                  trip={selected}
                  role={role}
                  onBack={() => setView('trips')}
                  onExtra={() => setShowExtra(true)}
                  onDocument={() => setShowDocument(true)}
                  onEdit={() => { if (role !== 'Driver') setEditTarget(selected) }}
                  onFollowup={role === 'Operations' ? () => { setFollowupTripFilter(selected.reference); setView('followups') } : undefined}
                  onApprove={(t) => setApprovePendingTrip(t)}
                  onOpsReject={rejectTripByOps}
                  onAccept={acceptTripByDriver}
                  onDvReject={rejectTripByDriver}
                  onStart={startTrip}
                  onHold={holdTrip}
                  onReach={reachTrip}
                  onUploadStamped={() => setShowDocument(true)}
                  onReminder={() => sendReminder(selected)}
                />
              )}
              {view === 'followups' && role === 'Operations' && (
                <FollowupsPage followups={followups} trips={trips} defaultTripFilter={followupTripFilter} onClearDefaultFilter={() => setFollowupTripFilter('')} onCall={(fu) => { window.location.href = `tel:${fu.driverPhone}` }} onOpenTrip={(tripId) => { const t = trips.find((x) => x.id === tripId); if (t) { setSelected(t); setView('trip-detail') } }} onCreate={() => setShowFollowup(true)} />
              )}
              {view === 'fuel' && role !== 'Driver' && <FuelTransactionsPage transactions={fuelTransactions} onSendToPump={sendToPump} onResend={resendToPump} />}
              {view === 'reports-ops' && <TripOpsReport trips={trips} />}
              {view === 'reports-fuel' && <FuelExpenseReport trips={trips} />}
            </>
          )}
        </div>
      </main>

      {/* Mobile nav */}
      {mobileNavOpen && (
        <div className="mobile-nav-layer" role="presentation" onClick={() => setMobileNavOpen(false)}>
          <aside className="mobile-drawer" role="dialog" aria-label="Mobile navigation" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand"><span className="brand-mark">D</span><span>Dev Roadways</span></div>
              <button className="drawer-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
            </div>
            <div className="workspace">Operations workspace <CaretDown size={14} style={{ display: 'inline', marginLeft: 4 }} /></div>
            <nav>
              {role === 'Super Admin' ? (
                <>
                  <NavItem active={view === 'reports-ops'} label="Trip Operations" onClick={() => { setView('reports-ops'); setMobileNavOpen(false) }} icon={<ChartPie size={18} />} />
                  <NavItem active={view === 'reports-fuel'} label="Fuel &amp; Expenses" onClick={() => { setView('reports-fuel'); setMobileNavOpen(false) }} icon={<GasPump size={18} />} />
                </>
              ) : (
                <>
                  {role !== 'Driver' && <NavItem active={view === 'dashboard'} label="Overview" onClick={() => { setView('dashboard'); setMobileNavOpen(false) }} icon={<House size={18} />} />}
                  <NavItem active={view === 'trips'} label="Trips" count={newCount || undefined} onClick={() => { setView('trips'); setMobileNavOpen(false) }} icon={<Truck size={18} />} />
                  {role === 'Operations' && <NavItem active={view === 'followups'} label="Follow-ups" count={followups.filter((f) => f.status === 'Open').length || undefined} onClick={() => { setView('followups'); setMobileNavOpen(false) }} icon={<Clock size={18} />} />}
                  {role !== 'Driver' && <NavItem active={view === 'fuel'} label="Fuel transactions" onClick={() => { setView('fuel'); setMobileNavOpen(false) }} icon={<GasPump size={18} />} />}
                </>
              )}
            </nav>
            <div className="mobile-drawer-footer">
              <div className="help"><QuestionMark size={16} /><span>Help centre</span></div>
              <div className="profile"><span className="avatar">AC</span><span><b>Alex Cooper</b><small>{role}</small></span></div>
            </div>
          </aside>
        </div>
      )}

      {toast && <div className="toast"><Check size={16} style={{ display: 'inline', marginRight: 6, color: '#10b981' }} /> {toast}</div>}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={addTrip} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); notify('Excel preview validated — 2 trips ready') }} />}
      {showExtra && <ExtraModal onClose={() => setShowExtra(false)} onCreate={addExtra} />}
      {showDocument && selected?.status === 'REACHED'
        ? <DocumentModal onClose={() => setShowDocument(false)} onCreate={uploadStampedDoc} isStamped />
        : showDocument && <DocumentModal onClose={() => setShowDocument(false)} onCreate={addDocument} />}
      {showFollowup && <FollowupModal trips={trips} onClose={() => setShowFollowup(false)} onCreate={createFollowup} />}
      {editTarget && <EditModal entity={editTarget} drivers={drivers} vehicles={vehicles} role={role} onClose={() => setEditTarget(null)} onSave={updateTrip} />}
      {approvePendingTrip && <AssignDriverModal trip={approvePendingTrip} drivers={drivers} vehicles={vehicles} onClose={() => setApprovePendingTrip(null)} onConfirm={(driver) => { approveTrip(approvePendingTrip, driver); setApprovePendingTrip(null) }} />}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({ label, icon, count, active, onClick }: { label: string; icon: React.ReactNode; count?: number; active?: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>{label}{count ? <em>{count}</em> : null}</button>
}

function StatusBadge({ status }: { status: string }) {
  const { bg, color } = getStatusColors(status)
  return <span className="status" style={{ background: bg, color }}>{getStatusLabel(status)}</span>
}

// Legacy Status component for compatibility (used by followups, fuel etc.)
function Status({ children }: { children: string }) {
  return <span className={`status ${children.toLowerCase().replace(/\s+/g, '-')}`}>{children}</span>
}

function Dashboard({ trips, onOpenTrip, onViewAll }: { trips: Trip[]; onOpenTrip: (t: Trip) => void; onViewAll: () => void }) {
  const newTrips = trips.filter((t) => t.status === 'NEW')
  const activeTrips = trips.filter((t) => ['TRIP_STARTED', 'TRIP_ON_HOLD'].includes(t.status))
  const recentTrips = [...trips].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <>
      <section className="stats">
        <Stat label="New trips" value={newTrips.length} tone="blue" hint="Awaiting review" icon={<Clock size={18} />} />
        <Stat label="Active trips" value={activeTrips.length} tone="purple" hint="Currently moving" icon={<Truck size={18} />} />
        <Stat label="Total trips" value={trips.length} tone="green" hint="All time" icon={<ChartPie size={18} />} />
      </section>
      <section className="section-grid">
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <div><h2>All Trips</h2><p>Recently created and scheduled journeys.</p></div>
            <button className="text-button" onClick={onViewAll}>View all <ArrowRight size={14} style={{ display: 'inline', marginLeft: 2 }} /></button>
          </div>
          <div className="request-stack">{recentTrips.map((t) => <TripRow key={t.id} trip={t} onClick={() => onOpenTrip(t)} />)}</div>
          {!recentTrips.length && <Empty label="No trips yet" />}
        </div>
      </section>
    </>
  )
}

function Stat({ label, value, hint, tone, icon }: { label: string; value: string | number; hint: string; tone: string; icon?: React.ReactNode }) {
  return (
    <div className="stat">
      {icon && <span className={`stat-icon ${tone}`}>{icon}</span>}
      <div><p>{label}</p><strong>{value}</strong><small>{hint}</small></div>
    </div>
  )
}

function TripRow({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  return (
    <button className="trip-card" onClick={onClick}>
      <span className="trip-date"><b>{trip.date.split(' ')[0]}</b><small>{trip.date.split(' ')[1]}</small></span>
      <span className="request-main"><b>{trip.reference} · {trip.customer}</b><small>{trip.origin} <ArrowRight size={12} style={{ display: 'inline', margin: '0 2px', color: '#a4adba' }} /> {trip.destination}</small></span>
      <StatusBadge status={trip.status} />
      <span className="chevron"><CaretRight size={16} /></span>
    </button>
  )
}

function TripList({ trips, role, onOpen, onCreate, onImport }: { trips: Trip[]; role: Role; onOpen: (t: Trip) => void; onCreate: () => void; onImport: () => void }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const FILTER_GROUPS: Record<string, TripStatus[]> = {
    New: ['NEW'],
    Approved: ['APPROVED', 'ACCEPTED', 'DOCUMENT_UPLOADED'],
    Active: ['TRIP_STARTED', 'TRIP_ON_HOLD', 'REACHED'],
    Completed: ['TRIP_COMPLETED'],
    Rejected: ['OP_REJECTED', 'DV_REJECTED'],
  }

  const filtered = trips.filter((t) => {
    const matchesFilter = filter === 'All' || (FILTER_GROUPS[filter]?.includes(t.status) ?? false)
    const matchesQuery = `${t.reference} ${t.customer} ${t.origin} ${t.destination}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div><h2>{trips.length} trips</h2></div>
        {role === 'Coordinator' && (
          <div className="panel-header-actions">
            <button className="icon-create" aria-label="Import Excel" title="Import Excel" onClick={onImport}><UploadSimple size={16} /></button>
            <button className="icon-create" aria-label="New trip" title="New trip" onClick={onCreate}><Plus size={16} /></button>
          </div>
        )}
      </div>
      <div className="filters">
        <div className="search"><MagnifyingGlass size={16} style={{ color: '#9ca6b4', marginRight: 4 }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference or customer" /></div>
        <div className="filter-group">{['All', 'New', 'Approved', 'Active', 'Completed', 'Rejected'].map((f) => <button key={f} className={filter === f ? 'filter active' : 'filter'} onClick={() => setFilter(f)}>{f}</button>)}</div>
      </div>
      {filtered.map((t) => <div key={t.id}><TripRow trip={t} onClick={() => onOpen(t)} /></div>)}
      {!filtered.length && <Empty label="No trips match" />}
    </section>
  )
}

function TripDetail({
  trip, role, onBack, onExtra, onDocument, onEdit, onFollowup,
  onApprove, onOpsReject, onAccept, onDvReject, onStart, onHold, onReach, onUploadStamped, onReminder,
}: {
  trip: Trip; role: Role;
  onBack: () => void; onExtra: () => void; onDocument: () => void; onEdit: () => void; onFollowup?: () => void;
  onApprove: (t: Trip) => void; onOpsReject: (t: Trip) => void;
  onAccept: (t: Trip) => void; onDvReject: (t: Trip) => void;
  onStart: (t: Trip) => void; onHold: (t: Trip) => void; onReach: (t: Trip) => void;
  onUploadStamped: () => void; onReminder: () => void;
}) {
  const isPendingReview = trip.status === 'NEW'

  return (
    <section className="detail">
      <button className="back" onClick={onBack}><ArrowLeft size={16} style={{ display: 'inline', marginRight: 4 }} /> Back to trips</button>
      <div className="detail-heading">
        <div><p className="eyebrow">Trip</p><h1>{trip.reference}</h1><p className="subheading">{trip.customer} · Created {trip.createdAt}</p></div>
        <div className="detail-heading-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={trip.status} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {role === 'Operations' && onFollowup && <button className="button secondary compact" onClick={onFollowup} style={{ height: 32 }}><span>Followups</span></button>}
            {(role === 'Coordinator' || role === 'Operations') && <button className="quick-action-icon" aria-label="Edit trip" title="Edit trip" onClick={onEdit} style={{ width: 32, height: 32 }}><PencilSimple size={16} /></button>}
            {role === 'Driver' && <div className="detail-quick-actions"><button className="quick-action-icon" aria-label="Upload trip document" title="Upload trip document" onClick={onDocument}><UploadSimple size={16} /></button><button className="quick-action-icon" aria-label="Submit extra request" title="Submit extra request" onClick={onExtra}><Plus size={16} /></button></div>}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel" style={{ gridColumn: (role === 'Operations' || isPendingReview) ? 'span 2' : undefined }}>
          <h2>Journey</h2>
          <div className="journey journey-times">
            <div><small>Pickup</small><b>{trip.origin}</b><span><em>Scheduled</em><b>{trip.pickupDate || trip.date}</b><b>{to12Hour(trip.pickupTime || trip.time)}</b></span></div>
            <ArrowRight size={18} style={{ color: 'var(--blue)', marginTop: 20 }} />
            <div><small>Drop-off</small><b>{trip.destination}</b><span><em>Requested</em><b>{trip.requestedDeliveryDate || trip.date}</b><b>{to12Hour(trip.requestedDeliveryTime || trip.time)}</b></span>{trip.estimatedDropDate && <span><em>Estimated</em><b>{trip.estimatedDropDate}</b><b>{to12Hour(trip.estimatedDropTime || '')}</b></span>}<span><em>Actual</em>{trip.actualDropDate ? <><b>{trip.actualDropDate}</b><b>{to12Hour(trip.actualDropTime || '')}</b></> : <b>Awaiting delivery</b>}</span></div>
          </div>
          <InfoSection title="Cargo details">
            <Info label="Material" value={trip.cargo?.material || trip.cargoMaterial || 'Cement'} />
            <Info label="Company" value={trip.cargo?.company || trip.cargoCompany || trip.customer} />
            <Info label="Cargo weight" value={trip.cargo?.quantity || trip.cargoWeight || '—'} />
            <Info label="Cargo type" value={trip.cargo?.loadType || trip.cargoType || 'Bagged'} />
            {(trip.cargo?.loadType || trip.cargoType) === 'Bagged' && <Info label="No. of bags" value={trip.cargo?.noOfBags || trip.noOfBags || `${trip.passengers} bags`} />}
          </InfoSection>
          {!isPendingReview && (
            <>
              <InfoSection title="Truck details"><Info label="Truck number" value={trip.truck?.number || 'Pending assignment'} /><Info label="Truck type" value={trip.truck?.type || 'Body'} /><Info label="Configuration" value={trip.truck?.configuration || '12 tyre'} /><Info label="Truck brand" value={trip.truck?.brand || 'Tata Motors'} /></InfoSection>
              <InfoSection title="Driver details"><Info label="Driver name" value={trip.driver || 'Unassigned'} /><Info label="Phone number" value={trip.driverNumber || 'Not available'} /></InfoSection>
              <InfoSection title="Fuel details"><Info label="Assigned fuel" value={trip.fuel?.assigned || '—'} /><Info label="Received fuel" value={trip.fuel?.received || '—'} /><Info label="Station name" value={trip.fuel?.station || '—'} /><Info label="Fulfilled at" value={trip.fuel?.fulfilledAt || '—'} /></InfoSection>
              <InfoSection title="Cash details"><Info label="Advanced amount" value={trip.cash?.advance || '—'} /><Info label="Payment mode" value={trip.cash?.paymentMode || '—'} /></InfoSection>
              <h2 className="activity-title section-title">Extra expenses</h2>
              {trip.extras.map((extra) => <div className="extra-row" key={extra.id}><span className="extra-icon">{extra.type === 'Fuel' ? <GasPump size={16} /> : extra.type === 'Cash' ? <CurrencyInr size={16} /> : <Drop size={16} />}</span><div><b>Extra {extra.type} request</b><p>{extra.note}</p></div><strong>{extra.amount}</strong></div>)}
              {!trip.extras.length && <Empty label="No extra expenses" />}
              <h2 className="activity-title">Trip documents</h2>
              {trip.documents.map((doc) => <div className="extra-row" key={doc.id}><span className="extra-icon"><FileText size={16} /></span><div><b>{doc.name}</b><p>{doc.type} · {doc.uploadedAt}</p></div><StatusBadge status="APPROVED" /></div>)}
              {!trip.documents.length && <Empty label="No documents uploaded" />}
            </>
          )}
          {role === 'Coordinator' && trip.status === 'NEW' && <button className="button secondary wide" onClick={onReminder} style={{ marginTop: 20 }}>Send reminder to Operations</button>}
        </div>

        {/* Operations: review NEW trip */}
        {role === 'Operations' && trip.status === 'NEW' && (
          <div className="panel action-panel">
            <h2>Review Request</h2>
            <p>Operations must review this trip before it is sent to the driver.</p>
            <button className="button primary wide" onClick={() => onApprove(trip)} style={{ marginTop: 12 }}>Approve & Assign Driver</button>
            <button className="button danger wide" onClick={() => onOpsReject(trip)} style={{ marginTop: 8 }}>Reject request</button>
          </div>
        )}

        {/* Driver: accept/reject APPROVED trip */}
        {role === 'Driver' && trip.status === 'APPROVED' && (
          <div className="panel action-panel">
            <h2>Driver Assignment</h2>
            <p>You have been assigned to this trip. Please accept or reject it.</p>
            <button className="button primary wide" onClick={() => onAccept(trip)} style={{ marginTop: 12 }}>Accept assignment</button>
            <button className="button danger wide" onClick={() => onDvReject(trip)} style={{ marginTop: 8 }}>Reject assignment</button>
          </div>
        )}

        {/* Driver: upload doc or start trip */}
        {role === 'Driver' && (trip.status === 'ACCEPTED' || trip.status === 'DOCUMENT_UPLOADED') && (
          <div className="panel action-panel">
            <h2>Driver Actions</h2>
            <p>Upload initial documents or start the trip journey.</p>
            <button className="button primary wide" onClick={onDocument} style={{ marginTop: 12 }}><UploadSimple size={16} style={{ display: 'inline', marginRight: 6 }} /> Upload trip document</button>
            <button className="button primary wide" onClick={() => onStart(trip)} style={{ marginTop: 8 }}>Start Journey</button>
          </div>
        )}

        {/* Driver: in-transit actions */}
        {role === 'Driver' && (trip.status === 'TRIP_STARTED' || trip.status === 'TRIP_ON_HOLD') && (
          <div className="panel action-panel">
            <h2>In-Transit Actions</h2>
            <p>Manage journey status during the trip.</p>
            {trip.status === 'TRIP_STARTED'
              ? <button className="button secondary wide" onClick={() => onHold(trip)} style={{ marginTop: 12 }}>Put Trip On Hold</button>
              : <button className="button primary wide" onClick={() => onStart(trip)} style={{ marginTop: 12 }}>Resume Trip</button>}
            <button className="button primary wide" onClick={() => onReach(trip)} style={{ marginTop: 8 }}>Mark as Reached</button>
            <button className="button primary wide" onClick={onExtra} style={{ marginTop: 8 }}><Plus size={16} style={{ display: 'inline', marginRight: 6 }} /> Extra expense request</button>
          </div>
        )}

        {/* Driver: upload stamped doc to complete */}
        {role === 'Driver' && trip.status === 'REACHED' && (
          <div className="panel action-panel">
            <h2>Trip Delivery Completion</h2>
            <p>Upload the stamped document to complete this trip.</p>
            <button className="button primary wide" onClick={onUploadStamped} style={{ marginTop: 12 }}><UploadSimple size={16} style={{ display: 'inline', marginRight: 6 }} /> Upload Stamped Document</button>
          </div>
        )}
      </div>
    </section>
  )
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) { return <><h2 className="activity-title section-title">{title}</h2><div className="info-grid compact-grid">{children}</div></> }
function Empty({ label }: { label: string }) { return <div className="empty">{label}</div> }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div> }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to12Hour(time: string) { const [h, m] = time.split(':').map(Number); if (Number.isNaN(h) || Number.isNaN(m)) return time; return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }
function toDatetimeLocal(date: string, time: string): string { try { const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }; const p = date.trim().split(' '); if (p.length === 3) { const d = new Date(Number(p[2]), months[p[1]] ?? 0, Number(p[0]), Number(time.split(':')[0] || '0'), Number(time.split(':')[1] || '0')); if (!isNaN(d.getTime())) return `${p[2]}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` } return '' } catch { return '' } }
function fromDatetimeLocal(value: string): { date: string; time: string } { if (!value) return { date: '', time: '' }; const d = new Date(value); const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return { date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`, time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` } }
function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><b>{value}</b></div> }

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ entity, drivers, vehicles, role, onClose, onSave }: { entity: Trip; drivers: Driver[]; vehicles: Vehicle[]; role: Role; onClose: () => void; onSave: (data: Partial<Trip>) => void }) {
  const [reference, setReference] = useState(entity.reference)
  const [customer, setCustomer] = useState(entity.customer)
  const [origin, setOrigin] = useState(entity.origin)
  const [destination, setDestination] = useState(entity.destination)
  const [pickupDT, setPickupDT] = useState(toDatetimeLocal(entity.date, entity.time))
  const [deliveryDT, setDeliveryDT] = useState(toDatetimeLocal(entity.requestedDeliveryDate || entity.date, entity.requestedDeliveryTime || entity.time))
  const [cargoMaterial, setCargoMaterial] = useState(entity.cargoMaterial || 'Cement')
  const [cargoWeight, setCargoWeight] = useState(entity.cargoWeight || '')
  const [cargoType, setCargoType] = useState<Trip['cargoType']>(entity.cargoType || 'Bagged')
  const [noOfBags, setNoOfBags] = useState(entity.noOfBags || '')
  const [selectedDriverId, setSelectedDriverId] = useState(entity.driverNumber ?? '')
  const selectedDriver = role !== 'Coordinator' ? (drivers.find((d) => d.id === selectedDriverId) ?? null) : null
  const selectedVehicle = selectedDriver ? (vehicles.find((v) => v.truck_id === selectedDriver.truck_id) ?? null) : null

  return (
    <Modal title="Edit trip" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const { date, time } = fromDatetimeLocal(pickupDT); const { date: dDate, time: dTime } = fromDatetimeLocal(deliveryDT); onSave({ reference, customer, origin, destination, date, time, requestedDeliveryDate: dDate, requestedDeliveryTime: dTime, cargoMaterial, cargoWeight, cargoType, noOfBags, passengers: Number(noOfBags) || entity.passengers, ...(role !== 'Coordinator' && { driver: selectedDriver?.name ?? entity.driver, driverNumber: selectedDriverId || entity.driverNumber }) }) }}>
        <label>Reference<input value={reference} onChange={(e) => setReference(e.target.value)} /></label>
        <label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label>
        <div className="form-row"><label>Pickup<input value={origin} onChange={(e) => setOrigin(e.target.value)} /></label><label>Drop-off<input value={destination} onChange={(e) => setDestination(e.target.value)} /></label></div>
        <label>Pickup date &amp; time<input type="datetime-local" value={pickupDT} onChange={(e) => setPickupDT(e.target.value)} /></label>
        <label>Delivery date &amp; time<input type="datetime-local" value={deliveryDT} onChange={(e) => setDeliveryDT(e.target.value)} /></label>
        <label>Material<input value={cargoMaterial} onChange={(e) => setCargoMaterial(e.target.value)} /></label>
        <div className="form-row"><label>Cargo weight<input value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="28 tonnes" /></label><label>Cargo type<select value={cargoType} onChange={(e) => setCargoType(e.target.value as Trip['cargoType'])}><option value="Bagged">Bagged</option><option value="Loose">Loose</option></select></label></div>
        <label>No. of bags<input value={noOfBags} onChange={(e) => setNoOfBags(e.target.value)} placeholder="560 bags" /></label>
        {role !== 'Coordinator' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 4 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Assigned driver
              <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} style={{ marginTop: 6 }}>
                <option value="">— Unassigned —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.source_location} · {d.truck_id}{d.status === 'unavailable' ? ' (on trip)' : ''}</option>)}
              </select>
            </label>
            {selectedDriver && (
              <div style={{ marginTop: 8 }}>
                <div className="info-grid compact-grid" style={{ marginBottom: 10 }}>
                  <Info label="Phone" value={String(selectedDriver.phone_number)} />
                  <Info label="Base location" value={selectedDriver.source_location} />
                  <Info label="Status" value={selectedDriver.status === 'unavailable' ? 'On trip' : 'Available'} />
                </div>
                {selectedVehicle && (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '10px 0 6px' }}>Truck</p>
                    <div style={{ background: 'var(--surface-alt, #f8fafc)', border: '1px solid var(--line)', borderRadius: 6, padding: '10px 12px' }}>
                      <b style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>{selectedVehicle.brand} {selectedVehicle.model_name}</b>
                      <div className="info-grid compact-grid">
                        <Info label="Truck ID" value={selectedVehicle.truck_id} />
                        <Info label="Type" value={selectedVehicle.type} />
                        <Info label="Tyres" value={`${selectedVehicle.tires_count} tyres`} />
                        <Info label="Capacity" value={selectedVehicle.load_capacity} />
                        <Info label="Mileage" value={`${selectedVehicle.mileage_kmpl} km/L`} />
                        <Info label="BS6" value={selectedVehicle.BS6 === 'yes' ? 'Yes' : 'No'} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <button className="button primary wide" type="submit">Save changes</button>
      </form>
    </Modal>
  )
}

// ─── Auto-Assign Driver helpers (kept from git) ───────────────────────────────

function extractCity(location: string): string { const parts = location.split(','); return parts[parts.length - 1].trim().toLowerCase() }
function scoreDriverForOrigin(driver: Driver, origin: string): number {
  if (!origin.trim()) return 0
  const originTokens = origin.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2)
  const locTokens = driver.source_location.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 2)
  return originTokens.reduce((score, ow) => score + (locTokens.some((lw) => lw.includes(ow) || ow.includes(lw)) ? 1 : 0), 0)
}
function scoreDriverForCity(driver: Driver, origin: string): number {
  const originCity = extractCity(origin)
  const driverCity = extractCity(driver.source_location)
  if (originCity && (driverCity.includes(originCity) || originCity.includes(driverCity))) return 3
  return scoreDriverForOrigin(driver, origin)
}

// ─── AssignDriverModal (auto-assign, kept from git) ───────────────────────────

function AssignDriverModal({ trip, drivers, vehicles, onClose, onConfirm }: { trip: Trip; drivers: Driver[]; vehicles: Vehicle[]; onClose: () => void; onConfirm: (driver?: Driver) => void }) {
  const originCity = extractCity(trip.origin)
  const scored = drivers
    .map((d) => ({ driver: d, score: scoreDriverForCity(d, trip.origin), vehicle: vehicles.find((v) => v.truck_id === d.truck_id) ?? null }))
    .sort((a, b) => { const aA = a.driver.status === 'available' ? 1 : 0; const bA = b.driver.status === 'available' ? 1 : 0; if (aA !== bA) return bA - aA; return b.score - a.score })
  const suggested = scored.find((s) => s.driver.status === 'available') ?? null
  const [selectedId, setSelectedId] = useState(suggested?.driver.id ?? '')
  const selectedEntry = scored.find((s) => s.driver.id === selectedId) ?? null

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: 2 }}>Approve &amp; Assign Driver</h2>
            <p style={{ fontSize: 11, color: 'var(--muted-ink)', margin: 0 }}>{trip.reference} &middot; Pickup: {trip.origin}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {originCity && (
          <div style={{ padding: '0 20px 12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, background: 'var(--blue-soft)', color: 'var(--blue)', borderRadius: 20, padding: '4px 10px' }}>
              Matching drivers in <b style={{ textTransform: 'capitalize', marginLeft: 3 }}>{originCity}</b>
            </span>
          </div>
        )}
        <div style={{ padding: '0 20px', maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {scored.map(({ driver, score, vehicle }) => {
            const isSelected = driver.id === selectedId
            const isSuggested = driver.id === suggested?.driver.id
            const isAvailable = driver.status === 'available'
            return (
              <button key={driver.id} type="button" onClick={() => { if (isAvailable) setSelectedId(driver.id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${isSelected ? 'var(--blue)' : 'var(--line)'}`, background: isSelected ? 'var(--blue-soft)' : 'var(--panel)', cursor: isAvailable ? 'pointer' : 'not-allowed', opacity: isAvailable ? 1 : 0.5, textAlign: 'left', width: '100%' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <b style={{ fontSize: 12 }}>{driver.name}</b>
                    {isSuggested && isAvailable && <span style={{ fontSize: 9, fontWeight: 700, background: isSelected ? 'var(--blue)' : 'var(--blue-soft)', color: isSelected ? '#fff' : 'var(--blue)', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Suggested</span>}
                    {!isAvailable && <span style={{ fontSize: 9, fontWeight: 700, background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>On trip</span>}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--muted-ink)', margin: 0 }}>{driver.source_location}</p>
                  {vehicle && <p style={{ fontSize: 10, color: 'var(--muted-ink)', margin: '1px 0 0' }}>{vehicle.brand} {vehicle.model_name} &middot; {driver.truck_id}</p>}
                </div>
                {score >= 3 && isAvailable && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--blue)', flexShrink: 0 }}>City match</span>}
                {isSelected && <Check size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />}
              </button>
            )
          })}
          {!scored.length && <p style={{ color: 'var(--muted-ink)', fontSize: 12, textAlign: 'center', padding: 16 }}>No drivers found</p>}
        </div>
        {selectedEntry?.vehicle && (
          <div style={{ margin: '0 20px 16px', background: 'var(--surface-alt, #f8fafc)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 8px' }}>Assigned truck</p>
            <b style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{selectedEntry.vehicle.brand} {selectedEntry.vehicle.model_name}</b>
            <div className="info-grid compact-grid">
              <Info label="Truck ID" value={selectedEntry.vehicle.truck_id} />
              <Info label="Type" value={selectedEntry.vehicle.type} />
              <Info label="Tyres" value={`${selectedEntry.vehicle.tires_count} tyres`} />
              <Info label="Capacity" value={selectedEntry.vehicle.load_capacity} />
              <Info label="Mileage" value={`${selectedEntry.vehicle.mileage_kmpl} km/L`} />
              <Info label="BS6" value={selectedEntry.vehicle.BS6 === 'yes' ? 'Yes' : 'No'} />
            </div>
          </div>
        )}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="button primary wide" disabled={!selectedId} onClick={() => onConfirm(selectedEntry?.driver ?? undefined)}>
            {selectedId ? `Assign ${selectedEntry?.driver.name ?? ''} & Approve` : 'Select a driver to continue'}
          </button>
          <button className="button secondary wide" onClick={() => onConfirm(undefined)}>Approve without driver</button>
        </div>
      </div>
    </div>
  )
}

// ─── Create / Import Modals ───────────────────────────────────────────────────

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: Trip) => void }) {
  const [reference, setReference] = useState('')
  const [customer, setCustomer] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [pickupDT, setPickupDT] = useState('')
  const [deliveryDT, setDeliveryDT] = useState('')
  const [cargoMaterial, setCargoMaterial] = useState('Cement')
  const [cargoWeight, setCargoWeight] = useState('')
  const [cargoType, setCargoType] = useState<Trip['cargoType']>('Bagged')
  const [noOfBags, setNoOfBags] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const { date, time } = fromDatetimeLocal(pickupDT)
    const { date: dDate, time: dTime } = fromDatetimeLocal(deliveryDT)
    const now = new Date(); const day = now.getDate(); const month = now.toLocaleString('en-GB', { month: 'short' }); const year = now.getFullYear(); const hours = now.getHours(); const mins = String(now.getMinutes()).padStart(2, '0'); const sfx = hours >= 12 ? 'PM' : 'AM'; const h12 = hours % 12 || 12
    onCreate({ id: `req-${Date.now()}`, reference: reference || `DR-${1050 + Math.floor(Math.random() * 20)}`, customer: customer || 'New customer', origin: origin || 'Wadgaon, Pune', destination: destination || 'Nashik MIDC', date: date || '20 Aug 2026', time: time || '09:00', requestedDeliveryDate: dDate || date || '20 Aug 2026', requestedDeliveryTime: dTime || time || '09:00', cargoMaterial, cargoCompany: customer, cargoWeight, cargoType, noOfBags: noOfBags || '1 bag', createdAt: `${day} ${month} ${year} · ${h12}:${mins} ${sfx}`, passengers: Number(noOfBags) || 1, status: 'NEW', documents: [], extras: [] })
  }

  return (
    <Modal title="Create trip" onClose={onClose}>
      <form onSubmit={submit}>
        <label>Reference<input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="DR-1049" /></label>
        <label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Company or person" /></label>
        <div className="form-row"><label>Pickup<input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="City or address" /></label><label>Drop-off<input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City or address" /></label></div>
        <label>Pickup date &amp; time<input type="datetime-local" value={pickupDT} onChange={(e) => setPickupDT(e.target.value)} /></label>
        <label>Delivery date &amp; time<input type="datetime-local" value={deliveryDT} onChange={(e) => setDeliveryDT(e.target.value)} /></label>
        <div className="form-row"><label>Cargo weight<input value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder="28 tonnes" /></label><label>Cargo type<select value={cargoType} onChange={(e) => setCargoType(e.target.value as Trip['cargoType'])}><option value="Bagged">Bagged</option><option value="Loose">Loose</option></select></label></div>
        <label>No. of bags<input value={noOfBags} onChange={(e) => setNoOfBags(e.target.value)} placeholder="560 bags" /></label>
        <button className="button primary wide" type="submit">Create trip</button>
      </form>
    </Modal>
  )
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) { return <Modal title="Import trips" onClose={onClose}><div className="upload"><UploadSimple size={24} style={{ color: 'var(--blue)' }} /><b>Drop your Excel file here</b><p>or choose a .xlsx file from your device</p><button className="button secondary">Choose file</button></div><div className="import-preview"><b>Preview ready</b><span>2 valid trips · 0 errors</span></div><button className="button primary wide" onClick={onDone}>Validate and import</button></Modal> }
function ExtraModal({ onClose, onCreate }: { onClose: () => void; onCreate: (x: Extra) => void }) { const [type, setType] = useState<Extra['type']>('Fuel'); const [amount, setAmount] = useState(''); const [note, setNote] = useState(''); return <Modal title="Submit extra request" onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onCreate({ id: `ex-${Date.now()}`, type, amount: amount.trim() ? `₹${amount.trim()}` : '₹0', note: note.trim() || 'Submitted by driver for review', status: 'Submitted' }) }}><label>Request type<select value={type} onChange={(e) => setType(e.target.value as Extra['type'])}><option>Fuel</option><option>Cash</option><option>AdBlue</option></select></label><label>Amount<input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} inputMode="decimal" placeholder="5000" /></label><label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a short note" rows={3} /></label><button className="button primary wide" type="submit">Submit request</button></form></Modal> }
function DocumentModal({ onClose, onCreate, isStamped }: { onClose: () => void; onCreate: (x: TripDocument) => void; isStamped?: boolean }) { const [type, setType] = useState<TripDocument['type']>('LR'); const [name, setName] = useState(''); return <Modal title={isStamped ? 'Upload Stamped Document' : 'Upload trip document'} onClose={onClose}><form onSubmit={(e) => { e.preventDefault(); onCreate({ id: `doc-${Date.now()}`, name: name || `Trip-document-${type}.pdf`, type, uploadedAt: 'Just now' }) }}><div className="upload"><UploadSimple size={24} style={{ color: 'var(--blue)' }} /><b>{isStamped ? 'Select the stamped document' : 'Select a document'}</b><p>PDF, JPG, or PNG up to 10 MB</p><input type="file" onChange={(e) => setName(e.target.files?.[0]?.name || '')} /></div><label>Document type<select value={type} onChange={(e) => setType(e.target.value as TripDocument['type'])}><option>LR</option><option>WB</option><option>Invoice</option><option>Other</option></select></label><button className="button primary wide" type="submit">{isStamped ? 'Upload & Complete Trip' : 'Upload document'}</button></form></Modal> }

// ─── TripOpsReport ────────────────────────────────────────────────────────────

function TripOpsReport({ trips }: { trips: Trip[] }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const total = trips.length
  const accepted = trips.filter((t) => !['NEW', 'OP_REJECTED', 'DV_REJECTED'].includes(t.status)).length
  const rejected = trips.filter((t) => ['OP_REJECTED', 'DV_REJECTED'].includes(t.status)).length
  const active = trips.filter((t) => ['TRIP_STARTED', 'TRIP_ON_HOLD', 'REACHED'].includes(t.status)).length
  const completed = trips.filter((t) => t.status === 'TRIP_COMPLETED').length
  const pending = trips.filter((t) => ['NEW', 'APPROVED', 'ACCEPTED', 'DOCUMENT_UPLOADED'].includes(t.status)).length

  const rows = trips.map((t) => ({ id: t.reference, source: t.origin, destination: t.destination, loadType: t.cargo?.loadType ?? '—', weight: t.cargo?.quantity ?? '—', driver: t.driver || 'Unassigned', status: t.status, delivery: t.estimatedDropDate || t.date }))

  const filteredRows = rows.filter((r) => {
    let matchesStatus = true
    if (statusFilter === 'New') matchesStatus = r.status === 'NEW'
    else if (statusFilter === 'Scheduled') matchesStatus = ['APPROVED', 'ACCEPTED', 'DOCUMENT_UPLOADED'].includes(r.status)
    else if (statusFilter === 'Active') matchesStatus = ['TRIP_STARTED', 'TRIP_ON_HOLD', 'REACHED'].includes(r.status)
    else if (statusFilter === 'Completed') matchesStatus = r.status === 'TRIP_COMPLETED'
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q || r.id.toLowerCase().includes(q) || r.source.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q)
    return matchesStatus && matchesQuery
  })

  const handleDownloadExcel = async () => {
    const XLSX = await import('xlsx')
    const data = filteredRows.map((r) => ({ 'Trip ID': r.id, Source: r.source, Destination: r.destination, 'Load Type': r.loadType, Weight: r.weight, Driver: r.driver, Status: getStatusLabel(r.status), 'Est. Delivery': r.delivery }))
    const worksheet = XLSX.utils.json_to_sheet(data); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'Trips'); XLSX.writeFile(workbook, `Trip_Operations_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const dist = [{ label: 'Pending', count: pending, color: '#3b82f6' }, { label: 'Active', count: active, color: '#8b5cf6' }, { label: 'Completed', count: completed, color: '#10b981' }]
  const maxCount = Math.max(...dist.map((d) => d.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[{ label: 'Total Trips', value: total, hint: 'All time' }, { label: 'Accepted Trips', value: accepted, hint: 'Approved or active' }, { label: 'Rejected Trips', value: rejected, hint: 'Declined' }, { label: 'Active Trips', value: active, hint: 'Currently moving' }, { label: 'Completed Trips', value: completed, hint: 'Delivered' }, { label: 'Pending Trips', value: pending, hint: 'Not yet started' }].map(({ label, value, hint }) => (
          <div key={label} className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>{label}</p>
            <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{value}</strong>
            <small style={{ color: '#8993a2', fontSize: '10px' }}>{hint}</small>
          </div>
        ))}
      </section>

      <div className="panel">
        <div className="panel-header" style={{ alignItems: 'center' }}>
          <div><h2>All Trips</h2><p>Live data from trips</p></div>
          <button className="icon-create" onClick={handleDownloadExcel} title="Download Excel (.xlsx)" aria-label="Download Excel"><DownloadSimple size={18} /></button>
        </div>
        <div className="filters" style={{ flexWrap: 'wrap' }}>
          <div className="search"><MagnifyingGlass size={16} style={{ color: '#9ca6b4', marginRight: 4 }} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search trip ID, source, destination, driver..." /></div>
          <div className="filter-group">{['All', 'New', 'Scheduled', 'Active', 'Completed'].map((s) => <button key={s} className={statusFilter === s ? 'filter active' : 'filter'} onClick={() => setStatusFilter(s)}>{s}</button>)}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Trip ID', 'Source', 'Destination', 'Load Type', 'Weight', 'Driver', 'Status', 'Est. Delivery'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{row.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.source}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.destination}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.loadType}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', textAlign: 'right' }}>{row.weight}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.driver}</td>
                  <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}><StatusBadge status={row.status} /></td>
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
          {dist.map((d) => (
            <div key={d.label} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 44px', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{d.label}</span>
              <div style={{ background: '#f1f5f9', borderRadius: 9999, height: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.round((d.count / maxCount) * 100)}%`, background: d.color, borderRadius: 9999, transition: 'width 0.4s ease' }} /></div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
          {total === 0 && <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No trip data available.</p>}
        </div>
      </div>
    </div>
  )
}

// ─── FuelExpenseReport ────────────────────────────────────────────────────────

function FuelExpenseReport({ trips }: { trips: Trip[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const dummyRows = [{ trip: 'TR-001', driver: 'Rahul', truck: 'MH13AB1234', fuelAuth: '120 L', fuelRec: '115 L', authN: 120, recN: 115, cash: '₹2,000', extraFuel: false }, { trip: 'TR-002', driver: 'Amit', truck: 'MH13CD5678', fuelAuth: '100 L', fuelRec: '102 L', authN: 100, recN: 102, cash: '₹1,500', extraFuel: true }, { trip: 'TR-003', driver: 'Sagar', truck: 'MH13EF9012', fuelAuth: '130 L', fuelRec: '125 L', authN: 130, recN: 125, cash: '₹2,500', extraFuel: false }]
  const filteredRows = dummyRows.filter((r) => { const q = searchQuery.toLowerCase().trim(); return !q || r.trip.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q) || r.truck.toLowerCase().includes(q) })
  const handleDownloadExcel = async () => { const XLSX = await import('xlsx'); const data = filteredRows.map((r) => ({ Trip: r.trip, Driver: r.driver, Truck: r.truck, 'Fuel Authorized': r.fuelAuth, 'Fuel Recorded': r.fuelRec, 'Cash Advance': r.cash, 'Extra Fuel': r.extraFuel ? 'Yes' : 'No' })); const worksheet = XLSX.utils.json_to_sheet(data); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'Fuel & Expenses'); XLSX.writeFile(workbook, `Fuel_Expense_Report_${new Date().toISOString().slice(0, 10)}.xlsx`) }
  const totalAuth = dummyRows.reduce((s, r) => s + r.authN, 0); const totalRec = dummyRows.reduce((s, r) => s + r.recN, 0); const extraCount = dummyRows.filter((r) => r.extraFuel).length; const maxFuel = Math.max(totalAuth, totalRec, 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[{ label: 'Fuel Authorized', value: `${totalAuth} L`, hint: 'Across all trips' }, { label: 'Fuel Recorded', value: `${totalRec} L`, hint: 'Actual consumption' }, { label: 'Cash Advances', value: '₹6,000', hint: `${dummyRows.length} trips` }, { label: 'Fuel Transactions', value: dummyRows.length, hint: 'This period' }, { label: 'Extra Fuel Requests', value: extraCount, hint: 'Pending review' }].map(({ label, value, hint }) => (
          <div key={label} className="stat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 18px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-ink)', fontWeight: 500 }}>{label}</p>
            <strong style={{ fontSize: '24px', letterSpacing: '-.04em', margin: '4px 0 2px' }}>{value}</strong>
            <small style={{ color: '#8993a2', fontSize: '10px' }}>{hint}</small>
          </div>
        ))}
      </section>
      <div className="panel">
        <div className="panel-header" style={{ alignItems: 'center' }}><div><h2>Fuel &amp; Expense Breakdown</h2><p>Per-trip fuel and cash advance summary</p></div><button className="icon-create" onClick={handleDownloadExcel} title="Download Excel (.xlsx)" aria-label="Download Excel"><DownloadSimple size={18} /></button></div>
        <div className="filters" style={{ flexWrap: 'wrap' }}><div className="search"><MagnifyingGlass size={16} style={{ color: '#9ca6b4', marginRight: 4 }} /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search trip ID, driver, truck..." /></div></div>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}><thead><tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>{['Trip', 'Driver', 'Truck', 'Fuel Authorized', 'Fuel Recorded', 'Cash Advance', 'Extra Fuel'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead><tbody>{filteredRows.map((row) => (<tr key={row.trip} style={{ borderBottom: '1px solid #f8fafc' }}><td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{row.trip}</td><td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.driver}</td><td style={{ padding: '0.75rem 1rem', color: '#475569', fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.truck}</td><td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.fuelAuth}</td><td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{row.fuelRec}</td><td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{row.cash}</td><td style={{ padding: '0.75rem 1rem' }}>{row.extraFuel ? <span style={{ color: '#d97706', fontWeight: 600 }}>Yes</span> : <span style={{ color: '#94a3b8' }}>No</span>}</td></tr>))}{filteredRows.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No records match the filters.</td></tr>}</tbody></table></div>
      </div>
      <div className="panel"><div className="panel-header"><div><h2>Fuel Authorized vs Recorded</h2><p>Planned vs actual consumption comparison</p></div></div><div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>{[{ label: 'Authorized', value: totalAuth, color: '#3b82f6' }, { label: 'Recorded', value: totalRec, color: '#10b981' }].map((bar) => (<div key={bar.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', alignItems: 'center', gap: '0.75rem' }}><span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{bar.label}</span><div style={{ background: '#f1f5f9', borderRadius: 9999, height: 14, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.round((bar.value / maxFuel) * 100)}%`, background: bar.color, borderRadius: 9999, transition: 'width 0.4s ease' }} /></div><span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{bar.value} L</span></div>))}<p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>Variance: <strong style={{ color: totalAuth - totalRec > 0 ? '#ef4444' : '#10b981' }}>{totalAuth - totalRec > 0 ? '−' : '+'}{Math.abs(totalAuth - totalRec)} L</strong> {totalAuth - totalRec > 0 ? 'under recorded vs authorized' : 'over recorded vs authorized'}.</p></div></div>
    </div>
  )
}

// ─── FollowupsPage ────────────────────────────────────────────────────────────

function FollowupsPage({ followups, trips, defaultTripFilter, onClearDefaultFilter, onCall, onOpenTrip, onCreate }: { followups: Followup[]; trips: Trip[]; defaultTripFilter?: string; onClearDefaultFilter?: () => void; onCall: (fu: Followup) => void; onOpenTrip: (tripId: string) => void; onCreate: () => void }) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [tripFilter, setTripFilter] = useState(defaultTripFilter || 'All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortAsc, setSortAsc] = useState(true)
  const tripOptions = ['All', ...Array.from(new Set(followups.map((f) => f.tripRef)))]
  useEffect(() => { if (defaultTripFilter) { setTripFilter(defaultTripFilter); onClearDefaultFilter?.() } }, [defaultTripFilter])
  const parseDue = (fu: Followup) => { try { const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }; const p = fu.dueDate.trim().split(' '); return new Date(Number(p[2]), months[p[1]] ?? 0, Number(p[0]), Number(fu.dueTime.split(':')[0] ?? '0'), Number(fu.dueTime.split(':')[1] ?? '0')).getTime() } catch { return 0 } }
  const filtered = followups.filter((f) => (tripFilter === 'All' || f.tripRef === tripFilter) && (statusFilter === 'All' || f.status === statusFilter)).filter((f) => { const q = query.toLowerCase(); return !q || f.driver.toLowerCase().includes(q) || f.tripRef.toLowerCase().includes(q) || f.note.toLowerCase().includes(q) }).sort((a, b) => sortAsc ? parseDue(a) - parseDue(b) : parseDue(b) - parseDue(a))
  const activeFilters = (tripFilter !== 'All' ? 1 : 0) + (statusFilter !== 'All' ? 1 : 0)
  return (
    <section className="panel list-panel">
      <div className="panel-header"><div><h2>Follow-ups</h2><p>Field communication and driver follow-up log.</p></div><div className="panel-header-actions"><button className="icon-create" aria-label="New follow-up" title="New follow-up" onClick={onCreate}><Plus size={16} /></button></div></div>
      <div className="filters" style={{ position: 'relative', flexWrap: 'wrap', gap: 8 }}>
        <div className="search" style={{ flex: 1, minWidth: 180 }}><MagnifyingGlass size={16} style={{ color: '#9ca6b4', marginRight: 4 }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search driver, trip, note" /></div>
        <button className="icon-create" title="Filter" aria-label="Filter" onClick={() => setShowFilters((v) => !v)} style={{ position: 'relative' }}><WarningCircle size={15} />{activeFilters > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--blue)', color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 8, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{activeFilters}</span>}</button>
        <button className="icon-create" title={sortAsc ? 'Sort: oldest due first' : 'Sort: newest due first'} aria-label="Sort" onClick={() => setSortAsc((v) => !v)}><ArrowRight size={15} style={{ transform: sortAsc ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform .2s' }} /></button>
        {showFilters && (<div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px', zIndex: 5, minWidth: 220, boxShadow: '0 8px 24px rgb(24 34 48 / 10%)' }}><p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Trip</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>{tripOptions.map((t) => <button key={t} className={tripFilter === t ? 'filter active' : 'filter'} style={{ fontSize: 10 }} onClick={() => setTripFilter(t)}>{t}</button>)}</div><p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Status</p><div style={{ display: 'flex', gap: 4 }}>{['All', 'Open', 'Done'].map((s) => <button key={s} className={statusFilter === s ? 'filter active' : 'filter'} style={{ fontSize: 10 }} onClick={() => setStatusFilter(s)}>{s}</button>)}</div></div>)}
      </div>
      {filtered.map((fu) => (<div key={fu.id} className="extra-row" style={{ alignItems: 'flex-start', gap: 12, padding: '14px 0' }}><span className="extra-icon" style={{ marginTop: 2 }}><Clock size={15} /></span><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><b style={{ fontSize: 11 }}>{fu.driver}</b><button className="text-button" style={{ fontSize: 10, padding: 0 }} onClick={() => onOpenTrip(fu.tripId)}>{fu.tripRef} <CaretRight size={10} style={{ display: 'inline' }} /></button><span className={`status ${fu.status.toLowerCase()}`} style={{ fontSize: 9 }}>{fu.status}</span></div><p style={{ fontSize: 10, color: 'var(--muted-ink)', margin: '4px 0 0', lineHeight: 1.5 }}>{fu.note}</p><small style={{ color: '#9ca6b4', fontSize: 9, display: 'block', marginTop: 4 }}>Due {fu.dueDate} · {to12Hour(fu.dueTime)}</small></div><a href={`tel:${fu.driverPhone}`} onClick={(e) => { e.preventDefault(); onCall(fu) }} className="button secondary compact" style={{ fontSize: 11, flexShrink: 0 }} aria-label={`Call ${fu.driver}`} title={`Call ${fu.driver}`}><span style={{ fontSize: 14 }}>📞</span> Call</a></div>))}
      {!filtered.length && <Empty label="No follow-ups match" />}
    </section>
  )
}

function FollowupModal({ trips, onClose, onCreate }: { trips: Trip[]; onClose: () => void; onCreate: (data: Omit<Followup, 'id' | 'createdAt' | 'status'>) => void }) {
  const activeTripOptions = trips.filter((t) => t.status !== 'TRIP_COMPLETED')
  const [tripId, setTripId] = useState(activeTripOptions[0]?.id || '')
  const selectedTrip = trips.find((t) => t.id === tripId)
  const [note, setNote] = useState('')
  const [dueDT, setDueDT] = useState('')
  return (
    <Modal title="Create follow-up" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (!selectedTrip) return; const { date: dDate, time: dTime } = fromDatetimeLocal(dueDT); onCreate({ tripId: selectedTrip.id, tripRef: selectedTrip.reference, driver: selectedTrip.driver || 'Unassigned', driverPhone: selectedTrip.driverNumber || '+91 00000 00000', note: note.trim() || 'Follow-up required', dueDate: dDate || 'Today', dueTime: dTime || '12:00' }) }}>
        <label>Trip
          <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
            {activeTripOptions.map((t) => <option key={t.id} value={t.id}>{t.reference} — {t.customer}</option>)}
            {!activeTripOptions.length && <option value="">No active trips</option>}
          </select>
        </label>
        {selectedTrip && <div style={{ background: 'var(--blue-soft)', borderRadius: 6, padding: '10px 12px', fontSize: 11, color: 'var(--blue)' }}><b>{selectedTrip.driver || 'Unassigned'}</b> · {selectedTrip.driverNumber || 'No phone on file'}</div>}
        <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to be followed up?" rows={3} /></label>
        <label>Due date &amp; time<input type="datetime-local" value={dueDT} onChange={(e) => setDueDT(e.target.value)} /></label>
        <button className="button primary wide" type="submit">Create follow-up</button>
      </form>
    </Modal>
  )
}

function FuelTransactionsPage({ transactions, onSendToPump, onResend }: { transactions: FuelTransaction[]; onSendToPump: (tx: FuelTransaction) => void; onResend: (tx: FuelTransaction) => void }) {
  const [statusFilter, setStatusFilter] = useState('All')
  const [query, setQuery] = useState('')
  const filtered = transactions.filter((tx) => { const matchesStatus = statusFilter === 'All' || tx.status === statusFilter; const q = query.toLowerCase(); const matchesQuery = !q || tx.tripRef.toLowerCase().includes(q) || tx.driver.toLowerCase().includes(q) || tx.station.toLowerCase().includes(q); return matchesStatus && matchesQuery })
  return (
    <section className="panel list-panel">
      <div className="panel-header"><div><h2>Fuel transactions</h2><p>Dispatch fuel authorisations to pump stations.</p></div></div>
      <div className="filters"><div className="search"><MagnifyingGlass size={16} style={{ color: '#9ca6b4', marginRight: 4 }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trip, driver, station" /></div><div className="filter-group">{['All', 'Pending', 'Sent', 'Resent'].map((f) => <button key={f} className={statusFilter === f ? 'filter active' : 'filter'} onClick={() => setStatusFilter(f)}>{f}</button>)}</div></div>
      {filtered.map((tx) => (<div key={tx.id} className="extra-row" style={{ alignItems: 'center' }}><span className="extra-icon"><GasPump size={15} /></span><div style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 11, display: 'block' }}>{tx.tripRef} · {tx.driver}</b><small style={{ color: 'var(--muted-ink)', fontSize: 10, display: 'block', marginTop: 3 }}>{tx.station} · {tx.litres}</small></div><strong style={{ fontSize: 11, marginLeft: 'auto', flexShrink: 0 }}>{tx.amount}</strong><span className={`status ${tx.status.toLowerCase()}`} style={{ marginLeft: 10 }}>{tx.status}</span>{tx.status === 'Pending' && <button className="button primary compact" style={{ marginLeft: 10, fontSize: 11 }} onClick={() => onSendToPump(tx)}>Send to pump</button>}{(tx.status === 'Sent' || tx.status === 'Resent') && <button className="button secondary compact" style={{ marginLeft: 10, fontSize: 11 }} onClick={() => onResend(tx)}>Resend</button>}</div>))}
      {!filtered.length && <Empty label="No fuel transactions found" />}
    </section>
  )
}
