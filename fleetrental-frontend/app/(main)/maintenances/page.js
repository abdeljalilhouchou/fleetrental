"use client";

import { useState, useRef, Fragment } from "react";
import { useData } from "../../context/DataContext";
import { getToken } from "../../../lib/api";
import { useRouter } from "next/navigation";
import RoleProtector from "../../components/RoleProtector";
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Search,
  Car,
  AlertCircle,
  XCircle,
  ChevronDown,
  CheckCircle2,
  Clock,
  Paperclip,
  Upload,
  FileText,
  FileImage,
  X,
  Eye,
  ChevronRight,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const STORAGE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:8000";

const MAINTENANCE_TYPES = [
  "Vidange",
  "Freins",
  "Pneus",
  "Batterie",
  "Révision",
  "Climatisation",
  "Transmission",
  "Embrayage",
  "Échappement",
  "Autre",
];

const EMPTY_FORM = {
  vehicle_id: "",
  type: "",
  description: "",
  cost: 0,
  date: new Date().toISOString().split("T")[0],
  mileage_at_maintenance: 0,
};

function FileIcon({ mimeType }) {
  if (mimeType?.startsWith("image/"))
    return <FileImage size={16} className="text-pink-500" />;
  return <FileText size={16} className="text-blue-500" />;
}

