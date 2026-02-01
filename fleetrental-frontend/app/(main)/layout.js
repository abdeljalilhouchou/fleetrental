import { DataProvider } from '../context/DataContext';
import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }) {
    return (
        <DataProvider>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </DataProvider>
    );
}
