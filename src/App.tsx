/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Users, MapPin, Briefcase, Calendar, Search, RefreshCw, Edit2, X, Check } from 'lucide-react';

interface Candidate {
  Nombre: string;
  Perfil: string;
  'Key Knowledge': string;
  Conocimiento: string;
  Localización: string;
  Candidatura: string;
  'Información del Contacto': string;
  'Fecha Solicitud': string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function App() {
  const [data, setData] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Edit state
  const [editingCandidate, setEditingCandidate] = useState<{index: number, data: Candidate} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/1O8NQ73nN_YTttpiCH_0u9dFQEucGzjZLOhbQ9yF5pmg/export?format=csv'
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const csvText = await response.text();
      
      Papa.parse<Candidate>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
          setLastUpdated(new Date());
          setLoading(false);
          if (showLoader) setIsRefreshing(false);
        },
        error: (error: any) => {
          setError(error.message);
          setLoading(false);
          if (showLoader) setIsRefreshing(false);
        }
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      if (showLoader) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle OAuth Success Message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        alert('Autenticación exitosa. Por favor, guarda los cambios de nuevo.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/url');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Por favor, permite las ventanas emergentes (popups) para conectar tu cuenta.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Error al iniciar la autenticación.');
    }
  };

  const handleSave = async () => {
    if (!editingCandidate) return;
    setIsSaving(true);
    
    // The row index in Google Sheets is index + 2 (1 for header, 1 for 0-based index)
    const rowIndex = editingCandidate.index + 2;
    const values = [
      editingCandidate.data.Nombre || '',
      editingCandidate.data.Perfil || '',
      editingCandidate.data['Key Knowledge'] || '',
      editingCandidate.data.Conocimiento || '',
      editingCandidate.data.Localización || '',
      editingCandidate.data.Candidatura || '',
      editingCandidate.data['Información del Contacto'] || '',
      editingCandidate.data['Fecha Solicitud'] || ''
    ];

    try {
      const response = await fetch(`/api/sheets/update/${rowIndex}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (response.status === 401) {
        // Not authenticated, trigger OAuth
        setIsSaving(false);
        handleConnect();
        return;
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al guardar');
      }

      // Success
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingCandidate(null);
        fetchData(true); // Refresh data
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  // Process data for charts
  const profileCount = data.reduce((acc, curr) => {
    acc[curr.Perfil] = (acc[curr.Perfil] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const profileData = Object.keys(profileCount).map(key => ({
    name: key || 'Unknown',
    count: profileCount[key]
  }));

  const locationCount = data.reduce((acc, curr) => {
    const loc = curr.Localización ? curr.Localización.split(',')[0] : 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.keys(locationCount).map(key => ({
    name: key,
    value: locationCount[key]
  }));

  const dateCount = data.reduce((acc, curr) => {
    const date = curr['Fecha Solicitud'] || 'Unknown';
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dateData = Object.keys(dateCount)
    .sort()
    .map(key => ({
      date: key,
      count: dateCount[key]
    }));

  const filteredData = data.filter(candidate => 
    Object.values(candidate).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Candidatos</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Resumen de solicitudes y perfiles
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">
                Actualizado: {lastUpdated.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
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
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Candidatos</p>
              <h3 className="text-2xl font-bold text-gray-900">{data.length}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Perfiles Únicos</p>
              <h3 className="text-2xl font-bold text-gray-900">{Object.keys(profileCount).length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Ubicaciones</p>
              <h3 className="text-2xl font-bold text-gray-900">{Object.keys(locationCount).length}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última Solicitud</p>
              <h3 className="text-lg font-bold text-gray-900">
                {dateData.length > 0 ? dateData[dateData.length - 1].date : '-'}
              </h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Candidatos por Perfil</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profileData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f3f4f6'}} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Evolución de Solicitudes</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dateData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Listado de Candidatos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Nombre</th>
                  <th className="p-4 font-medium">Perfil</th>
                  <th className="p-4 font-medium">Key Knowledge</th>
                  <th className="p-4 font-medium">Localización</th>
                  <th className="p-4 font-medium">Fecha Solicitud</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((candidate, index) => {
                    // Find the actual index in the original data array for updating the correct row
                    const originalIndex = data.findIndex(c => c === candidate);
                    
                    return (
                      <tr key={originalIndex} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-900 font-medium">{candidate.Nombre || '-'}</td>
                        <td className="p-4 text-gray-600">{candidate.Perfil || '-'}</td>
                        <td className="p-4 text-gray-600">
                          <div className="max-w-xs truncate" title={candidate['Key Knowledge']}>
                            {candidate['Key Knowledge'] || '-'}
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{candidate.Localización || '-'}</td>
                        <td className="p-4 text-gray-600 whitespace-nowrap">{candidate['Fecha Solicitud'] || '-'}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setEditingCandidate({ index: originalIndex, data: { ...candidate } })}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Candidato"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No se encontraron candidatos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                    value={editingCandidate.data.Nombre}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, Nombre: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data.Perfil}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, Perfil: e.target.value}
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Knowledge</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data['Key Knowledge']}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, 'Key Knowledge': e.target.value}
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conocimiento</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data.Conocimiento}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, Conocimiento: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localización</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data.Localización}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, Localización: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidatura</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data.Candidatura}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, Candidatura: e.target.value}
                    })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Información del Contacto</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data['Información del Contacto']}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, 'Información del Contacto': e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Solicitud</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingCandidate.data['Fecha Solicitud']}
                    onChange={e => setEditingCandidate({
                      ...editingCandidate, 
                      data: {...editingCandidate.data, 'Fecha Solicitud': e.target.value}
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button 
                onClick={() => setEditingCandidate(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving || saveSuccess}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <Check className="h-4 w-4" /> Guardado
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

