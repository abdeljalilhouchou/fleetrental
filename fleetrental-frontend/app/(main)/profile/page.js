'use client';

import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { updateProfile, updateAvatar, removeAvatar, updatePreferences, updatePassword, storageUrl } from '../../../lib/api';
import RoleProtector from '../../components/RoleProtector';
import {
    User, Mail, Phone, MapPin, Calendar, Camera, Trash2, Lock,
    Sun, Moon, Globe, Bell, Shield, Building2, Save, Eye, EyeOff,
    CheckCircle, AlertCircle
} from 'lucide-react';

function Message({ section, messages }) {
    const msg = messages[section];
    if (!msg) return null;
    return (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            msg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
        </div>
    );
}

const ROLE_LABELS = {
    super_admin: { label: 'Super Admin', color: 'bg-purple-600' },
    company_admin: { label: 'Admin Entreprise', color: 'bg-green-600' },
    employee: { label: 'Employé', color: 'bg-blue-600' },
};

export default function ProfilePage() {
    const { user, refresh } = useData();
    const fileInputRef = useRef(null);

    // États pour les formulaires
    const [profileForm, setProfileForm] = useState({
        name: '',
        phone: '',
        address: '',
        birthdate: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [preferences, setPreferences] = useState({
        theme: 'light',
        language: 'fr',
        notifications_email: true,
        notifications_maintenance: true,
        notifications_rental: true,
    });

    // États UI
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState({});
    const [messages, setMessages] = useState({});

    // Charger les données utilisateur
    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.name || '',
                phone: user.phone || '',
                address: user.address || '',
                birthdate: user.birthdate ? user.birthdate.split('T')[0] : '',
            });
            setPreferences({
                theme: user.theme || 'light',
                language: user.language || 'fr',
                notifications_email: user.notifications_email ?? true,
                notifications_maintenance: user.notifications_maintenance ?? true,
                notifications_rental: user.notifications_rental ?? true,
            });
            if (user.avatar) {
                setAvatarPreview(storageUrl(user.avatar));
            }
        }
    }, [user]);

    // Appliquer le thème (seulement après chargement utilisateur pour éviter flash)
    useEffect(() => {
        if (!user) return;
        if (preferences.theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [preferences.theme, user]);

    const showMessage = (section, type, text) => {
        setMessages(prev => ({ ...prev, [section]: { type, text } }));
        setTimeout(() => {
            setMessages(prev => ({ ...prev, [section]: null }));
        }, 4000);
    };

    // Mise à jour du profil
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, profile: true }));
        try {
            await updateProfile(profileForm);
            await refresh('user');
            showMessage('profile', 'success', 'Profil mis à jour avec succès');
        } catch (error) {
            showMessage('profile', 'error', error.message || 'Erreur lors de la mise à jour');
        }
        setLoading(prev => ({ ...prev, profile: false }));
    };

    // Gestion de l'avatar
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation côté client
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            showMessage('avatar', 'error', 'Format non supporté. Utilisez JPG ou PNG.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showMessage('avatar', 'error', 'Fichier trop volumineux (max 2MB)');
            return;
        }

        setLoading(prev => ({ ...prev, avatar: true }));
        try {
            const result = await updateAvatar(file);
            if (result.user?.avatar) {
                setAvatarPreview(storageUrl(result.user.avatar));
            }
            await refresh('user');
            showMessage('avatar', 'success', 'Avatar mis à jour avec succès');
        } catch (error) {
            showMessage('avatar', 'error', error.message || 'Erreur lors de l\'upload');
        }
        setLoading(prev => ({ ...prev, avatar: false }));
    };

    const handleAvatarRemove = async () => {
        setLoading(prev => ({ ...prev, avatar: true }));
        try {
            await removeAvatar();
            setAvatarPreview(null);
            await refresh('user');
            showMessage('avatar', 'success', 'Avatar supprimé');
        } catch (error) {
            showMessage('avatar', 'error', error.message || 'Erreur lors de la suppression');
        }
        setLoading(prev => ({ ...prev, avatar: false }));
    };

    // Changement de mot de passe
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.password !== passwordForm.password_confirmation) {
            showMessage('password', 'error', 'Les mots de passe ne correspondent pas');
            return;
        }
        if (passwordForm.password.length < 6) {
            showMessage('password', 'error', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(prev => ({ ...prev, password: true }));
        try {
            await updatePassword(passwordForm);
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
            showMessage('password', 'success', 'Mot de passe mis à jour avec succès');
        } catch (error) {
            const msg = error.message || 'Erreur lors de la mise à jour';
            showMessage('password', 'error', msg);
        }
        setLoading(prev => ({ ...prev, password: false }));
    };

    // Mise à jour des préférences
    const handlePreferencesSubmit = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, preferences: true }));
        try {
            await updatePreferences(preferences);
            await refresh('user');
            showMessage('preferences', 'success', 'Préférences mises à jour');
        } catch (error) {
            showMessage('preferences', 'error', error.message || 'Erreur lors de la mise à jour');
        }
        setLoading(prev => ({ ...prev, preferences: false }));
    };

    const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.employee;

    return (
        <RoleProtector allowedRoles={['super_admin', 'company_admin', 'employee']}>
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Mon Profil</h1>

            <div className="space-y-6">
                {/* Section Informations du compte (lecture seule) */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Informations du compte</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-1">
                                <Mail size={14} />
                                Email
                            </div>
                            <p className="font-medium text-slate-900 dark:text-white">{user?.email}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-1">
                                <User size={14} />
                                Rôle
                            </div>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold text-white ${roleInfo.color}`}>
                                {roleInfo.label}
                            </span>
                        </div>
                        {user?.company && (
                            <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-gray-400 text-sm mb-1">
                                    <Building2 size={14} />
                                    Entreprise
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white">{user.company.name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Avatar */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Camera className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Photo de profil</h2>
                    </div>
                    <Message section="avatar" messages={messages} />
                    <div className="flex items-center gap-6 mt-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden ring-4 ring-slate-100 dark:ring-gray-700">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-slate-400 dark:text-gray-500" />
                                )}
                            </div>
                            {loading.avatar && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/jpeg,image/jpg,image/png"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading.avatar}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                            >
                                Changer la photo
                            </button>
                            {avatarPreview && (
                                <button
                                    onClick={handleAvatarRemove}
                                    disabled={loading.avatar}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    Supprimer
                                </button>
                            )}
                            <p className="text-xs text-slate-500 dark:text-gray-400">JPG ou PNG. Max 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* Section Informations personnelles */}
                <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <User className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Informations personnelles</h2>
                    </div>
                    <Message section="profile" messages={messages} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nom complet</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Téléphone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="+33 6 12 34 56 78"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date de naissance</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type="date"
                                    value={profileForm.birthdate}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, birthdate: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Adresse</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-slate-400 dark:text-gray-500" />
                                <textarea
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                                    rows={2}
                                    placeholder="123 Rue Example, 75001 Paris"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading.profile}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading.profile ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>

                {/* Section Sécurité */}
                <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sécurité</h2>
                    </div>
                    <Message section="password" messages={messages} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Mot de passe actuel</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                    className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={passwordForm.password}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                                >
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Confirmer le mot de passe</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={passwordForm.password_confirmation}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, password_confirmation: e.target.value }))}
                                    className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">Minimum 6 caractères</p>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading.password}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading.password ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Lock size={16} />
                            )}
                            Changer le mot de passe
                        </button>
                    </div>
                </form>

                {/* Section Préférences */}
                <form onSubmit={handlePreferencesSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Sun className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Préférences</h2>
                    </div>
                    <Message section="preferences" messages={messages} />

                    <div className="space-y-6 mt-4">
                        {/* Thème */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Thème</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                                        preferences.theme === 'light'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 dark:text-gray-300'
                                    }`}
                                >
                                    <Sun size={20} />
                                    <span className="font-medium">Clair</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                                        preferences.theme === 'dark'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 dark:text-gray-300'
                                    }`}
                                >
                                    <Moon size={20} />
                                    <span className="font-medium">Sombre</span>
                                </button>
                            </div>
                        </div>

                        {/* Langue */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-3">Langue</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPreferences(prev => ({ ...prev, language: 'fr' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                                        preferences.language === 'fr'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 dark:text-gray-300'
                                    }`}
                                >
                                    <Globe size={20} />
                                    <span className="font-medium">Français</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreferences(prev => ({ ...prev, language: 'en' }))}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition ${
                                        preferences.language === 'en'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                            : 'border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 dark:text-gray-300'
                                    }`}
                                >
                                    <Globe size={20} />
                                    <span className="font-medium">English</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading.preferences}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading.preferences ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>

                {/* Section Notifications */}
                <form onSubmit={handlePreferencesSubmit} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-slate-600 dark:text-gray-300" size={20} />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
                    </div>

                    <div className="space-y-4 mt-4">
                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Notifications par email</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Recevoir des notifications par email</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.notifications_email}
                                onChange={(e) => setPreferences(prev => ({ ...prev, notifications_email: e.target.checked }))}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Rappels de maintenance</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Être notifié des maintenances à venir</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.notifications_maintenance}
                                onChange={(e) => setPreferences(prev => ({ ...prev, notifications_maintenance: e.target.checked }))}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition">
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">Alertes de location</p>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Être notifié des locations en cours et à venir</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.notifications_rental}
                                onChange={(e) => setPreferences(prev => ({ ...prev, notifications_rental: e.target.checked }))}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </label>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading.preferences}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading.preferences ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </RoleProtector>
    );
}
