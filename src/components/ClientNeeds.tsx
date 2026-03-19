import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Search, Sparkles, User, Briefcase, MapPin } from 'lucide-react';
import { recommendCandidatesForNeeds } from '../ai';
import { Candidate } from '../types';

export const ClientNeeds: React.FC = () => {
  const { allCandidates } = useAppContext();
  const [needs, setNeeds] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<{ candidate: Candidate; reason: string; score: number }[]>([]);

  const handleSearch = async () => {
    if (!needs.trim()) return;
    setIsSearching(true);
    try {
      const results = await recommendCandidatesForNeeds(needs, allCandidates);
      const mappedResults = results.map((r: any) => {
        const candidate = allCandidates.find(c => c.id === r.candidateId);
        return {
          candidate: candidate as Candidate,
          reason: r.justification,
          score: r.score || 100
        };
      }).filter((r: any) => r.candidate !== undefined);
      setRecommendations(mappedResults);
    } catch (error) {
      console.error("Error al buscar recomendaciones:", error);
      alert("Hubo un error al procesar la solicitud con IA.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Buscador por Necesidades de Cliente
        </h2>
        <p className="text-gray-600 mb-6">
          Describe las necesidades del cliente en lenguaje natural. La IA analizará la base de datos de candidatos y recomendará los perfiles que mejor se ajusten.
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="Ej: Necesitamos un desarrollador frontend senior con experiencia en React y TypeScript, que viva en Madrid o Barcelona y tenga buen nivel de inglés..."
            value={needs}
            onChange={(e) => setNeeds(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isSearching || !needs.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Analizando perfiles...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Buscar Candidatos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Candidatos Recomendados ({recommendations.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{rec.candidate.Nombre}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Briefcase className="h-4 w-4" /> {rec.candidate.Perfil}
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold border border-indigo-100">
                    Match: {rec.score}%
                  </div>
                </div>
                
                <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {rec.candidate.Localización}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> Por qué encaja:
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isSearching && needs.trim() && recommendations.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
          No se encontraron recomendaciones. Intenta ajustar la descripción de las necesidades.
        </div>
      )}
    </div>
  );
};
