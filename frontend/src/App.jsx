import { useState } from 'react'
import ArtikelListe from './components/ArtikelListe'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">🚴 Radstation Warenwirtschaft</h1>
          <p className="text-blue-100 mt-1">Artikel- und Bestandsverwaltung</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ArtikelListe />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm">
          Radstation v2 - Phase 1 - Session 1.7
        </div>
      </footer>
    </div>
  )
}

export default App
