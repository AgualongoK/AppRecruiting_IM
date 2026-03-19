import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MapPin, Briefcase, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { allCandidates } = useAppContext();

  const profileCount = allCandidates.reduce((acc, curr) => {
    acc[curr.Perfil] = (acc[curr.Perfil] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const profileData = Object.keys(profileCount).map(key => ({
    name: key || 'Unknown',
    count: profileCount[key]
  }));

  const locationCount = allCandidates.reduce((acc, curr) => {
    const loc = curr.Localización ? curr.Localización.split(',')[0] : 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.keys(locationCount).map(key => ({
    name: key,
    value: locationCount[key]
  }));

  const dateCount = allCandidates.reduce((acc, curr) => {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Candidatos</p>
            <h3 className="text-2xl font-bold text-gray-900">{allCandidates.length}</h3>
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
    </div>
  );
};
