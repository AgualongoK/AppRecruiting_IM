import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Candidate, Offer, Application } from './types';
import Papa from 'papaparse';

interface AppContextType {
  sheetCandidates: Candidate[];
  drivenValueCandidates: Candidate[];
  localEdits: Record<string, Partial<Candidate>>;
  customFields: string[];
  offers: Offer[];
  applications: Application[];
  allCandidates: Candidate[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date;
  isRefreshing: boolean;
  fetchData: (showLoader?: boolean) => Promise<void>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  addCustomField: (field: string) => void;
  addDrivenValueCandidates: (candidates: Candidate[]) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  deleteOffer: (id: string) => void;
  addApplication: (app: Application) => void;
  updateApplicationStatus: (candidateId: string, offerId: string, status: Application['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sheetCandidates, setSheetCandidates] = useState<Candidate[]>([]);
  const [drivenValueCandidates, setDrivenValueCandidates] = useState<Candidate[]>([]);
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<Candidate>>>({});
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedEdits = localStorage.getItem('localEdits');
    if (savedEdits) setLocalEdits(JSON.parse(savedEdits));
    
    const savedDriven = localStorage.getItem('drivenValueCandidates');
    if (savedDriven) setDrivenValueCandidates(JSON.parse(savedDriven));
    
    const savedFields = localStorage.getItem('customFields');
    if (savedFields) setCustomFields(JSON.parse(savedFields));
    
    const savedOffers = localStorage.getItem('offers');
    if (savedOffers) setOffers(JSON.parse(savedOffers));
    
    const savedApps = localStorage.getItem('applications');
    if (savedApps) setApplications(JSON.parse(savedApps));
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem('localEdits', JSON.stringify(localEdits));
    localStorage.setItem('drivenValueCandidates', JSON.stringify(drivenValueCandidates));
    localStorage.setItem('customFields', JSON.stringify(customFields));
    localStorage.setItem('offers', JSON.stringify(offers));
    localStorage.setItem('applications', JSON.stringify(applications));
  }, [localEdits, drivenValueCandidates, customFields, offers, applications]);

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
      
      if (csvText.trim().toLowerCase().startsWith('<!doctype html>')) {
        throw new Error('El documento no es público. Por favor, asegúrate de que el Google Sheet tiene los permisos "Cualquier persona con el enlace puede leer".');
      }
      
      Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data.map((row: any, index: number) => {
            // Generate a stable ID based on name and date, or fallback to index
            const id = `sheet-${row.Nombre?.replace(/\s+/g, '-')}-${row['Fecha Solicitud']}-${index}`;
            return {
              ...row,
              id,
              source: 'sheet' as const
            };
          });
          setSheetCandidates(parsed);
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
    const interval = setInterval(() => {
      fetchData();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const allCandidates = useMemo(() => {
    const combined = [...sheetCandidates, ...drivenValueCandidates];
    return combined.map(c => ({
      ...c,
      ...(localEdits[c.id] || {})
    }));
  }, [sheetCandidates, drivenValueCandidates, localEdits]);

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setLocalEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates }
    }));
  };

  const addCustomField = (field: string) => {
    if (!customFields.includes(field)) {
      setCustomFields(prev => [...prev, field]);
    }
  };

  const addDrivenValueCandidates = (candidates: Candidate[]) => {
    setDrivenValueCandidates(prev => [...prev, ...candidates]);
  };

  const addOffer = (offer: Offer) => {
    setOffers(prev => [...prev, offer]);
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id));
    setApplications(prev => prev.filter(a => a.offerId !== id));
  };

  const addApplication = (app: Application) => {
    setApplications(prev => {
      const exists = prev.find(a => a.candidateId === app.candidateId && a.offerId === app.offerId);
      if (exists) {
        return prev.map(a => a.candidateId === app.candidateId && a.offerId === app.offerId ? app : a);
      }
      return [...prev, app];
    });
  };

  const updateApplicationStatus = (candidateId: string, offerId: string, status: Application['status']) => {
    setApplications(prev => prev.map(a => 
      a.candidateId === candidateId && a.offerId === offerId ? { ...a, status } : a
    ));
  };

  return (
    <AppContext.Provider value={{
      sheetCandidates,
      drivenValueCandidates,
      localEdits,
      customFields,
      offers,
      applications,
      allCandidates,
      loading,
      error,
      lastUpdated,
      isRefreshing,
      fetchData,
      updateCandidate,
      addCustomField,
      addDrivenValueCandidates,
      addOffer,
      updateOffer,
      deleteOffer,
      addApplication,
      updateApplicationStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
