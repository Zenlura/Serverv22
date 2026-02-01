import { useState } from 'react'
import ArtikelListe from './components/ArtikelListe'
import BestellungenListe from './components/BestellungenListe'
import ReparaturenListe from './components/ReparaturenListe'

function App() {
  const [activeView, setActiveView] = useState('reparaturen')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🚴 Radstation Warenwirtschaft</h1>
          <p className="text-blue-100 mt-1">Artikel, Bestellungen & Reparaturen</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="container mx-auto px-4">
          <div className="flex gap-1 border-b border-blue-500">
            <button
              onClick={() => setActiveView('artikel')}
              className={`px-6 py-3 font-medium transition ${
                activeView === 'artikel'
                  ? 'bg-white text-blue-600 rounded-t-lg'
                  : 'text-white hover:bg-blue-500 rounded-t-lg'
              }`}
            >
              📦 Artikel
            </button>
            <button
              onClick={() => setActiveView('bestellungen')}
              className={`px-6 py-3 font-medium transition ${
                activeView === 'bestellungen'
                  ? 'bg-white text-blue-600 rounded-t-lg'
                  : 'text-white hover:bg-blue-500 rounded-t-lg'
              }`}
            >
              🛒 Bestellungen
            </button>
            <button
              onClick={() => setActiveView('reparaturen')}
              className={`px-6 py-3 font-medium transition ${
                activeView === 'reparaturen'
                  ? 'bg-white text-blue-600 rounded-t-lg'
                  : 'text-white hover:bg-blue-500 rounded-t-lg'
              }`}
            >
              🔧 Reparaturen
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeView === 'artikel' && <ArtikelListe />}
        {activeView === 'bestellungen' && <BestellungenListe />}
        {activeView === 'reparaturen' && <ReparaturenListe />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm">
          Radstation v2 - Phase 3 - Session 3.2 - Reparaturen Frontend
        </div>
      </footer>
    </div>
  )
}

export default App