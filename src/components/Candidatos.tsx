import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Edit2, X, Plus, Download } from 'lucide-react';
import { Candidate } from '../types';
import Papa from 'papaparse';

export const Candidatos: React.FC = () => {
  const { allCandidates, updateCandidate, customFields, addCustomField, applications, offers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [newField, setNewField] = useState('');
  const [showNewFieldInput, setShowNewFieldInput] = useState(false);

  const filteredData = allCandidates.filter(candidate => 
    Object.values(candidate).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSave = () => {
    if (editingCandidate) {
      updateCandidate(editingCandidate.id, editingCandidate);
      setEditingCandidate(null);
    }
  };

  const handleAddField = () => {
    if (newField.trim()) {
      addCustomField(newField.trim());
      setNewField('');
      setShowNewFieldInput(false);
    }
  };

  const handleDownload = () => {
    const csv = Papa.unparse(allCandidates);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'candidatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar candidatos..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Perfil</th>
                <th className="p-4 font-medium">Key Knowledge</th>
                <th className="p-4 font-medium">Localización</th>
                <th className="p-4 font-medium">Origen</th>
                {customFields.map(field => (
                  <th key={field} className="p-4 font-medium">{field}</th>
                ))}
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.length > 0 ? (
                filteredData.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-900 font-medium">{candidate.Nombre || '-'}</td>
                    <td className="p-4 text-gray-600">{candidate.Perfil || '-'}</td>
                    <td className="p-4 text-gray-600">
                      <div className="max-w-xs truncate" title={candidate['Key Knowledge']}>
                        {candidate['Key Knowledge'] || '-'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{candidate.Localización || '-'}</td>
                    <td className="p-4 text-gray-600">
                      <span className={`px-2 py-1 text-xs rounded-full ${candidate.source === 'sheet' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {candidate.source === 'sheet' ? 'Sheet' : 'Driven Value'}
                      </span>
                    </td>
                    {customFields.map(field => (
                      <td key={field} className="p-4 text-gray-600">{candidate[field] || '-'}</td>
                    ))}
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setEditingCandidate({ ...candidate })}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Candidato"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6 + customFields.length} className="p-8 text-center text-gray-500">
                    No se encontraron candidatos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Editar Candidato</h2>
              <button 
                onClick={() => setEditingCandidate(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Nombre || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Perfil || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Perfil: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Knowledge</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate['Key Knowledge'] || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, 'Key Knowledge': e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conocimiento</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Conocimiento || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Conocimiento: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localización</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Localización || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Localización: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidatura</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.Candidatura || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, Candidatura: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Información del Contacto</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate['Información del Contacto'] || ''}
                    onChange={e => setEditingCandidate({...editingCandidate, 'Información del Contacto': e.target.value})}
                  />
                </div>
                
                {/* Custom Fields */}
                {customFields.map(field => (
                  <div key={field} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editingCandidate[field] || ''}
                      onChange={e => setEditingCandidate({...editingCandidate, [field]: e.target.value})}
                    />
                  </div>
                ))}
              </div>

              {/* Add Custom Field */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                {!showNewFieldInput ? (
                  <button 
                    onClick={() => setShowNewFieldInput(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" /> Añadir nuevo campo
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Nombre del campo..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={newField}
                      onChange={e => setNewField(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddField()}
                    />
                    <button 
                      onClick={handleAddField}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Añadir
                    </button>
                    <button 
                      onClick={() => setShowNewFieldInput(false)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Offers */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ofertas Vinculadas</h3>
                {applications.filter(a => a.candidateId === editingCandidate.id).length > 0 ? (
                  <div className="space-y-3">
                    {applications.filter(a => a.candidateId === editingCandidate.id).map(app => {
                      const offer = offers.find(o => o.id === app.offerId);
                      if (!offer) return null;
                      return (
                        <div key={app.candidateId + '-' + app.offerId} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-gray-900">{offer.title}</h4>
                            <p className="text-sm text-gray-500">{offer.status === 'open' ? 'Abierta' : 'Cerrada'}</p>
                          </div>
                          <div>
                            {app.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendiente</span>}
                            {app.status === 'pass' && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Apto</span>}
                            {app.status === 'no-pass' && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">No Apto</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Este candidato no está vinculado a ninguna oferta.</p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
