'use client';

import { DataProvider, useData } from '../context/DataContext';
import Sidebar from '../components/Sidebar';

function MainContent({ children }) {
    const { loading } = useData();

    if (loading) {
        return (
            <main className="flex-1 p-8 overflow-auto flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400 text-sm">Chargement...</span>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-8 overflow-auto">
            {children}
        </main>
    );
}

export default function MainLayout({ children }) {
    return (
        <DataProvider>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <MainContent>{children}</MainContent>
            </div>
        </DataProvider>
    );
}