function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MaintenancesPage() {
  const {
    maintenances,
    vehicles,
    user: currentUser,
    loading,
    refreshMaintenances,
    refreshVehicles,
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const headers = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_URL}/maintenances/${editingId}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`${API_URL}/maintenances`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(form),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      await Promise.all([refreshMaintenances(), refreshVehicles()]);
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
    if (!confirm("Voulez-vous vraiment supprimer cette maintenance ?")) return;
    const res = await fetch(`${API_URL}/maintenances/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (res.ok) await Promise.all([refreshMaintenances(), refreshVehicles()]);
  };

  const handleComplete = async (id) => {
    const res = await fetch(`${API_URL}/maintenances/${id}/complete`, {
      method: "POST",
      headers: headers(),
    });
    if (res.ok) await Promise.all([refreshMaintenances(), refreshVehicles()]);
  };

  const handleEdit = (m) => {
    setForm({
      vehicle_id: m.vehicle_id || "",
      type: m.type || "",
      description: m.description || "",
      cost: m.cost || 0,
      date: m.date || new Date().toISOString().split("T")[0],
      mileage_at_maintenance: m.mileage_at_maintenance || 0,
    });
    setEditingId(m.id);
    setError("");
    setShowModal(true);
  };

  const handleCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const handleFileUpload = async (maintenanceId, files) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Créer un FormData pour chaque fichier séparément
      for (let file of files) {
        const formData = new FormData();
        formData.append("file", file); // Note: 'file' (singulier) et non 'files[]'

        const res = await fetch(
          `${API_URL}/maintenances/${maintenanceId}/files`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getToken()}`,
              // NE PAS ajouter Content-Type, le navigateur le fera automatiquement avec FormData
            },
            body: formData,
          },
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erreur lors de l'upload");
        }
      }

      await refreshMaintenances();
    } catch (e) {
      console.error("Erreur upload:", e);
      setError(`Erreur lors de l'upload: ${e.message}`);
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  const handleDeleteFile = async (maintenanceId, fileId) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    const res = await fetch(
      `${API_URL}/maintenances/${maintenanceId}/files/${fileId}`,
      {
        method: "DELETE",
        headers: headers(),
      },
    );
    if (res.ok) await refreshMaintenances();
  };

  const isAdmin =
    currentUser?.role === "company_admin" ||
    currentUser?.role === "super_admin";

  const filtered = maintenances.filter((m) => {
    const vehicle = vehicles.find((v) => v.id === m.vehicle_id);
    const vehicleName = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.registration_number}`
      : "";
    const matchSearch = `${m.type} ${m.description} ${vehicleName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchVehicle =
      filterVehicle === "all" || m.vehicle_id === parseInt(filterVehicle);
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchVehicle && matchStatus;
  });

  const inProgressCount = maintenances.filter(
    (m) => m.status === "in_progress",
  ).length;
  const completedCount = maintenances.filter(
    (m) => m.status === "completed",
  ).length;
  const totalCost = filtered.reduce((sum, m) => sum + parseFloat(m.cost), 0);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
            <Wrench size={22} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Maintenances</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
              Suivez l&apos;entretien de vos véhicules
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-green-600/20 hover:shadow-lg transition flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          Nouvelle maintenance
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        {[
          { label: 'En cours', value: inProgressCount, filter: 'in_progress', valueColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Terminées', value: completedCount, filter: 'completed', valueColor: 'text-green-600 dark:text-green-400' },
          { label: 'Coût total', value: `${totalCost.toLocaleString()} MAD`, filter: null, valueColor: 'text-blue-600 dark:text-blue-400' },
        ].map((card, i) => (
          <div
            key={i}
            onClick={() => card.filter !== null && setFilterStatus(filterStatus === card.filter ? 'all' : card.filter)}
            className={`rounded-2xl border shadow-sm p-5 transition ${card.filter !== null ? 'cursor-pointer hover:shadow-md' : ''} ${
              card.filter !== null && filterStatus === card.filter
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/50'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700'
            }`}
          >
            <div className={`text-3xl font-bold ${card.valueColor}`}>{card.value}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une maintenance..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white dark:placeholder-gray-500"
          />
        </div>
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none cursor-pointer"
        >
          <option value="all">Tous les véhicules</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.brand} {v.model}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">
              Aucune maintenance trouvée
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Type
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Véhicule
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Coût
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Statut
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const vehicle = vehicles.find((v) => v.id === m.vehicle_id);
                const isExpanded = expandedId === m.id;

                return (
                  <Fragment key={m.id}>
                    <tr className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : m.id)
                            }
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <ChevronRight
                              size={14}
                              className={`text-gray-400 dark:text-gray-500 transition ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                          <span className="text-sm font-semibold text-gray-800 dark:text-white">
                            {m.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {vehicle && (
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {vehicle.registration_number}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(m.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-white">
                        {parseFloat(m.cost).toLocaleString()} MAD
                      </td>
                      <td className="px-4 py-4">
                        {m.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800">
                            <Clock size={12} />
                            En cours
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
                            <CheckCircle2 size={12} />
                            Terminée
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {m.status === "in_progress" && (
                            <button
                              onClick={() => handleComplete(m.id)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                              title="Terminer"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleEdit(m)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan="6" className="bg-gray-50 dark:bg-gray-800/50 px-4 py-4">
                          <div className="max-w-4xl">
                            {m.description && (
                              <div className="mb-4">
                                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">
                                  Description
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {m.description}
                                </div>
                              </div>
                            )}

                            <div className="mb-4">
                              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                                Fichiers joints
                              </div>
                              {m.files && m.files.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {m.files.map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                                    >
                                      <FileIcon mimeType={file.mime_type} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                          {file.file_name}
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                          {formatSize(file.file_size)}
                                        </div>
                                      </div>
                                      <a
                                        href={`${STORAGE_URL}/storage/${file.file_path}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                      >
                                        <Eye size={14} />
                                      </a>
                                      {isAdmin && (
                                        <button
                                          onClick={() =>
                                            handleDeleteFile(m.id, file.id)
                                          }
                                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                                  Aucun fichier joint
                                </div>
                              )}

                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleFileUpload(m.id, e.dataTransfer.files);
                                }}
                                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                                  dragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500"
                                }`}
                                onClick={() => {
                                  const input = document.createElement("input");
                                  input.type = "file";
                                  input.multiple = true;
                                  input.onchange = (e) =>
                                    handleFileUpload(m.id, e.target.files);
                                  input.click();
                                }}
                              >
                                <Upload
                                  size={20}
                                  className="mx-auto mb-2 text-gray-400 dark:text-gray-500"
                                />
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {uploading
                                    ? "Upload en cours..."
                                    : "Glissez des fichiers ou cliquez pour ajouter"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-800 dark:text-white">
                {editingId ? "Modifier" : "Nouvelle"} maintenance
              </h2>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                    Véhicule
                  </label>
                  <select
                    value={form.vehicle_id}
                    onChange={(e) =>
                      setForm({ ...form, vehicle_id: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white cursor-pointer"
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles
                      .filter((v) => v.status !== "rented")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} - {v.registration_number}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white cursor-pointer"
                  >
                    <option value="">Sélectionner un type</option>
                    {MAINTENANCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows="3"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                      Coût (MAD)
                    </label>
                    <input
                      type="number"
                      value={form.cost}
                      onChange={(e) =>
                        setForm({ ...form, cost: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm({ ...form, date: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    value={form.mileage_at_maintenance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mileage_at_maintenance: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-sm text-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(EMPTY_FORM);
                  setEditingId(null);
                  setError("");
                }}
                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-5 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleProtector>
  );
}
