"use client";

import { useState, useEffect } from "react";
import { useData } from "../../context/DataContext";
import { getToken } from "../../../lib/api";
import { useRouter } from "next/navigation";
import RoleProtector from "../../components/RoleProtector";
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Search,
  Car,
  AlertCircle,
  XCircle,
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const REMINDER_TYPES = [
  "Vidange",
  "Freins",
  "Pneus",
  "Batterie",
  "Révision",
  "Climatisation",
  "Transmission",
  "Embrayage",
  "Échappement",
  "Contrôle technique",
  "Assurance",
  "Autre",
];

// Intervalles par défaut intelligents selon le type
const DEFAULT_INTERVALS = {
  Vidange: { mileage: 10000, months: 6 },
  Freins: { mileage: 30000, months: 24 },
  Pneus: { mileage: 40000, months: 36 },
  Batterie: { mileage: 0, months: 24 },
  Révision: { mileage: 20000, months: 12 },
  Climatisation: { mileage: 0, months: 24 },
  Transmission: { mileage: 60000, months: 48 },
  Embrayage: { mileage: 80000, months: 60 },
  Échappement: { mileage: 50000, months: 36 },
  "Contrôle technique": { mileage: 0, months: 24 },
  Assurance: { mileage: 0, months: 12 },
  Autre: { mileage: 10000, months: 12 },
};

const STATUS_CONFIG = {
  overdue: {
    label: "En retard",
    textColor: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/30",
    icon: AlertTriangle,
  },
  upcoming: {
    label: "À venir",
    textColor: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    icon: Clock,
  },
  ok: {
    label: "OK",
    textColor: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    icon: CheckCircle2,
  },
};

const EMPTY_FORM = {
  vehicle_id: "",
  type: "",
  description: "",
  next_due_mileage: "",
  next_due_date: "",
};

