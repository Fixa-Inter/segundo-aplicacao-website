import type {
  CalendarEvent,
  DashboardRecord,
  ManagerProfile,
  Technician,
} from '../types/management'

export const initialTechnicians: Technician[] = [
  {
    id: 't-1',
    name: 'Ana Costa',
    email: 'ana@fixa.test',
    phone: '(11) 99999-0001',
    specialty: 'Elétrica',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-2',
    name: 'Bruno Lima',
    email: 'bruno@fixa.test',
    phone: '(11) 99999-0002',
    specialty: 'Hidráulica',
    shift: '10:00 - 18:00',
    status: 'Ativo',
  },
  {
    id: 't-3',
    name: 'Carla Mendes',
    email: 'carla@fixa.test',
    phone: '(11) 99999-0003',
    specialty: 'Climatização',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-4',
    name: 'Diego Rocha',
    email: 'diego@fixa.test',
    phone: '(11) 99999-0004',
    specialty: 'Predial',
    shift: '10:00 - 18:00',
    status: 'Inativo',
  },
  {
    id: 't-5',
    name: 'Elisa Alves',
    email: 'elisa@fixa.test',
    phone: '(11) 99999-0005',
    specialty: 'Elétrica',
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-6',
    name: 'Fábio Santos',
    email: 'fabio@fixa.test',
    phone: '(11) 99999-0006',
    specialty: 'Hidráulica',
    shift: '10:00 - 18:00',
    status: 'Ativo',
  },
]

export const initialEvents: CalendarEvent[] = [
  {
    id: 'e-1',
    title: 'Reunião de equipe',
    date: '2026-03-11',
    time: '09:00',
    description: 'Alinhamento das solicitações abertas.',
    technicianId: 't-1',
  },
  {
    id: 'e-2',
    title: 'Inspeção elétrica',
    date: '2026-03-12',
    time: '14:00',
    description: 'Verificação preventiva.',
    technicianId: 't-5',
  },
  {
    id: 'e-3',
    title: 'Manutenção hidráulica',
    date: '2026-03-18',
    time: '10:30',
    description: 'Revisão do sistema hidráulico.',
    technicianId: 't-2',
  },
]

export const initialProfile: ManagerProfile = {
  name: 'Raphaely Sales',
  email: 'demo@fixa.test',
  company: 'FIXA',
  phone: '(11) 99999-0100',
  birthDate: '2000-03-11',
  postalCode: '01310-100',
  address: 'Avenida Exemplo',
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  number: '100',
  complement: '',
}

export const dashboardRecords: DashboardRecord[] = [
  { month: 'Jan', opened: 28, completed: 18, hours: [2, 3, 4, 3, 5, 7, 2, 4] },
  { month: 'Fev', opened: 34, completed: 27, hours: [1, 2, 4, 5, 6, 4, 3, 8] },
  { month: 'Mar', opened: 45, completed: 40, hours: [2, 2, 3, 4, 4, 6, 7, 9] },
  { month: 'Abr', opened: 32, completed: 26, hours: [1, 3, 3, 5, 5, 7, 4, 6] },
  { month: 'Mai', opened: 20, completed: 12, hours: [2, 2, 4, 4, 5, 5, 8, 10] },
  { month: 'Jun', opened: 30, completed: 24, hours: [1, 3, 4, 4, 6, 6, 7, 9] },
  { month: 'Jul', opened: 24, completed: 18, hours: [2, 3, 3, 4, 5, 7, 7, 8] },
]
