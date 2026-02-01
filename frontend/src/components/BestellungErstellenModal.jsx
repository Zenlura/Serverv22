import { useState, useEffect } from 'react'

function BestellungErstellenModal({ artikel, onClose, onSuccess }) {
  const [lieferanten, setLieferanten] = useState([])
  const [selectedLieferant, setSelectedLieferant] = useState(null)
  const [menge, setMenge] = useState('')
  const [einzelpreis, setEinzelpreis] = useState('')
  const [versandkosten, setVersandkosten] = useState('0.00')
  const [notizen, setNotizen] = useState('')
  const [interneNotizen, setInterneNotizen] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Daten laden
  useEffect(() => {
    if (artikel) {
      loadData()
    }
  }, [artikel])

  const loadData = async () => {
    try {
      setLoading(true)

      // Alle Lieferanten laden
      const response = await fetch('/api/lieferanten')
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Lieferanten')
      }

      const data = await response.json()
      const lieferantenListe = data.items || data || []
      setLieferanten(lieferantenListe)

      // Bevorzugten Lieferanten vorauswählen (falls vorhanden)
      if (artikel.lieferanten && artikel.lieferanten.length > 0) {
        const bevorzugt = artikel.lieferanten.find(l => l.bevorzugt)
        const hauptLieferant = bevorzugt || artikel.lieferanten[0]
        
        setSelectedLieferant(hauptLieferant.lieferant.id)
        setEinzelpreis(hauptLieferant.einkaufspreis || '')
        
        // Vorgeschlagene Menge: Mindestbestand * 2 (mindestens 1)
        const vorschlag = Math.max(1, (artikel.mindestbestand || 10) * 2)
        setMenge(vorschlag.toString())
      } else if (lieferantenListe.length > 0) {
        setSelectedLieferant(lieferantenListe[0].id)
      }

      setError(null)
    } catch (err) {
      setError('Fehler beim Laden: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLieferantChange = (lieferantId) => {
    setSelectedLieferant(parseInt(lieferantId))
    
    // Preis vom Artikel-Lieferanten übernehmen (falls vorhanden)
    if (artikel.lieferanten) {
      const artikelLieferant = artikel.lieferanten.find(
        l => l.lieferant.id === parseInt(lieferantId)
      )
      if (artikelLieferant && artikelLieferant.einkaufspreis) {
        setEinzelpreis(artikelLieferant.einkaufspreis.toString())
      }
    }
  }

  const handleSubmit = async () => {
    // Validierung
    if (!selectedLieferant) {
      alert('Bitte wähle einen Lieferanten aus!')
      return
    }
    if (!menge || parseInt(menge) <= 0) {
      alert('Bitte gib eine gültige Menge ein!')
      return
    }
    if (!einzelpreis || parseFloat(einzelpreis) < 0) {
      alert('Bitte gib einen gültigen Preis ein!')
      return
    }

    try {
      setSaving(true)

      const bestellung = {
        lieferant_id: selectedLieferant,
        positionen: [
          {
            artikel_id: artikel.id,
            menge: parseInt(menge),
            einzelpreis: parseFloat(einzelpreis),
            notizen: null
          }
        ],
        versandkosten: parseFloat(versandkosten) || 0,
        notizen: notizen || null,
        interne_notizen: interneNotizen || null
      }

      const response = await fetch('/api/bestellungen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bestellung)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Fehler: ${response.status}`)
      }

      const createdBestellung = await response.json()
      
      if (onSuccess) {
        onSuccess(createdBestellung)
      }
      
      onClose()
    } catch (err) {
      setError('Fehler beim Erstellen: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const getGesamtpreis = () => {
    const m = parseFloat(menge) || 0
    const p = parseFloat(einzelpreis) || 0
    const v = parseFloat(versandkosten) || 0
    return (m * p + v).toFixed(2)
  }

  const formatPreis = (preis) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(preis || 0)
  }

  const getBestand = () => {
    return (artikel.bestand_lager || 0) + (artikel.bestand_werkstatt || 0)
  }

  const istMindestbestand = () => {
    return getBestand() <= (artikel.mindestbestand || 0)
  }

  if (!artikel) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">📦 Bestellung erstellen</h2>
              <p className="text-green-100 text-sm mt-1">
                {artikel.artikelnummer} - {artikel.bezeichnung}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Lade Daten...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold">Fehler</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Bestand-Warnung */}
              {istMindestbestand() && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900">Mindestbestand unterschritten!</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Aktueller Bestand: {getBestand()} {artikel.einheit || 'Stück'} 
                      {artikel.mindestbestand > 0 && ` (Mindest: ${artikel.mindestbestand})`}
                    </p>
                  </div>
                </div>
              )}

              {/* Lieferant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieferant *
                </label>
                <select
                  value={selectedLieferant || ''}
                  onChange={(e) => handleLieferantChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={saving}
                >
                  <option value="">Bitte wählen...</option>
                  {lieferanten.map(lieferant => (
                    <option key={lieferant.id} value={lieferant.id}>
                      {lieferant.name}
                      {artikel.lieferanten?.find(l => l.lieferant.id === lieferant.id && l.bevorzugt) && ' ⭐'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Menge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menge * ({artikel.einheit || 'Stück'})
                </label>
                <input
                  type="number"
                  value={menge}
                  onChange={(e) => setMenge(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={saving}
                  placeholder="z.B. 10"
                />
                {artikel.mindestbestand > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    💡 Empfohlen: {Math.max(1, artikel.mindestbestand * 2)} (2× Mindestbestand)
                  </p>
                )}
              </div>

              {/* Einzelpreis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Einkaufspreis (pro {artikel.einheit || 'Stück'}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={einzelpreis}
                    onChange={(e) => setEinzelpreis(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    disabled={saving}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500">€</span>
                </div>
              </div>

              {/* Versandkosten */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Versandkosten (optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={versandkosten}
                    onChange={(e) => setVersandkosten(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    disabled={saving}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-2.5 text-gray-500">€</span>
                </div>
              </div>

              {/* Gesamtpreis Vorschau */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Gesamtpreis:</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatPreis(getGesamtpreis())}
                  </span>
                </div>
                {menge && einzelpreis && (
                  <p className="text-xs text-gray-500 mt-2">
                    {menge} × {formatPreis(einzelpreis)} + {formatPreis(versandkosten)} Versand
                  </p>
                )}
              </div>

              {/* Notizen für Lieferant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen für Lieferant (optional)
                </label>
                <textarea
                  value={notizen}
                  onChange={(e) => setNotizen(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={saving}
                  placeholder="z.B. 'Bitte schnell liefern'"
                />
              </div>

              {/* Interne Notizen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interne Notizen (optional)
                </label>
                <textarea
                  value={interneNotizen}
                  onChange={(e) => setInterneNotizen(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={saving}
                  placeholder="Notizen nur für dich..."
                />
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
          >
            {saving ? 'Erstelle...' : '📦 Bestellung erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BestellungErstellenModal