export default function RemindersPage() {
  const {
    reminders,
    vehicles,
    user: currentUser,
    loading,
    refreshReminders,
  } = useData();

  // Modal créer/modifier
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  // Modal renouveler
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewingReminder, setRenewingtReminder] = useState(null);
  const [renewForm, setRenewForm] = useState({
    mileage_interval: "",
    date_months: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  const headers = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  // Debug des données
  useEffect(() => {
    if (reminders.length > 0) {
      console.log("=== DEBUG RAPPELS ===");
      reminders.forEach((r, index) => {
        console.log(`Rappel ${index + 1}:`, {
          id: r.id,
          type: r.type,
          computed_status: r.computed_status,
          next_due_mileage: r.next_due_mileage,
          next_due_date: r.next_due_date,
          vehicle: r.vehicle ? {
            brand: r.vehicle.brand,
            model: r.vehicle.model,
            current_mileage: r.vehicle.current_mileage
          } : null
        });
      });
      console.log("=== FIN DEBUG ===");
    }
  }, [reminders]);

  // ── CRUD ──────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        next_due_mileage:
          form.next_due_mileage === "" ? null : form.next_due_mileage,
        next_due_date: form.next_due_date === "" ? null : form.next_due_date,
      };
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/reminders/${editingId}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/reminders`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      await refreshReminders();
      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Vous êtes sûr de supprimer ce rappel ?")) return;
    await fetch(`${API_URL}/reminders/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    await refreshReminders();
  };

  const handleEdit = (r) => {
    setForm({
      vehicle_id: r.vehicle_id,
      type: r.type,
      description: r.description || "",
      next_due_mileage: r.next_due_mileage ?? "",
      next_due_date: r.next_due_date ?? "",
    });
    setEditingId(r.id);
    setError("");
    setShowModal(true);
  };

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  // ── RENEW ─────────────────────────────────────
  const openRenewModal = (reminder) => {
    const defaults =
      DEFAULT_INTERVALS[reminder.type] || DEFAULT_INTERVALS["Autre"];
    setRenewingtReminder(reminder);
    setRenewForm({
      mileage_interval: reminder.next_due_mileage ? defaults.mileage : "",
      date_months: reminder.next_due_date ? defaults.months : "",
    });
    setError("");
    setShowRenewModal(true);
  };

  const handleRenew = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `${API_URL}/reminders/${renewingReminder.id}/renew`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(renewForm),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      await refreshReminders();
      setShowRenewModal(false);
      setRenewingtReminder(null);
    } catch (e) {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ── FILTRES ───────────────────────────────────
  const filtered = reminders.filter((r) => {
    const matchSearch =
      search === "" ||
      `${r.type} ${r.vehicle?.brand || ""} ${r.vehicle?.model || ""} ${r.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchVehicle =
      filterVehicle === "all" || r.vehicle_id === parseInt(filterVehicle);
    const matchStatus =
      filterStatus === "all" || r.computed_status === filterStatus;
    return matchSearch && matchVehicle && matchStatus;
  });

  const overdueCount = reminders.filter(
    (r) => r.computed_status === "overdue",
  ).length;
  const upcomingCount = reminders.filter(
    (r) => r.computed_status === "upcoming",
  ).length;
  const okCount = reminders.filter((r) => r.computed_status === "ok").length;

  const isAdmin =
    currentUser?.role === "company_admin" ||
    currentUser?.role === "super_admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <RoleProtector allowedRoles={['company_admin', 'employee']}>
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Rappels de maintenance
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {reminders.length} rappel(s) actif(s)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Nouveau rappel
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {reminders.length}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Total rappels</div>
        </div>

        <button
          onClick={() =>
            setFilterStatus(filterStatus === "overdue" ? "all" : "overdue")
          }
          className={`rounded-2xl border shadow-sm p-5 text-left transition
                        ${filterStatus === "overdue" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{overdueCount}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">En retard</div>
        </button>

        <button
          onClick={() =>
            setFilterStatus(filterStatus === "upcoming" ? "all" : "upcoming")
          }
          className={`rounded-2xl border shadow-sm p-5 text-left transition
                        ${filterStatus === "upcoming" ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">
            {upcomingCount}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">À venir</div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "ok" ? "all" : "ok")}
          className={`rounded-2xl border shadow-sm p-5 text-left transition
                        ${filterStatus === "ok" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800"}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{okCount}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">OK</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un rappel..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 shadow-sm"
          />
        </div>
        <div className="relative">
          <select
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="appearance-none pl-3.5 pr-8 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-600 dark:text-gray-300 shadow-sm cursor-pointer"
          >
            <option value="all">Tous les véhicules</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} - {v.registration_number}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
        </div>
        {(filterVehicle !== "all" || search || filterStatus !== "all") && (
          <button
            onClick={() => {
              setFilterVehicle("all");
              setSearch("");
              setFilterStatus("all");
            }}
            className="text-sm text-blue-600 font-semibold hover:underline whitespace-nowrap"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">Aucun rappel trouvé</p>
            <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">
              {search || filterVehicle !== "all" || filterStatus !== "all"
                ? "Essayez de modifier votre recherche"
                : "Créez votre premier rappel de maintenance"}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Kilométrage
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Date limite
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                // CORRECTION: Normaliser le statut pour gérer les cas où il pourrait être en majuscules
                const normalizedStatus = r.computed_status?.toLowerCase() || 'ok';
                const status = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.ok;
                const StatusIcon = status.icon;
                const vehicle = r.vehicle;
                const mileageLeft = r.next_due_mileage && vehicle?.current_mileage
                  ? r.next_due_mileage - vehicle.current_mileage
                  : null;
                const canRenew =
                  normalizedStatus === "overdue" || normalizedStatus === "upcoming";

                return (
                  <tr
                    key={r.id}
                    className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                          <Car size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            {vehicle?.brand} {vehicle?.model}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {vehicle?.registration_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg ${status.bgColor} ${status.textColor}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.next_due_mileage && vehicle?.current_mileage !== undefined ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            {Number(r.next_due_mileage).toLocaleString()}{" "}
                            <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">
                              km
                            </span>
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${mileageLeft <= 0 ? "text-red-500 font-semibold" : mileageLeft <= 500 ? "text-amber-500 font-semibold" : "text-gray-400"}`}
                          >
                            {mileageLeft <= 0
                              ? `${Math.abs(mileageLeft).toLocaleString()} km en retard`
                              : `${mileageLeft.toLocaleString()} km restants`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.next_due_date ? (
                        <div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-white">
                            {new Date(r.next_due_date).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${new Date(r.next_due_date) < new Date() ? "text-red-500 font-semibold" : "text-gray-400"}`}
                          >
                            {new Date(r.next_due_date) < new Date()
                              ? "Dépassée"
                              : `Dans ${Math.ceil((new Date(r.next_due_date) - new Date()) / 86400000)} jours`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {/* Renouveler - SEULEMENT ADMINS */}
                        {isAdmin && canRenew && (
                          <button
                            onClick={() => openRenewModal(r)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                            title="Renouveler le rappel"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        {/* Modifier - SEULEMENT ADMINS */}
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {/* Supprimer - SEULEMENT ADMINS */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Créer / Modifier - SEULEMENT ADMINS ── */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${editingId ? "bg-blue-50 dark:bg-blue-900/30" : "bg-amber-50 dark:bg-amber-900/30"}`}
                >
                  {editingId ? (
                    <Edit2 size={18} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Bell size={18} className="text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 dark:text-white">
                    {editingId ? "Modifier" : "Nouveau"} rappel
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Définissez par kilométrage, date, ou les deux
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-lg flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  🔴 <strong>En retard</strong> si dépassé · 🟡{" "}
                  <strong>À venir</strong> si &lt; 500 km ou 7 jours · 🟢{" "}
                  <strong>OK</strong> sinon
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Véhicule
                </label>
                <div className="relative">
                  <Car
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500"
                  />
                  <select
                    value={form.vehicle_id}
                    onChange={(e) =>
                      setForm({ ...form, vehicle_id: e.target.value })
                    }
                    className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 cursor-pointer"
                  >
                    <option value="">Choisir un véhicule...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} - {v.registration_number}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <div className="relative">
                  <Bell
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500"
                  />
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="appearance-none w-full pl-10 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 cursor-pointer"
                  >
                    <option value="">Choisir un type...</option>
                    {REMINDER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ex: Vidange à faire tous les 10 000 km..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Kilométrage limite{" "}
                    <span className="ml-1 font-normal text-gray-300 dark:text-gray-600 normal-case">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={form.next_due_mileage}
                    onChange={(e) =>
                      setForm({ ...form, next_due_mileage: e.target.value })
                    }
                    placeholder="Ex: 50000"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-500 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Date limite{" "}
                    <span className="ml-1 font-normal text-gray-300 dark:text-gray-600 normal-case">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={form.next_due_date}
                    onChange={(e) =>
                      setForm({ ...form, next_due_date: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-blue-600/20"
              >
                {saving
                  ? "Sauvegarde..."
                  : editingId
                    ? "Mettre à jour"
                    : "Créer le rappel"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Renouveler - SEULEMENT ADMINS ── */}
      {showRenewModal && renewingReminder && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <RotateCcw size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 dark:text-white">
                    Renouveler le rappel
                  </h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {renewingReminder.type} · {renewingReminder.vehicle?.brand}{" "}
                    {renewingReminder.vehicle?.model}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRenewModal(false)}
                className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {/* Info de la situation actuelle */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Situation actuelle
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Kilométrage véhicule
                  </span>
                  <span className="text-xs font-bold text-gray-800 dark:text-white">
                    {Number(
                      renewingReminder.vehicle?.current_mileage || 0,
                    ).toLocaleString()}{" "}
                    km
                  </span>
                </div>
                {renewingReminder.next_due_mileage && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Limite actuelle
                    </span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {Number(
                        renewingReminder.next_due_mileage,
                      ).toLocaleString()}{" "}
                      km
                    </span>
                  </div>
                )}
                {renewingReminder.next_due_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Date actuelle</span>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {new Date(
                        renewingReminder.next_due_date,
                      ).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Intervalle kilométrage */}
              {renewingReminder.next_due_mileage && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Intervalle kilométrage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={renewForm.mileage_interval}
                      onChange={(e) =>
                        setRenewForm({
                          ...renewForm,
                          mileage_interval: e.target.value,
                        })
                      }
                      className="w-full px-3 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-semibold">
                      km
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Nouvelle limite :{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {renewForm.mileage_interval
                        ? `${(parseInt(renewingReminder.vehicle?.current_mileage || 0) + parseInt(renewForm.mileage_interval || 0)).toLocaleString()} km`
                        : "—"}
                    </span>
                  </p>
                </div>
              )}

              {/* Intervalle date */}
              {renewingReminder.next_due_date && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Intervalle date
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={renewForm.date_months}
                      onChange={(e) =>
                        setRenewForm({
                          ...renewForm,
                          date_months: e.target.value,
                        })
                      }
                      className="w-full px-3 pr-16 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 font-semibold">
                      mois
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Nouvelle date :{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {renewForm.date_months
                        ? new Date(
                            Date.now() +
                              parseInt(renewForm.date_months || 0) * 30 * 86400000,
                          ).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleRenew}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                {saving ? "Renouvellement..." : "Renouveler"}
              </button>
              <button
                onClick={() => setShowRenewModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleProtector>
  );
}