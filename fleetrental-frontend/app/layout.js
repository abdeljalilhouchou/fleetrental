import './globals.css'

export const metadata = {
    title: 'FleetRental',
    description: 'Gestion de flotte automobile',
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`
                }} />
            </head>
            <body className="antialiased">
                {children}
            </body>
        </html>
    )
}