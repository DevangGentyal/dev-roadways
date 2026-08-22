"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageProvider, useLang, Language } from "@/lib/i18n";
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
  Lock,
  CheckCircle,
  Eye,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "Coordinator" | "Operations" | "Driver" | "Super Admin";

type DriverFlowState = {
  tripId: string;
  step: number; // 1: LR, 2: WB, 3: Invoice, 4: Start Trip, 5: In Transit, 6: Stamped Docs, 7: Finished
  lrDocName?: string;
  wbDocName?: string;
  invoiceDocName?: string;
  stampedLrName?: string;
  stampedWbName?: string;
  stampedInvoiceName?: string;
};

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
  | "STAMPED_DOCS_SUBMITTED"
  | "COMPLETED";

type Trip = {
  id: string;
  reference: string;
  clientId?: string;
  customer: string;
  origin: string;
  destination: string;
  sourceId?: string;
  driverId?: string;
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
  tripId?: string;
  tripRef?: string;
  driver?: string;
  type: "Fuel" | "Cash" | "AdBlue" | "Other";
  amount: string;
  litres?: string;
  note: string;
  status: "Submitted" | "Approved" | "Rejected";
  requestedAt?: string;
  approvedAt?: string;
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
  type: string;
  uploadedAt: string;
  tripId?: string;
  trip_Id?: string;
  status?: string;
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
  phone?: string;
  phone_number?: number | string;
  vehicleId?: string;
  truck_id?: string;
  status: "available" | "unavailable";
  clientId?: string;
  sourceId?: string;
  source_location?: string;
  source_company?: string;
  documents?: unknown[];
};
type Source = { id: string; name: string; address: string };
type Client = { id: string; name: string; code: string; sources: Source[] };
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
  Driver: "Ramesh",
  "Super Admin": "Dheeraj",
};

// ─── Status Helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TripStatus | string, string> = {
  NEW: "New",
  DRIVER_PENDING: "Driver Pending",
  REJECTED: "Rejected (Ops)",
  DRIVER_ACCEPTED: "Accepted",
  DRIVER_REJECTED: "Rejected (Driver)",
  DOCUMENTS_SUBMITTED: "Docs Uploaded",
  STAMPED_DOCS_SUBMITTED: "Stamped Docs",
  READY: "Not Started",
  IN_TRANSIT: "In Transit",
  REACHED: "Reached",
  COMPLETED: "Complete",
  // Legacy fallbacks
  PREPARING: "Docs Uploaded",
  ON_HOLD: "In Transit",
  DELIVERED: "Reached",
};

const STATUS_COLORS: Record<
  TripStatus | string,
  { bg: string; color: string }
> = {
  NEW: { bg: "#fef3c7", color: "#d97706" },
  DRIVER_PENDING: { bg: "#e0f2fe", color: "#0369a1" },
  REJECTED: { bg: "#fee2e2", color: "#b91c1c" },
  DRIVER_ACCEPTED: { bg: "#dbeafe", color: "#1d4ed8" },
  DRIVER_REJECTED: { bg: "#fee2e2", color: "#b91c1c" },
  DOCUMENTS_SUBMITTED: { bg: "#e0f2fe", color: "#0369a1" },
  STAMPED_DOCS_SUBMITTED: { bg: "#e0f2fe", color: "#0369a1" },
  READY: { bg: "#e0e7ff", color: "#4338ca" },
  IN_TRANSIT: { bg: "#ede9fe", color: "#6d28d9" },
  REACHED: { bg: "#fef3c7", color: "#b45309" },
  COMPLETED: { bg: "#dcfce7", color: "#15803d" },
  // Legacy fallbacks
  PREPARING: { bg: "#e0f2fe", color: "#0369a1" },
  ON_HOLD: { bg: "#ede9fe", color: "#6d28d9" },
  DELIVERED: { bg: "#fef3c7", color: "#b45309" },
};

function formatDDMMYY(dateStr?: string): string {
  if (
    !dateStr ||
    dateStr === "Awaiting" ||
    dateStr === "—" ||
    dateStr === "Pending" ||
    dateStr === "Not fulfilled"
  ) {
    return dateStr || "—";
  }

  try {
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    const match = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2,4})/);
    if (match) {
      const day = match[1].padStart(2, "0");
      const month = months[match[2].slice(0, 3)] || "01";
      const year = match[3].length === 4 ? match[3].slice(2) : match[3];
      return `${day}/${month}/${year}`;
    }

    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(2);
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  } catch {
    return dateStr;
  }
}

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
  return (
    <LanguageProvider>
      <OpsDashboardInner />
    </LanguageProvider>
  );
}

