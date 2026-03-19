export interface Candidate {
  id: string;
  Nombre: string;
  Perfil: string;
  'Key Knowledge': string;
  Conocimiento: string;
  Localización: string;
  Candidatura: string;
  'Información del Contacto': string;
  'Fecha Solicitud': string;
  source: 'sheet' | 'driven-value';
  [key: string]: any;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  requirements: string;
}

export interface Application {
  id: string;
  candidateId: string;
  offerId: string;
  status: 'pending' | 'pass' | 'no-pass';
  aiRecommendation?: string;
  isFit?: boolean;
  score?: number;
}
