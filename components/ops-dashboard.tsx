"use client";

import { useEffect, useMemo, useState } from "react";
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
  FunnelSimple,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Coordinator" | "Operations" | "Driver" | "Super Admin";

type TripStatus =
  | "NEW"
  | "DRIVER_PENDING"
  | "DRIVER_ACCEPTED"
  | "DRIVER_REJECTED"
  | "REJECTED"
  | "PREPARING"
  | "READY"
  | "IN_TRANSIT"
  | "ON_HOLD"
  | "REACHED"
  | "DELIVERED"
  | "DOCUMENTS_SUBMITTED"
  | "COMPLETED";

type Trip = {
  id: string;
  reference: string;
  customer: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  requestedDeliveryDate?: string;
  requestedDeliveryTime?: string;
  createdAt: string;
  passengers: number;
  cargoMaterial?: string;
  cargoCompany?: string;
  cargoWeight?: string;
  cargoType?: "Bagged" | "Loose";
  noOfBags?: string;
  status: TripStatus;
  driver?: string;
  driverNumber?: string;
  pickupDate?: string;
  pickupTime?: string;
  estimatedDropDate?: string;
  estimatedDropTime?: string;
  actualDropDate?: string;
  actualDropTime?: string;
  cargo?: Cargo;
  truck?: TruckInfo;
  fuel?: FuelDetails;
  cash?: CashDetails;
  documents: TripDocument[];
  extras: Extra[];
};

type Extra = {
  id: string;
  type: "Fuel" | "Cash" | "AdBlue";
  amount: string;
  note: string;
  status: "Submitted" | "Approved";
};
type Cargo = {
  material: string;
  company: string;
  quantity: string;
  noOfBags?: string;
  loadType: "Bagged" | "Loose";
};
type TruckInfo = {
  number: string;
  type: "Body" | "Open";
  configuration: "10 tyre" | "12 tyre" | "14 tyre" | "16 tyre";
  brand: string;
};
type FuelDetails = {
  assigned: string;
  received: string;
  station: string;
  fulfilledAt: string;
};
type CashDetails = { advance: string; paymentMode: "Cash" | "UPI" };
type TripDocument = {
  id: string;
  name: string;
  type: "LR" | "WB" | "Invoice" | "Other";
  uploadedAt: string;
};
type Followup = {
  id: string;
  tripId: string;
  tripRef: string;
  driver: string;
  driverPhone: string;
  note: string;
  dueDate: string;
  dueTime: string;
  createdAt: string;
  status: "Open" | "Done";
};
type FuelTransaction = {
  id: string;
  tripId: string;
  tripRef: string;
  driver: string;
  station: string;
  amount: string;
  litres: string;
  status: "Pending" | "Sent" | "Resent";
};
type Driver = {
  id: string;
  name: string;
  phone_number: number;
  truck_id: string;
  status: "available" | "unavailable";
  source_location: string;
  documents: unknown[];
};
type Vehicle = {
  truck_id: string;
  brand: string;
  model_name: string;
  BS6: "yes" | "no";
  tires_count: number;
  mileage_kmpl: number;
  load_capacity: string;
  type: "Body" | "Bulker" | "Open";
};

