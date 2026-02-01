import './globals.css'

export const metadata = {
    title: 'FleetRental',
    description: 'Gestion de flotte automobile',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body className="antialiased">
                {children}
            </body>
        </html>
    )
}