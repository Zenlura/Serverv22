import { useState, useEffect } from 'react'

export default function ReparaturBearbeitenModal({ reparatur, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fahrradmarke: '',
    fahrradmodell: '',
    rahmennummer: '',
    schluesselnummer: '',
    fahrrad_anwesend: false,
    kunde_name: '',
    kunde_telefon: '',
    kunde_email: '',
    maengelbeschreibung: '',
    status: '',
    fertig_bis: '',
    fertig_am: '',
    abholtermin: '',
    abgeholt_am: '',
    kostenvoranschlag: '',
    endbetrag: '',
    bezahlt: false,
    bezahlt_am: '',
    notizen: ''
  })

  const [positionen, setPositionen] = useState([])
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [newPosition, setNewPosition] = useState({
    typ: 'teil',
    artikel_id: null,
    bezeichnung: '',
    beschreibung: '',
    menge: 1,
    einzelpreis: 0
  })
  
  // KRITISCH: Artikel-State mit leerem Array initialisieren
  const [artikel, setArtikel] = useState([])
  const [artikelLoading, setArtikelLoading] = useState(false)
  const [artikelSuche, setArtikelSuche] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDetails()
    loadArtikel()
  }, [reparatur.id])

  const loadDetails = async () => {
    try {
      console.log('🔍 Lade Reparatur-Details für ID:', reparatur.id)
      const response = await fetch(`http://localhost:8000/api/reparaturen/${reparatur.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Empfangene Daten:', data)
        console.log('📝 Positionen im Response:', data.positionen)
        
        setFormData({
          fahrradmarke: data.fahrradmarke || '',
          fahrradmodell: data.fahrradmodell || '',
          rahmennummer: data.rahmennummer || '',
          schluesselnummer: data.schluesselnummer || '',
          fahrrad_anwesend: data.fahrrad_anwesend || false,
          kunde_name: data.kunde_name || '',
          kunde_telefon: data.kunde_telefon || '',
          kunde_email: data.kunde_email || '',
          maengelbeschreibung: data.maengelbeschreibung || '',
          status: data.status || '',
          fertig_bis: data.fertig_bis ? data.fertig_bis.split('T')[0] : '',
          fertig_am: data.fertig_am ? data.fertig_am.split('T')[0] : '',
          abholtermin: data.abholtermin || '',
          abgeholt_am: data.abgeholt_am ? data.abgeholt_am.split('T')[0] : '',
          kostenvoranschlag: data.kostenvoranschlag || '',
          endbetrag: data.endbetrag || '',
          bezahlt: data.bezahlt || false,
          bezahlt_am: data.bezahlt_am ? data.bezahlt_am.split('T')[0] : '',
          notizen: data.notizen || ''
        })
        setPositionen(data.positionen || [])
        console.log('✅ Positionen gesetzt:', data.positionen?.length || 0)
      }
    } catch (err) {
      console.error('Fehler beim Laden der Reparatur:', err)
    }
  }

  const loadArtikel = async () => {
    setArtikelLoading(true)
    try {
      console.log('🔄 Lade Artikel...')
      const response = await fetch('http://localhost:8000/api/artikel/')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('📦 Backend Response:', data)
      console.log('📦 Response Type:', typeof data)
      console.log('📦 Is Array?', Array.isArray(data))
      
      // Robuste Artikel-Extraktion
      let artikelArray = []
      
      if (Array.isArray(data)) {
        // Direktes Array
        artikelArray = data
        console.log('✅ Direktes Array erkannt')
      } else if (data && typeof data === 'object') {
        // Objekt mit items-Property
        if (Array.isArray(data.items)) {
          artikelArray = data.items
          console.log('✅ Items-Array erkannt')
        } else if (data.items && typeof data.items === 'object') {
          // items ist ein Objekt, nicht Array - in Array konvertieren
          artikelArray = Object.values(data.items)
          console.log('⚠️ Items war Objekt, konvertiert zu Array')
        }
      }
      
      console.log('✅ Finale Artikel-Liste:', artikelArray)
      console.log('✅ Anzahl Artikel:', artikelArray.length)
      
      setArtikel(artikelArray)
    } catch (err) {
      console.error('❌ Fehler beim Laden der Artikel:', err)
      setArtikel([]) // Bei Fehler leeres Array setzen
    } finally {
      setArtikelLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        kostenvoranschlag: formData.kostenvoranschlag ? parseFloat(formData.kostenvoranschlag) : null,
        endbetrag: formData.endbetrag ? parseFloat(formData.endbetrag) : null,
        fertig_bis: formData.fertig_bis || null,
        fertig_am: formData.fertig_am || null,
        abgeholt_am: formData.abgeholt_am || null,
        bezahlt_am: formData.bezahlt_am || null
      }

      const response = await fetch(`http://localhost:8000/api/reparaturen/${reparatur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Fehler beim Speichern')
      }
    } catch (err) {
      setError('Netzwerkfehler')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPosition = async () => {
    if (!newPosition.bezeichnung) {
      alert('Bitte Bezeichnung eingeben')
      return
    }

    try {
      console.log('📤 Sende Position:', newPosition)
      
      const response = await fetch(`http://localhost:8000/api/reparaturen/${reparatur.id}/positionen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPosition,
          menge: parseFloat(newPosition.menge),
          einzelpreis: parseFloat(newPosition.einzelpreis),
          artikel_id: newPosition.artikel_id || null
        })
      })

      console.log('📥 Response Status:', response.status)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Position erstellt:', result)
        
        setShowAddPosition(false)
        setNewPosition({
          typ: 'teil',
          artikel_id: null,
          bezeichnung: '',
          beschreibung: '',
          menge: 1,
          einzelpreis: 0
        })
        
        console.log('🔄 Lade Details neu...')
        await loadDetails()
        console.log('✅ Details neu geladen')
      } else {
        const errorData = await response.json()
        console.error('❌ Fehler beim Speichern:', errorData)
        alert('Fehler beim Hinzufügen: ' + (errorData.detail || 'Unbekannter Fehler'))
      }
    } catch (err) {
      console.error('❌ Netzwerkfehler:', err)
      alert('Fehler beim Hinzufügen')
    }
  }

  const handleDeletePosition = async (posId) => {
    if (!confirm('Position wirklich löschen?')) return

    try {
      const response = await fetch(
        `http://localhost:8000/api/reparaturen/${reparatur.id}/positionen/${posId}`,
        { method: 'DELETE' }
      )
      if (response.ok) {
        loadDetails()
      }
    } catch (err) {
      console.error('Fehler beim Löschen:', err)
      alert('Fehler beim Löschen')
    }
  }

  const handleArtikelSelect = (e) => {
    const artikelId = parseInt(e.target.value)
    
    if (!artikelId || !Array.isArray(artikel)) {
      setNewPosition(prev => ({
        ...prev,
        artikel_id: null
      }))
      return
    }
    
    const selectedArtikel = artikel.find(a => a.id === artikelId)
    
    if (selectedArtikel) {
      setNewPosition(prev => ({
        ...prev,
        artikel_id: artikelId,
        bezeichnung: selectedArtikel.name || '',
        beschreibung: selectedArtikel.beschreibung || '',
        einzelpreis: parseFloat(selectedArtikel.verkaufspreis) || 0
      }))
    }
  }

  const gesamtpreis = positionen.reduce((sum, pos) => sum + parseFloat(pos.gesamtpreis || 0), 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              🔧 Reparatur bearbeiten: {reparatur.auftragsnummer}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* 3-Column Layout */}
            <div className="grid grid-cols-3 gap-6">
              {/* Column 1: Fahrrad */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">🚲 Fahrrad-Daten</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Marke *</label>
                  <input
                    type="text"
                    name="fahrradmarke"
                    value={formData.fahrradmarke}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Modell</label>
                  <input
                    type="text"
                    name="fahrradmodell"
                    value={formData.fahrradmodell}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rahmennummer</label>
                  <input
                    type="text"
                    name="rahmennummer"
                    value={formData.rahmennummer}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Schlüsselnummer</label>
                  <input
                    type="text"
                    name="schluesselnummer"
                    value={formData.schluesselnummer}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="fahrrad_anwesend"
                      checked={formData.fahrrad_anwesend}
                      onChange={handleChange}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <span className="text-sm font-medium">Fahrrad anwesend</span>
                  </label>
                </div>
              </div>

              {/* Column 2: Kunde */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">👤 Kunden-Daten</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="kunde_name"
                    value={formData.kunde_name}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    name="kunde_telefon"
                    value={formData.kunde_telefon}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-Mail</label>
                  <input
                    type="email"
                    name="kunde_email"
                    value={formData.kunde_email}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Column 3: Reparatur */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm border-b pb-2">🔧 Reparatur-Details</h3>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="angenommen">Angenommen</option>
                    <option value="in_arbeit">In Arbeit</option>
                    <option value="fertig">Fertig</option>
                    <option value="abgeholt">Abgeholt</option>
                    <option value="storniert">Storniert</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fertig bis</label>
                  <input
                    type="date"
                    name="fertig_bis"
                    value={formData.fertig_bis}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fertig am</label>
                  <input
                    type="date"
                    name="fertig_am"
                    value={formData.fertig_am}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Abholtermin</label>
                  <input
                    type="text"
                    name="abholtermin"
                    value={formData.abholtermin}
                    onChange={handleChange}
                    placeholder="z.B. Montag 14 Uhr"
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Abgeholt am</label>
                  <input
                    type="date"
                    name="abgeholt_am"
                    value={formData.abgeholt_am}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Full Width Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mängelbeschreibung *</label>
                <textarea
                  name="maengelbeschreibung"
                  value={formData.maengelbeschreibung}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notizen (intern)</label>
                <textarea
                  name="notizen"
                  value={formData.notizen}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Money Section */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">💰 Kosten & Bezahlung</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kostenvoranschlag (€)</label>
                    <input
                      type="number"
                      name="kostenvoranschlag"
                      value={formData.kostenvoranschlag}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Endbetrag (€)</label>
                    <input
                      type="number"
                      name="endbetrag"
                      value={formData.endbetrag}
                      onChange={handleChange}
                      step="0.01"
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                    />
                    {positionen.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Summe Positionen: {gesamtpreis.toFixed(2)} €
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="bezahlt"
                        checked={formData.bezahlt}
                        onChange={handleChange}
                        className="w-4 h-4 text-pink-600 rounded"
                      />
                      <span className="text-sm font-medium">Bezahlt</span>
                    </label>
                  </div>
                  {formData.bezahlt && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bezahlt am</label>
                      <input
                        type="date"
                        name="bezahlt_am"
                        value={formData.bezahlt_am}
                        onChange={handleChange}
                        className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Positionen */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📝 Positionen (Teile & Arbeit)</h3>
              <button
                onClick={() => setShowAddPosition(!showAddPosition)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
              >
                + Position hinzufügen
              </button>
            </div>

            {/* Add Position Form */}
            {showAddPosition && (
              <div className="bg-white border rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  {/* Typ Auswahl */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ</label>
                    <select
                      value={newPosition.typ}
                      onChange={(e) => setNewPosition({...newPosition, typ: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="teil">Ersatzteil</option>
                      <option value="arbeit">Arbeitszeit</option>
                    </select>
                  </div>
                  {newPosition.typ === 'teil' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Artikel suchen {artikelLoading && '(lädt...)'}
                      </label>
                      
                      {/* Suchfeld */}
                      <input
                        type="text"
                        placeholder="Suche: Artikelnummer, Name oder Beschreibung..."
                        value={artikelSuche}
                        onChange={(e) => setArtikelSuche(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mb-2"
                        disabled={artikelLoading}
                      />
                      
                      {/* Artikel-Liste (gefiltert) */}
                      <div className="border rounded-lg max-h-48 overflow-y-auto bg-white">
                        {Array.isArray(artikel) && artikel.length > 0 ? (
                          (() => {
                            const suchbegriff = artikelSuche.toLowerCase().trim()
                            const gefiltert = artikel.filter(a => {
                              if (!suchbegriff) return true
                              return (
                                a.artikelnummer?.toLowerCase().includes(suchbegriff) ||
                                a.name?.toLowerCase().includes(suchbegriff) ||
                                a.bezeichnung?.toLowerCase().includes(suchbegriff) ||
                                a.beschreibung?.toLowerCase().includes(suchbegriff)
                              )
                            })
                            
                            if (gefiltert.length === 0) {
                              return (
                                <div className="p-4 text-center text-gray-500">
                                  Keine Artikel gefunden für "{artikelSuche}"
                                </div>
                              )
                            }
                            
                            return gefiltert.map(a => (
                              <div
                                key={a.id}
                                onClick={() => {
                                  setNewPosition(prev => ({
                                    ...prev,
                                    artikel_id: a.id,
                                    bezeichnung: a.name || a.bezeichnung || '',
                                    beschreibung: a.beschreibung || '',
                                    einzelpreis: parseFloat(a.verkaufspreis) || 0
                                  }))
                                  setArtikelSuche('')
                                }}
                                className={`p-3 border-b hover:bg-blue-50 cursor-pointer transition ${
                                  newPosition.artikel_id === a.id ? 'bg-blue-100' : ''
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {a.artikelnummer} - {a.name || a.bezeichnung}
                                    </div>
                                    {a.beschreibung && (
                                      <div className="text-sm text-gray-600">{a.beschreibung}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">
                                      Lager: {a.bestand_lager || 0} | Werkstatt: {a.bestand_werkstatt || 0}
                                    </div>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className="font-semibold text-green-600">
                                      {parseFloat(a.verkaufspreis || 0).toFixed(2)} €
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          })()
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            {artikelLoading ? 'Artikel werden geladen...' : 'Keine Artikel verfügbar'}
                          </div>
                        )}
                      </div>
                      
                      {/* Gewählter Artikel anzeigen */}
                      {newPosition.artikel_id && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          <strong>Gewählt:</strong> {newPosition.bezeichnung}
                          <button
                            onClick={() => setNewPosition(prev => ({
                              ...prev,
                              artikel_id: null,
                              bezeichnung: '',
                              beschreibung: '',
                              einzelpreis: 0
                            }))}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            ✕ Entfernen
                          </button>
                        </div>
                      )}
                      
                      {/* Oder manuell eingeben */}
                      {!newPosition.artikel_id && (
                        <div className="mt-2 text-sm text-gray-600">
                          💡 Tipp: Klicke auf einen Artikel oder gib die Daten manuell unten ein
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Restliche Felder in Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={newPosition.typ === 'arbeit' ? 'col-span-2' : ''}>
                      <label className="block text-sm font-medium mb-1">Bezeichnung</label>
                      <input
                        type="text"
                        value={newPosition.bezeichnung}
                        onChange={(e) => setNewPosition({...newPosition, bezeichnung: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder={newPosition.typ === 'arbeit' ? 'z.B. Bremsen einstellen' : 'Bezeichnung'}
                        disabled={!!newPosition.artikel_id}
                      />
                      {newPosition.artikel_id && (
                        <p className="text-xs text-gray-500 mt-1">✓ Wird vom Artikel übernommen</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Menge</label>
                      <input
                        type="number"
                        value={newPosition.menge}
                        onChange={(e) => setNewPosition({...newPosition, menge: e.target.value})}
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Einzelpreis (€)</label>
                      <input
                        type="number"
                        value={newPosition.einzelpreis}
                        onChange={(e) => setNewPosition({...newPosition, einzelpreis: e.target.value})}
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={!!newPosition.artikel_id}
                      />
                      {newPosition.artikel_id && (
                        <p className="text-xs text-gray-500 mt-1">✓ Wird vom Artikel übernommen</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Beschreibung</label>
                      <input
                        type="text"
                        value={newPosition.beschreibung}
                        onChange={(e) => setNewPosition({...newPosition, beschreibung: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Optional"
                        disabled={!!newPosition.artikel_id}
                      />
                      {newPosition.artikel_id && (
                        <p className="text-xs text-gray-500 mt-1">✓ Wird vom Artikel übernommen</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowAddPosition(false)
                        setArtikelSuche('')
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleAddPosition}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Positionen Liste */}
            {positionen.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Noch keine Positionen vorhanden</p>
            ) : (
              <div className="space-y-2">
                {positionen.map(pos => (
                  <div key={pos.id} className="bg-white border rounded-lg p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          pos.typ === 'teil' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {pos.typ === 'teil' ? '🔧 Teil' : '⏱️ Arbeit'}
                        </span>
                        <span className="font-medium">{pos.bezeichnung}</span>
                      </div>
                      {pos.beschreibung && (
                        <p className="text-sm text-gray-600 mt-1">{pos.beschreibung}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {pos.menge} × {parseFloat(pos.einzelpreis).toFixed(2)} € = {parseFloat(pos.gesamtpreis).toFixed(2)} €
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePosition(pos.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Löschen
                    </button>
                  </div>
                ))}
                <div className="bg-gray-100 rounded-lg p-3 font-semibold text-right">
                  Gesamt: {gesamtpreis.toFixed(2)} €
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {loading ? 'Speichere...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}