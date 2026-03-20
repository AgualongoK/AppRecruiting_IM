import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Upload, FileText, CheckCircle, Search, Sparkles, User, Briefcase, MapPin, Edit2, X, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Candidate } from '../types';
import { recommendCandidatesForNeeds } from '../ai';

export const DrivenValue: React.FC = () => {
  const { allCandidates, addDrivenValueCandidates, updateCandidate, deleteDrivenValueCandidate } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Search State
  const [needs, setNeeds] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<{ candidate: Candidate; reason: string; score: number }[]>([]);

  // Edit State
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const teamCandidates = allCandidates.filter(c => c.source === 'driven-value' || c.isDrivenValue);

  const standardKeys = ['id', 'source', 'drivenValueStatus', 'Nombre', 'Perfil', 'Localización', 'Key Knowledge', 'isDrivenValue', 'status', 'step', 'rating', 'comments', 'customFields'];
  const allKeys = new Set<string>();
  teamCandidates.forEach(c => {
    Object.keys(c).forEach(k => {
      if (!standardKeys.includes(k) && typeof (c as any)[k] !== 'object') {
        allKeys.add(k);
      }
    });
  });
  const dynamicColumns = Array.from(allKeys);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsed = json.map((row: any, index: number) => {
          const id = `driven-${Date.now()}-${index}`;
          
          // Helper to find a key ignoring case and spaces
          const findValue = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
              const foundKey = rowKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
              if (foundKey && row[foundKey]) return String(row[foundKey]);
            }
            return '';
          };

          return {
            ...row,
            Nombre: findValue(['Nombre', 'Name', 'Candidato', 'Full Name', 'Nombre completo']),
            Perfil: findValue(['Perfil', 'Profile', 'Role', 'Rol', 'Puesto', 'Title', 'Job Title']),
            Localización: findValue(['Localización', 'Localizacion', 'Location', 'Ciudad', 'City', 'Ubicación', 'Ubicacion']),
            'Key Knowledge': findValue(['Key Knowledge', 'Knowledge', 'Conocimientos', 'Skills', 'Habilidades', 'Stack', 'Tecnologías']),
            id,
            source: 'driven-value' as const,
            drivenValueStatus: 'Staffing' // Default status
          };
        });
        addDrivenValueCandidates(parsed);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (error: any) {
        alert('Error al procesar el archivo Excel: ' + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSearch = async () => {
    if (!needs.trim()) return;
    setIsSearching(true);
    try {
      // Search only within team candidates
      const results = await recommendCandidatesForNeeds(needs, teamCandidates);
      const mappedResults = results.map((r: any) => {
        const candidate = teamCandidates.find(c => c.id === r.candidateId);
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

  const handleSave = () => {
    if (editingCandidate) {
      updateCandidate(editingCandidate.id, editingCandidate);
      setEditingCandidate(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Search Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          Buscador de Necesidades (Team Driven Value)
        </h2>
        <p className="text-gray-600 mb-6">
          Describe las necesidades del cliente. La IA analizará los perfiles del equipo Driven Value y recomendará los que mejor se ajusten.
        </p>

        <div className="space-y-4">
          <textarea
            className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="Ej: Necesitamos un desarrollador frontend senior con experiencia en React y TypeScript..."
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

      {/* Team List Section */}
      <div 
        className={`bg-white rounded-xl shadow-sm border transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Miembros del Equipo ({teamCandidates.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Gestiona el talento y visualiza toda la información importada.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm text-sm"
            >
              <Upload className="h-4 w-4" />
              Importar Excel
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="bg-emerald-50 p-3 border-b border-emerald-100 flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            ¡Archivo procesado con éxito! Los candidatos han sido añadidos.
          </div>
        )}

        {teamCandidates.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay candidatos todavía</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Arrastra un archivo Excel aquí o usa el botón de importar para cargar tu equipo. Toda la información del archivo se mostrará en una tabla.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm"
            >
              Seleccionar Archivo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Candidato</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Localización</th>
                  <th className="px-6 py-4">Conocimientos</th>
                  {dynamicColumns.map(col => (
                    <th key={col} className="px-6 py-4">{col}</th>
                  ))}
                  <th className="px-6 py-4 text-right sticky right-0 bg-gray-50/80 backdrop-blur-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teamCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0 border border-indigo-100/50">
                          {candidate.Nombre ? candidate.Nombre.trim().split(/\s+/).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{candidate.Nombre || 'Sin Nombre'}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{candidate.Perfil || 'Sin Perfil'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        candidate.drivenValueStatus === 'Proyecto' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {candidate.drivenValueStatus || 'Staffing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {candidate.Localización ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {candidate.Localización}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={candidate['Key Knowledge']}>
                      {candidate['Key Knowledge'] || '-'}
                    </td>
                    {dynamicColumns.map(col => (
                      <td key={col} className="px-6 py-4 text-gray-600 max-w-xs truncate" title={String((candidate as any)[col] || '')}>
                        {(candidate as any)[col] ? String((candidate as any)[col]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right sticky right-0 bg-white group-hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingCandidate({ ...candidate })}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar Estado"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {candidate.source === 'driven-value' && (
                          <button 
                            onClick={() => {
                              if (confirm('¿Estás seguro de que quieres eliminar a este candidato del equipo?')) {
                                deleteDrivenValueCandidate(candidate.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar del equipo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Editar Estado en Equipo</h2>
              <button 
                onClick={() => setEditingCandidate(null)}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  value={editingCandidate.drivenValueStatus || 'Staffing'}
                  onChange={e => setEditingCandidate({...editingCandidate, drivenValueStatus: e.target.value as any})}
                >
                  <option value="Staffing">Staffing</option>
                  <option value="Proyecto">En Proyecto</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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
