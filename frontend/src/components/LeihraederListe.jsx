import React, { useState, useEffect } from 'react'

export default function LeihraederListe({ showToast }) {
  const [leihraeder, setLeihraeder] = useState([])
  const [vermietungen, setVermietungen] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('alle')
  const [typFilter, setTypFilter] = useState('alle')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showVermietungModal, setShowVermietungModal] = useState(false)
  const [selectedLeihrad, setSelectedLeihrad] = useState(null)

  useEffect(() => {
    loadLeihraeder()
    loadVermietungen()
  }, [])

  const loadLeihraeder = async () => {
    try {
      const res = await fetch('/api/leihraeder')
      const data = await res.json()
      setLeihraeder(data.items || [])
    } catch (error) {
      showToast('Fehler beim Laden der Leihräder', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadVermietungen = async () => {
    try {
      const res = await fetch('/api/vermietungen?aktiv=true')
      const data = await res.json()
      setVermietungen(data.items || [])
    } catch (error) {
      console.error('Fehler beim Laden der Vermietungen:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Leihrad wirklich löschen?')) return
    try {
      const res = await fetch(`/api/leihraeder/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast('Leihrad gelöscht', 'success')
        loadLeihraeder()
      } else {
        const error = await res.json()
        showToast(error.detail || 'Fehler beim Löschen', 'error')
      }
    } catch (error) {
      showToast('Fehler beim Löschen', 'error')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`/api/leihraeder/${id}/status?status=${status}`, {
        method: 'PATCH'
      })
      if (res.ok) {
        showToast('Status geändert', 'success')
        loadLeihraeder()
      }
    } catch (error) {
      showToast('Fehler beim Ändern', 'error')
    }
  }

  const handleVermieten = (leihrad) => {
    setSelectedLeihrad(leihrad)
    setShowVermietungModal(true)
  }

  const filteredLeihraeder = leihraeder.filter(rad => {
    const matchesStatus = statusFilter === 'alle' || rad.status === statusFilter
    const matchesTyp = typFilter === 'alle' || rad.typ === typFilter
    const matchesSearch = searchTerm === '' ||
      rad.inventarnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rad.marke.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rad.modell && rad.modell.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesTyp && matchesSearch
  })

  const statusColors = {
    verfuegbar: 'bg-green-100 text-green-800',
    verliehen: 'bg-yellow-100 text-yellow-800',
    wartung: 'bg-orange-100 text-orange-800',
    defekt: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    verfuegbar: 'Verfügbar',
    verliehen: 'Verliehen',
    wartung: 'Wartung',
    defekt: 'Defekt'
  }

  if (loading) return <div className="p-8 text-center">Laden...</div>

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Leihräder</h1>
          <p className="text-gray-600 mt-1">{filteredLeihraeder.length} von {leihraeder.length} Rädern</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Neues Leihrad
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-4 items-center bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="Suche nach Inventarnr., Marke, Modell..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="alle">Alle Status</option>
          <option value="verfuegbar">Verfügbar</option>
          <option value="verliehen">Verliehen</option>
          <option value="wartung">Wartung</option>
          <option value="defekt">Defekt</option>
        </select>
        <select
          value={typFilter}
          onChange={(e) => setTypFilter(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="alle">Alle Typen</option>
          <option value="Citybike">Citybike</option>
          <option value="E-Bike">E-Bike</option>
          <option value="MTB">MTB</option>
          <option value="Trekking">Trekking</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Inventar-Nr.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Fahrrad</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Typ</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Größe</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Preis/Tag</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredLeihraeder.map(rad => (
              <tr key={rad.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{rad.inventarnummer}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{rad.marke}</div>
                  {rad.modell && <div className="text-sm text-gray-500">{rad.modell}</div>}
                </td>
                <td className="px-4 py-3 text-sm">{rad.typ || '-'}</td>
                <td className="px-4 py-3 text-sm">{rad.rahmenhoeho || '-'}</td>
                <td className="px-4 py-3 font-semibold">{parseFloat(rad.tagespreis).toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <select
                    value={rad.status}
                    onChange={(e) => handleStatusChange(rad.id, e.target.value)}
                    className={`px-2 py-1 rounded text-sm font-medium ${statusColors[rad.status]}`}
                  >
                    <option value="verfuegbar">Verfügbar</option>
                    <option value="verliehen">Verliehen</option>
                    <option value="wartung">Wartung</option>
                    <option value="defekt">Defekt</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {rad.status === 'verfuegbar' && (
                      <button
                        onClick={() => handleVermieten(rad)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Vermieten
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rad.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeihraeder.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Keine Leihräder gefunden
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <LeihradErstellenModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadLeihraeder()
            showToast('Leihrad erstellt', 'success')
          }}
          showToast={showToast}
        />
      )}

      {showVermietungModal && selectedLeihrad && (
        <VermietungErstellenModal
          leihrad={selectedLeihrad}
          onClose={() => {
            setShowVermietungModal(false)
            setSelectedLeihrad(null)
          }}
          onSuccess={() => {
            setShowVermietungModal(false)
            setSelectedLeihrad(null)
            loadLeihraeder()
            loadVermietungen()
            showToast('Vermietung erstellt', 'success')
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ========== LEIHRAD ERSTELLEN MODAL ==========
function LeihradErstellenModal({ onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    inventarnummer: '',
    marke: '',
    modell: '',
    rahmennummer: '',
    farbe: '',
    rahmenhoeho: '',
    typ: 'Citybike',
    tagespreis: '15.00',
    wochenpreis: '80.00',
    kaution: '50.00',
    status: 'verfuegbar',
    zustand: '',
    notizen: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/leihraeder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        showToast(error.detail || 'Fehler beim Erstellen', 'error')
      }
    } catch (error) {
      showToast('Fehler beim Erstellen', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Neues Leihrad</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Inventarnummer *</label>
              <input
                type="text"
                required
                value={formData.inventarnummer}
                onChange={(e) => setFormData({...formData, inventarnummer: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marke *</label>
              <input
                type="text"
                required
                value={formData.marke}
                onChange={(e) => setFormData({...formData, marke: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modell</label>
              <input
                type="text"
                value={formData.modell}
                onChange={(e) => setFormData({...formData, modell: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Typ</label>
              <select
                value={formData.typ}
                onChange={(e) => setFormData({...formData, typ: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="Citybike">Citybike</option>
                <option value="E-Bike">E-Bike</option>
                <option value="MTB">MTB</option>
                <option value="Trekking">Trekking</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rahmenhöhe</label>
              <input
                type="text"
                placeholder="z.B. M, L, 54cm"
                value={formData.rahmenhoeho}
                onChange={(e) => setFormData({...formData, rahmenhoeho: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Farbe</label>
              <input
                type="text"
                value={formData.farbe}
                onChange={(e) => setFormData({...formData, farbe: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tagespreis (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tagespreis}
                onChange={(e) => setFormData({...formData, tagespreis: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kaution (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.kaution}
                onChange={(e) => setFormData({...formData, kaution: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ========== VERMIETUNG ERSTELLEN MODAL ==========
function VermietungErstellenModal({ leihrad, onClose, onSuccess, showToast }) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  
  const [formData, setFormData] = useState({
    leihrad_id: leihrad.id,
    kunde_name: '',
    kunde_telefon: '',
    kunde_email: '',
    ausweis_typ: 'Personalausweis',
    ausweis_nummer: '',
    von_datum: today,
    bis_datum: tomorrow,
    tagespreis: leihrad.tagespreis,
    anzahl_tage: 1,
    gesamtpreis: leihrad.tagespreis,
    kaution: leihrad.kaution,
    zustand_bei_ausgabe: 'Gut',
    notizen: ''
  })

  useEffect(() => {
    const von = new Date(formData.von_datum)
    const bis = new Date(formData.bis_datum)
    const tage = Math.max(1, Math.ceil((bis - von) / 86400000) + 1)
    const gesamt = (parseFloat(formData.tagespreis) * tage).toFixed(2)
    setFormData(prev => ({...prev, anzahl_tage: tage, gesamtpreis: gesamt}))
  }, [formData.von_datum, formData.bis_datum, formData.tagespreis])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/vermietungen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        showToast(error.detail || 'Fehler beim Erstellen', 'error')
      }
    } catch (error) {
      showToast('Fehler beim Erstellen', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Vermietung erstellen</h2>
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="font-semibold">{leihrad.marke} {leihrad.modell}</div>
          <div className="text-sm text-gray-600">Inventar-Nr.: {leihrad.inventarnummer}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Kundenname *</label>
              <input
                type="text"
                required
                value={formData.kunde_name}
                onChange={(e) => setFormData({...formData, kunde_name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input
                type="tel"
                value={formData.kunde_telefon}
                onChange={(e) => setFormData({...formData, kunde_telefon: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-Mail</label>
              <input
                type="email"
                value={formData.kunde_email}
                onChange={(e) => setFormData({...formData, kunde_email: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ausweistyp</label>
              <select
                value={formData.ausweis_typ}
                onChange={(e) => setFormData({...formData, ausweis_typ: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              >
                <option>Personalausweis</option>
                <option>Reisepass</option>
                <option>Führerschein</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ausweisnummer</label>
              <input
                type="text"
                value={formData.ausweis_nummer}
                onChange={(e) => setFormData({...formData, ausweis_nummer: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Von *</label>
              <input
                type="date"
                required
                value={formData.von_datum}
                onChange={(e) => setFormData({...formData, von_datum: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bis *</label>
              <input
                type="date"
                required
                value={formData.bis_datum}
                onChange={(e) => setFormData({...formData, bis_datum: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Anzahl Tage</label>
              <input
                type="number"
                disabled
                value={formData.anzahl_tage}
                className="w-full px-3 py-2 border rounded bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gesamtpreis (€)</label>
              <input
                type="text"
                disabled
                value={formData.gesamtpreis}
                className="w-full px-3 py-2 border rounded bg-gray-50 font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kaution (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.kaution}
                onChange={(e) => setFormData({...formData, kaution: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zustand</label>
              <input
                type="text"
                value={formData.zustand_bei_ausgabe}
                onChange={(e) => setFormData({...formData, zustand_bei_ausgabe: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Vermietung starten
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}