function OpsDashboardInner() {
  const { lang, setLang, t } = useLang();
  const [role, setRole] = useState<Role>("Coordinator");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [allExtras, setAllExtras] = useState<Extra[]>([]);
  const [fuelTransactions, setFuelTransactions] = useState<FuelTransaction[]>(
    [],
  );
  const [clients, setClients] = useState<Client[]>([]);
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
        setClients(data.clients || []);
        setFollowups(data.followups || []);
        setAllExtras(data.extras || []);
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
    try {
      const response = await fetch("/api/mock-db", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, data }),
      });
      if (!response.ok) {
        console.warn(`Mock DB write warning for ${collection}`);
        return { ok: false };
      }
      return await response.json();
    } catch (err) {
      console.warn(`Mock DB network warning for ${collection}:`, err);
      return { ok: false };
    }
  }

  const [tripsFilter, setTripsFilter] = useState("All");
  const [view, setView] = useState<
    | "dashboard"
    | "active"
    | "trips"
    | "trip-detail"
    | "followups"
    | "fuel"
    | "reports-ops"
    | "reports-fuel"
    | "reports-cash"
    | "approvals"
  >("dashboard");
  const [fuelStatusFilter, setFuelStatusFilter] = useState("All");
  const [approvalFilterType, setApprovalFilterType] = useState<
    "All" | "Fuel" | "Cash" | "AdBlue"
  >("All");
  const [approvalStatusTab, setApprovalStatusTab] = useState<
    "Approved" | "All"
  >("All");
  const [fuelReportTab, setFuelReportTab] = useState<"basic" | "extra">(
    "basic",
  );
  const [fuelReportStatus, setFuelReportStatus] = useState("All");
  const [cashReportStatus, setCashReportStatus] = useState("All");

  const changeView = (
    targetView:
      | "dashboard"
      | "trips"
      | "trip-detail"
      | "followups"
      | "fuel"
      | "reports-ops"
      | "reports-fuel"
      | "reports-cash"
      | "approvals"
      | "active",
  ) => {
    const allowedViews: Array<typeof targetView> =
      role === "Driver"
        ? isDriverInTrip || activeDriverFlow
          ? ["active", "trip-detail"]
          : ["dashboard", "active", "trips", "trip-detail"]
        : role === "Coordinator"
          ? ["dashboard", "trips", "trip-detail"]
          : role === "Operations"
            ? ["dashboard", "trips", "trip-detail", "followups", "fuel"]
            : [
                "dashboard",
                "trips",
                "trip-detail",
                "fuel",
                "reports-ops",
                "reports-fuel",
                "reports-cash",
                "approvals",
              ];
    if (!allowedViews.includes(targetView)) return;
    setTripsFilter("All");
    setFollowupTripFilter("");
    setView(targetView);
  };

  useEffect(() => {
    if (role === "Coordinator" && view === "fuel") {
      setView("dashboard");
    }
  }, [role, view]);

  const pendingApprovalsCount = allExtras.filter(
    (x) => x.status === "Submitted",
  ).length;

  function handleNavigateApprovals(
    type: "Fuel" | "Cash" | "AdBlue" | "All" = "All",
    status: "Approved" | "All" = "All",
  ) {
    setApprovalFilterType(type);
    setApprovalStatusTab(status);
    setView("approvals");
  }

  function handleNavigateReports(
    reportView: "reports-fuel" | "reports-cash" | "reports-ops",
    tab: "basic" | "extra" = "extra",
    status = "Approved",
  ) {
    if (reportView === "reports-fuel") {
      setFuelReportTab(tab);
      setFuelReportStatus(status);
    } else if (reportView === "reports-cash") {
      setCashReportStatus(status);
    }
    setView(reportView);
  }

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
  const [toast, setToast] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const [activeDriverFlow, setActiveDriverFlow] =
    useState<DriverFlowState | null>(null);

  const activeDriverTrip =
    activeDriverFlow && activeDriverFlow.tripId
      ? trips.find((t) => t.id === activeDriverFlow.tripId)
      : null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("driver_active_flow");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.tripId && parsed.step) {
            setActiveDriverFlow(parsed);
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  useEffect(() => {
    if (role === "Driver" && activeDriverFlow && !activeDriverTrip) {
      updateDriverFlowState(null);
    }
  }, [role, activeDriverFlow, activeDriverTrip]);

  useEffect(() => {
    if (role !== "Driver") return;

    const hasActiveTrip = trips.some((t) =>
      [
        "DRIVER_PENDING",
        "DRIVER_ACCEPTED",
        "PREPARING",
        "READY",
        "IN_TRANSIT",
        "ON_HOLD",
        "REACHED",
      ].includes(t.status),
    );

    if ((activeDriverFlow || hasActiveTrip) && view !== "active") {
      setView("active");
    }
  }, [role, activeDriverFlow, trips, view]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            installing.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    });

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOfflineState = () => setIsOffline(!window.navigator.onLine);
    syncOfflineState();

    window.addEventListener("online", syncOfflineState);
    window.addEventListener("offline", syncOfflineState);

    return () => {
      window.removeEventListener("online", syncOfflineState);
      window.removeEventListener("offline", syncOfflineState);
    };
  }, []);

  // Synchronize driver availability based on active/ongoing trips
  useEffect(() => {
    if (drivers.length === 0 || trips.length === 0) return;

    let changed = false;
    const updatedDrivers = drivers.map((d) => {
      const hasOngoingTrip = trips.some(
        (t) =>
          (t.driver === d.name || t.driverNumber === d.id) &&
          [
            "DRIVER_PENDING",
            "DRIVER_ACCEPTED",
            "PREPARING",
            "READY",
            "IN_TRANSIT",
            "ON_HOLD",
            "REACHED",
          ].includes(t.status),
      );

      const expectedStatus: "available" | "unavailable" = hasOngoingTrip
        ? "unavailable"
        : "available";
      if (d.status !== expectedStatus) {
        changed = true;
        return { ...d, status: expectedStatus };
      }
      return d;
    });

    if (changed) {
      setDrivers(updatedDrivers);
      void persist("drivers", updatedDrivers);
    }
  }, [trips, drivers]);

  const updateDriverFlowState = (newState: DriverFlowState | null) => {
    setActiveDriverFlow(newState);
    if (typeof window !== "undefined") {
      if (newState) {
        localStorage.setItem("driver_active_flow", JSON.stringify(newState));
      } else {
        localStorage.removeItem("driver_active_flow");
      }
    }
  };

  const isDriverFlowLocked = role === "Driver" && activeDriverFlow !== null;
  const isDriverInTrip =
    role === "Driver" &&
    trips.some((t) =>
      [
        "DRIVER_PENDING",
        "DRIVER_ACCEPTED",
        "PREPARING",
        "READY",
        "IN_TRANSIT",
        "ON_HOLD",
        "REACHED",
      ].includes(t.status),
    );

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

    const newCount = trips.filter((t) => t.status === "NEW").length;
  const visibleTrips =
    role === "Driver" && !isDriverInTrip && !activeDriverFlow
      ? trips.filter(
          (t) =>
            [
              "DRIVER_PENDING",
              "DRIVER_ACCEPTED",
              "PREPARING",
              "READY",
              "IN_TRANSIT",
              "ON_HOLD",
              "REACHED",
              "DELIVERED",
              "DOCUMENTS_SUBMITTED",
              "STAMPED_DOCS_SUBMITTED",
              "COMPLETED",
            ].includes(t.status) && Boolean(t.driver),
        )
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

  async function updateExtraApproval(
    extraId: string,
    newStatus: "Approved" | "Rejected",
  ) {
    const ts = new Date().toLocaleDateString("en-GB");
    const nextExtras = allExtras.map((x) =>
      x.id === extraId
        ? {
            ...x,
            status:
              newStatus === "Approved"
                ? ("Approved" as const)
                : ("Rejected" as const),
            approvedAt: newStatus === "Approved" ? ts : x.approvedAt || "—",
          }
        : x,
    );
    setAllExtras(nextExtras);
    const nextTrips = trips.map((t) => ({
      ...t,
      extras: (t.extras || []).map((x) =>
        x.id === extraId
          ? {
              ...x,
              status:
                newStatus === "Approved"
                  ? ("Approved" as const)
                  : ("Rejected" as const),
              approvedAt: newStatus === "Approved" ? ts : x.approvedAt || "—",
            }
          : x,
      ),
    }));
    setTrips(nextTrips);
    if (selected?.id) {
      const updatedSel = nextTrips.find((t) => t.id === selected.id);
      if (updatedSel) setSelected(updatedSel);
    }
    await persist("extras", nextExtras);
    notify(
      `Request ${newStatus === "Approved" ? "approved" : "rejected"} successfully`,
    );
  }

  function createFuelTransactionForTrip(trip: Trip) {
    setFuelTransactions((current) => {
      if (current.some((tx) => tx.tripId === trip.id)) return current;

      const nextTx: FuelTransaction = {
        id: `ft-${Date.now()}`,
        tripId: trip.id,
        tripRef: trip.reference,
        driver: trip.driver || "Unassigned driver",
        station: trip.fuel?.station || "To be assigned",
        amount: trip.fuel?.assigned || "₹0",
        litres: trip.fuel?.received || "Awaiting receipt",
        status: "Pending",
      };

      const next = [nextTx, ...current];
      void persist("fuel-transactions", next);
      return next;
    });
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
    updateDriverFlowState({
      tripId: trip.id,
      step: 1,
    });
    createFuelTransactionForTrip(trip);
    notify(`${trip.reference} accepted — please upload LR document`);
  }
  function rejectTripByDriver(trip: Trip) {
    updateTripStatus(trip.id, "DRIVER_REJECTED");
    if (activeDriverFlow?.tripId === trip.id) {
      updateDriverFlowState(null);
    }
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

  async function addExtraForTrip(tripId: string, data: Extra) {
    const targetTrip = trips.find((t) => t.id === tripId);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} · ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    const entity: Extra = {
      ...data,
      tripId,
      tripRef: data.tripRef || targetTrip?.reference || tripId,
      driver: data.driver || targetTrip?.driver || role || "Ramesh Yadav",
      status: data.status || "Submitted",
      requestedAt: data.requestedAt || formattedDate,
    };
    const result = await persist("extras", [entity]);
    const hydratedTrip = result.trip as Trip | undefined;
    const next = trips.map((t) =>
      t.id === tripId
        ? { ...t, extras: hydratedTrip?.extras || [...t.extras, entity] }
        : t,
    );
    setTrips(next);
    if (selected?.id === tripId) {
      setSelected(next.find((t) => t.id === tripId) || selected);
    }
    notify(`Extra ${data.type} request submitted`);
  }

  async function addExtra(data: Extra) {
    const tripId = selected?.id;
    if (!tripId) return;
    await addExtraForTrip(tripId, data);
    setShowExtra(false);
  }

  async function addDocument(data: TripDocument) {
    const tripId = selected?.id;
    if (!tripId) return;
    const targetTrip = trips.find((t) => t.id === tripId);
    const entity = {
      ...data,
      tripId,
      trip_Id: data.trip_Id || targetTrip?.reference || tripId,
    };
    const result = await persist("documents", [entity]);
    const hydratedTrip =
      result && "trip" in result
        ? (result.trip as Trip | undefined)
        : undefined;
    const initTypes = ["LR", "WB", "Invoice"];
    const stampedTypes = ["LR (stamped)", "WB (stamped)", "Invoice (stamped)"];
    const next = trips.map((t) => {
      if (t.id !== tripId) return t;
      const updatedDocs =
        hydratedTrip?.documents ||
        (t.documents.some((d) => d.id === data.id)
          ? t.documents
          : [...t.documents, data]);
      const hasAllInitDocs = initTypes.every((type) =>
        updatedDocs.some((d) => d.type === type),
      );
      const allInitVerified = initTypes.every((type) =>
        updatedDocs.some((d) => d.type === type && d.status === "verified"),
      );
      const hasAllStampedDocs = stampedTypes.every((type) =>
        updatedDocs.some((d) => d.type === type),
      );
      let newStatus = t.status;
      if (hasAllStampedDocs) {
        newStatus = "STAMPED_DOCS_SUBMITTED" as TripStatus;
      } else if (
        hasAllInitDocs &&
        !allInitVerified &&
        ["DRIVER_ACCEPTED", "DRIVER_PENDING", "PREPARING", "NEW"].includes(
          t.status,
        )
      ) {
        newStatus = "DOCUMENTS_SUBMITTED" as TripStatus;
      } else if (
        allInitVerified &&
        [
          "DRIVER_ACCEPTED",
          "DRIVER_PENDING",
          "PREPARING",
          "DOCUMENTS_SUBMITTED",
        ].includes(t.status)
      ) {
        newStatus = "READY" as TripStatus;
      }
      return { ...t, documents: updatedDocs, status: newStatus };
    });
    setTrips(next);
    const updatedTrip = next.find((t) => t.id === tripId);
    if (updatedTrip?.status === "DOCUMENTS_SUBMITTED") {
      createFuelTransactionForTrip(updatedTrip);
    }
    setSelected(next.find((t) => t.id === tripId) || selected);
    setShowDocument(false);
    void persist("trips", next);
    notify(`${data.type} document uploaded`);
  }

  async function addDocumentForTrip(tripId: string, data: TripDocument) {
    const targetTrip = trips.find((t) => t.id === tripId);
    const entity = {
      ...data,
      tripId,
      trip_Id: data.trip_Id || targetTrip?.reference || tripId,
    };
    const result = await persist("documents", [entity]);
    const hydratedTrip =
      result && "trip" in result
        ? (result.trip as Trip | undefined)
        : undefined;
    const initTypes = ["LR", "WB", "Invoice"];
    const stampedTypes = ["LR (stamped)", "WB (stamped)", "Invoice (stamped)"];
    const next = trips.map((t) => {
      if (t.id !== tripId) return t;
      const updatedDocs =
        hydratedTrip?.documents ||
        (t.documents.some((d) => d.id === data.id)
          ? t.documents
          : [...t.documents, data]);
      const hasAllInitDocs = initTypes.every((type) =>
        updatedDocs.some((d) => d.type === type),
      );
      const allInitVerified = initTypes.every((type) =>
        updatedDocs.some((d) => d.type === type && d.status === "verified"),
      );
      const hasAllStampedDocs = stampedTypes.every((type) =>
        updatedDocs.some((d) => d.type === type),
      );
      let newStatus = t.status;
      if (hasAllStampedDocs) {
        newStatus = "STAMPED_DOCS_SUBMITTED" as TripStatus;
      } else if (
        hasAllInitDocs &&
        !allInitVerified &&
        ["DRIVER_ACCEPTED", "DRIVER_PENDING", "PREPARING", "NEW"].includes(
          t.status,
        )
      ) {
        newStatus = "DOCUMENTS_SUBMITTED" as TripStatus;
      } else if (
        allInitVerified &&
        [
          "DRIVER_ACCEPTED",
          "DRIVER_PENDING",
          "PREPARING",
          "DOCUMENTS_SUBMITTED",
        ].includes(t.status)
      ) {
        newStatus = "READY" as TripStatus;
      }
      return { ...t, documents: updatedDocs, status: newStatus };
    });
    setTrips(next);
    const updatedTrip = next.find((t) => t.id === tripId);
    if (updatedTrip?.status === "DOCUMENTS_SUBMITTED") {
      createFuelTransactionForTrip(updatedTrip);
    }
    if (selected?.id === tripId) {
      setSelected(next.find((t) => t.id === tripId) || selected);
    }
    void persist("trips", next);
  }

  async function submitStampedDocsForTrip(
    tripId: string,
    docs: TripDocument[],
  ) {
    const targetTrip = trips.find((t) => t.id === tripId);
    const entities = docs.map((d) => ({
      ...d,
      tripId,
      trip_Id: d.trip_Id || targetTrip?.reference || tripId,
    }));
    const result = await persist("documents", entities);
    const hydratedTrip =
      result && "trip" in result
        ? (result.trip as Trip | undefined)
        : undefined;
    const next = trips.map((t) => {
      if (t.id !== tripId) return t;
      const existingDocIds = t.documents.map((doc) => doc.id);
      const newDocs = docs.filter((doc) => !existingDocIds.includes(doc.id));
      return {
        ...t,
        documents: hydratedTrip?.documents || [...t.documents, ...newDocs],
        status: "STAMPED_DOCS_SUBMITTED" as TripStatus,
      };
    });
    setTrips(next);
    const updatedSelectedTrip = next.find((t) => t.id === tripId);
    if (selected?.id === tripId && updatedSelectedTrip) {
      setSelected(updatedSelectedTrip);
    }
    void persist("trips", next);
    notify("Stamped documents submitted — waiting for Operations approval");
  }

  async function toggleVerifyDoc(tripId: string, docId: string) {
    const initTypes = ["LR", "WB", "Invoice"];
    const stampedTypes = ["LR (stamped)", "WB (stamped)", "Invoice (stamped)"];

    const nextTrips = trips.map((t) => {
      if (t.id !== tripId) return t;
      const updatedDocs = t.documents.map((d) => {
        if (d.id !== docId) return d;
        const newStatus = d.status === "verified" ? "uploaded" : "verified";
        return { ...d, status: newStatus };
      });

      const allInitVerified = initTypes.every((type) =>
        updatedDocs.some((d) => d.type === type && d.status === "verified"),
      );

      const allStampedVerified = stampedTypes.every((type) =>
        updatedDocs.some((d) => d.type === type && d.status === "verified"),
      );

      let newTripStatus = t.status;
      if (allStampedVerified) {
        newTripStatus = "COMPLETED" as TripStatus;
      } else if (
        allInitVerified &&
        ["DOCUMENTS_SUBMITTED", "DRIVER_ACCEPTED", "PREPARING"].includes(
          t.status,
        )
      ) {
        newTripStatus = "READY" as TripStatus;
      } else if (!allInitVerified && t.status === "READY") {
        newTripStatus = "DOCUMENTS_SUBMITTED" as TripStatus;
      } else if (!allStampedVerified && t.status === "COMPLETED") {
        newTripStatus = "STAMPED_DOCS_SUBMITTED" as TripStatus;
      }

      return { ...t, documents: updatedDocs, status: newTripStatus };
    });

    setTrips(nextTrips);
    if (selected?.id === tripId) {
      const updatedSelected = nextTrips.find((t) => t.id === tripId) || null;
      setSelected(updatedSelected);
    }

    const allDocs = nextTrips.flatMap((t) =>
      t.documents.map((d) => ({
        ...d,
        tripId: t.id,
        trip_Id: d.trip_Id || t.reference,
      })),
    );
    await persist("documents", allDocs);
    await persist("trips", nextTrips);

    const targetDoc = nextTrips
      .find((t) => t.id === tripId)
      ?.documents.find((d) => d.id === docId);
    const isVer = targetDoc?.status === "verified";
    notify(
      `Document "${targetDoc?.name || ""}" marked as ${isVer ? "Verified" : "Unverified"}`,
    );
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const title =
    view === "dashboard"
      ? `नमस्ते, ${ROLE_GREETINGS[role]}`
      : view === "active"
        ? "Active"
        : view === "trips" || view === "trip-detail"
          ? "Trips"
          : view === "followups"
            ? "Follow-ups"
            : view === "fuel"
              ? "Fuel Transactions"
              : view === "reports-ops"
                ? "Trip Operations Report"
                : view === "reports-fuel"
                  ? "Fuel & Extra Fuel Reports"
                  : view === "reports-cash"
                    ? "Cash Advances Report"
                    : view === "approvals"
                      ? "Super Admin Approvals"
                      : "Overview";

  return (
    <div className="app-shell app-shell-bottom-nav">
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            {role === "Super Admin" ? t("Admin") : t("Operations")} <span>/</span>{" "}
            {view === "dashboard" ? t("Overview") : t(title)}
          </div>
          <div className="top-actions">
            <div className="role-switch">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="role-switch">
              <span>{t("Viewing as")}</span>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  changeView("dashboard");
                }}
                aria-label="Select role"
              >
                <option value="Coordinator">{t("Coordinator")}</option>
                <option value="Operations">{t("Operations")}</option>
                <option value="Driver">{t("Driver")}</option>
                <option value="Super Admin">{t("Super Admin")}</option>
              </select>
            </div>
          </div>
        </header>

        <div className="content">
          {!dbReady && !dbError && (
            <div className="panel db-state">Loading mock database…</div>
          )}
          {dbError && <div className="panel db-state error">{dbError}</div>}
          {isOffline && (
            <div className="offline-banner">
              <b>{t("Offline mode")}</b>
              <span>
                You&apos;re viewing cached app shell content. Live mock data
                will load again when the connection returns.
              </span>
            </div>
          )}
          {dbReady && (
            <>
              {!isDriverFlowLocked && (
                <div className="page-heading">
                  <div>
                    <h1>{t(title)}</h1>
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
                          <span>{t("Import Excel")}</span>
                        </button>
                        <button
                          className="button primary"
                          onClick={() => setShowCreate(true)}
                        >
                          <Plus
                            size={16}
                            style={{ display: "inline", marginRight: 6 }}
                          />
                          <span>{t("New trip")}</span>
                        </button>
                      </div>
                    )}
                </div>
              )}

              {isDriverFlowLocked && activeDriverFlow && activeDriverTrip ? (
                <DriverWorkflow
                  trip={activeDriverTrip}
                  flowState={activeDriverFlow}
                  onUpdateFlowState={updateDriverFlowState}
                  onAddDocument={(doc) =>
                    addDocumentForTrip(activeDriverTrip.id, doc)
                  }
                  onAddExtra={(extraData) =>
                    addExtraForTrip(activeDriverTrip.id, extraData)
                  }
                  onStartTrip={startTrip}
                  onReachTrip={reachTrip}
                  onSubmitStampedDocs={(docs) =>
                    submitStampedDocsForTrip(activeDriverTrip.id, docs)
                  }
                  onCompleteFlow={() => updateDriverFlowState(null)}
                />
              ) : (
                <>
                  {view === "dashboard" && !(role === "Driver" && (activeDriverFlow || isDriverInTrip)) && (
                    <Dashboard
                      trips={visibleTrips}
                      fuelTransactions={fuelTransactions}
                      approvalCount={
                        allExtras.filter((x) => x.status === "Submitted").length
                      }
                      role={role}
                      activeDriverFlow={activeDriverFlow}
                      onOpenFuel={() => {
                        setFuelStatusFilter("Pending");
                        setView("fuel");
                      }}
                      onMetricClick={(f) => {
                        if (f === "Pending Approvals") {
                          setView("approvals");
                          return;
                        }
                        setTripsFilter(f);
                        setView("trips");
                      }}
                      onAcceptTrip={acceptTripByDriver}
                      onRejectTrip={rejectTripByDriver}
                      onResumeFlow={(t) => {
                        const docs = t.documents.map((d) => d.type);
                        let step = 1;
                        if (t.status === "REACHED") {
                          if (docs.includes("WB (stamped)")) step = 8;
                          else if (docs.includes("LR (stamped)")) step = 7;
                          else step = 6;
                        } else if (t.status === "IN_TRANSIT") step = 5;
                        else if (docs.includes("Invoice")) step = 4;
                        else if (docs.includes("WB")) step = 3;
                        else if (docs.includes("LR")) step = 2;
                        updateDriverFlowState({ tripId: t.id, step });
                      }}
                    />
                  )}
                  {view === "active" && role === "Driver" && (
                    <ActiveTripsPage
                      trips={visibleTrips}
                      activeDriverFlow={activeDriverFlow}
                      onResumeFlow={(t) => {
                        const docs = t.documents.map((d) => d.type);
                        let step = 1;
                        if (t.status === "REACHED") {
                          if (docs.includes("WB (stamped)")) step = 8;
                          else if (docs.includes("LR (stamped)")) step = 7;
                          else step = 6;
                        } else if (t.status === "IN_TRANSIT") step = 5;
                        else if (docs.includes("Invoice")) step = 4;
                        else if (docs.includes("WB")) step = 3;
                        else if (docs.includes("LR")) step = 2;
                        updateDriverFlowState({ tripId: t.id, step });
                      }}
                    />
                  )}
              {view === "trips" && (
                role === "Super Admin" ? (
                  <TripOpsReport
                    trips={visibleTrips}
                    onOpenTrip={(trip) => {
                      setSelected(trip);
                      setView("trip-detail");
                    }}
                  />
                ) : (
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
                    view={view}
                  />
                )
                  )}
                </>
              )}
              {view === "trip-detail" && selected && (
                <TripDetail
                  trip={selected}
                  role={role}
                  onBack={() => changeView("trips")}
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
                  onToggleVerifyDoc={toggleVerifyDoc}
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
                  view={view}
                />
              )}
              {view === "fuel" &&
                role !== "Driver" &&
                role !== "Coordinator" && (
                  <FuelTransactionsPage
                    transactions={fuelTransactions}
                    onSendToPump={sendToPump}
                    onResend={resendToPump}
                    view={view}
                    defaultStatusFilter={fuelStatusFilter}
                  />
                )}
              {view === "reports-ops" && (
                <TripOpsReport
                  trips={trips}
                  onMetricClick={(f: string) => {
                    setTripsFilter(f);
                    setView("trips");
                  }}
                />
              )}
              {view === "reports-fuel" && (
                <FuelReportsPage
                  trips={trips}
                  extras={allExtras}
                  initialTab={fuelReportTab}
                  initialStatus={fuelReportStatus}
                  onNavigateApprovals={handleNavigateApprovals}
                />
              )}
              {view === "reports-cash" && (
                <CashAdvancesPage
                  trips={trips}
                  extras={allExtras}
                  initialStatus={cashReportStatus}
                  onNavigateApprovals={handleNavigateApprovals}
                />
              )}
              {view === "approvals" && (
                <ApprovalsHub
                  extras={allExtras}
                  trips={trips}
                  initialFilter={approvalFilterType}
                  initialStatusTab={approvalStatusTab}
                  onApprove={(id) => updateExtraApproval(id, "Approved")}
                  onReject={(id) => updateExtraApproval(id, "Rejected")}
                  onOpenTrip={(tripId) => {
                    const t = trips.find((x) => x.id === tripId);
                    if (t) {
                      setSelected(t);
                      setView("trip-detail");
                    }
                  }}
                  onNavigateReports={handleNavigateReports}
                />
              )}
            </>
          )}
        </div>
      </main>
      <BottomBar
        role={role}
        view={view}
        newCount={newCount}
        pendingApprovalsCount={pendingApprovalsCount}
        onNavigate={(next) => {
          if (next === "overview")
            changeView(
              role === "Driver" && (activeDriverFlow || isDriverInTrip)
                ? "active"
                : "dashboard",
            );
          if (next === "active") changeView("active");
          if (next === "trips")
            changeView(
              role === "Driver" && (activeDriverFlow || isDriverInTrip)
                ? "active"
                : "trips",
            );
          if (next === "fuel")
            changeView(role === "Super Admin" ? "reports-fuel" : "fuel");
          if (next === "cash") changeView("reports-cash");
          if (next === "approvals") changeView("approvals");
          if (next === "followups") changeView("followups");
        }}
      />

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
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={addTrip}
          clients={clients}
        />
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
          onCreate={(doc) => {
            if (selected) submitStampedDocsForTrip(selected.id, [doc]);
            setShowDocument(false);
          }}
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
          clients={clients}
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
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={disabled ? undefined : onClick}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      title={
        disabled
          ? "Navigation is locked during active driver workflow"
          : undefined
      }
    >
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {icon}
      </span>
      {label}
      {count ? <em>{count}</em> : null}
      {disabled && (
        <Lock size={12} style={{ marginLeft: "auto", opacity: 0.7 }} />
      )}
    </button>
  );
}