const ROLE_GREETINGS: Record<Role, string> = {
  Coordinator: "Govind",
  Operations: "Laxman",
  Driver: "Ramesh Yadav",
  "Super Admin": "Dheeraj",
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus, string> = {
  NEW: "New",
  DRIVER_PENDING: "Driver Pending",
  DRIVER_ACCEPTED: "Driver Accepted",
  DRIVER_REJECTED: "Driver Rejected",
  REJECTED: "Rejected",
  PREPARING: "Preparing",
  READY: "Ready",
  IN_TRANSIT: "In Transit",
  ON_HOLD: "On Hold",
  REACHED: "Reached",
  DELIVERED: "Delivered",
  DOCUMENTS_SUBMITTED: "Docs Submitted",
  COMPLETED: "Completed",
};

const STATUS_COLORS: Record<TripStatus, { bg: string; color: string }> = {
  NEW: { bg: "#fef3c7", color: "#d97706" },
  DRIVER_PENDING: { bg: "#e0f2fe", color: "#0369a1" },
  DRIVER_ACCEPTED: { bg: "#dbeafe", color: "#1d4ed8" },
  DRIVER_REJECTED: { bg: "#fee2e2", color: "#dc2626" },
  REJECTED: { bg: "#fee2e2", color: "#dc2626" },
  PREPARING: { bg: "#ede9fe", color: "#6d28d9" },
  READY: { bg: "#dbeafe", color: "#1d4ed8" },
  IN_TRANSIT: { bg: "#ede9fe", color: "#5b21b6" },
  ON_HOLD: { bg: "#fef3c7", color: "#b45309" },
  REACHED: { bg: "#dcfce7", color: "#166534" },
  DELIVERED: { bg: "#bbf7d0", color: "#15803d" },
  DOCUMENTS_SUBMITTED: { bg: "#e0f2fe", color: "#0369a1" },
  COMPLETED: { bg: "#dcfce7", color: "#15803d" },
};

function getStatusLabel(s: string): string {
  return STATUS_LABELS[s as TripStatus] ?? s;
}

function getStatusColors(s: string): { bg: string; color: string } {
  return STATUS_COLORS[s as TripStatus] ?? { bg: "#f1f5f9", color: "#475569" };
}

// ─── Seed data (fallback) ──────────────────────────────────────────────────────

const seedTrips: Trip[] = [
  {
    id: "req-1",
    reference: "DR-101",
    customer: "Ultratech Cement",
    origin: "Solapur MIDC",
    destination: "Koregaon Village",
    date: "18 Aug 2026",
    time: "08:30",
    requestedDeliveryDate: "19 Aug 2026",
    requestedDeliveryTime: "12:00",
    cargoMaterial: "Portland Cement",
    cargoCompany: "Ultratech Cement",
    cargoWeight: "15 tons",
    cargoType: "Bagged",
    noOfBags: "300 bags",
    createdAt: "16 Aug 2026 · 10:15 AM",
    passengers: 300,
    status: "IN_TRANSIT",
    driver: "Ramesh Yadav",
    driverNumber: "DRV-021",
    pickupDate: "18 Aug 2026",
    pickupTime: "08:30",
    estimatedDropDate: "19 Aug 2026",
    estimatedDropTime: "12:00",
    cargo: {
      material: "Portland Cement",
      company: "Ultratech Cement",
      quantity: "15 tons",
      noOfBags: "300 bags",
      loadType: "Bagged",
    },
    truck: {
      number: "MH-01-AB-1234",
      type: "Body",
      configuration: "12 tyre",
      brand: "Tata Motors",
    },
    fuel: {
      assigned: "120 L",
      received: "120 L",
      station: "BPCL Hotgi Road",
      fulfilledAt: "18 Aug 2026 · 09:00",
    },
    cash: { advance: "₹25,000", paymentMode: "UPI" },
    documents: [],
    extras: [],
  },
  {
    id: "req-3",
    reference: "DR-103",
    customer: "Shree Cement",
    origin: "Hotgi Road, Solapur",
    destination: "Tuljapur Village",
    date: "19 Aug 2026",
    time: "14:15",
    createdAt: "16 Aug 2026 · 09:20 AM",
    passengers: 0,
    status: "NEW",
    documents: [],
    extras: [],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OpsDashboard() {
  const [role, setRole] = useState<Role>("Coordinator");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>(
    [],
  );
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    fetch("/api/mock-db")
      .then((r) => {
        if (!r.ok) throw new Error("DB unavailable");
        return r.json();
      })
      .then((data) => {
        setTrips(data.trips || []);
        setFollowups(data.followups || []);
        setFuelTransactions(data.fuelTransactions || []);
        setDrivers(data.drivers || []);
        setVehicles(data.vehicles || []);
        setDbReady(true);
      })
      .catch(() => setDbError("Unable to load mock database"));
  }, []);

  async function persist(
    collection:
      | "trips"
      | "extras"
      | "documents"
      | "followups"
      | "fuel-transactions"
      | "drivers",
    data: unknown,
  ) {
    const response = await fetch("/api/mock-db", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection, data }),
    });
    if (!response.ok) throw new Error("Mock database write failed");
    return response.json();
  }

  const [tripsFilter, setTripsFilter] = useState("All");
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState<Trip | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupTripFilter, setFollowupTripFilter] = useState("");
  const [editTarget, setEditTarget] = useState<Trip | null>(null);
  const [approvePendingTrip, setApprovePendingTrip] = useState<Trip | null>(
    null,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const newCount = trips.filter((t) => t.status === "NEW").length;
  const visibleTrips =
    role === "Driver"
      ? trips.filter((t) => t.driver === "Ramesh Yadav")
      : trips;
  const [docPurpose, setDocPurpose] = useState<"regular" | "submit_docs">(
    "regular",
  );

  // ─── Status Transition Handlers ──────────────────────────────────────────

  function updateTripStatus(
    tripId: string,
    status: TripStatus,
    extra?: Partial<Trip>,
  ) {
    const next = trips.map((t) =>
      t.id === tripId ? { ...t, status, ...extra } : t,
    );
    setTrips(next);
    void persist("trips", next);
    const updated = next.find((t) => t.id === tripId);
    if (updated) setSelected(updated);
    return updated;
  }

  // Operations: approve → DRIVER_PENDING (auto-creates trip + assigns driver/truck)
  function approveTrip(trip: Trip, driverObj?: Driver) {
    const driverName = driverObj?.name;
    const driverId = driverObj?.id ?? "";
    const vehicleRecord = driverObj
      ? vehicles.find((v) => v.truck_id === driverObj.truck_id)
      : undefined;
    const extra: Partial<Trip> = {
      status: "DRIVER_PENDING",
      driver: driverName ?? trip.driver,
      driverNumber: driverId || trip.driverNumber,
      pickupDate: trip.pickupDate || trip.date,
      pickupTime: trip.pickupTime || trip.time,
      estimatedDropDate: trip.estimatedDropDate || trip.date,
      estimatedDropTime: trip.estimatedDropTime || trip.time,
      cargo: trip.cargo ?? {
        material: trip.cargoMaterial || "Cement",
        company: trip.customer,
        quantity: trip.cargoWeight || "—",
        loadType: trip.cargoType ?? "Bagged",
      },
      truck: trip.truck ?? {
        number: driverObj?.truck_id || "Pending assignment",
        type: (vehicleRecord?.type === "Bulker" ? "Open" : "Body") as
          | "Body"
          | "Open",
        configuration: `${vehicleRecord?.tires_count ?? 12} tyre` as
          | "10 tyre"
          | "12 tyre"
          | "14 tyre"
          | "16 tyre",
        brand: vehicleRecord?.brand || "Tata Motors",
      },
      fuel: trip.fuel ?? {
        assigned: "120 L",
        received: "Awaiting receipt",
        station: "To be assigned",
        fulfilledAt: "Not fulfilled",
      },
      cash: trip.cash ?? { advance: "₹0", paymentMode: "UPI" as const },
    };
    const next = trips.map((t) => (t.id === trip.id ? { ...t, ...extra } : t));
    setTrips(next);
    if (driverObj) {
      const nextDrivers = drivers.map((d) =>
        d.id === driverObj.id ? { ...d, status: "unavailable" as const } : d,
      );
      setDrivers(nextDrivers);
      void persist("drivers", nextDrivers);
    }
    void persist("trips", next);
    setSelected(next.find((t) => t.id === trip.id) ?? null);
    notify(
      `${trip.reference} approved — sent to driver${driverObj ? ` (${driverObj.name})` : ""}`,
    );
  }

  function rejectTripByOps(trip: Trip) {
    updateTripStatus(trip.id, "REJECTED");
    notify(`${trip.reference} rejected by Operations`);
  }
  function acceptTripByDriver(trip: Trip) {
    updateTripStatus(trip.id, "DRIVER_ACCEPTED");
    notify(`${trip.reference} accepted by driver`);
  }
  function rejectTripByDriver(trip: Trip) {
    updateTripStatus(trip.id, "DRIVER_REJECTED");
    notify(`${trip.reference} rejected — returning to pending`);
  }
  function reAcceptAfterReject(trip: Trip) {
    updateTripStatus(trip.id, "DRIVER_PENDING");
    notify(`${trip.reference} — driver assignment re-sent`);
  }
  function markPreparing(trip: Trip) {
    updateTripStatus(trip.id, "PREPARING");
    notify(`${trip.reference} — preparation started`);
  }
  function markReady(trip: Trip) {
    updateTripStatus(trip.id, "READY");
    notify(`${trip.reference} — marked ready for departure`);
  }
  function startTrip(trip: Trip) {
    updateTripStatus(trip.id, "IN_TRANSIT");
    notify(`${trip.reference} — journey started`);
  }
  function holdTrip(trip: Trip) {
    updateTripStatus(trip.id, "ON_HOLD");
    notify(`${trip.reference} put on hold`);
  }
  function reachTrip(trip: Trip) {
    updateTripStatus(trip.id, "REACHED");
    notify(`${trip.reference} — driver reached destination`);
  }
  function markDelivered(trip: Trip) {
    updateTripStatus(trip.id, "DELIVERED");
    notify(`${trip.reference} — marked delivered`);
  }
  function completeTrip(trip: Trip) {
    updateTripStatus(trip.id, "COMPLETED");
    notify(`${trip.reference} — trip completed by Operations!`);
  }

  function addTrip(data: Trip) {
    const next = [data, ...trips];
    setTrips(next);
    void persist("trips", next);
    setShowCreate(false);
    notify("Trip created");
  }

  function sendReminder(trip: Trip) {
    notify(`Reminder sent to Operations for ${trip.reference}`);
  }

  async function updateTrip(data: Partial<Trip>) {
    if (!editTarget) return;
    const updated = { ...editTarget, ...data };
    const next = trips.map((t) => (t.id === updated.id ? updated : t));
    setTrips(next);
    setSelected(updated);
    await persist("trips", next);
    setEditTarget(null);
    notify(`${updated.reference} updated`);
  }

  function createFollowup(data: Omit<Followup, "id" | "createdAt" | "status">) {
    const now = new Date();
    const ts = `${now.getDate()} ${now.toLocaleString("en-GB", { month: "short" })} ${now.getFullYear()} · ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;
    const fu: Followup = {
      ...data,
      id: `fu-${Date.now()}`,
      createdAt: ts,
      status: "Open",
    };
    const next = [fu, ...followups];
    setFollowups(next);
    void persist("followups", next);
    setShowFollowup(false);
    notify("Follow-up created");
  }

  function sendToPump(tx: FuelTransaction) {
    const next = fuelTransactions.map((t) =>
      t.id === tx.id ? { ...t, status: "Sent" as const } : t,
    );
    setFuelTransactions(next);
    void persist("fuel-transactions", next);
    notify(`Fuel sent to pump for ${tx.tripRef}`);
  }
  function resendToPump(tx: FuelTransaction) {
    const next = fuelTransactions.map((t) =>
      t.id === tx.id ? { ...t, status: "Resent" as const } : t,
    );
    setFuelTransactions(next);
    void persist("fuel-transactions", next);
    notify(`Fuel resent to pump for ${tx.tripRef}`);
  }

  async function addExtra(data: Extra) {
    const tripId = selected?.id;
    if (!tripId) return;
    const entity = { ...data, tripId };
    const currentExtras = trips.flatMap((t) =>
      t.extras.map((e) => ({ ...e, tripId: t.id })),
    );
    const nextExtras = [...currentExtras, entity];
    const result = await persist("extras", nextExtras);
    const hydratedTrip = result.trip as Trip | undefined;
    const next = trips.map((t) =>
      t.id === tripId
        ? { ...t, extras: hydratedTrip?.extras || [...t.extras, data] }
        : t,
    );
    setTrips(next);
    setSelected(next.find((t) => t.id === tripId) || selected);
    setShowExtra(false);
    notify(`${data.type} request submitted`);
  }

  async function addDocument(data: TripDocument) {
    const tripId = selected?.id;
    if (!tripId) return;
    const entity = { ...data, tripId };
    const currentDocuments = trips.flatMap((t) =>
      t.documents.map((d) => ({ ...d, tripId: t.id })),
    );
    const nextDocuments = [...currentDocuments, entity];
    const result = await persist("documents", nextDocuments);
    const hydratedTrip = result.trip as Trip | undefined;
    const next = trips.map((t) => {
      if (t.id !== tripId) return t;
      const updatedDocs = hydratedTrip?.documents || [...t.documents, data];
      return { ...t, documents: updatedDocs };
    });
    setTrips(next);
    setSelected(next.find((t) => t.id === tripId) || selected);
    setShowDocument(false);
    notify(`${data.type} document uploaded`);
  }

  // Driver submits stamped docs after delivery (DELIVERED → DOCUMENTS_SUBMITTED)
  async function submitStampedDocs(data: TripDocument) {
    const tripId = selected?.id;
    if (!tripId) return;
    const entity = { ...data, tripId };
    const currentDocuments = trips.flatMap((t) =>
      t.documents.map((d) => ({ ...d, tripId: t.id })),
    );
    const nextDocuments = [...currentDocuments, entity];
    const result = await persist("documents", nextDocuments);
    const hydratedTrip = result.trip as Trip | undefined;
    const next = trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        documents: hydratedTrip?.documents || [...t.documents, data],
        status: "DOCUMENTS_SUBMITTED" as TripStatus,
      };
    });
    setTrips(next);
    setSelected(next.find((t) => t.id === tripId) || selected);
    setShowDocument(false);
    notify("Stamped documents submitted — awaiting Ops verification");
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const title =
    view === "dashboard"
      ? `Namaste, ${ROLE_GREETINGS[role]}`
      : view === "trips" || view === "trip-detail"
        ? "Trips"
        : view === "followups"
          ? "Follow-ups"
          : view === "fuel"
            ? "Fuel Transactions"
            : view === "reports-ops"
              ? "Trip Operations Report"
              : view === "reports-fuel"
                ? "Fuel & Trip Expense Report"
                : "Overview";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <span>Dev Roadways</span>
        </div>
        <div className="workspace">
          Operations workspace{" "}
          <CaretDown size={14} style={{ display: "inline", marginLeft: 4 }} />
        </div>
        <nav>
          {role === "Super Admin" ? (
            <>
              <NavItem
                active={view === "dashboard"}
                label="Overview"
                onClick={() => setView("dashboard")}
                icon={<House size={18} />}
              />
              <NavItem
                active={view === "reports-ops"}
                label="Trip Operations"
                onClick={() => setView("reports-ops")}
                icon={<ChartPie size={18} />}
              />
              <NavItem
                active={view === "reports-fuel"}
                label="Fuel &amp; Expenses"
                onClick={() => setView("reports-fuel")}
                icon={<GasPump size={18} />}
              />
            </>
          ) : (
            <>
              <NavItem
                active={view === "dashboard"}
                label="Overview"
                onClick={() => setView("dashboard")}
                icon={<House size={18} />}
              />
              <NavItem
                active={view === "trips"}
                label="Trips"
                count={newCount || undefined}
                onClick={() => setView("trips")}
                icon={<Truck size={18} />}
              />
              {role === "Operations" && (
                <NavItem
                  active={view === "followups"}
                  label="Follow-ups"
                  count={
                    followups.filter((f) => f.status === "Open").length ||
                    undefined
                  }
                  onClick={() => setView("followups")}
                  icon={<Clock size={18} />}
                />
              )}
              {role !== "Driver" && (
                <NavItem
                  active={view === "fuel"}
                  label="Fuel transactions"
                  onClick={() => setView("fuel")}
                  icon={<GasPump size={18} />}
                />
              )}
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="help">
            <QuestionMark size={16} />
            <span>Help centre</span>
          </div>
          <div className="profile">
            <span className="avatar">AC</span>
            <span>
              <b>Alex Cooper</b>
              <small>{role}</small>
            </span>
            <span className="more">
              <DotsThree size={18} />
            </span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(true)}
          >
            <List size={20} />
          </button>
          <div className="crumb">
            {role === "Super Admin" ? "Admin" : "Operations"} <span>/</span>{" "}
            {view === "dashboard" ? "Overview" : title}
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="role-switch">
              <span>Viewing as</span>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  setView(
                    e.target.value === "Super Admin"
                      ? "dashboard"
                      : "dashboard",
                  );
                }}
                aria-label="Select role"
              >
                <option>Coordinator</option>
                <option>Operations</option>
                <option>Driver</option>
                <option>Super Admin</option>
              </select>
            </div>
          </div>
        </header>

        <div className="content">
          {!dbReady && !dbError && (
            <div className="panel db-state">Loading mock database…</div>
          )}
          {dbError && <div className="panel db-state error">{dbError}</div>}
          {dbReady && (
            <>
              <div className="page-heading">
                <div>
                  <h1>{title}</h1>
                  {/* {view === "dashboard" && role !== "Driver" && (
                    <p className="subheading">
                      Keep every journey moving, from request to arrival.
                    </p>
                  )} */}
                </div>
                {role === "Coordinator" &&
                  (view === "dashboard" || view === "trips") && (
                    <div className="heading-actions">
                      <button
                        className="button secondary"
                        onClick={() => setShowImport(true)}
                      >
                        <UploadSimple
                          size={16}
                          style={{ display: "inline", marginRight: 6 }}
                        />
                        <span>Import Excel</span>
                      </button>
                      <button
                        className="button primary"
                        onClick={() => setShowCreate(true)}
                      >
                        <Plus
                          size={16}
                          style={{ display: "inline", marginRight: 6 }}
                        />
                        <span>New trip</span>
                      </button>
                    </div>
                  )}
              </div>

              {view === "dashboard" && (
                <Dashboard
                  trips={visibleTrips}
                  role={role}
                  onMetricClick={(f) => {
                    setTripsFilter(f);
                    setView("trips");
                  }}
                />
              )}
              {view === "trips" && (
                <TripList
                  trips={visibleTrips}
                  role={role}
                  onOpen={(t) => {
                    setSelected(t);
                    setView("trip-detail");
                  }}
                  onCreate={() => setShowCreate(true)}
                  onImport={() => setShowImport(true)}
                  filter={tripsFilter}
                  setFilter={setTripsFilter}
                />
              )}
              {view === "trip-detail" && selected && (
                <TripDetail
                  trip={selected}
                  role={role}
                  onBack={() => setView("trips")}
                  onExtra={() => setShowExtra(true)}
                  onDocument={() => {
                    setDocPurpose("regular");
                    setShowDocument(true);
                  }}
                  onEdit={() => {
                    if (role !== "Driver") setEditTarget(selected);
                  }}
                  onFollowup={
                    role === "Operations"
                      ? () => {
                          setFollowupTripFilter(selected.reference);
                          setView("followups");
                        }
                      : undefined
                  }
                  onApprove={(t) => setApprovePendingTrip(t)}
                  onOpsReject={rejectTripByOps}
                  onAccept={acceptTripByDriver}
                  onDvReject={rejectTripByDriver}
                  onReAccept={reAcceptAfterReject}
                  onMarkPreparing={markPreparing}
                  onMarkReady={markReady}
                  onStart={startTrip}
                  onHold={holdTrip}
                  onReach={reachTrip}
                  onMarkDelivered={markDelivered}
                  onSubmitDocs={() => {
                    setDocPurpose("submit_docs");
                    setShowDocument(true);
                  }}
                  onCompleteTrip={completeTrip}
                  onReminder={() => sendReminder(selected)}
                />
              )}
              {view === "followups" && role === "Operations" && (
                <FollowupsPage
                  followups={followups}
                  trips={trips}
                  defaultTripFilter={followupTripFilter}
                  onClearDefaultFilter={() => setFollowupTripFilter("")}
                  onCall={(fu) => {
                    window.location.href = `tel:${fu.driverPhone}`;
                  }}
                  onOpenTrip={(tripId) => {
                    const t = trips.find((x) => x.id === tripId);
                    if (t) {
                      setSelected(t);
                      setView("trip-detail");
                    }
                  }}
                  onCreate={() => setShowFollowup(true)}
                />
              )}
              {view === "fuel" && role !== "Driver" && (
                <FuelTransactionsPage
                  transactions={fuelTransactions}
                  onSendToPump={sendToPump}
                  onResend={resendToPump}
                />
              )}
              {view === "reports-ops" && (
                <TripOpsReport
                  trips={trips}
                  onMetricClick={(f) => {
                    setTripsFilter(f);
                    setView("trips");
                  }}
                />
              )}
              {view === "reports-fuel" && <FuelExpenseReport trips={trips} />}
            </>
          )}
        </div>
      </main>

      {/* Mobile nav */}
      {mobileNavOpen && (
        <div
          className="mobile-nav-layer"
          role="presentation"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="mobile-drawer"
            role="dialog"
            aria-label="Mobile navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div className="brand">
                <span className="brand-mark">D</span>
                <span>Dev Roadways</span>
              </div>
              <button
                className="drawer-close"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="workspace">
              Operations workspace{" "}
              <CaretDown
                size={14}
                style={{ display: "inline", marginLeft: 4 }}
              />
            </div>
            <nav>
              {role === "Super Admin" ? (
                <>
                  <NavItem
                    active={view === "dashboard"}
                    label="Overview"
                    onClick={() => {
                      setView("dashboard");
                      setMobileNavOpen(false);
                    }}
                    icon={<House size={18} />}
                  />
                  <NavItem
                    active={view === "reports-ops"}
                    label="Trip Operations"
                    onClick={() => {
                      setView("reports-ops");
                      setMobileNavOpen(false);
                    }}
                    icon={<ChartPie size={18} />}
                  />
                  <NavItem
                    active={view === "reports-fuel"}
                    label="Fuel &amp; Expenses"
                    onClick={() => {
                      setView("reports-fuel");
                      setMobileNavOpen(false);
                    }}
                    icon={<GasPump size={18} />}
                  />
                </>
              ) : (
                <>
                  <NavItem
                    active={view === "dashboard"}
                    label="Overview"
                    onClick={() => {
                      setView("dashboard");
                      setMobileNavOpen(false);
                    }}
                    icon={<House size={18} />}
                  />
                  <NavItem
                    active={view === "trips"}
                    label="Trips"
                    count={newCount || undefined}
                    onClick={() => {
                      setView("trips");
                      setMobileNavOpen(false);
                    }}
                    icon={<Truck size={18} />}
                  />
                  {role === "Operations" && (
                    <NavItem
                      active={view === "followups"}
                      label="Follow-ups"
                      count={
                        followups.filter((f) => f.status === "Open").length ||
                        undefined
                      }
                      onClick={() => {
                        setView("followups");
                        setMobileNavOpen(false);
                      }}
                      icon={<Clock size={18} />}
                    />
                  )}
                  {role !== "Driver" && (
                    <NavItem
                      active={view === "fuel"}
                      label="Fuel transactions"
                      onClick={() => {
                        setView("fuel");
                        setMobileNavOpen(false);
                      }}
                      icon={<GasPump size={18} />}
                    />
                  )}
                </>
              )}
            </nav>
            <div className="mobile-drawer-footer">
              <div className="help">
                <QuestionMark size={16} />
                <span>Help centre</span>
              </div>
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

      {toast && (
        <div className="toast">
          <Check
            size={16}
            style={{ display: "inline", marginRight: 6, color: "#10b981" }}
          />{" "}
          {toast}
        </div>
      )}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreate={addTrip} />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => {
            setShowImport(false);
            notify("Excel preview validated — 2 trips ready");
          }}
        />
      )}
      {showExtra && (
        <ExtraModal onClose={() => setShowExtra(false)} onCreate={addExtra} />
      )}
      {showDocument && docPurpose === "submit_docs" ? (
        <DocumentModal
          onClose={() => setShowDocument(false)}
          onCreate={submitStampedDocs}
          isStamped
        />
      ) : (
        showDocument && (
          <DocumentModal
            onClose={() => setShowDocument(false)}
            onCreate={addDocument}
          />
        )
      )}
      {showFollowup && (
        <FollowupModal
          trips={trips}
          onClose={() => setShowFollowup(false)}
          onCreate={createFollowup}
        />
      )}
      {editTarget && (
        <EditModal
          entity={editTarget}
          drivers={drivers}
          vehicles={vehicles}
          role={role}
          onClose={() => setEditTarget(null)}
          onSave={updateTrip}
        />
      )}
      {approvePendingTrip && (
        <AssignDriverModal
          trip={approvePendingTrip}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setApprovePendingTrip(null)}
          onConfirm={(driver) => {
            approveTrip(approvePendingTrip, driver);
            setApprovePendingTrip(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavItem({
  label,
  icon,
  count,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {icon}
      </span>
      {label}
      {count ? <em>{count}</em> : null}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { bg, color } = getStatusColors(status);
  return (
    <span className="status" style={{ background: bg, color }}>
      {getStatusLabel(status)}
    </span>
  );
}

// Legacy Status component for compatibility (used by followups, fuel etc.)
function Status({ children }: { children: string }) {
  return (
    <span className={`status ${children.toLowerCase().replace(/\s+/g, "-")}`}>
      {children}
    </span>
  );
}

function Dashboard({
  trips,
  role,
  onMetricClick,
}: {
  trips: Trip[];
  role: Role;
  onMetricClick: (f: string) => void;
}) {
  const newTrips = trips.filter((t) => t.status === "NEW");
  const pendingTrips = trips.filter((t) =>
    ["DRIVER_PENDING", "DRIVER_ACCEPTED", "PREPARING", "READY"].includes(
      t.status,
    ),
  );
  const activeTrips = trips.filter((t) =>
    ["IN_TRANSIT", "ON_HOLD", "REACHED"].includes(t.status),
  );
  const deliveredTrips = trips.filter((t) =>
    ["DELIVERED", "DOCUMENTS_SUBMITTED"].includes(t.status),
  );
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const rejectedTrips = trips.filter((t) =>
    ["REJECTED", "DRIVER_REJECTED"].includes(t.status),
  );

  return (
    <section
      className="stats"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        width: "100%",
      }}
    >
      {role !== "Driver" && (
        <Stat
          label="New Trips"
          value={newTrips.length}
          tone="blue"
          hint="Awaiting Ops review"
          icon={<Clock size={18} />}
          onClick={() => onMetricClick("New")}
        />
      )}
      <Stat
        label="Pending Start"
        value={pendingTrips.length}
        tone="blue"
        hint="Assigned · Pre-trip"
        icon={<Truck size={18} />}
        onClick={() => onMetricClick("Pending")}
      />
      <Stat
        label="Active Trips"
        value={activeTrips.length}
        tone="purple"
        hint="Currently in transit"
        icon={<Truck size={18} />}
        onClick={() => onMetricClick("Active")}
      />
      <Stat
        label="Delivered"
        value={deliveredTrips.length}
        tone="green"
        hint="Awaiting docs/verify"
        icon={<ChartPie size={18} />}
        onClick={() => onMetricClick("Delivered")}
      />
      <Stat
        label="Completed"
        value={completedTrips.length}
        tone="green"
        hint="Finalized"
        icon={<ChartPie size={18} />}
        onClick={() => onMetricClick("Completed")}
      />
      {role !== "Driver" && (
        <Stat
          label="Rejected"
          value={rejectedTrips.length}
          tone="red"
          hint="Ops / Driver rejected"
          icon={<Clock size={18} />}
          onClick={() => onMetricClick("Rejected")}
        />
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
  icon,
  onClick,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="stat"
      style={{
        textAlign: "left",
        border: "1px solid var(--line)",
        background: "var(--surface)",
        cursor: "pointer",
        width: "100%",
      }}
      onClick={onClick}
    >
      {icon && <span className={`stat-icon ${tone}`}>{icon}</span>}
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </button>
  );
}

function TripRow({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  return (
    <button className="trip-card" onClick={onClick}>
      <span className="trip-date">
        <b>{trip.date.split(" ")[0]}</b>
        <small>{trip.date.split(" ")[1]}</small>
      </span>
      <span className="request-main">
        <b>
          {trip.reference} · {trip.customer}
        </b>
        <small>
          {trip.origin}{" "}
          <ArrowRight
            size={12}
            style={{ display: "inline", margin: "0 2px", color: "#a4adba" }}
          />{" "}
          {trip.destination}
        </small>
      </span>
      <StatusBadge status={trip.status} />
      <span className="chevron">
        <CaretRight size={16} />
      </span>
    </button>
  );
}

function DateRangeFilter({
  dateFrom,
  dateTo,
  onFrom,
  onTo,
}: {
  dateFrom: string;
  dateTo: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  return (
    <div className="date-range-filter" style={{ gap: 10 }}>
      <label className="date-range-label" style={{ minWidth: 120 }}>
        <span>From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onFrom(e.target.value)}
          className="date-range-input"
        />
      </label>
      <label className="date-range-label" style={{ minWidth: 120 }}>
        <span>To</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onTo(e.target.value)}
          className="date-range-input"
        />
      </label>
      {(dateFrom || dateTo) && (
        <button
          className="filter"
          style={{ padding: "4px 10px", fontSize: 11 }}
          onClick={() => {
            onFrom("");
            onTo("");
          }}
          aria-label="Clear date filter"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

function parseTripDate(trip: Trip): Date | null {
  try {
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const p = trip.date.trim().split(" ");
    if (p.length === 3)
      return new Date(Number(p[2]), months[p[1]] ?? 0, Number(p[0]));
    return null;
  } catch {
    return null;
  }
}

function TripList({
  trips,
  role,
  onOpen,
  onCreate,
  onImport,
  filter,
  setFilter,
}: {
  trips: Trip[];
  role: Role;
  onOpen: (t: Trip) => void;
  onCreate: () => void;
  onImport: () => void;
  filter: string;
  setFilter: (f: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [draftStatus, setDraftStatus] = useState("All");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

  const FILTER_GROUPS: Record<string, TripStatus[]> = {
    All: [],
    New: ["NEW"],
    "Waiting for Driver": ["DRIVER_PENDING"],
    "Driver Accepted": ["DRIVER_ACCEPTED"],
    Preparing: ["PREPARING"],
    "Ready to Start": ["READY"],
    "In Transit": ["IN_TRANSIT"],
    "On Hold": ["ON_HOLD"],
    Reached: ["REACHED"],
    Delivered: ["DELIVERED"],
    "Documents Submitted": ["DOCUMENTS_SUBMITTED"],
    Completed: ["COMPLETED"],
    Rejected: ["REJECTED", "DRIVER_REJECTED"],
    "Driver Rejected": ["DRIVER_REJECTED"],
  };

  const filtered = trips.filter((t) => {
    const matchesFilter =
      statusFilter === "All" ||
      (FILTER_GROUPS[statusFilter]?.includes(t.status) ?? false);
    const matchesQuery =
      `${t.reference} ${t.customer} ${t.origin} ${t.destination}`
        .toLowerCase()
        .includes(query.toLowerCase());
    const td = parseTripDate(t);
    const matchesFrom = !dateFrom || (td && td >= new Date(dateFrom));
    const matchesTo = !dateTo || (td && td <= new Date(dateTo + "T23:59:59"));
    return matchesFilter && matchesQuery && matchesFrom && matchesTo;
  });
  const sorted = [...filtered].sort((a, b) => {
    const ad = parseTripDate(a)?.getTime() ?? 0;
    const bd = parseTripDate(b)?.getTime() ?? 0;
    return sortNewestFirst ? bd - ad : ad - bd;
  });
  const activeFilters =
    (statusFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  const activeChips = [
    statusFilter !== "All" ? statusFilter : "",
    dateFrom ? `From ${dateFrom}` : "",
    dateTo ? `To ${dateTo}` : "",
  ].filter(Boolean);
  const statusOptions = [
    "All",
    "New",
    "Waiting for Driver",
    "Driver Accepted",
    "Preparing",
    "Ready to Start",
    "In Transit",
    "On Hold",
    "Reached",
    "Delivered",
    "Documents Submitted",
    "Completed",
    "Rejected",
    "Driver Rejected",
  ];

  function openFilters() {
    setDraftStatus(statusFilter);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setShowFilters(true);
  }

  function clearAllFilters() {
    setDraftStatus("All");
    setDraftDateFrom("");
    setDraftDateTo("");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
    setShowFilters(false);
  }

  function applyFilters() {
    setStatusFilter(draftStatus);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setShowFilters(false);
  }

  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{trips.length} trips</h2>
        </div>
        {role === "Coordinator" && (
          <div className="panel-header-actions">
            <button
              className="icon-create"
              aria-label="Import Excel"
              title="Import Excel"
              onClick={onImport}
            >
              <UploadSimple size={16} />
            </button>
            <button
              className="icon-create"
              aria-label="New trip"
              title="New trip"
              onClick={onCreate}
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="filters" style={{ alignItems: "center", gap: 10 }}>
        <div className="search">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", marginRight: 4 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reference or customer"
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            className="icon-create"
            aria-label={sortNewestFirst ? "Sort oldest first" : "Sort newest first"}
            title={sortNewestFirst ? "Newest first" : "Oldest first"}
            onClick={() => setSortNewestFirst((v) => !v)}
            style={{ width: 40, height: 40, minWidth: 40 }}
          >
            <ArrowRight
              size={16}
              style={{
                transform: sortNewestFirst ? "rotate(-90deg)" : "rotate(90deg)",
                transition: "transform .2s",
              }}
            />
          </button>
          <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            className="button secondary"
            aria-label="Open filters"
            title="Filters"
            onClick={() => (showFilters ? setShowFilters(false) : openFilters())}
            style={{ height: 40, padding: "0 14px", minWidth: 110, gap: 6 }}
          >
            <FunnelSimple size={16} />
            <span>Filter{activeFilters ? ` (${activeFilters})` : ""}</span>
          </button>
          {showFilters && (
            <>
              <div
                role="presentation"
                onClick={() => setShowFilters(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.18)",
                  zIndex: 30,
                }}
              />
              <div
                role="dialog"
                aria-label="Trip filters"
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 40,
                  background: "#fff",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  boxShadow: "0 -16px 40px rgba(15, 23, 42, 0.14)",
                  padding: "12px 16px 16px",
                  maxHeight: "72vh",
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 4,
                    borderRadius: 999,
                    background: "#dbe3ee",
                    margin: "0 auto 12px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <b style={{ fontSize: 15 }}>Filters</b>
                  <button
                    className="text-button"
                    style={{ fontSize: 12, padding: 0 }}
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                </div>
                {activeChips.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {activeChips.map((chip) => (
                      <button
                        key={chip}
                        className="filter active"
                        style={{ fontSize: 11, paddingRight: 10 }}
                        onClick={() => {
                          if (chip === statusFilter) setStatusFilter("All");
                          if (chip.startsWith("From ")) setDateFrom("");
                          if (chip.startsWith("To ")) setDateTo("");
                        }}
                      >
                        {chip} <span style={{ marginLeft: 6 }}>×</span>
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--muted-ink)",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    Trip Status
                  </p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {statusOptions.map((f) => (
                      <button
                        key={f}
                        className={draftStatus === f ? "filter active" : "filter"}
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          fontSize: 13,
                        }}
                        onClick={() => setDraftStatus(f)}
                      >
                        <span>{f}</span>
                        {draftStatus === f && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--muted-ink)",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    Date Range
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <label className="date-range-label" style={{ minWidth: 0 }}>
                      <span>From</span>
                      <input
                        type="date"
                        value={draftDateFrom}
                        onChange={(e) => setDraftDateFrom(e.target.value)}
                        className="date-range-input"
                      />
                    </label>
                    <label className="date-range-label" style={{ minWidth: 0 }}>
                      <span>To</span>
                      <input
                        type="date"
                        value={draftDateTo}
                        onChange={(e) => setDraftDateTo(e.target.value)}
                        className="date-range-input"
                      />
                    </label>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  <button
                    className="button secondary"
                    onClick={clearAllFilters}
                    type="button"
                  >
                    Clear All
                  </button>
                  <button
                    className="button primary"
                    onClick={applyFilters}
                    type="button"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
      {activeChips.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            margin: "0 0 10px",
          }}
        >
          {activeChips.map((chip) => (
            <button
              key={chip}
              className="filter active"
              style={{ fontSize: 11, paddingRight: 10 }}
              onClick={() => {
                if (chip === statusFilter) setStatusFilter("All");
                if (chip.startsWith("From ")) setDateFrom("");
                if (chip.startsWith("To ")) setDateTo("");
              }}
            >
              {chip} <span style={{ marginLeft: 6 }}>×</span>
            </button>
          ))}
        </div>
      )}
      {sorted.map((t) => (
        <div key={t.id}>
          <TripRow trip={t} onClick={() => onOpen(t)} />
        </div>
      ))}
      {!sorted.length && <Empty label="No trips match" />}
    </section>
  );
}

function TripDetail({
  trip,
  role,
  onBack,
  onExtra,
  onDocument,
  onEdit,
  onFollowup,
  onApprove,
  onOpsReject,
  onAccept,
  onDvReject,
  onReAccept,
  onMarkPreparing,
  onMarkReady,
  onStart,
  onHold,
  onReach,
  onMarkDelivered,
  onSubmitDocs,
  onCompleteTrip,
  onReminder,
}: {
  trip: Trip;
  role: Role;
  onBack: () => void;
  onExtra: () => void;
  onDocument: () => void;
  onEdit: () => void;
  onFollowup?: () => void;
  onApprove: (t: Trip) => void;
  onOpsReject: (t: Trip) => void;
  onAccept: (t: Trip) => void;
  onDvReject: (t: Trip) => void;
  onReAccept: (t: Trip) => void;
  onMarkPreparing: (t: Trip) => void;
  onMarkReady: (t: Trip) => void;
  onStart: (t: Trip) => void;
  onHold: (t: Trip) => void;
  onReach: (t: Trip) => void;
  onMarkDelivered: (t: Trip) => void;
  onSubmitDocs: () => void;
  onCompleteTrip: (t: Trip) => void;
  onReminder: () => void;
}) {
  const isPendingReview = trip.status === "NEW";
  const hasAssignment = !["NEW", "REJECTED"].includes(trip.status);

  return (
    <section className="detail">
      <button className="back" onClick={onBack}>
        <ArrowLeft size={16} style={{ display: "inline", marginRight: 4 }} />{" "}
        Back to trips
      </button>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">Trip</p>
          <h1>{trip.reference}</h1>
          <p className="subheading">
            {trip.customer} · Created {trip.createdAt}
          </p>
        </div>
        <div
          className="detail-heading-right"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
          }}
        >
          <StatusBadge status={trip.status} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {role === "Operations" && onFollowup && (
              <button
                className="button secondary compact"
                onClick={onFollowup}
                style={{ height: 32 }}
              >
                <span>Followups</span>
              </button>
            )}
            {(role === "Coordinator" || role === "Operations") && (
              <button
                className="quick-action-icon"
                aria-label="Edit trip"
                title="Edit trip"
                onClick={onEdit}
                style={{ width: 32, height: 32 }}
              >
                <PencilSimple size={16} />
              </button>
            )}
            {role === "Driver" &&
              [
                "PREPARING",
                "READY",
                "IN_TRANSIT",
                "ON_HOLD",
                "REACHED",
                "DELIVERED",
              ].includes(trip.status) && (
                <div className="detail-quick-actions">
                  <button
                    className="quick-action-icon"
                    aria-label="Upload trip document"
                    title="Upload trip document"
                    onClick={onDocument}
                  >
                    <UploadSimple size={16} />
                  </button>
                  <button
                    className="quick-action-icon"
                    aria-label="Submit extra request"
                    title="Submit extra request"
                    onClick={onExtra}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div
          className="panel"
          style={{
            gridColumn:
              role === "Operations" || isPendingReview ? "span 2" : undefined,
          }}
        >
          <h2>Journey</h2>
          <div className="journey journey-times">
            <div>
              <small>Pickup</small>
              <b>{trip.origin}</b>
              <span>
                <em>Scheduled</em>
                <b>{trip.pickupDate || trip.date}</b>
                <b>{to12Hour(trip.pickupTime || trip.time)}</b>
              </span>
            </div>
            <ArrowRight
              size={18}
              style={{ color: "var(--blue)", marginTop: 20 }}
            />
            <div>
              <small>Drop-off</small>
              <b>{trip.destination}</b>
              <span>
                <em>Requested</em>
                <b>{trip.requestedDeliveryDate || trip.date}</b>
                <b>{to12Hour(trip.requestedDeliveryTime || trip.time)}</b>
              </span>
              {trip.estimatedDropDate && (
                <span>
                  <em>Estimated</em>
                  <b>{trip.estimatedDropDate}</b>
                  <b>{to12Hour(trip.estimatedDropTime || "")}</b>
                </span>
              )}
              <span>
                <em>Actual</em>
                {trip.actualDropDate ? (
                  <>
                    <b>{trip.actualDropDate}</b>
                    <b>{to12Hour(trip.actualDropTime || "")}</b>
                  </>
                ) : (
                  <b>Awaiting delivery</b>
                )}
              </span>
            </div>
          </div>
          <InfoSection title="Cargo details">
            <Info
              label="Material"
              value={trip.cargo?.material || trip.cargoMaterial || "Cement"}
            />
            <Info
              label="Company"
              value={trip.cargo?.company || trip.cargoCompany || trip.customer}
            />
            <Info
              label="Cargo weight"
              value={trip.cargo?.quantity || trip.cargoWeight || "—"}
            />
            <Info
              label="Cargo type"
              value={trip.cargo?.loadType || trip.cargoType || "Bagged"}
            />
            {(trip.cargo?.loadType || trip.cargoType) === "Bagged" && (
              <Info
                label="No. of bags"
                value={
                  trip.cargo?.noOfBags ||
                  trip.noOfBags ||
                  `${trip.passengers} bags`
                }
              />
            )}
          </InfoSection>
          {hasAssignment && (
            <>
              <InfoSection title="Truck details">
                <Info
                  label="Truck number"
                  value={trip.truck?.number || "Pending assignment"}
                />
                <Info label="Truck type" value={trip.truck?.type || "Body"} />
                <Info
                  label="Configuration"
                  value={trip.truck?.configuration || "12 tyre"}
                />
                <Info
                  label="Truck brand"
                  value={trip.truck?.brand || "Tata Motors"}
                />
              </InfoSection>
              <InfoSection title="Driver details">
                <Info label="Driver name" value={trip.driver || "Unassigned"} />
                <Info
                  label="Phone number"
                  value={trip.driverNumber || "Not available"}
                />
              </InfoSection>
              <InfoSection title="Fuel details">
                <Info
                  label="Assigned fuel"
                  value={trip.fuel?.assigned || "—"}
                />
                <Info
                  label="Received fuel"
                  value={trip.fuel?.received || "—"}
                />
                <Info label="Station name" value={trip.fuel?.station || "—"} />
                <Info
                  label="Fulfilled at"
                  value={trip.fuel?.fulfilledAt || "—"}
                />
              </InfoSection>
              <InfoSection title="Cash details">
                <Info
                  label="Advanced amount"
                  value={trip.cash?.advance || "—"}
                />
                <Info
                  label="Payment mode"
                  value={trip.cash?.paymentMode || "—"}
                />
              </InfoSection>
              <h2 className="activity-title section-title">Extra expenses</h2>
              {trip.extras.map((extra) => (
                <div className="extra-row" key={extra.id}>
                  <span className="extra-icon">
                    {extra.type === "Fuel" ? (
                      <GasPump size={16} />
                    ) : extra.type === "Cash" ? (
                      <CurrencyInr size={16} />
                    ) : (
                      <Drop size={16} />
                    )}
                  </span>
                  <div>
                    <b>Extra {extra.type} request</b>
                    <p>{extra.note}</p>
                  </div>
                  <strong>{extra.amount}</strong>
                </div>
              ))}
              {!trip.extras.length && <Empty label="No extra expenses" />}
              <h2 className="activity-title">Trip documents</h2>
              {trip.documents.map((doc) => (
                <div className="extra-row" key={doc.id}>
                  <span className="extra-icon">
                    <FileText size={16} />
                  </span>
                  <div>
                    <b>{doc.name}</b>
                    <p>
                      {doc.type} · {doc.uploadedAt}
                    </p>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>
              ))}
              {!trip.documents.length && (
                <Empty label="No documents uploaded" />
              )}
            </>
          )}
          {role === "Coordinator" && trip.status === "NEW" && (
            <button
              className="button secondary wide"
              onClick={onReminder}
              style={{ marginTop: 20 }}
            >
              Send reminder to Operations
            </button>
          )}
        </div>

        {/* Operations: review NEW trip */}
        {role === "Operations" && trip.status === "NEW" && (
          <div className="panel action-panel">
            <h2>Review Request</h2>
            <p>
              Approve this request to assign a driver and move the trip to
              DRIVER_PENDING.
            </p>
            <button
              className="button primary wide"
              onClick={() => onApprove(trip)}
              style={{ marginTop: 12 }}
            >
              Approve &amp; Assign Driver
            </button>
            <button
              className="button danger wide"
              onClick={() => onOpsReject(trip)}
              style={{ marginTop: 8 }}
            >
              Reject request
            </button>
          </div>
        )}

        {/* Driver: accept/reject DRIVER_PENDING trip */}
        {role === "Driver" && trip.status === "DRIVER_PENDING" && (
          <div className="panel action-panel">
            <h2>Driver Assignment</h2>
            <p>
              You have been assigned to this trip. Please accept or reject it.
            </p>
            <button
              className="button primary wide"
              onClick={() => onAccept(trip)}
              style={{ marginTop: 12 }}
            >
              Accept assignment
            </button>
            <button
              className="button danger wide"
              onClick={() => onDvReject(trip)}
              style={{ marginTop: 8 }}
            >
              Reject assignment
            </button>
          </div>
        )}

        {/* Driver: rejected — re-accept flow */}
        {role === "Driver" && trip.status === "DRIVER_REJECTED" && (
          <div className="panel action-panel">
            <h2>Assignment Rejected</h2>
            <p>
              You previously rejected this trip. Operations can reassign or you
              may reconsider.
            </p>
            <button
              className="button primary wide"
              onClick={() => onReAccept(trip)}
              style={{ marginTop: 12 }}
            >
              Accept assignment
            </button>
          </div>
        )}

        {/* Driver: accepted — begin preparation */}
        {role === "Driver" && trip.status === "DRIVER_ACCEPTED" && (
          <div className="panel action-panel">
            <h2>Pre-Trip Preparation</h2>
            <p>
              You accepted this trip. Upload documents and mark as Preparing
              when ready.
            </p>
            <button
              className="button primary wide"
              onClick={onDocument}
              style={{ marginTop: 12 }}
            >
              <UploadSimple
                size={16}
                style={{ display: "inline", marginRight: 6 }}
              />{" "}
              Upload trip document
            </button>
            <button
              className="button primary wide"
              onClick={() => onMarkPreparing(trip)}
              style={{ marginTop: 8 }}
            >
              Start Preparing
            </button>
          </div>
        )}

        {/* Driver: preparing — upload docs, mark ready */}
        {role === "Driver" && trip.status === "PREPARING" && (
          <div className="panel action-panel">
            <h2>Pre-Trip Checklist</h2>
            <p>Complete pre-trip documents and mark Ready when all done.</p>
            <button
              className="button primary wide"
              onClick={onDocument}
              style={{ marginTop: 12 }}
            >
              <UploadSimple
                size={16}
                style={{ display: "inline", marginRight: 6 }}
              />{" "}
              Upload document
            </button>
            <button
              className="button primary wide"
              onClick={() => onMarkReady(trip)}
              style={{ marginTop: 8 }}
            >
              Mark Ready to Depart
            </button>
          </div>
        )}

        {/* Driver: ready — start trip */}
        {role === "Driver" && trip.status === "READY" && (
          <div className="panel action-panel">
            <h2>Ready for Departure</h2>
            <p>
              All pre-trip work complete. Start the journey when loaded and
              cleared.
            </p>
            <button
              className="button primary wide"
              onClick={() => onStart(trip)}
              style={{ marginTop: 12 }}
            >
              Start Trip
            </button>
          </div>
        )}

        {/* Driver: in-transit actions */}
        {role === "Driver" &&
          (trip.status === "IN_TRANSIT" || trip.status === "ON_HOLD") && (
            <div className="panel action-panel">
              <h2>In-Transit Actions</h2>
              <p>Manage journey status during the trip.</p>
              {trip.status === "IN_TRANSIT" ? (
                <button
                  className="button secondary wide"
                  onClick={() => onHold(trip)}
                  style={{ marginTop: 12 }}
                >
                  Put Trip On Hold
                </button>
              ) : (
                <button
                  className="button primary wide"
                  onClick={() => onStart(trip)}
                  style={{ marginTop: 12 }}
                >
                  Resume Trip
                </button>
              )}
              <button
                className="button primary wide"
                onClick={() => onReach(trip)}
                style={{ marginTop: 8 }}
              >
                Mark as Reached
              </button>
              <button
                className="button primary wide"
                onClick={onExtra}
                style={{ marginTop: 8 }}
              >
                <Plus size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
                Extra expense request
              </button>
            </div>
          )}

        {/* Driver: reached — mark delivered */}
        {role === "Driver" && trip.status === "REACHED" && (
          <div className="panel action-panel">
            <h2>Delivery Confirmation</h2>
            <p>Confirm delivery to the customer.</p>
            <button
              className="button primary wide"
              onClick={() => onMarkDelivered(trip)}
              style={{ marginTop: 12 }}
            >
              Mark as Delivered
            </button>
          </div>
        )}

        {/* Driver: delivered — submit stamped docs */}
        {role === "Driver" && trip.status === "DELIVERED" && (
          <div className="panel action-panel">
            <h2>Submit Stamped Documents</h2>
            <p>
              Upload the final stamped documents to submit for Operations
              review.
            </p>
            <button
              className="button primary wide"
              onClick={onSubmitDocs}
              style={{ marginTop: 12 }}
            >
              <UploadSimple
                size={16}
                style={{ display: "inline", marginRight: 6 }}
              />{" "}
              Upload Stamped Document
            </button>
          </div>
        )}

        {/* Operations/Admin: verify documents → complete */}
        {(role === "Operations" || role === "Super Admin") &&
          trip.status === "DOCUMENTS_SUBMITTED" && (
            <div className="panel action-panel">
              <h2>Verify Documents</h2>
              <p>
                Review submitted stamped documents and mark the trip as
                Completed.
              </p>
              <button
                className="button primary wide"
                onClick={() => onCompleteTrip(trip)}
                style={{ marginTop: 12 }}
              >
                <Check
                  size={16}
                  style={{ display: "inline", marginRight: 6 }}
                />{" "}
                Verify &amp; Complete Trip
              </button>
            </div>
          )}
      </div>
    </section>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="activity-title section-title">{title}</h2>
      <div className="info-grid compact-grid">{children}</div>
    </>
  );
}
function Empty({ label }: { label: string }) {
  return <div className="empty">{label}</div>;
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to12Hour(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function toDatetimeLocal(date: string, time: string): string {
  try {
    const months: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const p = date.trim().split(" ");
    if (p.length === 3) {
      const d = new Date(
        Number(p[2]),
        months[p[1]] ?? 0,
        Number(p[0]),
        Number(time.split(":")[0] || "0"),
        Number(time.split(":")[1] || "0"),
      );
      if (!isNaN(d.getTime()))
        return `${p[2]}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "";
  } catch {
    return "";
  }
}
function fromDatetimeLocal(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const d = new Date(value);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return {
    date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  entity,
  drivers,
  vehicles,
  role,
  onClose,
  onSave,
}: {
  entity: Trip;
  drivers: Driver[];
  vehicles: Vehicle[];
  role: Role;
  onClose: () => void;
  onSave: (data: Partial<Trip>) => void;
}) {
  const [reference, setReference] = useState(entity.reference);
  const [customer, setCustomer] = useState(entity.customer);
  const [origin, setOrigin] = useState(entity.origin);
  const [destination, setDestination] = useState(entity.destination);
  const [pickupDT, setPickupDT] = useState(
    toDatetimeLocal(entity.date, entity.time),
  );
  const [deliveryDT, setDeliveryDT] = useState(
    toDatetimeLocal(
      entity.requestedDeliveryDate || entity.date,
      entity.requestedDeliveryTime || entity.time,
    ),
  );
  const [cargoMaterial, setCargoMaterial] = useState(
    entity.cargoMaterial || "Cement",
  );
  const [cargoWeight, setCargoWeight] = useState(entity.cargoWeight || "");
  const [cargoType, setCargoType] = useState<Trip["cargoType"]>(
    entity.cargoType || "Bagged",
  );
  const [noOfBags, setNoOfBags] = useState(entity.noOfBags || "");
  const [selectedDriverId, setSelectedDriverId] = useState(
    entity.driverNumber ?? "",
  );
  const selectedDriver =
    role !== "Coordinator"
      ? (drivers.find((d) => d.id === selectedDriverId) ?? null)
      : null;
  const selectedVehicle = selectedDriver
    ? (vehicles.find((v) => v.truck_id === selectedDriver.truck_id) ?? null)
    : null;

  return (
    <Modal title="Edit trip" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const { date, time } = fromDatetimeLocal(pickupDT);
          const { date: dDate, time: dTime } = fromDatetimeLocal(deliveryDT);
          onSave({
            reference,
            customer,
            origin,
            destination,
            date,
            time,
            requestedDeliveryDate: dDate,
            requestedDeliveryTime: dTime,
            cargoMaterial,
            cargoWeight,
            cargoType,
            noOfBags,
            passengers: Number(noOfBags) || entity.passengers,
            ...(role !== "Coordinator" && {
              driver: selectedDriver?.name ?? entity.driver,
              driverNumber: selectedDriverId || entity.driverNumber,
            }),
          });
        }}
      >
        <label>
          Reference
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <label>
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Pickup
            <input value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </label>
          <label>
            Drop-off
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>
        </div>
        <label>
          Pickup date &amp; time
          <input
            type="datetime-local"
            value={pickupDT}
            onChange={(e) => setPickupDT(e.target.value)}
          />
        </label>
        <label>
          Delivery date &amp; time
          <input
            type="datetime-local"
            value={deliveryDT}
            onChange={(e) => setDeliveryDT(e.target.value)}
          />
        </label>
        <label>
          Material
          <input
            value={cargoMaterial}
            onChange={(e) => setCargoMaterial(e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Cargo weight
            <input
              value={cargoWeight}
              onChange={(e) => setCargoWeight(e.target.value)}
              placeholder="28 tonnes"
            />
          </label>
          <label>
            Cargo type
            <select
              value={cargoType}
              onChange={(e) =>
                setCargoType(e.target.value as Trip["cargoType"])
              }
            >
              <option value="Bagged">Bagged</option>
              <option value="Loose">Loose</option>
            </select>
          </label>
        </div>
        <label>
          No. of bags
          <input
            value={noOfBags}
            onChange={(e) => setNoOfBags(e.target.value)}
            placeholder="560 bags"
          />
        </label>
        {role !== "Coordinator" && (
          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <label style={{ display: "block", marginBottom: 6 }}>
              Assigned driver
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                style={{ marginTop: 6 }}
              >
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.source_location} · {d.truck_id}
                    {d.status === "unavailable" ? " (on trip)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {selectedDriver && (
              <div style={{ marginTop: 8 }}>
                <div
                  className="info-grid compact-grid"
                  style={{ marginBottom: 10 }}
                >
                  <Info
                    label="Phone"
                    value={String(selectedDriver.phone_number)}
                  />
                  <Info
                    label="Base location"
                    value={selectedDriver.source_location}
                  />
                  <Info
                    label="Status"
                    value={
                      selectedDriver.status === "unavailable"
                        ? "On trip"
                        : "Available"
                    }
                  />
                </div>
                {selectedVehicle && (
                  <>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--muted-ink)",
                        textTransform: "uppercase",
                        letterSpacing: ".07em",
                        margin: "10px 0 6px",
                      }}
                    >
                      Truck
                    </p>
                    <div
                      style={{
                        background: "var(--surface-alt, #f8fafc)",
                        border: "1px solid var(--line)",
                        borderRadius: 6,
                        padding: "10px 12px",
                      }}
                    >
                      <b
                        style={{
                          fontSize: 12,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        {selectedVehicle.brand} {selectedVehicle.model_name}
                      </b>
                      <div className="info-grid compact-grid">
                        <Info
                          label="Truck ID"
                          value={selectedVehicle.truck_id}
                        />
                        <Info label="Type" value={selectedVehicle.type} />
                        <Info
                          label="Tyres"
                          value={`${selectedVehicle.tires_count} tyres`}
                        />
                        <Info
                          label="Capacity"
                          value={selectedVehicle.load_capacity}
                        />
                        <Info
                          label="Mileage"
                          value={`${selectedVehicle.mileage_kmpl} km/L`}
                        />
                        <Info
                          label="BS6"
                          value={selectedVehicle.BS6 === "yes" ? "Yes" : "No"}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <button className="button primary wide" type="submit">
          Save changes
        </button>
      </form>
    </Modal>
  );
}

// ─── Auto-Assign Driver helpers (kept from git) ───────────────────────────────

function extractCity(location: string): string {
  const parts = location.split(",");
  return parts[parts.length - 1].trim().toLowerCase();
}
function scoreDriverForOrigin(driver: Driver, origin: string): number {
  if (!origin.trim()) return 0;
  const originTokens = origin
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
  const locTokens = driver.source_location
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2);
  return originTokens.reduce(
    (score, ow) =>
      score +
      (locTokens.some((lw) => lw.includes(ow) || ow.includes(lw)) ? 1 : 0),
    0,
  );
}
function scoreDriverForCity(driver: Driver, origin: string): number {
  const originCity = extractCity(origin);
  const driverCity = extractCity(driver.source_location);
  if (
    originCity &&
    (driverCity.includes(originCity) || originCity.includes(driverCity))
  )
    return 3;
  return scoreDriverForOrigin(driver, origin);
}

// ─── AssignDriverModal (auto-assign, kept from git) ───────────────────────────

function AssignDriverModal({
  trip,
  drivers,
  vehicles,
  onClose,
  onConfirm,
}: {
  trip: Trip;
  drivers: Driver[];
  vehicles: Vehicle[];
  onClose: () => void;
  onConfirm: (driver?: Driver) => void;
}) {
  const originCity = extractCity(trip.origin);
  const scored = drivers
    .map((d) => ({
      driver: d,
      score: scoreDriverForCity(d, trip.origin),
      vehicle: vehicles.find((v) => v.truck_id === d.truck_id) ?? null,
    }))
    .sort((a, b) => {
      const aA = a.driver.status === "available" ? 1 : 0;
      const bA = b.driver.status === "available" ? 1 : 0;
      if (aA !== bA) return bA - aA;
      return b.score - a.score;
    });
  const suggested = scored.find((s) => s.driver.status === "available") ?? null;
  const [selectedId, setSelectedId] = useState(suggested?.driver.id ?? "");
  const selectedEntry = scored.find((s) => s.driver.id === selectedId) ?? null;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h2 style={{ marginBottom: 2 }}>Approve &amp; Assign Driver</h2>
            <p style={{ fontSize: 11, color: "var(--muted-ink)", margin: 0 }}>
              {trip.reference} &middot; Pickup: {trip.origin}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {originCity && (
          <div style={{ padding: "0 20px 12px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                background: "var(--blue-soft)",
                color: "var(--blue)",
                borderRadius: 20,
                padding: "4px 10px",
              }}
            >
              Matching drivers in{" "}
              <b style={{ textTransform: "capitalize", marginLeft: 3 }}>
                {originCity}
              </b>
            </span>
          </div>
        )}
        <div
          style={{
            padding: "0 20px",
            maxHeight: 260,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {scored.map(({ driver, score, vehicle }) => {
            const isSelected = driver.id === selectedId;
            const isSuggested = driver.id === suggested?.driver.id;
            const isAvailable = driver.status === "available";
            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => {
                  if (isAvailable) setSelectedId(driver.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${isSelected ? "var(--blue)" : "var(--line)"}`,
                  background: isSelected ? "var(--blue-soft)" : "var(--panel)",
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  opacity: isAvailable ? 1 : 0.5,
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    <b style={{ fontSize: 12 }}>{driver.name}</b>
                    {isSuggested && isAvailable && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: isSelected
                            ? "var(--blue)"
                            : "var(--blue-soft)",
                          color: isSelected ? "#fff" : "var(--blue)",
                          borderRadius: 4,
                          padding: "1px 6px",
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        Suggested
                      </span>
                    )}
                    {!isAvailable && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: "#fee2e2",
                          color: "#991b1b",
                          borderRadius: 4,
                          padding: "1px 6px",
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        On trip
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--muted-ink)",
                      margin: 0,
                    }}
                  >
                    {driver.source_location}
                  </p>
                  {vehicle && (
                    <p
                      style={{
                        fontSize: 10,
                        color: "var(--muted-ink)",
                        margin: "1px 0 0",
                      }}
                    >
                      {vehicle.brand} {vehicle.model_name} &middot;{" "}
                      {driver.truck_id}
                    </p>
                  )}
                </div>
                {score >= 3 && isAvailable && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--blue)",
                      flexShrink: 0,
                    }}
                  >
                    City match
                  </span>
                )}
                {isSelected && (
                  <Check
                    size={14}
                    style={{ color: "var(--blue)", flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}
          {!scored.length && (
            <p
              style={{
                color: "var(--muted-ink)",
                fontSize: 12,
                textAlign: "center",
                padding: 16,
              }}
            >
              No drivers found
            </p>
          )}
        </div>
        {selectedEntry?.vehicle && (
          <div
            style={{
              margin: "0 20px 16px",
              background: "var(--surface-alt, #f8fafc)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted-ink)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                margin: "0 0 8px",
              }}
            >
              Assigned truck
            </p>
            <b style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              {selectedEntry.vehicle.brand} {selectedEntry.vehicle.model_name}
            </b>
            <div className="info-grid compact-grid">
              <Info label="Truck ID" value={selectedEntry.vehicle.truck_id} />
              <Info label="Type" value={selectedEntry.vehicle.type} />
              <Info
                label="Tyres"
                value={`${selectedEntry.vehicle.tires_count} tyres`}
              />
              <Info
                label="Capacity"
                value={selectedEntry.vehicle.load_capacity}
              />
              <Info
                label="Mileage"
                value={`${selectedEntry.vehicle.mileage_kmpl} km/L`}
              />
              <Info
                label="BS6"
                value={selectedEntry.vehicle.BS6 === "yes" ? "Yes" : "No"}
              />
            </div>
          </div>
        )}
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            className="button primary wide"
            disabled={!selectedId}
            onClick={() => onConfirm(selectedEntry?.driver ?? undefined)}
          >
            {selectedId
              ? `Assign ${selectedEntry?.driver.name ?? ""} & Approve`
              : "Select a driver to continue"}
          </button>
          <button
            className="button secondary wide"
            onClick={() => onConfirm(undefined)}
          >
            Approve without driver
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Import Modals ───────────────────────────────────────────────────

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: Trip) => void;
}) {
  const [reference, setReference] = useState("");
  const [customer, setCustomer] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDT, setPickupDT] = useState("");
  const [deliveryDT, setDeliveryDT] = useState("");
  const [cargoMaterial, setCargoMaterial] = useState("Cement");
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoType, setCargoType] = useState<Trip["cargoType"]>("Bagged");
  const [noOfBags, setNoOfBags] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { date, time } = fromDatetimeLocal(pickupDT);
    const { date: dDate, time: dTime } = fromDatetimeLocal(deliveryDT);
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString("en-GB", { month: "short" });
    const year = now.getFullYear();
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const sfx = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    onCreate({
      id: `req-${Date.now()}`,
      reference: reference || `DR-${1050 + Math.floor(Math.random() * 20)}`,
      customer: customer || "New customer",
      origin: origin || "Wadgaon, Pune",
      destination: destination || "Nashik MIDC",
      date: date || "20 Aug 2026",
      time: time || "09:00",
      requestedDeliveryDate: dDate || date || "20 Aug 2026",
      requestedDeliveryTime: dTime || time || "09:00",
      cargoMaterial,
      cargoCompany: customer,
      cargoWeight,
      cargoType,
      noOfBags: noOfBags || "1 bag",
      createdAt: `${day} ${month} ${year} · ${h12}:${mins} ${sfx}`,
      passengers: Number(noOfBags) || 1,
      status: "NEW",
      documents: [],
      extras: [],
    });
  };

  return (
    <Modal title="Create trip" onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          Reference
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="DR-1049"
          />
        </label>
        <label>
          Customer
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Company or person"
          />
        </label>
        <div className="form-row">
          <label>
            Pickup
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="City or address"
            />
          </label>
          <label>
            Drop-off
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or address"
            />
          </label>
        </div>
        <label>
          Pickup date &amp; time
          <input
            type="datetime-local"
            value={pickupDT}
            onChange={(e) => setPickupDT(e.target.value)}
          />
        </label>
        <label>
          Delivery date &amp; time
          <input
            type="datetime-local"
            value={deliveryDT}
            onChange={(e) => setDeliveryDT(e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            Cargo weight
            <input
              value={cargoWeight}
              onChange={(e) => setCargoWeight(e.target.value)}
              placeholder="28 tonnes"
            />
          </label>
          <label>
            Cargo type
            <select
              value={cargoType}
              onChange={(e) =>
                setCargoType(e.target.value as Trip["cargoType"])
              }
            >
              <option value="Bagged">Bagged</option>
              <option value="Loose">Loose</option>
            </select>
          </label>
        </div>
        <label>
          No. of bags
          <input
            value={noOfBags}
            onChange={(e) => setNoOfBags(e.target.value)}
            placeholder="560 bags"
          />
        </label>
        <button className="button primary wide" type="submit">
          Create trip
        </button>
      </form>
    </Modal>
  );
}

function ImportModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Modal title="Import trips" onClose={onClose}>
      <div className="upload">
        <UploadSimple size={24} style={{ color: "var(--blue)" }} />
        <b>Drop your Excel file here</b>
        <p>or choose a .xlsx file from your device</p>
        <button className="button secondary">Choose file</button>
      </div>
      <div className="import-preview">
        <b>Preview ready</b>
        <span>2 valid trips · 0 errors</span>
      </div>
      <button className="button primary wide" onClick={onDone}>
        Validate and import
      </button>
    </Modal>
  );
}
function ExtraModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (x: Extra) => void;
}) {
  const [type, setType] = useState<Extra["type"]>("Fuel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal title="Submit extra request" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({
            id: `ex-${Date.now()}`,
            type,
            amount: amount.trim() ? `₹${amount.trim()}` : "₹0",
            note: note.trim() || "Submitted by driver for review",
            status: "Submitted",
          });
        }}
      >
        <label>
          Request type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Extra["type"])}
          >
            <option>Fuel</option>
            <option>Cash</option>
            <option>AdBlue</option>
          </select>
        </label>
        <label>
          Amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="5000"
          />
        </label>
        <label>
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a short note"
            rows={3}
          />
        </label>
        <button className="button primary wide" type="submit">
          Submit request
        </button>
      </form>
    </Modal>
  );
}
function DocumentModal({
  onClose,
  onCreate,
  isStamped,
}: {
  onClose: () => void;
  onCreate: (x: TripDocument) => void;
  isStamped?: boolean;
}) {
  const [type, setType] = useState<TripDocument["type"]>("LR");
  const [name, setName] = useState("");
  return (
    <Modal
      title={isStamped ? "Upload Stamped Document" : "Upload trip document"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate({
            id: `doc-${Date.now()}`,
            name: name || `Trip-document-${type}.pdf`,
            type,
            uploadedAt: "Just now",
          });
        }}
      >
        <div className="upload">
          <UploadSimple size={24} style={{ color: "var(--blue)" }} />
          <b>
            {isStamped ? "Select the stamped document" : "Select a document"}
          </b>
          <p>PDF, JPG, or PNG up to 10 MB</p>
          <input
            type="file"
            onChange={(e) => setName(e.target.files?.[0]?.name || "")}
          />
        </div>
        <label>
          Document type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TripDocument["type"])}
          >
            <option>LR</option>
            <option>WB</option>
            <option>Invoice</option>
            <option>Other</option>
          </select>
        </label>
        <button className="button primary wide" type="submit">
          {isStamped ? "Upload & Complete Trip" : "Upload document"}
        </button>
      </form>
    </Modal>
  );
}

// ─── TripOpsReport ────────────────────────────────────────────────────────────

function TripOpsReport({
  trips,
  onMetricClick,
}: {
  trips: Trip[];
  onMetricClick: (f: string) => void;
}) {
  const total = trips.length;
  const newTrips = trips.filter((t) => t.status === "NEW").length;
  const pending = trips.filter((t) =>
    ["DRIVER_PENDING", "DRIVER_ACCEPTED", "PREPARING", "READY"].includes(
      t.status,
    ),
  ).length;
  const active = trips.filter((t) =>
    ["IN_TRANSIT", "ON_HOLD", "REACHED"].includes(t.status),
  ).length;
  const delivered = trips.filter((t) =>
    ["DELIVERED", "DOCUMENTS_SUBMITTED"].includes(t.status),
  ).length;
  const completed = trips.filter((t) => t.status === "COMPLETED").length;
  const rejected = trips.filter((t) =>
    ["REJECTED", "DRIVER_REJECTED"].includes(t.status),
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section
        className="stats"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          width: "100%",
        }}
      >
        <Stat
          label="Total Trips"
          value={total}
          tone="green"
          hint="All time"
          icon={<ChartPie size={18} />}
          onClick={() => onMetricClick("All")}
        />
        <Stat
          label="New Trips"
          value={newTrips}
          tone="blue"
          hint="Awaiting review"
          icon={<Clock size={18} />}
          onClick={() => onMetricClick("New")}
        />
        <Stat
          label="Pending Start"
          value={pending}
          tone="blue"
          hint="Assigned · Pre-trip"
          icon={<Truck size={18} />}
          onClick={() => onMetricClick("Pending")}
        />
        <Stat
          label="Active"
          value={active}
          tone="purple"
          hint="Currently in transit"
          icon={<Truck size={18} />}
          onClick={() => onMetricClick("Active")}
        />
        <Stat
          label="Delivered"
          value={delivered}
          tone="green"
          hint="Docs pending/submitted"
          icon={<ChartPie size={18} />}
          onClick={() => onMetricClick("Delivered")}
        />
        <Stat
          label="Completed"
          value={completed}
          tone="green"
          hint="Finalized"
          icon={<ChartPie size={18} />}
          onClick={() => onMetricClick("Completed")}
        />
        <Stat
          label="Rejected"
          value={rejected}
          tone="red"
          hint="Ops / Driver rejected"
          icon={<Clock size={18} />}
          onClick={() => onMetricClick("Rejected")}
        />
      </section>
    </div>
  );
}

// ─── FuelExpenseReport ────────────────────────────────────────────────────────

function FuelExpenseReport({ trips }: { trips: Trip[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const dummyRows = [
    {
      trip: "TR-001",
      driver: "Rahul",
      truck: "MH13AB1234",
      fuelAuth: "120 L",
      fuelRec: "115 L",
      authN: 120,
      recN: 115,
      cash: "₹2,000",
      extraFuel: false,
    },
    {
      trip: "TR-002",
      driver: "Amit",
      truck: "MH13CD5678",
      fuelAuth: "100 L",
      fuelRec: "102 L",
      authN: 100,
      recN: 102,
      cash: "₹1,500",
      extraFuel: true,
    },
    {
      trip: "TR-003",
      driver: "Sagar",
      truck: "MH13EF9012",
      fuelAuth: "130 L",
      fuelRec: "125 L",
      authN: 130,
      recN: 125,
      cash: "₹2,500",
      extraFuel: false,
    },
  ];
  const filteredRows = dummyRows.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      r.trip.toLowerCase().includes(q) ||
      r.driver.toLowerCase().includes(q) ||
      r.truck.toLowerCase().includes(q)
    );
  });
  const handleDownloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filteredRows.map((r) => ({
      Trip: r.trip,
      Driver: r.driver,
      Truck: r.truck,
      "Fuel Authorized": r.fuelAuth,
      "Fuel Recorded": r.fuelRec,
      "Cash Advance": r.cash,
      "Extra Fuel": r.extraFuel ? "Yes" : "No",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel & Expenses");
    XLSX.writeFile(
      workbook,
      `Fuel_Expense_Report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };
  const totalAuth = dummyRows.reduce((s, r) => s + r.authN, 0);
  const totalRec = dummyRows.reduce((s, r) => s + r.recN, 0);
  const extraCount = dummyRows.filter((r) => r.extraFuel).length;
  const maxFuel = Math.max(totalAuth, totalRec, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <section
        className="stats"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
      >
        {[
          {
            label: "Fuel Authorized",
            value: `${totalAuth} L`,
            hint: "Across all trips",
          },
          {
            label: "Fuel Recorded",
            value: `${totalRec} L`,
            hint: "Actual consumption",
          },
          {
            label: "Cash Advances",
            value: "₹6,000",
            hint: `${dummyRows.length} trips`,
          },
          {
            label: "Fuel Transactions",
            value: dummyRows.length,
            hint: "This period",
          },
          {
            label: "Extra Fuel Requests",
            value: extraCount,
            hint: "Pending review",
          },
        ].map(({ label, value, hint }) => (
          <div
            key={label}
            className="stat"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "16px 18px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "var(--muted-ink)",
                fontWeight: 500,
              }}
            >
              {label}
            </p>
            <strong
              style={{
                fontSize: "24px",
                letterSpacing: "-.04em",
                margin: "4px 0 2px",
              }}
            >
              {value}
            </strong>
            <small style={{ color: "#8993a2", fontSize: "10px" }}>{hint}</small>
          </div>
        ))}
      </section>
      <div className="panel">
        <div className="panel-header" style={{ alignItems: "center" }}>
          <div>
            <h2>Fuel &amp; Expense Breakdown</h2>
            <p>Per-trip fuel and cash advance summary</p>
          </div>
          <button
            className="icon-create"
            onClick={handleDownloadExcel}
            title="Download Excel (.xlsx)"
            aria-label="Download Excel"
          >
            <DownloadSimple size={18} />
          </button>
        </div>
        <div className="filters" style={{ flexWrap: "wrap" }}>
          <div className="search">
            <MagnifyingGlass
              size={16}
              style={{ color: "#9ca6b4", marginRight: 4 }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trip ID, driver, truck..."
            />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              fontSize: "0.875rem",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {[
                  "Trip",
                  "Driver",
                  "Truck",
                  "Fuel Authorized",
                  "Fuel Recorded",
                  "Cash Advance",
                  "Extra Fuel",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.trip}
                  style={{ borderBottom: "1px solid #f8fafc" }}
                >
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    {row.trip}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    {row.driver}
                  </td>
                  <td
                    style={{
                      padding: "0.75rem 1rem",
                      color: "#475569",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    {row.truck}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                    {row.fuelAuth}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                    {row.fuelRec}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>
                    {row.cash}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {row.extraFuel ? (
                      <span style={{ color: "#d97706", fontWeight: 600 }}>
                        Yes
                      </span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>No</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No records match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Fuel Authorized vs Recorded</h2>
            <p>Planned vs actual consumption comparison</p>
          </div>
        </div>
        <div
          style={{
            padding: "0 1rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {[
            { label: "Authorized", value: totalAuth, color: "#3b82f6" },
            { label: "Recorded", value: totalRec, color: "#10b981" },
          ].map((bar) => (
            <div
              key={bar.label}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 64px",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "#475569",
                  fontWeight: 500,
                }}
              >
                {bar.label}
              </span>
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: 9999,
                  height: 14,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.round((bar.value / maxFuel) * 100)}%`,
                    background: bar.color,
                    borderRadius: 9999,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#1e293b",
                  textAlign: "right",
                }}
              >
                {bar.value} L
              </span>
            </div>
          ))}
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#64748b",
              marginTop: "0.25rem",
            }}
          >
            Variance:{" "}
            <strong
              style={{
                color: totalAuth - totalRec > 0 ? "#ef4444" : "#10b981",
              }}
            >
              {totalAuth - totalRec > 0 ? "−" : "+"}
              {Math.abs(totalAuth - totalRec)} L
            </strong>{" "}
            {totalAuth - totalRec > 0
              ? "under recorded vs authorized"
              : "over recorded vs authorized"}
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── FollowupsPage ────────────────────────────────────────────────────────────

function FollowupsPage({
  followups,
  trips,
  defaultTripFilter,
  onClearDefaultFilter,
  onCall,
  onOpenTrip,
  onCreate,
}: {
  followups: Followup[];
  trips: Trip[];
  defaultTripFilter?: string;
  onClearDefaultFilter?: () => void;
  onCall: (fu: Followup) => void;
  onOpenTrip: (tripId: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tripFilter, setTripFilter] = useState(defaultTripFilter || "All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortAsc, setSortAsc] = useState(true);
  const tripOptions = [
    "All",
    ...Array.from(new Set(followups.map((f) => f.tripRef))),
  ];
  useEffect(() => {
    if (defaultTripFilter) {
      setTripFilter(defaultTripFilter);
      onClearDefaultFilter?.();
    }
  }, [defaultTripFilter]);
  const parseDue = (fu: Followup) => {
    try {
      const months: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const p = fu.dueDate.trim().split(" ");
      return new Date(
        Number(p[2]),
        months[p[1]] ?? 0,
        Number(p[0]),
        Number(fu.dueTime.split(":")[0] ?? "0"),
        Number(fu.dueTime.split(":")[1] ?? "0"),
      ).getTime();
    } catch {
      return 0;
    }
  };
  const filtered = followups
    .filter(
      (f) =>
        (tripFilter === "All" || f.tripRef === tripFilter) &&
        (statusFilter === "All" || f.status === statusFilter),
    )
    .filter((f) => {
      const q = query.toLowerCase();
      return (
        !q ||
        f.driver.toLowerCase().includes(q) ||
        f.tripRef.toLowerCase().includes(q) ||
        f.note.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortAsc ? parseDue(a) - parseDue(b) : parseDue(b) - parseDue(a),
    );
  const activeFilters =
    (tripFilter !== "All" ? 1 : 0) + (statusFilter !== "All" ? 1 : 0);
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Follow-ups</h2>
          <p>Field communication and driver follow-up log.</p>
        </div>
        <div className="panel-header-actions">
          <button
            className="icon-create"
            aria-label="New follow-up"
            title="New follow-up"
            onClick={onCreate}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div
        className="filters"
        style={{ position: "relative", flexWrap: "wrap", gap: 8 }}
      >
        <div className="search" style={{ flex: 1, minWidth: 180 }}>
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", marginRight: 4 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search driver, trip, note"
          />
        </div>
        <button
          className="icon-create"
          title="Filter"
          aria-label="Filter"
          onClick={() => setShowFilters((v) => !v)}
          style={{ position: "relative" }}
        >
          <WarningCircle size={15} />
          {activeFilters > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "var(--blue)",
                color: "white",
                borderRadius: "50%",
                width: 14,
                height: 14,
                fontSize: 8,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              {activeFilters}
            </span>
          )}
        </button>
        <button
          className="icon-create"
          title={sortAsc ? "Sort: oldest due first" : "Sort: newest due first"}
          aria-label="Sort"
          onClick={() => setSortAsc((v) => !v)}
        >
          <ArrowRight
            size={15}
            style={{
              transform: sortAsc ? "rotate(90deg)" : "rotate(-90deg)",
              transition: "transform .2s",
            }}
          />
        </button>
        {showFilters && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 6,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "14px 16px",
              zIndex: 5,
              minWidth: 220,
              boxShadow: "0 8px 24px rgb(24 34 48 / 10%)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted-ink)",
                textTransform: "uppercase",
                letterSpacing: ".07em",
              }}
            >
              Trip
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 12,
              }}
            >
              {tripOptions.map((t) => (
                <button
                  key={t}
                  className={tripFilter === t ? "filter active" : "filter"}
                  style={{ fontSize: 10 }}
                  onClick={() => setTripFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted-ink)",
                textTransform: "uppercase",
                letterSpacing: ".07em",
              }}
            >
              Status
            </p>
            <div style={{ display: "flex", gap: 4 }}>
              {["All", "Open", "Done"].map((s) => (
                <button
                  key={s}
                  className={statusFilter === s ? "filter active" : "filter"}
                  style={{ fontSize: 10 }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {filtered.map((fu) => (
        <div
          key={fu.id}
          className="extra-row"
          style={{ alignItems: "flex-start", gap: 12, padding: "14px 0" }}
        >
          <span className="extra-icon" style={{ marginTop: 2 }}>
            <Clock size={15} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <b style={{ fontSize: 11 }}>{fu.driver}</b>
              <button
                className="text-button"
                style={{ fontSize: 10, padding: 0 }}
                onClick={() => onOpenTrip(fu.tripId)}
              >
                {fu.tripRef}{" "}
                <CaretRight size={10} style={{ display: "inline" }} />
              </button>
              <span
                className={`status ${fu.status.toLowerCase()}`}
                style={{ fontSize: 9 }}
              >
                {fu.status}
              </span>
            </div>
            <p
              style={{
                fontSize: 10,
                color: "var(--muted-ink)",
                margin: "4px 0 0",
                lineHeight: 1.5,
              }}
            >
              {fu.note}
            </p>
            <small
              style={{
                color: "#9ca6b4",
                fontSize: 9,
                display: "block",
                marginTop: 4,
              }}
            >
              Due {fu.dueDate} · {to12Hour(fu.dueTime)}
            </small>
          </div>
          <a
            href={`tel:${fu.driverPhone}`}
            onClick={(e) => {
              e.preventDefault();
              onCall(fu);
            }}
            className="button secondary compact"
            style={{ fontSize: 11, flexShrink: 0 }}
            aria-label={`Call ${fu.driver}`}
            title={`Call ${fu.driver}`}
          >
            <span style={{ fontSize: 14 }}>📞</span> Call
          </a>
        </div>
      ))}
      {!filtered.length && <Empty label="No follow-ups match" />}
    </section>
  );
}

function FollowupModal({
  trips,
  onClose,
  onCreate,
}: {
  trips: Trip[];
  onClose: () => void;
  onCreate: (data: Omit<Followup, "id" | "createdAt" | "status">) => void;
}) {
  const activeTripOptions = trips.filter((t) => t.status !== "COMPLETED");
  const [tripId, setTripId] = useState(activeTripOptions[0]?.id || "");
  const selectedTrip = trips.find((t) => t.id === tripId);
  const [note, setNote] = useState("");
  const [dueDT, setDueDT] = useState("");
  return (
    <Modal title="Create follow-up" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedTrip) return;
          const { date: dDate, time: dTime } = fromDatetimeLocal(dueDT);
          onCreate({
            tripId: selectedTrip.id,
            tripRef: selectedTrip.reference,
            driver: selectedTrip.driver || "Unassigned",
            driverPhone: selectedTrip.driverNumber || "+91 00000 00000",
            note: note.trim() || "Follow-up required",
            dueDate: dDate || "Today",
            dueTime: dTime || "12:00",
          });
        }}
      >
        <label>
          Trip
          <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
            {activeTripOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.reference} — {t.customer}
              </option>
            ))}
            {!activeTripOptions.length && (
              <option value="">No active trips</option>
            )}
          </select>
        </label>
        {selectedTrip && (
          <div
            style={{
              background: "var(--blue-soft)",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              color: "var(--blue)",
            }}
          >
            <b>{selectedTrip.driver || "Unassigned"}</b> ·{" "}
            {selectedTrip.driverNumber || "No phone on file"}
          </div>
        )}
        <label>
          Note
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What needs to be followed up?"
            rows={3}
          />
        </label>
        <label>
          Due date &amp; time
          <input
            type="datetime-local"
            value={dueDT}
            onChange={(e) => setDueDT(e.target.value)}
          />
        </label>
        <button className="button primary wide" type="submit">
          Create follow-up
        </button>
      </form>
    </Modal>
  );
}

function FuelTransactionsPage({
  transactions,
  onSendToPump,
  onResend,
}: {
  transactions: FuelTransaction[];
  onSendToPump: (tx: FuelTransaction) => void;
  onResend: (tx: FuelTransaction) => void;
}) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const filtered = transactions.filter((tx) => {
    const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      tx.tripRef.toLowerCase().includes(q) ||
      tx.driver.toLowerCase().includes(q) ||
      tx.station.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });
  const activeFilters =
    (statusFilter !== "All" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>Fuel Transactions</h2>
          <p>Dispatch fuel authorisations to pump stations.</p>
        </div>
      </div>
      <div
        className="filters"
        style={{ alignItems: "center", gap: 10, flexWrap: "nowrap" }}
      >
        <div className="search">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", marginRight: 4 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trip, driver, station"
          />
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            className="icon-create"
            aria-label="Open filters"
            title="Filters"
            onClick={() => setShowFilters((v) => !v)}
            style={{ width: 40, height: 40, minWidth: 40 }}
          >
            <FunnelSimple size={16} />
            {activeFilters > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "var(--blue)",
                  color: "white",
                  borderRadius: 999,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  fontSize: 9,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                }}
              >
                {activeFilters}
              </span>
            )}
          </button>
          {showFilters && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 14,
                minWidth: 260,
                zIndex: 20,
                boxShadow: "0 12px 32px rgb(15 23 42 / 10%)",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted-ink)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                Status
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["All", "Pending", "Sent", "Resent"].map((f) => (
                  <button
                    key={f}
                    className={statusFilter === f ? "filter active" : "filter"}
                    style={{ fontSize: 11 }}
                    onClick={() => setStatusFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div style={{ height: 12 }} />
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--muted-ink)",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                }}
              >
                Date range
              </p>
              <DateRangeFilter
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFrom={setDateFrom}
                onTo={setDateTo}
              />
            </div>
          )}
        </div>
      </div>
      {filtered.map((tx) => (
        <button key={tx.id} className="trip-card" style={{ cursor: "default" }}>
          <span className="trip-date">
            <GasPump size={16} style={{ color: "var(--blue)" }} />
          </span>
          <span className="request-main">
            <b>
              {tx.tripRef} · {tx.driver}
            </b>
            <small>
              {tx.station} · {tx.litres}
            </small>
          </span>
          <span
            className="status"
            style={{
              background:
                tx.status === "Pending"
                  ? "#fef3c7"
                  : tx.status === "Sent"
                    ? "#dbeafe"
                    : "#d1fae5",
              color:
                tx.status === "Pending"
                  ? "#d97706"
                  : tx.status === "Sent"
                    ? "#1d4ed8"
                    : "#065f46",
            }}
          >
            {tx.status}
          </span>
          <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {tx.amount}
          </span>
          {tx.status === "Pending" && (
            <button
              className="button primary compact"
              style={{ fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                onSendToPump(tx);
              }}
            >
              Send to pump
            </button>
          )}
          {(tx.status === "Sent" || tx.status === "Resent") && (
            <button
              className="button secondary compact"
              style={{ fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                onResend(tx);
              }}
            >
              Resend
            </button>
          )}
        </button>
      ))}
      {!filtered.length && <Empty label="No fuel transactions found" />}
    </section>
  );
}
