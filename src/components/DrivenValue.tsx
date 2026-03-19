import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Candidate } from '../types';

export const DrivenValue: React.FC = () => {
  const { addDrivenValueCandidates } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any, index: number) => {
          const id = `driven-${Date.now()}-${index}`;
          return {
            ...row,
            id,
            source: 'driven-value' as const
          };
        });
        addDrivenValueCandidates(parsed);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      },
      error: (error: any) => {
        alert('Error al procesar el archivo: ' + error.message);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidatos Driven Value</h2>
        <p className="text-gray-500 mb-8">Sube un archivo CSV con nuevos candidatos para añadirlos a la base de datos local.</p>

        <div 
          className={`border-2 border-dashed rounded-xl p-12 transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploadSuccess ? (
            <div className="flex flex-col items-center text-emerald-600">
              <CheckCircle className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold">¡Archivo procesado con éxito!</h3>
              <p className="mt-2 text-gray-500">Los candidatos han sido añadidos a la base de datos.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Arrastra tu archivo CSV aquí</h3>
              <p className="text-gray-500 text-sm mb-6">o haz clic para seleccionar un archivo de tu ordenador</p>
              
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seleccionar Archivo
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
          <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Formato esperado del CSV
          </p>
          <p>El archivo debe contener al menos las siguientes columnas (los nombres deben coincidir exactamente):</p>
          <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
            <li>Nombre</li>
            <li>Perfil</li>
            <li>Key Knowledge</li>
            <li>Conocimiento</li>
            <li>Localización</li>
            <li>Candidatura</li>
            <li>Información del Contacto</li>
            <li>Fecha Solicitud</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
