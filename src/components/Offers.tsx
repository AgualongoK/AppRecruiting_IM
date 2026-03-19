import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Offer, Candidate } from '../types';
import { Plus, Briefcase, Users, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { evaluateCandidateForOffer } from '../ai';

export const Offers: React.FC = () => {
  const { offers, addOffer, updateOffer, deleteOffer, allCandidates, applications, addApplication, updateApplicationStatus } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [newOffer, setNewOffer] = useState<Partial<Offer>>({});
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleAddOffer = () => {
    if (newOffer.title && newOffer.description) {
      addOffer({
        title: newOffer.title,
        description: newOffer.description,
        requirements: newOffer.requirements || '',
        status: 'open',
      });
      setIsAdding(false);
      setNewOffer({});
    }
  };

  const handleEvaluateCandidate = async (candidateId: string, offerId: string) => {
    setIsEvaluating(true);
    const candidate = allCandidates.find(c => c.id === candidateId);
    const offer = offers.find(o => o.id === offerId);

    if (candidate && offer) {
      try {
        const evaluation = await evaluateCandidateForOffer(candidate, offer);
        addApplication({
          candidateId,
          offerId,
          status: 'pending',
          aiRecommendation: evaluation.recommendation,
          isFit: evaluation.isFit
        });
      } catch (error) {
        console.error("Error evaluating candidate:", error);
        alert("Hubo un error al evaluar al candidato con IA.");
      }
    }
    setIsEvaluating(false);
  };

  const getApplicationsForOffer = (offerId: string) => {
    return applications.filter(app => app.offerId === offerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Ofertas</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nueva Oferta
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Crear Nueva Oferta</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Oferta</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newOffer.title || ''}
                onChange={e => setNewOffer({ ...newOffer, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2"
                rows={3}
                value={newOffer.description || ''}
                onChange={e => setNewOffer({ ...newOffer, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos (separados por comas)</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-2"
                value={newOffer.requirements || ''}
                onChange={e => setNewOffer({ ...newOffer, requirements: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOffer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar Oferta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Ofertas */}
        <div className="md:col-span-1 space-y-4">
          {offers.map(offer => (
            <div
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedOffer?.id === offer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${offer.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {offer.status === 'open' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{offer.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{getApplicationsForOffer(offer.id).length} Candidatos</span>
              </div>
            </div>
          ))}
          {offers.length === 0 && !isAdding && (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
              No hay ofertas creadas.
            </div>
          )}
        </div>

        {/* Detalle de Oferta y Candidatos */}
        <div className="md:col-span-2">
          {selectedOffer ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedOffer.title}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateOffer(selectedOffer.id, { status: selectedOffer.status === 'open' ? 'closed' : 'open' })}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {selectedOffer.status === 'open' ? 'Cerrar Oferta' : 'Reabrir Oferta'}
                    </button>
                    <button 
                      onClick={() => { deleteOffer(selectedOffer.id); setSelectedOffer(null); }}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{selectedOffer.description}</p>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Requisitos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOffer.requirements.split(',').map((req, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" /> Candidatos Vinculados
                </h3>
                
                <div className="space-y-4">
                  {getApplicationsForOffer(selectedOffer.id).map(app => {
                    const candidate = allCandidates.find(c => c.id === app.candidateId);
                    if (!candidate) return null;

                    return (
                      <div key={app.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{candidate.Nombre}</h4>
                            <p className="text-sm text-gray-500">{candidate.Perfil}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.status === 'pending' && <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full"><Clock className="h-3 w-3"/> Pendiente</span>}
                            {app.status === 'pass' && <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full"><CheckCircle className="h-3 w-3"/> Apto</span>}
                            {app.status === 'no-pass' && <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full"><XCircle className="h-3 w-3"/> No Apto</span>}
                          </div>
                        </div>
                        
                        {app.aiRecommendation && (
                          <div className={`mt-3 p-3 rounded-md text-sm ${app.isFit ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-orange-50 text-orange-800 border border-orange-100'}`}>
                            <div className="flex items-center gap-1 font-semibold mb-1">
                              <Sparkles className="h-4 w-4" />
                              Recomendación IA: {app.isFit ? 'Buen Encaje' : 'No Recomendado'}
                            </div>
                            <p>{app.aiRecommendation}</p>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'pass')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${app.status === 'pass' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
                          >
                            Marcar Apto
                          </button>
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'no-pass')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${app.status === 'no-pass' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'}`}
                          >
                            Marcar No Apto
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {getApplicationsForOffer(selectedOffer.id).length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No hay candidatos vinculados a esta oferta aún.</p>
                  )}
                </div>

                {/* Vincular nuevo candidato */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Vincular Candidato</h4>
                  <div className="flex gap-2">
                    <select 
                      id="candidate-select"
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                      defaultValue=""
                    >
                      <option value="" disabled>Selecciona un candidato...</option>
                      {allCandidates
                        .filter(c => !getApplicationsForOffer(selectedOffer.id).some(app => app.candidateId === c.id))
                        .map(c => (
                        <option key={c.id} value={c.id}>{c.Nombre} - {c.Perfil}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('candidate-select') as HTMLSelectElement;
                        if (select.value) {
                          handleEvaluateCandidate(select.value, selectedOffer.id);
                          select.value = "";
                        }
                      }}
                      disabled={isEvaluating}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isEvaluating ? 'Evaluando con IA...' : 'Vincular y Evaluar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 h-full min-h-[400px] flex items-center justify-center text-gray-500">
              Selecciona una oferta para ver sus detalles y candidatos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