function BottomBar({
  role,
  view,
  newCount,
  pendingApprovalsCount,
  onNavigate,
}: {
  role: Role;
  view: string;
  newCount: number;
  pendingApprovalsCount: number;
  onNavigate: (
    next:
      | "overview"
      | "active"
      | "trips"
      | "fuel"
      | "cash"
      | "approvals"
      | "followups",
  ) => void;
}) {
  const { t } = useLang();
  const items =
    role === "Driver"
      ? [
          { id: "overview", icon: <House size={20} />, label: "Overview" },
          { id: "active", icon: <WarningCircle size={20} />, label: "Active" },
          {
            id: "trips",
            icon: <Truck size={20} />,
            label: "Trips",
            count: newCount,
          },
        ]
      : role === "Coordinator"
        ? [
            { id: "overview", icon: <House size={20} />, label: "Overview" },
            {
              id: "trips",
              icon: <Truck size={20} />,
              label: "Trips",
              count: newCount,
            },
          ]
        : role === "Operations"
          ? [
              { id: "overview", icon: <House size={20} />, label: "Overview" },
              {
                id: "trips",
                icon: <Truck size={20} />,
                label: "Trips",
                count: newCount,
              },
              { id: "fuel", icon: <GasPump size={20} />, label: "Fuel" },
              {
                id: "followups",
                icon: <Clock size={20} />,
                label: "Follow-ups",
              },
            ]
          : [
              { id: "overview", icon: <House size={20} />, label: "Overview" },
              { id: "trips", icon: <Truck size={20} />, label: "Trips" },
              { id: "fuel", icon: <GasPump size={20} />, label: "Fuel" },
              { id: "cash", icon: <CurrencyInr size={20} />, label: "Cash" },
              {
                id: "approvals",
                icon: <CheckCircle size={20} />,
                label: "Approvals",
                count: pendingApprovalsCount,
              },
            ];

  return (
    <nav className="bottom-bar" aria-label="Primary">
      {items.map((item) => {
        const active =
          item.id === "overview"
            ? view === "dashboard"
            : item.id === "fuel" && role === "Super Admin"
              ? view === "reports-fuel"
              : item.id === "cash"
                ? view === "reports-cash"
                : item.id === "approvals"
                  ? view === "approvals"
                  : view === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-bar-item ${active ? "active" : ""}`}
            onClick={() => onNavigate(item.id as any)}
            aria-label={t(item.label)}
            title={t(item.label)}
            type="button"
          >
            <span className="bottom-bar-icon">{item.icon}</span>
            {item.count ? <em>{item.count}</em> : null}
          </button>
        );
      })}
    </nav>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const { bg, color } = getStatusColors(status);
  return (
    <span className="status" style={{ background: bg, color }}>
      {t(getStatusLabel(status))}
    </span>
  );
}

// Legacy Status component for compatibility (used by followups, fuel etc.)
function Status({ children }: { children: string }) {
  const { t } = useLang();
  return (
    <span className={`status ${children.toLowerCase().replace(/\s+/g, "-")}`}>
      {t(children)}
    </span>
  );
}

function ActiveTripsPage({
  trips,
  activeDriverFlow,
  onResumeFlow,
}: {
  trips: Trip[];
  activeDriverFlow?: DriverFlowState | null;
  onResumeFlow: (t: Trip) => void;
}) {
  const { t } = useLang();
  const activeTrips = trips.filter((t) =>
    [
      "DRIVER_ACCEPTED",
      "PREPARING",
      "READY",
      "IN_TRANSIT",
      "ON_HOLD",
      "REACHED",
      "DOCUMENTS_SUBMITTED",
      "STAMPED_DOCS_SUBMITTED",
    ].includes(t.status),
  );

  return (
    <section className="panel list-panel active-panel">
      <div className="panel-header">
        <div>
          <h2>{t("Active")}</h2>
          <p>Current live trip work and journey state.</p>
        </div>
      </div>
      {activeDriverFlow && (
        <div className="active-banner">
          <div>
            <b>Active workflow in progress</b>
            <span>Resume the current driver flow from where it stopped.</span>
          </div>
        </div>
      )}
      <div className="active-stack">
        {activeTrips.map((trip) => (
          <button
            key={trip.id}
            className="active-card"
            onClick={() => onResumeFlow(trip)}
            type="button"
          >
            <div className="active-card-main">
              <b>{trip.reference}</b>
              <small>
                {trip.customer} · {trip.origin} → {trip.destination}
              </small>
            </div>
            <StatusBadge status={trip.status} />
          </button>
        ))}
        {!activeTrips.length && <Empty label="No active trips right now." />}
      </div>
    </section>
  );
}

function Dashboard({
  trips,
  fuelTransactions,
  approvalCount,
  role,
  activeDriverFlow,
  onMetricClick,
  onOpenFuel,
  onAcceptTrip,
  onRejectTrip,
  onResumeFlow,
}: {
  trips: Trip[];
  fuelTransactions: FuelTransaction[];
  approvalCount: number;
  role: Role;
  activeDriverFlow?: DriverFlowState | null;
  onMetricClick: (
    f:
      | "New"
      | "Driver Pending"
      | "In Transit"
      | "Docs Uploaded"
      | "Complete"
      | "Rejected (Ops)"
      | "Pending Approvals",
  ) => void;
  onOpenFuel?: () => void;
  onAcceptTrip?: (t: Trip) => void;
  onRejectTrip?: (t: Trip) => void;
  onResumeFlow?: (t: Trip) => void;
}) {
  const { t } = useLang();
  const newTrips = trips.filter((t) => t.status === "NEW");
  const pendingTrips = trips.filter((t) =>
    ["DRIVER_PENDING", "DRIVER_ACCEPTED", "PREPARING"].includes(t.status),
  );
  const pendingFuelAssignments = fuelTransactions.filter(
    (tx) => tx.status === "Pending",
  );
  const activeTrips = trips.filter((t) =>
    ["READY", "IN_TRANSIT", "ON_HOLD", "REACHED"].includes(t.status),
  );
  const deliveredTrips = trips.filter((t) =>
    ["DELIVERED", "DOCUMENTS_SUBMITTED"].includes(t.status),
  );
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const rejectedTrips = trips.filter((t) =>
    ["REJECTED", "DRIVER_REJECTED"].includes(t.status),
  );

  return (
    <div>
      {role === "Driver" && onAcceptTrip && onRejectTrip && onResumeFlow && (
        <DriverOverviewSection
          trips={trips}
          activeDriverFlow={activeDriverFlow}
          onAcceptTrip={onAcceptTrip}
          onRejectTrip={onRejectTrip}
          onResumeFlow={onResumeFlow}
        />
      )}

      <section
        className="stats"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          width: "100%",
          marginBottom: role === "Driver" ? 24 : 0,
        }}
      >
        {role !== "Driver" && (
          <Stat
            label={t("New Trips")}
            value={newTrips.length}
            tone="blue"
            icon={<Clock size={18} />}
            onClick={() => onMetricClick("New")}
            alert={role === "Operations" && newTrips.length > 0}
          />
        )}
        {role === "Operations" && (
          <Stat
            label={t("Pending Fuel Assignments")}
            value={pendingFuelAssignments.length}
            tone="purple"
            icon={<GasPump size={18} />}
            onClick={onOpenFuel}
            alert={role === "Operations" && pendingFuelAssignments.length > 0}
          />
        )}
        {role === "Super Admin" && (
          <Stat
            label={t("Pending Approvals")}
            value={approvalCount}
            tone="red"
            icon={<CheckCircle size={18} />}
            onClick={() => onMetricClick("Pending Approvals")}
            alert={approvalCount > 0}
          />
        )}
        <Stat
          label={t("Driver Pending")}
          value={pendingTrips.length}
          tone="blue"
          icon={<Truck size={18} />}
          onClick={() => onMetricClick("Driver Pending")}
        />
        <Stat
          label={t("Active Trips")}
          value={activeTrips.length}
          tone="purple"
          icon={<Truck size={18} />}
          onClick={() => onMetricClick("In Transit")}
        />
        <Stat
          label={t("Docs Uploaded")}
          value={deliveredTrips.length}
          tone="green"
          icon={<ChartPie size={18} />}
          onClick={() => onMetricClick("Docs Uploaded")}
        />
        <Stat
          label={t("Completed")}
          value={completedTrips.length}
          tone="green"
          icon={<ChartPie size={18} />}
          onClick={() => onMetricClick("Complete")}
        />
        {role !== "Driver" && (
          <Stat
            label={t("Rejected")}
            value={rejectedTrips.length}
            tone="red"
            icon={<Clock size={18} />}
            onClick={() => onMetricClick("Rejected (Ops)")}
          />
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
  onClick,
  alert,
}: {
  label: string;
  value: string | number;
  tone: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  alert?: boolean;
}) {
  return (
    <button
      className="stat"
      style={{
        textAlign: "left",
        border: "1px solid var(--line)",
        background: alert
          ? "linear-gradient(180deg, #fff7ed 0%, #fff 100%)"
          : "var(--surface)",
        cursor: "pointer",
        width: "100%",
        boxShadow: alert
          ? "0 0 0 1px rgba(249, 115, 22, 0.18), 0 8px 24px rgba(249, 115, 22, 0.12)"
          : undefined,
        animation: alert ? "pulseAlert 1.8s ease-in-out infinite" : undefined,
      }}
      onClick={onClick}
    >
      {icon && (
        <span
          className={`stat-icon ${tone}`}
          style={
            alert ? { background: "#fed7aa", color: "#c2410c" } : undefined
          }
        >
          {icon}
        </span>
      )}
      <div>
        <p style={alert ? { color: "#9a3412" } : undefined}>{label}</p>
        <strong style={alert ? { color: "#c2410c" } : undefined}>
          {value}
        </strong>
      </div>
    </button>
  );
}

type ApprovalStatus = "Submitted" | "Approved" | "Rejected";

function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useLang();
  const styles =
    status === "Approved"
      ? { background: "#dcfce7", color: "#15803d" }
      : status === "Rejected"
        ? { background: "#fee2e2", color: "#b91c1c" }
        : { background: "#fef3c7", color: "#b45309" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 88,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        ...styles,
      }}
    >
      {t(status)}
    </span>
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted-ink)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          From Date
        </span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onFrom(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted-ink)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          To Date
        </span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onTo(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>
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
  view,
}: {
  trips: Trip[];
  role: Role;
  onOpen: (t: Trip) => void;
  onCreate: () => void;
  onImport: () => void;
  filter: string;
  setFilter: (f: string) => void;
  view?: string;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draftStatus, setDraftStatus] = useState("All");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

  useEffect(() => {
    setQuery("");
    setStatusFilter("All");
    setDateFrom("");
    setDateTo("");
    setDraftStatus("All");
    setDraftDateFrom("");
    setDraftDateTo("");
    setShowFilters(false);
  }, [view]);
  const statusPriority: Record<string, number> = {
    NEW: 1,
    DRIVER_PENDING: 2,
    REJECTED: 3,
    DRIVER_ACCEPTED: 4,
    DRIVER_REJECTED: 5,
    DOCUMENTS_SUBMITTED: 6,
    STAMPED_DOCS_SUBMITTED: 6,
    PREPARING: 6,
    READY: 7,
    IN_TRANSIT: 8,
    ON_HOLD: 8,
    REACHED: 9,
    DELIVERED: 9,
    COMPLETED: 10,
  };

  const FILTER_GROUPS: Record<string, TripStatus[]> = {
    All: [],
    New: ["NEW"],
    "Driver Pending": ["DRIVER_PENDING"],
    "Rejected (Ops)": ["REJECTED"],
    Accepted: ["DRIVER_ACCEPTED"],
    "Rejected (Driver)": ["DRIVER_REJECTED"],
    "Docs Uploaded": ["DOCUMENTS_SUBMITTED", "PREPARING"],
    "Not Started": ["READY"],
    "In Transit": ["IN_TRANSIT", "ON_HOLD"],
    Reached: ["REACHED", "DELIVERED"],
    "Stamped Docs": ["STAMPED_DOCS_SUBMITTED"],
    Complete: ["COMPLETED"],
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
    const aStatus = statusPriority[a.status] ?? 999;
    const bStatus = statusPriority[b.status] ?? 999;
    if (aStatus !== bStatus) return aStatus - bStatus;
    const ad = parseTripDate(a)?.getTime() ?? 0;
    const bd = parseTripDate(b)?.getTime() ?? 0;
    return bd - ad;
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
    "Driver Pending",
    "Rejected (Ops)",
    "Accepted",
    "Rejected (Driver)",
    "Docs Uploaded",
    "Not Started",
    "In Transit",
    "Reached",
    "Stamped Docs",
    "Complete",
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

  useEffect(() => {
    if (filter !== statusFilter) {
      setStatusFilter(filter);
      setDraftStatus(filter);
    }
  }, [filter]);

  return (
    <div className="table-page-panel">
      {/* Section 2: search bar + filter icon button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("Search")} reference or customer...`}
          />
        </div>
        <div style={{ position: "relative" }}>
          <button
            className="table-filter-btn"
            aria-label="Open filters"
            title={t("Filters")}
            onClick={() =>
              showFilters ? setShowFilters(false) : openFilters()
            }
          >
            <FunnelSimple size={16} />
            {activeFilters > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
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
            <>
              <div
                role="presentation"
                onClick={() => setShowFilters(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.18)",
                  zIndex: 1000,
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
                  zIndex: 1001,
                  background: "var(--surface, #fff)",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  boxShadow: "0 -16px 40px rgba(15, 23, 42, 0.18)",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 4,
                    borderRadius: 999,
                    background: "#dbe3ee",
                    margin: "12px auto 4px",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 20px 12px",
                    borderBottom: "1px solid var(--line)",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <b style={{ fontSize: 17, color: "var(--ink)" }}>
                      {t("Filters")}
                    </b>
                    {activeFilters > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--muted-ink)",
                          marginLeft: 8,
                        }}
                      >
                        ({activeFilters} {t("Active")})
                      </span>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <button
                      type="button"
                      className="text-button"
                      style={{
                        fontSize: 13,
                        color: "var(--blue)",
                        fontWeight: 600,
                      }}
                      onClick={clearAllFilters}
                    >
                      {t("Reset All")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      aria-label="Close filters"
                      style={{
                        background: "var(--line-light, #f1f5f9)",
                        border: "none",
                        borderRadius: "50%",
                        width: 30,
                        height: 30,
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        color: "var(--ink)",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px 20px",
                    overflowY: "auto",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  {activeChips.length > 0 && (
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
                        {t("Active Filters")}
                      </p>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {activeChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            className="filter active"
                            style={{
                              fontSize: 11,
                              paddingRight: 10,
                              borderRadius: 20,
                            }}
                            onClick={() => {
                              if (chip === draftStatus) setDraftStatus("All");
                              if (chip.startsWith("From "))
                                setDraftDateFrom("");
                              if (chip.startsWith("To ")) setDraftDateTo("");
                            }}
                          >
                            {chip} <span style={{ marginLeft: 6 }}>×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
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
                      {t("TRIP STATUS")}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {statusOptions.map((f) => {
                        const isSelected = draftStatus === f;
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setDraftStatus(f)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: isSelected
                                ? "1.5px solid var(--blue)"
                                : "1px solid var(--line)",
                              background: isSelected
                                ? "var(--blue-soft, #eff6ff)"
                                : "var(--surface)",
                              color: isSelected
                                ? "var(--blue)"
                                : "var(--ink)",
                              fontSize: 13,
                              fontWeight: isSelected ? 600 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              textAlign: "left",
                            }}
                          >
                            <span>{t(f)}</span>
                            {isSelected && (
                              <CheckCircle
                                size={15}
                                style={{
                                  color: "var(--blue)",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
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
                      {t("Date Range")}
                    </p>
                    <DateRangeFilter
                      dateFrom={draftDateFrom}
                      dateTo={draftDateTo}
                      onFrom={setDraftDateFrom}
                      onTo={setDraftDateTo}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px 20px 16px",
                    borderTop: "1px solid var(--line)",
                    background: "var(--surface, #fff)",
                    display: "flex",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <button
                    className="button secondary"
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontSize: 14,
                      borderRadius: 10,
                    }}
                    onClick={clearAllFilters}
                    type="button"
                  >
                    {t("Clear All")}
                  </button>
                  <button
                    className="button primary"
                    style={{
                      flex: 2,
                      padding: "12px",
                      fontSize: 14,
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                    onClick={applyFilters}
                    type="button"
                  >
                    {t("Apply Filters")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Date"),
                t("Reference & Customer"),
                t("Route"),
                t("Driver"),
                t("Status"),
                t("Action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                style={{ cursor: "pointer" }}
                onClick={() => onOpen(t)}
              >
                <td style={{ whiteSpace: "nowrap" }}>
                  <b>{t.date.split(" ")[0]}</b>{" "}
                  <small style={{ color: "var(--muted-ink)" }}>
                    {t.date.split(" ")[1]}
                  </small>
                </td>
                <td>
                  <b style={{ color: "var(--ink)" }}>{t.reference}</b>
                  {t.customer && (
                    <small style={{ display: "block", color: "var(--muted-ink)" }}>
                      {t.customer}
                    </small>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 500 }}>{t.origin}</span>
                  <ArrowRight
                    size={12}
                    style={{ display: "inline", margin: "0 4px", color: "#a4adba" }}
                  />
                  <span style={{ color: "var(--muted-ink)" }}>{t.destination}</span>
                </td>
                <td>{t.driver || "—"}</td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td style={{ textAlign: "center", color: "#a6afbb" }}>
                  <CaretRight size={16} />
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No trips match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentPreviewModal({
  doc,
  tripRef,
  role,
  onClose,
  onToggleVerify,
}: {
  doc: TripDocument;
  tripRef?: string;
  role?: Role;
  onClose: () => void;
  onToggleVerify?: () => void;
}) {
  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="modal"
        style={{
          maxWidth: 700,
          padding: 0,
          overflow: "hidden",
          background: "#0f172a",
        }}
      >
        <button
          onClick={onClose}
          className="quick-action-icon"
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 2,
            background: "rgba(15,23,42,0.72)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            padding: 24,
            background: "#0f172a",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 420,
            textAlign: "center",
          }}
        >
          <FileText size={72} style={{ color: "#38bdf8", marginBottom: 16 }} />
          <div style={{ width: "100%", maxWidth: 520 }}>
            <b
              style={{
                fontSize: 16,
                color: "#f8fafc",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {doc.name}
            </b>
          </div>
        </div>
      </div>
    </div>
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
  onToggleVerifyDoc,
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
  onToggleVerifyDoc?: (tripId: string, docId: string) => void;
}) {
  const isPendingReview = trip.status === "NEW";
  const hasAssignment = !["NEW", "REJECTED"].includes(trip.status);
  const [previewDoc, setPreviewDoc] = useState<TripDocument | null>(null);

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
            {role === "Operations" && onFollowup && trip.status !== "NEW" && (
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
          <div
            className="journey journey-times"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              <small>Pickup</small>
              <b
                style={{
                  fontSize: 15,
                  lineHeight: 1.3,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                }}
              >
                {trip.origin}
              </b>
              <span>
                <em>Scheduled</em>
                <b>{trip.pickupDate || trip.date}</b>
                <b>{to12Hour(trip.pickupTime || trip.time)}</b>
              </span>
            </div>
            <ArrowRight
              size={18}
              style={{ color: "var(--blue)", marginTop: 20, flexShrink: 0 }}
            />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              <small>Drop-off</small>
              <b
                style={{
                  fontSize: 15,
                  lineHeight: 1.3,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                }}
              >
                {trip.destination}
              </b>
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
                    ) : extra.type === "AdBlue" ? (
                      <Drop size={16} />
                    ) : (
                      <DotsThree size={16} />
                    )}
                  </span>
                  <div>
                    <b>Extra {extra.type} request</b>
                    <p>{extra.note}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{extra.amount}</strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 700,
                        marginTop: 2,
                        padding: "2px 6px",
                        borderRadius: 8,
                        background:
                          extra.status === "Approved"
                            ? "#dcfce7"
                            : extra.status === "Rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                        color:
                          extra.status === "Approved"
                            ? "#15803d"
                            : extra.status === "Rejected"
                              ? "#b91c1c"
                              : "#b45309",
                      }}
                    >
                      {extra.status === "Approved"
                        ? "Approved"
                        : extra.status === "Rejected"
                          ? "Rejected"
                          : "Submitted"}
                    </span>
                  </div>
                </div>
              ))}
              {!trip.extras.length && <Empty label="No extra expenses" />}
              <h2 className="activity-title">Trip documents</h2>
              {(() => {
                const uniqueDocsMap = new Map<string, TripDocument>();
                trip.documents.forEach((d) => {
                  if (d && d.id) {
                    uniqueDocsMap.set(d.id, d);
                  }
                });
                const uniqueDocs = Array.from(uniqueDocsMap.values());

                return (
                  <>
                    {uniqueDocs.map((doc, idx) => {
                      const isVerified = doc.status === "verified";
                      return (
                        <div
                          className="extra-row"
                          key={`${doc.id || "doc"}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 8,
                            border: `1px solid ${isVerified ? "#bbf7d0" : "var(--line)"}`,
                            marginBottom: 8,
                            background: isVerified
                              ? "#f0fdf4"
                              : "var(--surface)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span className="extra-icon">
                              <FileText
                                size={18}
                                style={{
                                  color: isVerified ? "#16a34a" : "var(--blue)",
                                }}
                              />
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <b
                                style={{
                                  fontSize: 12,
                                  lineHeight: 1.25,
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {doc.name}
                              </b>
                              <p
                                style={{
                                  fontSize: 10,
                                  color: "var(--muted-ink)",
                                  margin: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {doc.type} · {doc.uploadedAt}
                              </p>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexShrink: 0,
                            }}
                          >
                            <button
                              type="button"
                              className="button secondary compact"
                              onClick={() => setPreviewDoc(doc)}
                              style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              title="Open document"
                              aria-label="Open document"
                            >
                              <Eye size={16} />
                            </button>

                            {(role === "Operations" ||
                              role === "Super Admin") &&
                            onToggleVerifyDoc ? (
                              <button
                                type="button"
                                className={`button ${isVerified ? "secondary" : "primary"} compact`}
                                onClick={() =>
                                  onToggleVerifyDoc(trip.id, doc.id)
                                }
                                style={{
                                  width: 32,
                                  height: 32,
                                  minWidth: 32,
                                  padding: 0,
                                  background: isVerified
                                    ? "#dcfce7"
                                    : undefined,
                                  color: isVerified ? "#15803d" : undefined,
                                  borderColor: isVerified
                                    ? "#86efac"
                                    : undefined,
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                title={isVerified ? "Verified" : "Verify"}
                                aria-label={isVerified ? "Verified" : "Verify"}
                              >
                                <Check size={16} />
                              </button>
                            ) : isVerified ? (
                              <span
                                style={{
                                  width: 32,
                                  height: 32,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 0,
                                  color: "#16a34a",
                                  background: "#dcfce7",
                                  borderRadius: 8,
                                }}
                                title="Verified"
                                aria-label="Verified"
                              >
                                <Check size={16} />
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {!uniqueDocs.length && (
                      <Empty label="No documents uploaded" />
                    )}
                  </>
                );
              })()}
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

        {/* Operations/Admin: verify documents → complete (only after final stamped docs uploaded stage) */}
        {(role === "Operations" || role === "Super Admin") &&
          (trip.status === "STAMPED_DOCS_SUBMITTED" ||
            trip.documents.some((d) => d.type.includes("(stamped)"))) && (
            <div className="panel action-panel">
              <h2>Verify Documents</h2>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted-ink)",
                  marginBottom: 12,
                }}
              >
                Review each submitted document independently above before
                completing.
              </p>

              {(() => {
                const totalDocs = trip.documents.length;
                const verifiedDocs = trip.documents.filter(
                  (d) => d.status === "verified",
                ).length;
                const allVerified = totalDocs > 0 && verifiedDocs === totalDocs;

                return (
                  <>
                    <div
                      style={{
                        background: "var(--surface-alt, #f8fafc)",
                        border: "1px solid var(--line)",
                        borderRadius: 6,
                        padding: "10px 12px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        <span>Verification Progress</span>
                        <span
                          style={{
                            color: allVerified ? "#15803d" : "var(--blue)",
                          }}
                        >
                          {verifiedDocs} of {totalDocs} verified
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "var(--line)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width:
                              totalDocs > 0
                                ? `${(verifiedDocs / totalDocs) * 100}%`
                                : "0%",
                            background: allVerified ? "#22c55e" : "#2563eb",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className="button primary wide"
                      onClick={() => onCompleteTrip(trip)}
                      style={{ padding: "12px 16px" }}
                    >
                      <Check
                        size={16}
                        style={{ display: "inline", marginRight: 6 }}
                      />
                      {allVerified
                        ? "Complete Trip (All Verified)"
                        : "Verify & Complete Trip"}
                    </button>
                  </>
                );
              })()}
            </div>
          )}

        {/* Document Review Modal Overlay */}
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            tripRef={trip.reference}
            role={role}
            onClose={() => setPreviewDoc(null)}
            onToggleVerify={
              onToggleVerifyDoc
                ? () => {
                    onToggleVerifyDoc(trip.id, previewDoc.id);
                    setPreviewDoc((prev) =>
                      prev
                        ? {
                            ...prev,
                            status:
                              prev.status === "verified"
                                ? "uploaded"
                                : "verified",
                          }
                        : null,
                    );
                  }
                : undefined
            }
          />
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

function FilterModal({
  isOpen,
  onClose,
  title = "Filters",
  sections,
  onClearAll,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  sections: {
    title?: string;
    options: { id: string; label: string }[];
    selected: string;
    onSelect: (id: string) => void;
  }[];
  onClearAll?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        className="filter-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 420px)",
          background: "#ffffff",
          borderRadius: "16px 16px 0 0",
          padding: "16px 20px calc(28px + env(safe-area-inset-bottom) + 120px)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
          maxHeight: "calc(100dvh - 140px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: "#cbd5e1",
            borderRadius: 2,
            margin: "0 auto 14px",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {title}
          </h3>
          {onClearAll && (
            <button
              className="text-button"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#2563eb",
                padding: 0,
              }}
              onClick={onClearAll}
            >
              Clear All
            </button>
          )}
        </div>

        {sections.map((sec, idx) => (
          <div
            key={idx}
            style={{ marginBottom: idx < sections.length - 1 ? 16 : 0 }}
          >
            {sec.title && (
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {sec.title}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sec.options.map((opt) => {
                const isSelected = sec.selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      sec.onSelect(opt.id);
                      onClose();
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: isSelected
                        ? "1px solid #bfdbfe"
                        : "1px solid transparent",
                      background: isSelected ? "#eff6ff" : "transparent",
                      color: isSelected ? "#1d4ed8" : "#334155",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "background 0.15s ease",
                    }}
                  >
                    {opt.label} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableShell({
  query,
  onQueryChange,
  queryPlaceholder,
  onFilterClick,
  filterCount = 0,
  rightActions,
  children,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  onFilterClick: () => void;
  filterCount?: number;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div className="search" style={{ flex: 1, minWidth: 0 }}>
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", marginRight: 4 }}
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={queryPlaceholder}
          />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {rightActions}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              className="button secondary compact"
              aria-label="Open filters"
              title="Filters"
              onClick={onFilterClick}
              style={{ minWidth: 36, width: 40, height: 40, padding: "0 8px" }}
            >
              <FunnelSimple size={16} />
            </button>
            {filterCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 14,
                  height: 14,
                  fontSize: 9,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                }}
              >
                {filterCount}
              </span>
            )}
          </div>
        </div>
      </div>
      {children}
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
                    value={selectedDriver.source_location || "Not specified"}
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
function normalizeLocation(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
function scoreDriverForOrigin(driver: Driver, origin: string): number {
  if (!normalizeLocation(origin)) return 0;
  const normalizedOrigin = normalizeLocation(origin);
  const normalizedDriverLocation = normalizeLocation(
    (driver as unknown as { source_location?: string }).source_location,
  );
  if (normalizedOrigin === normalizedDriverLocation) return 5;
  if (normalizedOrigin.includes(normalizedDriverLocation)) return 4;
  if (normalizedDriverLocation.includes(normalizedOrigin)) return 4;

  const originCity = extractCity(origin);
  const driverCity = extractCity(
    (driver as unknown as { source_location?: string }).source_location ?? "",
  );
  if (originCity && originCity === driverCity) return 3;
  if (
    originCity &&
    (driverCity.includes(originCity) || originCity.includes(driverCity))
  )
    return 2;
  return 0;
}

function scoreDriverForSourceId(driver: Driver, sourceId?: string): number {
  if (!sourceId) return 0;
  return driver.sourceId === sourceId ? 100 : 0;
}

// ─── AssignDriverModal (auto-assign, kept from git) ───────────────────────────

function AssignDriverModal({
  trip,
  drivers,
  clients,
  vehicles,
  onClose,
  onConfirm,
}: {
  trip: Trip;
  drivers: Driver[];
  clients: Client[];
  vehicles: Vehicle[];
  onClose: () => void;
  onConfirm: (driver?: Driver) => void;
}) {
  const selectedClient = clients.find((c) => c.id === trip.clientId) ?? null;
  const selectedSource =
    selectedClient?.sources.find((s) => s.id === trip.sourceId) ?? null;

  const scored = drivers
    .map((d) => ({
      driver: d,
      score:
        scoreDriverForSourceId(d, trip.sourceId) +
        scoreDriverForOrigin(d, trip.origin) +
        (trip.cargoCompany &&
        d.source_company &&
        normalizeLocation(trip.cargoCompany) ===
          normalizeLocation(d.source_company)
          ? 2
          : 0),
      vehicle: vehicles.find((v) => v.truck_id === d.vehicleId) ?? null,
    }))
    .sort((a, b) => {
      const aExact = a.score >= 100 ? 1 : 0;
      const bExact = b.score >= 100 ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;
      return b.score - a.score;
    });
  const suggested =
    scored.find((s) => s.score >= 100) ??
    scored.find((s) => s.score > 0) ??
    null;
  const [selectedId, setSelectedId] = useState(suggested?.driver.id ?? "");
  const selectedEntry = scored.find((s) => s.driver.id === selectedId) ?? null;
  const selectedDriverClient =
    clients.find((c) => c.id === selectedEntry?.driver.clientId) ?? null;
  const selectedDriverSource =
    selectedDriverClient?.sources.find(
      (s) => s.id === selectedEntry?.driver.sourceId,
    ) ?? null;
  const selectedVehicle =
    vehicles.find((v) => v.truck_id === selectedEntry?.driver.vehicleId) ??
    null;
  const canAssign =
    !!selectedEntry && selectedEntry.driver.status === "available";

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h2>Approve &amp; Assign Driver</h2>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div
          style={{
            padding: "0 20px",
            maxHeight: 280,
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
                    {isSelected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--blue)",
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        Selected
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
                    {clients.find((c) => c.id === driver.clientId)?.name ??
                      "Unknown client"}{" "}
                    ·{" "}
                    {clients
                      .find((c) => c.id === driver.clientId)
                      ?.sources.find((s) => s.id === driver.sourceId)?.name ??
                      "Unknown source"}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--muted-ink)",
                      margin: "1px 0 0",
                    }}
                  >
                    {driver.vehicleId}
                  </p>
                </div>

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
        {selectedVehicle && (
          <div
            style={{
              margin: "0 20px 16px",
              background: "var(--surface-alt, #f8fafc)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              padding: "12px 14px",
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
            <b style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
              {selectedVehicle.brand} {selectedVehicle.model_name}
            </b>
            <div className="info-grid compact-grid">
              <Info label="Truck ID" value={selectedVehicle.truck_id} />
              <Info label="Type" value={selectedVehicle.type} />
              <Info label="Capacity" value={selectedVehicle.load_capacity} />
            </div>
            {selectedDriverClient && selectedDriverSource && (
              <p
                style={{
                  fontSize: 10,
                  color: "var(--muted-ink)",
                  margin: "10px 0 0",
                }}
              >
                {selectedDriverClient.name} · {selectedDriverSource.name}
              </p>
            )}
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
            disabled={!canAssign}
            onClick={() => onConfirm(selectedEntry?.driver ?? undefined)}
          >
            {selectedEntry
              ? canAssign
                ? `Assign ${selectedEntry?.driver.name ?? ""} & Approve`
                : "Selected driver is unavailable"
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

const DUMMY_CUSTOMERS = [
  "Ultratech Cement",
  "Chettinad Cement",
  "Dalmia Cement",
  "Shree Cement",
  "ACC Limited",
  "Ambuja Cement",
];

const DUMMY_PICKUP_LOCATIONS = [
  "Wadgaon, Pune",
  "Hotgi Road, Solapur",
  "Chakan MIDC, Pune",
  "Kalamboli, Navi Mumbai",
  "Nashik MIDC",
  "Ariyalur Plant",
  "Rajgangpur Plant",
  "Beawar Plant",
];

function CreateModal({
  onClose,
  onCreate,
  clients,
}: {
  onClose: () => void;
  onCreate: (t: Trip) => void;
  clients: Client[];
}) {
  const [reference, setReference] = useState("");
  const [clientId, setClientId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupDT, setPickupDT] = useState("");
  const [deliveryDT, setDeliveryDT] = useState("");
  const [cargoMaterial, setCargoMaterial] = useState("Cement");
  const [cargoWeight, setCargoWeight] = useState("");
  const [cargoType, setCargoType] = useState<Trip["cargoType"]>("Bagged");
  const [noOfBags, setNoOfBags] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const sourceOptions = selectedClient?.sources ?? [];
  const selectedSource = sourceOptions.find((s) => s.id === sourceId) ?? null;

  useEffect(() => {
    if (
      selectedClient &&
      !selectedClient.sources.some((s) => s.id === sourceId)
    ) {
      setSourceId("");
    }
    if (!clientId && sourceId) {
      setSourceId("");
    }
  }, [clientId, selectedClient, sourceId]);

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
      clientId: clientId || undefined,
      sourceId: sourceId || undefined,
      customer: selectedClient?.name || "Unassigned",
      origin: selectedSource?.address || "Pending source selection",
      destination: destination || "Nashik MIDC",
      date: date || "20 Aug 2026",
      time: time || "09:00",
      requestedDeliveryDate: dDate || date || "20 Aug 2026",
      requestedDeliveryTime: dTime || time || "09:00",
      cargoMaterial,
      cargoCompany: selectedClient?.name || "Unassigned",
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
          Client
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSourceId("");
            }}
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
            }}
            disabled={!selectedClient}
          >
            <option value="">
              {selectedClient ? "Select source" : "Select client first"}
            </option>
            {sourceOptions.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Destination
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or address"
          />
        </label>
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
        {cargoType === "Bagged" && (
          <label>
            No. of bags
            <input
              value={noOfBags}
              onChange={(e) => setNoOfBags(e.target.value)}
              placeholder="560 bags"
            />
          </label>
        )}
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
  onOpenTrip,
  onMetricClick,
}: {
  trips: Trip[];
  onOpenTrip?: (trip: Trip) => void;
  onMetricClick?: (filter: string) => void;
}) {
  const { t } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const rows = trips.map((t) => ({
    id: t.reference,
    trip: t,
    source: t.origin,
    destination: t.destination,
    loadType: t.cargo?.loadType ?? "—",
    weight: t.cargo?.quantity ?? "—",
    driver: t.driver || "Unassigned",
    status: t.status,
    delivery: formatDDMMYY(t.estimatedDropDate || t.date),
  }));

  const filteredRows = rows.filter((r) => {
    const matchesStatus =
      selectedFilter === "All"
        ? true
        : selectedFilter === "In progress" || selectedFilter === "In Transit"
          ? ["READY", "IN_TRANSIT", "ON_HOLD", "REACHED"].includes(r.status)
          : selectedFilter === "Completed" || selectedFilter === "Delivered"
            ? ["COMPLETED", "DELIVERED", "DOCUMENTS_SUBMITTED"].includes(
                r.status,
              )
            : selectedFilter === "Scheduled" ||
                selectedFilter === "Waiting for Driver" ||
                selectedFilter === "Driver Accepted"
              ? ["NEW", "DRIVER_PENDING", "DRIVER_ACCEPTED"].includes(r.status)
              : selectedFilter === "Rejected"
                ? ["REJECTED", "DRIVER_REJECTED"].includes(r.status)
                : r.status === selectedFilter;
    const q = searchQuery.toLowerCase().trim();
    return (
      matchesStatus &&
      (!q ||
        r.id.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.driver.toLowerCase().includes(q))
    );
  });

  const handleDownloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filteredRows.map((r) => ({
      "Trip ID": r.id,
      Source: r.source,
      Destination: r.destination,
      "Load Type": r.loadType,
      Weight: r.weight,
      Driver: r.driver,
      Status: getStatusLabel(r.status),
      "Est. Delivery": r.delivery,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");
    XLSX.writeFile(
      workbook,
      `Trip_Operations_Report_${selectedFilter.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const tripFilterOptions = [
    { id: "All", label: t("All") },
    { id: "Waiting for Driver", label: t("Driver Pending") },
    { id: "Driver Accepted", label: t("Accepted") },
    { id: "In Transit", label: t("In Transit") },
    { id: "Delivered", label: t("Reached") },
    { id: "Rejected", label: t("Rejected") },
  ];

  return (
    <div className="table-page-panel">
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={t("Filters")}
        sections={[
          {
            title: t("TRIP STATUS"),
            options: tripFilterOptions,
            selected: selectedFilter,
            onSelect: (id) => setSelectedFilter(id),
          },
        ]}
        onClearAll={() => setSelectedFilter("All")}
      />

      {/* Section 2: search bar + filter icon button & download button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t("Search")} trip ID, source, destination, driver...`}
          />
        </div>
        <button
          className="table-filter-btn"
          onClick={() => setShowFilterModal(true)}
          title={t("Filters")}
          aria-label={t("Filters")}
        >
          <FunnelSimple size={16} />
          {selectedFilter !== "All" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: 14,
                height: 14,
                fontSize: 9,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              1
            </span>
          )}
        </button>
        <button
          className="table-filter-btn"
          onClick={handleDownloadExcel}
          title={t("Download")}
          aria-label={t("Download")}
        >
          <DownloadSimple size={16} />
        </button>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Trip Ref"),
                t("Route"),
                t("Destination"),
                t("Expense Type"),
                t("Driver"),
                t("Status"),
                t("Due Date & Time"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                style={{
                  cursor: onOpenTrip ? "pointer" : "default",
                }}
                onClick={() => onOpenTrip && onOpenTrip(row.trip)}
                title={onOpenTrip ? `View details for ${row.id}` : undefined}
              >
                <td
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  {row.id}
                </td>
                <td style={{ fontWeight: 500 }}>{row.source}</td>
                <td style={{ color: "#475569" }}>{row.destination}</td>
                <td style={{ color: "#475569" }}>
                  {row.loadType} · {row.weight}
                </td>
                <td style={{ color: "#475569" }}>{row.driver}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Status>{getStatusLabel(row.status)}</Status>
                </td>
                <td style={{ color: "#475569", whiteSpace: "nowrap" }}>
                  {row.delivery}
                </td>
              </tr>
            ))}
            {!filteredRows.length && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No trips match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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

function CashAdvancesPage({
  trips,
  extras,
  initialStatus = "All",
  onNavigateApprovals,
}: {
  trips: Trip[];
  extras: Extra[];
  initialStatus?: string;
  onNavigateApprovals?: (
    type: "Fuel" | "Cash" | "AdBlue" | "All",
    status?: "Approved" | "All",
  ) => void;
}) {
  const { t } = useLang();
  const cashRecords = extras.filter((e) => e.type === "Cash");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => setStatusFilter(initialStatus), [initialStatus]);
  const handleDownloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filtered.map((r) => {
      const trip = trips.find((t) => t.id === r.tripId);
      return {
        "Trip ID": r.tripRef || trip?.reference || "—",
        Driver: r.driver || trip?.driver || "—",
        Truck: trip?.truck?.number || "—",
        "Req Amt": r.amount,
        Reason: r.note,
        "Req Date": formatDDMMYY(r.requestedAt),
        "Appr Date": formatDDMMYY(r.approvedAt),
        Status: r.status,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cash Advances");
    XLSX.writeFile(
      workbook,
      `Cash_Advances_Report_${statusFilter.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };
  const filtered = cashRecords.filter((r) => {
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const q = query.toLowerCase().trim();
    const trip = trips.find((t) => t.id === r.tripId);
    const tripRef = r.tripRef || trip?.reference || "";
    const driver = r.driver || trip?.driver || "";
    return (
      matchesStatus &&
      (!q ||
        tripRef.toLowerCase().includes(q) ||
        driver.toLowerCase().includes(q) ||
        (r.note || "").toLowerCase().includes(q))
    );
  });
  return (
    <div className="table-page-panel">
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={t("Filters")}
        sections={[
          {
            title: t("STATUS"),
            options: ["All", "Submitted", "Approved", "Rejected"].map((id) => ({
              id,
              label: t(id),
            })),
            selected: statusFilter,
            onSelect: (id) => setStatusFilter(id),
          },
        ]}
        onClearAll={() => setStatusFilter("All")}
      />

      {/* Toolbar: search bar + filter icon button & download button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("Search")} trip, driver, reason...`}
          />
        </div>
        <button
          className="table-filter-btn"
          onClick={() => setShowFilters(true)}
          title={t("Filters")}
          aria-label={t("Filters")}
        >
          <FunnelSimple size={16} />
          {statusFilter !== "All" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: 14,
                height: 14,
                fontSize: 9,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              1
            </span>
          )}
        </button>
        <button
          className="table-filter-btn"
          onClick={handleDownloadExcel}
          title={t("Download")}
          aria-label={t("Download")}
        >
          <DownloadSimple size={16} />
        </button>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Trip Ref"),
                t("Driver"),
                t("Vehicle Number"),
                t("Amount"),
                t("Follow-up Note"),
                t("Requested Date"),
                t("Date"),
                t("Status"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const trip = trips.find((t) => t.id === row.tripId);
              return (
                <tr key={row.id}>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700 }}>
                    {row.tripRef || trip?.reference}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {row.driver || trip?.driver}
                  </td>
                  <td style={{ fontFamily: "monospace", color: "#64748b" }}>
                    {trip?.truck?.number || "—"}
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.amount}</td>
                  <td style={{ color: "#475569" }}>{row.note}</td>
                  <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                    {formatDDMMYY(row.requestedAt)}
                  </td>
                  <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                    {formatDDMMYY(row.approvedAt)}
                  </td>
                  <td>
                    <ApprovalStatusBadge status={row.status} />
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No cash advances match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FuelReportsPage({
  trips,
  extras,
  initialTab = "basic",
  initialStatus = "All",
  onNavigateApprovals,
}: {
  trips: Trip[];
  extras: Extra[];
  initialTab?: "basic" | "extra";
  initialStatus?: string;
  onNavigateApprovals?: (
    type: "Fuel" | "Cash" | "AdBlue" | "All",
    status?: "Approved" | "All",
  ) => void;
}) {
  const [tab, setTab] = useState<"basic" | "extra">(initialTab);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => setStatusFilter(initialStatus), [initialStatus]);

  const extraFuelRows = extras
    .filter((x) => x.type === "Fuel")
    .map((x) => ({
      ...x,
      tripRef:
        x.tripRef || trips.find((t) => t.id === x.tripId)?.reference || "",
    }));

  const basicFuelRows = trips.map((t) => ({
    trip: t.reference,
    driver: t.driver || "Unassigned",
    truck: t.truck?.number || "—",
    fuelAuth: t.fuel?.assigned || "—",
    fuelRec: t.fuel?.received || "—",
    cash: t.cash?.advance || "—",
    extraFuel: (t.extras || []).some((x) => x.type === "Fuel"),
  }));

  const filteredBasic = basicFuelRows.filter((r) => {
    const q = query.toLowerCase().trim();
    return (
      !q ||
      r.trip.toLowerCase().includes(q) ||
      r.driver.toLowerCase().includes(q) ||
      r.truck.toLowerCase().includes(q)
    );
  });

  const filteredExtra = extraFuelRows.filter((r) => {
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    const q = query.toLowerCase().trim();
    return (
      matchesStatus &&
      (!q ||
        r.tripRef.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q))
    );
  });

  const handleDownloadExcel = async () => {
    const XLSX = await import("xlsx");
    const data =
      tab === "basic"
        ? filteredBasic.map((r) => ({
            Trip: r.trip,
            Driver: r.driver,
            Truck: r.truck,
            "Fuel Authorized": r.fuelAuth,
            "Fuel Recorded": r.fuelRec,
            "Cash Advance": r.cash,
            "Extra Fuel": r.extraFuel ? "Yes" : "No",
          }))
        : filteredExtra.map((r) => ({
            "Trip ID": r.tripRef || "—",
            Type: r.type,
            Amount: r.amount,
            Litres: r.litres || "—",
            Note: r.note,
            Status: r.status,
          }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      tab === "basic" ? "Basic Fuel" : "Extra Fuel",
    );
    XLSX.writeFile(
      workbook,
      `Fuel_Report_${tab}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return (
    <div className="table-page-panel">
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        sections={[
          {
            title: "STATUS",
            options: ["All", "Submitted", "Approved", "Rejected"].map((id) => ({
              id,
              label: id,
            })),
            selected: statusFilter,
            onSelect: (id) => setStatusFilter(id),
          },
        ]}
        onClearAll={() => setStatusFilter("All")}
      />

      {/* Section 1: Tab bars (if any) + download button (if any) */}
      <div className="table-section-top">
        <div className="table-tab-bar">
          <button
            className={tab === "basic" ? "filter active" : "filter"}
            onClick={() => setTab("basic")}
            style={{ padding: "6px 14px", borderRadius: 6 }}
          >
            Basic Fuel
          </button>
          <button
            className={tab === "extra" ? "filter active" : "filter"}
            onClick={() => setTab("extra")}
            style={{ padding: "6px 14px", borderRadius: 6 }}
          >
            Extra Fuel
          </button>
        </div>
        <div className="table-top-actions">
          <button
            className="button secondary compact"
            onClick={handleDownloadExcel}
            title="Download Excel (.xlsx)"
            aria-label="Download Excel"
          >
            <DownloadSimple size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Section 2: search bar + filter icon button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fuel report records..."
          />
        </div>
        <button
          className="table-filter-btn"
          onClick={() => setShowFilters(true)}
          title="Filters"
          aria-label="Filters"
        >
          <FunnelSimple size={16} />
          {statusFilter !== "All" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: 14,
                height: 14,
                fontSize: 9,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        {tab === "basic" ? (
          <table className="table-ui">
            <thead>
              <tr>
                {[
                  "Trip",
                  "Driver",
                  "Truck",
                  "Fuel Authorized",
                  "Fuel Recorded",
                  "Cash Advance",
                  "Extra Fuel",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBasic.map((row) => (
                <tr key={row.trip}>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    {row.trip}
                  </td>
                  <td style={{ fontWeight: 500 }}>{row.driver}</td>
                  <td
                    style={{
                      color: "#475569",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                    }}
                  >
                    {row.truck}
                  </td>
                  <td style={{ color: "#475569" }}>{row.fuelAuth}</td>
                  <td style={{ color: "#475569" }}>{row.fuelRec}</td>
                  <td style={{ fontWeight: 500 }}>{row.cash}</td>
                  <td>
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
              {!filteredBasic.length && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No basic fuel records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="table-ui">
            <thead>
              <tr>
                {["Trip ID", "Type", "Amount", "Litres", "Note", "Status"].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filteredExtra.map((row) => (
                <tr key={row.id}>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    {row.tripRef || "—"}
                  </td>
                  <td style={{ fontWeight: 500 }}>{row.type}</td>
                  <td style={{ color: "#475569" }}>{row.amount}</td>
                  <td style={{ color: "#475569" }}>{row.litres || "—"}</td>
                  <td style={{ color: "#475569" }}>{row.note}</td>
                  <td>
                    <ApprovalStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
              {!filteredExtra.length && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No extra fuel records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ApprovalsHub({
  extras,
  trips,
  initialFilter = "All",
  initialStatusTab = "Approved",
  onApprove,
  onReject,
}: {
  extras: Extra[];
  trips: Trip[];
  initialFilter?: "All" | "Fuel" | "Cash" | "AdBlue";
  initialStatusTab?: "Approved" | "All";
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onOpenTrip?: (tripId: string) => void;
  onNavigateReports?: (
    reportView: "reports-fuel" | "reports-cash" | "reports-ops",
    tab?: "basic" | "extra",
    status?: string,
  ) => void;
}) {
  const { t } = useLang();
  const [typeFilter, setTypeFilter] = useState<"All" | "Fuel" | "Cash" | "AdBlue">(
    initialFilter,
  );
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setTypeFilter(initialFilter);
  }, [initialFilter]);

  const filtered = extras.filter((x) => {
    const matchesType = typeFilter === "All" || x.type === typeFilter;
    const trip = trips.find((t) => t.id === x.tripId);
    const tripRef = x.tripRef || trip?.reference || "";
    const driver = x.driver || trip?.driver || "";
    const q = query.toLowerCase().trim();
    return (
      matchesType &&
      (!q ||
        tripRef.toLowerCase().includes(q) ||
        driver.toLowerCase().includes(q) ||
        x.note.toLowerCase().includes(q))
    );
  });

  return (
    <div className="table-page-panel">
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={t("Filters")}
        sections={[
          {
            title: t("EXPENSE TYPE"),
            options: ["All", "Fuel", "Cash", "AdBlue"].map((id) => ({
              id,
              label: t(id),
            })),
            selected: typeFilter,
            onSelect: (id) => setTypeFilter(id as any),
          },
        ]}
        onClearAll={() => setTypeFilter("All")}
      />

      {/* Section 2: search bar + filter icon button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("Search")} approvals by trip, driver, note...`}
          />
        </div>
        <button
          className="table-filter-btn"
          onClick={() => setShowFilters(true)}
          title={t("Filters")}
          aria-label={t("Filters")}
        >
          <FunnelSimple size={16} />
          {typeFilter !== "All" && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: 14,
                height: 14,
                fontSize: 9,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Trip Ref"),
                t("Expense Type"),
                t("Amount"),
                t("Follow-up Note"),
                t("Status"),
                t("Action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const trip = trips.find((t) => t.id === item.tripId);
              return (
                <tr key={item.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {item.tripRef || trip?.reference || "—"}
                  </td>
                  <td style={{ fontWeight: 500 }}>{item.type}</td>
                  <td style={{ fontWeight: 600 }}>{item.amount}</td>
                  <td style={{ color: "#475569" }}>
                    {item.litres ? `${item.litres} · ` : ""}
                    {item.note || "—"}
                  </td>
                  <td>
                    <ApprovalStatusBadge status={item.status} />
                  </td>
                  <td>
                    {item.status === "Submitted" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="button primary compact"
                          onClick={() => onApprove(item.id)}
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          Accept
                        </button>
                        <button
                          className="button danger compact"
                          onClick={() => onReject(item.id)}
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No approval requests match the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
  view,
}: {
  followups: Followup[];
  trips: Trip[];
  defaultTripFilter?: string;
  onClearDefaultFilter?: () => void;
  onCall: (fu: Followup) => void;
  onOpenTrip: (tripId: string) => void;
  onCreate: () => void;
  view?: string;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tripFilter, setTripFilter] = useState(defaultTripFilter || "All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    setQuery("");
    setStatusFilter("All");
    setShowFilters(false);
    if (!defaultTripFilter) {
      setTripFilter("All");
    }
  }, [view]);
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
    <div className="table-page-panel">
      {/* Toolbar: search bar + new follow-up */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("Search")} driver, trip, note...`}
          />
        </div>
        <button
          className="button primary compact"
          onClick={onCreate}
          title={t("New Follow-up")}
        >
          <Plus size={16} />
          <span>{t("New Follow-up")}</span>
        </button>
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Driver Name"),
                t("Trip Ref"),
                t("Follow-up Note"),
                t("Due Date & Time"),
                t("Status"),
                t("Action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fu) => (
              <tr key={fu.id}>
                <td style={{ fontWeight: 600 }}>{fu.driver}</td>
                <td>
                  <button
                    className="text-button"
                    style={{ fontSize: 12, padding: 0 }}
                    onClick={() => onOpenTrip(fu.tripId)}
                  >
                    {fu.tripRef}{" "}
                    <CaretRight size={10} style={{ display: "inline" }} />
                  </button>
                </td>
                <td style={{ color: "var(--muted-ink)" }}>{fu.note}</td>
                <td style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                  Due {fu.dueDate} · {to12Hour(fu.dueTime)}
                </td>
                <td>
                  <span className={`status ${fu.status.toLowerCase()}`}>
                    {t(fu.status)}
                  </span>
                </td>
                <td>
                  <a
                    href={`tel:${fu.driverPhone}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onCall(fu);
                    }}
                    className="button secondary compact"
                    style={{ fontSize: 11 }}
                    aria-label={`Call ${fu.driver}`}
                    title={`Call ${fu.driver}`}
                  >
                    {t("Call")}
                  </a>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No follow-ups match the filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
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
  view,
  defaultStatusFilter,
}: {
  transactions: FuelTransaction[];
  onSendToPump: (tx: FuelTransaction) => void;
  onResend: (tx: FuelTransaction) => void;
  view?: string;
  defaultStatusFilter?: string;
}) {
  const { t } = useLang();
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [draftStatus, setDraftStatus] = useState("All");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

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

  useEffect(() => {
    setStatusFilter("All");
    setDraftStatus("All");
    setQuery("");
    setDateFrom("");
    setDraftDateFrom("");
    setDateTo("");
    setDraftDateTo("");
    setShowFilters(false);
  }, [view]);

  useEffect(() => {
    if (!defaultStatusFilter) return;
    setStatusFilter(defaultStatusFilter);
    setDraftStatus(defaultStatusFilter);
  }, [defaultStatusFilter]);

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
    <div className="table-page-panel">
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={t("Filters")}
        sections={[
          {
            title: t("STATUS"),
            options: ["All", "Pending", "Sent", "Resent"].map((id) => ({
              id,
              label: t(id),
            })),
            selected: statusFilter,
            onSelect: (id) => setStatusFilter(id),
          },
        ]}
        onClearAll={() => setStatusFilter("All")}
      />

      {/* Section 2: search bar + filter icon button */}
      <div className="table-section-toolbar">
        <div className="table-search-box">
          <MagnifyingGlass
            size={16}
            style={{ color: "#9ca6b4", flexShrink: 0 }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t("Search")} trip, driver, station...`}
          />
        </div>
        <button
          className="table-filter-btn"
          onClick={() => setShowFilters(true)}
          title={t("Filters")}
          aria-label={t("Filters")}
        >
          <FunnelSimple size={16} />
          {activeFilters > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#2563eb",
                color: "#fff",
                borderRadius: "50%",
                width: 14,
                height: 14,
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
      </div>

      {/* Section 3: Table column header & Section 4: Table rows */}
      <div className="table-scroll-container">
        <table className="table-ui">
          <thead>
            <tr>
              {[
                t("Trip Ref"),
                t("Driver"),
                t("Pump Station"),
                t("Litres"),
                t("Amount"),
                t("Status"),
                t("Action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {tx.tripRef}
                </td>
                <td style={{ fontWeight: 500 }}>{tx.driver}</td>
                <td style={{ color: "#475569" }}>{tx.station}</td>
                <td style={{ color: "#475569" }}>{tx.litres}</td>
                <td style={{ fontWeight: 600 }}>{tx.amount}</td>
                <td>
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
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    {t(tx.status)}
                  </span>
                </td>
                <td>
                  {tx.status === "Pending" && (
                    <button
                      className="button primary compact"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => onSendToPump(tx)}
                    >
                      {t("Send to pump")}
                    </button>
                  )}
                  {(tx.status === "Sent" || tx.status === "Resent") && (
                    <button
                      className="button secondary compact"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => onResend(tx)}
                    >
                      {t("Resend")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No fuel transactions match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Driver Overview Section & Locked Workflow ───────────────────────────────

function DriverOverviewSection({
  trips,
  activeDriverFlow,
  onAcceptTrip,
  onRejectTrip,
  onResumeFlow,
}: {
  trips: Trip[];
  activeDriverFlow?: { tripId: string; step: number } | null;
  onAcceptTrip: (t: Trip) => void;
  onRejectTrip: (t: Trip) => void;
  onResumeFlow: (t: Trip) => void;
}) {
  const driverPendingTrips = trips.filter((t) => t.status === "DRIVER_PENDING");
  if (driverPendingTrips.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {activeDriverFlow && (
        <div
          style={{
            background: "var(--blue-soft, #eff6ff)",
            border: "1.5px solid var(--blue, #2563eb)",
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <b style={{ fontSize: 14, color: "var(--blue)", display: "block" }}>
              Active Trip Journey in Progress
            </b>
            <span style={{ fontSize: 12, color: "var(--muted-ink)" }}>
              You have an active trip workflow in progress.
            </span>
          </div>
          <button
            className="button primary"
            onClick={() => {
              const activeTrip = trips.find(
                (t) => t.id === activeDriverFlow.tripId,
              );
              if (activeTrip) onResumeFlow(activeTrip);
            }}
          >
            Resume Active Trip Flow →
          </button>
        </div>
      )}

      <div className="panel" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 16 }}>Pending Requests</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {driverPendingTrips.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: 16,
                background: "var(--panel)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <b style={{ fontSize: 14, marginRight: 8 }}>{t.reference}</b>
                  <span style={{ fontSize: 12, color: "var(--muted-ink)" }}>
                    {t.customer}
                  </span>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <div style={{ fontSize: 12, color: "var(--ink)" }}>
                <div>
                  <b>Pickup:</b> {t.origin} ({t.date} · {t.time})
                </div>
                <div>
                  <b>Drop-off:</b> {t.destination}
                </div>
                <div>
                  <b>Cargo:</b> {t.cargoMaterial || "Cement"} (
                  {t.cargoWeight || "28 tons"})
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="button primary wide"
                  onClick={() => onAcceptTrip(t)}
                  style={{ padding: "8px 14px", fontSize: 12 }}
                >
                  Accept Trip
                </button>
                <button
                  type="button"
                  className="button danger wide"
                  onClick={() => onRejectTrip(t)}
                  style={{ padding: "8px 14px", fontSize: 12 }}
                >
                  Reject Trip
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverWorkflow({
  trip,
  flowState,
  onUpdateFlowState,
  onAddDocument,
  onAddExtra,
  onStartTrip,
  onReachTrip,
  onSubmitStampedDocs,
  onCompleteFlow,
}: {
  trip: Trip;
  flowState: {
    tripId: string;
    step: number;
    lrDocName?: string;
    wbDocName?: string;
    invoiceDocName?: string;
    stampedLrName?: string;
    stampedWbName?: string;
    stampedInvoiceName?: string;
  };
  onUpdateFlowState: (st: any) => void;
  onAddDocument: (doc: TripDocument) => void;
  onAddExtra?: (extra: Extra) => void;
  onStartTrip: (t: Trip) => void;
  onReachTrip: (t: Trip) => void;
  onSubmitStampedDocs: (docs: TripDocument[]) => void;
  onCompleteFlow: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState("");

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraType, setExtraType] = useState<
    "Fuel" | "Cash" | "AdBlue" | "Other"
  >("Fuel");
  const [extraAmount, setExtraAmount] = useState("");
  const [extraLitres, setExtraLitres] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [extraError, setExtraError] = useState("");
  const [extraSuccess, setExtraSuccess] = useState("");

  const handleExtraSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setExtraError("");
    setExtraSuccess("");
    if (
      !extraAmount ||
      isNaN(Number(extraAmount)) ||
      Number(extraAmount) <= 0
    ) {
      setExtraError("Please enter a valid amount (e.g. 3500)");
      return;
    }
    if (
      (extraType === "Fuel" || extraType === "AdBlue") &&
      (!extraLitres || isNaN(Number(extraLitres)) || Number(extraLitres) <= 0)
    ) {
      setExtraError(
        `Please enter valid litres for extra ${extraType} (e.g. 35)`,
      );
      return;
    }
    if (!extraNote.trim()) {
      setExtraError(
        "Please provide a reason / note for the extra expense request.",
      );
      return;
    }

    const numAmt = Number(extraAmount);
    const formattedAmount = `₹${numAmt.toLocaleString("en-IN")}`;
    const formattedLitres = extraLitres ? `${extraLitres.trim()} L` : undefined;

    const extraEntity: Extra = {
      id: `ex-${Date.now()}`,
      tripId: trip.id,
      tripRef: trip.reference,
      driver: trip.driver || "Ramesh Yadav",
      type: extraType,
      amount: formattedAmount,
      litres:
        extraType === "Fuel" || extraType === "AdBlue"
          ? formattedLitres
          : undefined,
      note: extraNote.trim(),
      status: "Submitted",
      requestedAt: getTimeString(),
    };

    if (onAddExtra) {
      onAddExtra(extraEntity);
    }
    setExtraAmount("");
    setExtraLitres("");
    setExtraNote("");
    setShowExtraModal(false);
  };

  const currentStep = flowState.step;
  const stepperRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const initialDocTypes = ["LR", "WB", "Invoice"];
  const stampedDocTypes = ["LR (stamped)", "WB (stamped)", "Invoice (stamped)"];
  const hasVerifiedDocs = (types: string[]) =>
    types.every((type) =>
      trip.documents.some(
        (doc) => doc.type === type && doc.status === "verified",
      ),
    );
  const initialDocsVerified = hasVerifiedDocs(initialDocTypes);
  const stampedDocsVerified = hasVerifiedDocs(stampedDocTypes);

  useEffect(() => {
    const activeIndex = currentStep - 1;
    const activeStepEl = stepRefs.current[activeIndex];
    if (activeStepEl) {
      activeStepEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentStep]);

  const getTimeString = () => {
    const now = new Date();
    return `${now.getDate()} ${now.toLocaleString("en-GB", { month: "short" })} ${now.getFullYear()} · ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName = selectedFile?.name || `LR_${trip.reference}.jpg`;
    onAddDocument({
      id: `doc-${Date.now()}-1`,
      name: fileName,
      type: "LR",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    });
    setSelectedFile(null);
    onUpdateFlowState({
      ...flowState,
      step: 2,
      lrDocName: fileName,
    });
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName = selectedFile?.name || `WB_${trip.reference}.jpg`;
    onAddDocument({
      id: `doc-${Date.now()}-2`,
      name: fileName,
      type: "WB",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    });
    setSelectedFile(null);
    onUpdateFlowState({
      ...flowState,
      step: 3,
      wbDocName: fileName,
    });
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName = selectedFile?.name || `Invoice_${trip.reference}.jpg`;
    onAddDocument({
      id: `doc-${Date.now()}-3`,
      name: fileName,
      type: "Invoice",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    });
    setSelectedFile(null);
    onUpdateFlowState({
      ...flowState,
      step: 4,
      invoiceDocName: fileName,
    });
  };

  const handleStartTripClick = () => {
    if (!initialDocsVerified) {
      setValidationError("Waiting for approval on documents.");
      return;
    }
    onStartTrip(trip);
    onUpdateFlowState({
      ...flowState,
      step: 5,
    });
  };

  const handleReachDestinationClick = () => {
    onReachTrip(trip);
    onUpdateFlowState({
      ...flowState,
      step: 6,
    });
  };

  const handleStep6Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName = selectedFile?.name || `Stamped_LR_${trip.reference}.jpg`;
    onAddDocument({
      id: `doc-${Date.now()}-6`,
      name: fileName,
      type: "LR (stamped)",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    });
    setSelectedFile(null);
    onUpdateFlowState({
      ...flowState,
      step: 7,
      stampedLrName: fileName,
    });
  };

  const handleStep7Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName = selectedFile?.name || `Stamped_WB_${trip.reference}.jpg`;
    onAddDocument({
      id: `doc-${Date.now()}-7`,
      name: fileName,
      type: "WB (stamped)",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    });
    setSelectedFile(null);
    onUpdateFlowState({
      ...flowState,
      step: 8,
      stampedWbName: fileName,
    });
  };

  const handleStep8Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please choose a document before submitting.");
      return;
    }
    setValidationError("");
    const fileName =
      selectedFile?.name || `Stamped_Invoice_${trip.reference}.jpg`;
    const doc: TripDocument = {
      id: `doc-${Date.now()}-8`,
      name: fileName,
      type: "Invoice (stamped)",
      uploadedAt: getTimeString(),
      trip_Id: trip.reference,
      status: "uploaded",
    };
    onAddDocument(doc);
    setSelectedFile(null);
    onSubmitStampedDocs([doc]);
    onUpdateFlowState({
      ...flowState,
      step: 9,
      stampedInvoiceName: fileName,
    });
  };

  const STEPS = [
    { num: 1, label: "Upload LR" },
    { num: 2, label: "Upload WB" },
    { num: 3, label: "Upload Invoice" },
    { num: 4, label: "Start Trip" },
    { num: 5, label: "In Transit" },
    { num: 6, label: "Upload Stamped LR" },
    { num: 7, label: "Upload Stamped WB" },
    { num: 8, label: "Upload Stamped Invoice" },
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      {/* Clean Trip Header */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <b style={{ fontSize: 14, display: "block", marginBottom: 2 }}>
          Trip: {trip.reference}
        </b>
        <span style={{ fontSize: 12, color: "var(--muted-ink)" }}>
          {trip.origin} → {trip.destination}
        </span>
      </div>

      {/* Stepper Bar */}
      {currentStep <= 8 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
            overflowX: "auto",
            padding: "2px 2px 8px",
          }}
          ref={stepperRef}
        >
          {STEPS.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                ref={(el) => {
                  stepRefs.current[s.num - 1] = el;
                }}
                style={{
                  flex: "0 0 auto",
                  minWidth: 112,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  padding: "10px 12px",
                  borderRadius: 999,
                  background: isCurrent
                    ? "var(--blue)"
                    : isDone
                      ? "#dcfce7"
                      : "var(--surface-alt, #f1f5f9)",
                  color: isCurrent
                    ? "#fff"
                    : isDone
                      ? "#15803d"
                      : "var(--muted-ink)",
                  fontWeight: isCurrent || isDone ? 600 : 400,
                  fontSize: 11,
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  boxShadow: isCurrent
                    ? "0 6px 18px rgba(37,99,235,0.18)"
                    : "none",
                }}
              >
                <span style={{ whiteSpace: "nowrap" }}>
                  {isDone ? `✓ ${s.label}` : s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1: Upload LR */}
      {currentStep === 1 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload LR</h2>

          <form onSubmit={handleStep1Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop LR document here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="lr-file-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("lr-file-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Upload WB */}
      {currentStep === 2 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload WB</h2>

          <form onSubmit={handleStep2Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop Weighbridge slip here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="wb-file-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("wb-file-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Upload Invoice */}
      {currentStep === 3 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload Invoice</h2>

          <form onSubmit={handleStep3Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop Invoice document here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="inv-file-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("inv-file-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Start Trip Button */}
      {currentStep === 4 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Start Trip</h2>

          {!initialDocsVerified ? (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                color: "#92400e",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Waiting for approval on documents.
            </div>
          ) : null}

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <b
              style={{
                fontSize: 13,
                color: "#1e40af",
                display: "block",
                marginBottom: 6,
              }}
            >
              Trip Summary
            </b>
            <div
              style={{
                fontSize: 12,
                color: "#1e3a8a",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <div>
                <b>Trip:</b> {trip.reference}
              </div>
              <div>
                <b>Customer:</b> {trip.customer}
              </div>
              <div>
                <b>Origin:</b> {trip.origin}
              </div>
              <div>
                <b>Destination:</b> {trip.destination}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="button primary wide"
            onClick={handleStartTripClick}
            disabled={!initialDocsVerified}
            style={{
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: 700,
              background: initialDocsVerified ? "#2563eb" : "#dbe4f0",
              color: initialDocsVerified ? "#fff" : "#64748b",
              cursor: initialDocsVerified ? "pointer" : "not-allowed",
            }}
          >
            Start Trip
          </button>
        </div>
      )}

      {/* Step 5: In Transit */}
      {currentStep === 5 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>In Transit</h2>

          {/* Map Preview */}
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              height: 520,
              margin: "0 auto 24px",
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              background: "#e2e8f0",
              border: "1px solid #cbd5e1",
            }}
          >
            <img
              src="/map.jpeg"
              alt="Trip route map"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />

            {/* Transit overlay */}
            <div
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                right: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(15, 23, 42, 0.88)",
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                    display: "inline-block",
                  }}
                />

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".05em",
                    color: "#4ade80",
                  }}
                >
                  IN TRANSIT
                </span>
              </div>

              <span
                style={{
                  fontSize: 10,
                  opacity: 0.8,
                }}
              >
                Trip: {trip.reference}
              </span>
            </div>

            {/* Route information */}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                right: 14,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(15, 23, 42, 0.88)",
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                }}
              >
                <span>📍 {trip.origin}</span>
                <span>🏁 {trip.destination}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="button primary wide"
            onClick={handleReachDestinationClick}
            style={{
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: 700,
              background: "#16a34a",
            }}
          >
            Reached Destination
          </button>

          {/* Request Extras Button */}
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="button secondary wide"
              onClick={() => {
                setExtraError("");
                setShowExtraModal(true);
              }}
              style={{
                padding: "12px 18px",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={18} /> Request extras
            </button>
          </div>

          {/* Request Extras Pop-up Modal */}
          {showExtraModal && (
            <Modal
              title="Request Extra Expense"
              onClose={() => setShowExtraModal(false)}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExtraSubmit(e);
                }}
              >
                <label style={{ display: "block", marginBottom: 14 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Type of extra request *
                  </span>
                  <select
                    value={extraType}
                    onChange={(e) =>
                      setExtraType(
                        e.target.value as "Fuel" | "Cash" | "AdBlue" | "Other",
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                    }}
                  >
                    <option value="Fuel">Fuel</option>
                    <option value="Cash">Cash</option>
                    <option value="AdBlue">AdBlue</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      extraType === "Fuel" || extraType === "AdBlue"
                        ? "1fr 1fr"
                        : "1fr",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <label>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Amount (₹) *
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 3500"
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        borderRadius: 6,
                        border: "1px solid var(--line)",
                        background: "var(--surface)",
                      }}
                    />
                  </label>

                  {(extraType === "Fuel" || extraType === "AdBlue") && (
                    <label>
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Litres (L) *
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 35"
                        value={extraLitres}
                        onChange={(e) => setExtraLitres(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          fontSize: 13,
                          borderRadius: 6,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                        }}
                      />
                    </label>
                  )}
                </div>

                <label style={{ display: "block", marginBottom: 16 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    Reason / Note *
                  </span>
                  <textarea
                    rows={3}
                    placeholder="Add a detailed note explaining the reason for this extra request..."
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 12,
                      borderRadius: 6,
                      border: "1px solid var(--line)",
                      background: "var(--surface)",
                      resize: "vertical",
                    }}
                  />
                </label>

                {extraError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#dc2626",
                      marginBottom: 14,
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ {extraError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setShowExtraModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button primary">
                    Submit Request
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {/* Previously Submitted Requests List */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--line)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                margin: "0 0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Previously Submitted Requests</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted-ink)",
                }}
              >
                {trip.extras?.length || 0} total
              </span>
            </h3>

            {trip.extras && trip.extras.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {trip.extras.map((ex) => (
                  <div
                    key={ex.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "var(--surface-alt, #f8fafc)",
                      border: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 600,
                        }}
                      >
                        {ex.type === "Fuel" && (
                          <GasPump size={16} style={{ color: "var(--blue)" }} />
                        )}
                        {ex.type === "Cash" && (
                          <CurrencyInr size={16} style={{ color: "#16a34a" }} />
                        )}
                        {ex.type === "AdBlue" && (
                          <Drop size={16} style={{ color: "#0284c7" }} />
                        )}
                        {ex.type === "Other" && (
                          <DotsThree
                            size={16}
                            style={{ color: "var(--muted-ink)" }}
                          />
                        )}
                        <span>Extra {ex.type}</span>
                        <span
                          style={{ color: "var(--muted-ink)", fontWeight: 400 }}
                        >
                          ·
                        </span>
                        <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                          {ex.amount}
                        </span>
                        {ex.litres && (
                          <span
                            style={{ fontSize: 11, color: "var(--muted-ink)" }}
                          >
                            ({ex.litres})
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 11,
                          color: "var(--muted-ink)",
                        }}
                      >
                        {ex.note}
                      </p>
                      {ex.requestedAt && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--muted-ink)",
                            opacity: 0.8,
                            display: "block",
                            marginTop: 2,
                          }}
                        >
                          Requested: {ex.requestedAt}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background:
                          ex.status === "Approved"
                            ? "#dcfce7"
                            : ex.status === "Rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                        color:
                          ex.status === "Approved"
                            ? "#15803d"
                            : ex.status === "Rejected"
                              ? "#b91c1c"
                              : "#b45309",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.status === "Approved"
                        ? "Approved"
                        : ex.status === "Rejected"
                          ? "Rejected"
                          : "Submitted"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  background: "var(--surface-alt, #f8fafc)",
                  borderRadius: 8,
                  border: "1px dashed var(--line)",
                  fontSize: 12,
                  color: "var(--muted-ink)",
                }}
              >
                No extra expense requests submitted yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 6: Upload Stamped LR */}
      {currentStep === 6 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload Stamped LR</h2>

          <form onSubmit={handleStep6Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop Stamped LR document here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="stamped-lr-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("stamped-lr-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 7: Upload Stamped WB */}
      {currentStep === 7 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload Stamped WB</h2>

          <form onSubmit={handleStep7Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop Stamped WB slip here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="stamped-wb-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("stamped-wb-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 8: Upload Stamped Invoice */}
      {currentStep === 8 && (
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            Upload Stamped Invoice
          </h2>

          <form onSubmit={handleStep8Submit}>
            <div
              style={{
                border: "2px dashed var(--line)",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--surface-alt, #f8fafc)",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}>
                <UploadSimple size={20} style={{ color: "var(--blue)" }} />
              </div>
              <b style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
                Drag &amp; drop Stamped Invoice document here
              </b>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--muted-ink)",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Supports PDF, PNG, JPG (Max 10MB)
              </span>
              <input
                type="file"
                id="stamped-inv-input"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  document.getElementById("stamped-inv-input")?.click()
                }
              >
                Choose File
              </button>
              {selectedFile && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                  }}
                >
                  Selected: {selectedFile.name}
                </div>
              )}
              {validationError && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {validationError}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="button primary wide"
              style={{
                padding: "12px 16px",
                background: selectedFile ? "var(--blue)" : "#dbe4f0",
                color: selectedFile ? "#fff" : "#64748b",
                borderColor: selectedFile ? "var(--blue)" : "#dbe4f0",
                cursor: selectedFile ? "pointer" : "not-allowed",
                opacity: 1,
              }}
              disabled={!selectedFile}
            >
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Step 9: Completion / Waiting Screen */}
      {currentStep === 9 && (
        <div className="panel" style={{ padding: 32, textAlign: "center" }}>
          {!stampedDocsVerified ? (
            <>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#fef3c7",
                  color: "#b45309",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 0 0 6px #fffbe6",
                }}
              >
                <Clock size={32} />
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 20,
                  color: "#92400e",
                }}
              >
                Waiting for Operations Completion Approval
              </h2>

              {/* Document Verification Checklist Card */}
              <div
                style={{
                  maxWidth: 440,
                  margin: "0 auto 8px",
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--surface-alt, #f8fafc)",
                  border: "1px solid var(--line)",
                  textAlign: "left",
                }}
              >
                <b
                  style={{
                    fontSize: 12,
                    color: "var(--ink)",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Document Verification Status
                </b>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {stampedDocTypes.map((docType) => {
                    const docObj = trip.documents.find(
                      (d) => d.type === docType,
                    );
                    const isDocVerified = docObj?.status === "verified";
                    return (
                      <div
                        key={docType}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "var(--surface)",
                          border: "1px solid var(--line)",
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 600,
                          }}
                        >
                          <FileText
                            size={16}
                            style={{
                              color: isDocVerified ? "#16a34a" : "var(--blue)",
                            }}
                          />
                          <span>{docType}</span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 12,
                            background: isDocVerified ? "#dcfce7" : "#fef3c7",
                            color: isDocVerified ? "#15803d" : "#b45309",
                          }}
                        >
                          {isDocVerified ? "Verified" : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 0 0 6px #f0fdf4",
                }}
              >
                <Check size={36} />
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 8,
                  color: "#15803d",
                }}
              >
                Trip Completed! 🎉
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted-ink)",
                  maxWidth: 440,
                  margin: "0 auto 24px",
                  lineHeight: 1.5,
                }}
              >
                Continue for more trips!
              </p>
              <button
                type="button"
                className="button primary"
                onClick={onCompleteFlow}
                style={{
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                Finish
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
