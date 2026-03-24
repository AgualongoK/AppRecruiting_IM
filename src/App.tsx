/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Dashboard } from './components/Dashboard';
import { Candidatos } from './components/Candidatos';
import { DrivenValue } from './components/DrivenValue';
import { Offers } from './components/Offers';
import { LayoutDashboard, Users, FileUp, Briefcase, Sparkles, LogOut, RefreshCw } from 'lucide-react';

type Tab = 'dashboard' | 'candidatos' | 'driven-value' | 'ofertas';

function AppContent() {
  const { isRefreshing, fetchData, lastUpdated } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'candidatos':
        return <Candidatos />;
      case 'driven-value':
        return <DrivenValue />;
      case 'ofertas':
        return <Offers />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col md:min-h-screen sticky top-0 z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-3 tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-lg font-black leading-none">N</span>
            </div>
            NTT DATA
          </h1>
          <p className="text-[10px] text-slate-500 mt-1.5 font-bold tracking-widest uppercase ml-11">Recruiting Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <LayoutDashboard className={`h-5 w-5 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('candidatos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'candidatos' 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className={`h-5 w-5 ${activeTab === 'candidatos' ? 'text-blue-600' : 'text-slate-400'}`} />
            Candidatos
          </button>
          <button
            onClick={() => setActiveTab('driven-value')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'driven-value' 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <FileUp className={`h-5 w-5 ${activeTab === 'driven-value' ? 'text-blue-600' : 'text-slate-400'}`} />
            Team Driven Value
          </button>
          <button
            onClick={() => setActiveTab('ofertas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === 'ofertas' 
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            <Briefcase className={`h-5 w-5 ${activeTab === 'ofertas' ? 'text-blue-600' : 'text-slate-400'}`} />
            Ofertas
          </button>
        </nav>

        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500 mb-4 text-center font-medium">
            Última actualización:<br/>
            <span className="text-slate-700 font-semibold">{lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button 
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 font-medium text-sm"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar Datos</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

