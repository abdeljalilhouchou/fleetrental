'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, FileText, CheckCircle, XCircle, Wrench, X } from 'lucide-react';
import { getNotifications, getUnreadCount, markAllNotificationsRead } from '../../lib/api';

const TYPE_CONFIG = {
    rental_created:       { icon: FileText,      color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
    rental_completed:     { icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/30' },
    rental_cancelled:     { icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/30' },
    maintenance_created:  { icon: Wrench,        color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    maintenance_completed:{ icon: CheckCircle,   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/30' },
};

function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'à l\'instant';
    if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [isOpen, setIsOpen]               = useState(false);
    const [loading, setLoading]             = useState(false);
    const dropdownRef                        = useRef(null);
    const intervalRef                        = useRef(null);

    // Fetch unread count (léger, pour le polling)
    const fetchCount = useCallback(async () => {
        try {
            const data = await getUnreadCount();
            setUnreadCount(data.count ?? 0);
        } catch {}
    }, []);

    // Fetch full list (quand on ouvre)
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch {}
        setLoading(false);
    }, []);

    // Polling toutes les 30s
    useEffect(() => {
        fetchCount();
        intervalRef.current = setInterval(fetchCount, 30000);
        return () => clearInterval(intervalRef.current);
    }, [fetchCount]);

    // Fermer si clic hors du dropdown
    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleOpen = async () => {
        const opening = !isOpen;
        setIsOpen(opening);
        if (opening) {
            await fetchNotifications();
            if (unreadCount > 0) {
                markAllNotificationsRead().catch(() => {});
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Icône cloche */}
            <button
                onClick={handleOpen}
                className="relative p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Liste */}
                    <div className="max-h-72 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-gray-500">
                                <Bell size={28} className="mb-2 opacity-40" />
                                <p className="text-sm">Aucune notification</p>
                            </div>
                        ) : (
                            notifications.slice(0, 20).map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.rental_created;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={n.id}
                                        className={`flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg}`}>
                                            <Icon size={14} className={cfg.color} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">{n.body}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">{timeAgo(n.created_at)}</p>
                                        </div>
                                        {!n.read && (
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
