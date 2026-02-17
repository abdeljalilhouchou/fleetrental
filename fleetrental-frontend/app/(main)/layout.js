'use client';

import { useEffect } from 'react';
import { DataProvider, useData } from '../context/DataContext';
import Sidebar from '../components/Sidebar';

function MainContent({ children }) {
    const { loading, user } = useData();

    useEffect(() => {
        if (user?.theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (user) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [user?.theme]);

    if (loading) {
        return (
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto flex items-center justify-center dark:bg-gray-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">Chargement...</span>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-4 pt-16 md:p-6 lg:p-8 lg:pt-8 overflow-auto dark:bg-gray-950">
            {children}
        </main>
    );
}

export default function MainLayout({ children }) {
    return (
        <DataProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar />
                <MainContent>{children}</MainContent>
            </div>
        </DataProvider>
    );
}
