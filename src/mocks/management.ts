import type {
  Address,
  CalendarEvent,
  DashboardRecord,
  ManagerProfile,
  Technician,
} from '../types/management'

const demoAddress: Address = {
  postalCode: '01310-100',
  address: 'Avenida Exemplo',
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  number: '100',
  complement: '',
}

export const initialTechnicians: Technician[] = [
  {
    id: 't-1',
    ...demoAddress,
    birthDate: '1995-04-18',
    accessType: 'TÉCNICO',
    name: 'Ana Costa',
    email: 'ana@fixa.test',
    phone: '(11) 99999-0001',
    specialty: 'Elétrica',
    assessedSpecialty: null,
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-2',
    ...demoAddress,
    birthDate: '1993-08-22',
    accessType: 'TÉCNICO',
    name: 'Bruno Lima',
    email: 'bruno@fixa.test',
    phone: '(11) 99999-0002',
    specialty: 'Hidráulica',
    assessedSpecialty: null,
    shift: '10:00 - 18:00',
    status: 'Ativo',
  },
  {
    id: 't-3',
    ...demoAddress,
    birthDate: '1998-02-10',
    accessType: 'TÉCNICO',
    name: 'Carla Mendes',
    email: 'carla@fixa.test',
    phone: '(11) 99999-0003',
    specialty: 'Climatização',
    assessedSpecialty: null,
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-4',
    ...demoAddress,
    birthDate: '1991-06-06',
    accessType: 'TÉCNICO',
    name: 'Diego Rocha',
    email: 'diego@fixa.test',
    phone: '(11) 99999-0004',
    specialty: 'Predial',
    assessedSpecialty: null,
    shift: '10:00 - 18:00',
    status: 'Inativo',
  },
  {
    id: 't-5',
    ...demoAddress,
    birthDate: '1996-10-02',
    accessType: 'TÉCNICO',
    name: 'Elisa Alves',
    email: 'elisa@fixa.test',
    phone: '(11) 99999-0005',
    specialty: 'Elétrica',
    assessedSpecialty: null,
    shift: '08:00 - 16:00',
    status: 'Ativo',
  },
  {
    id: 't-6',
    ...demoAddress,
    birthDate: '1994-12-15',
    accessType: 'TÉCNICO',
    name: 'Fábio Santos',
    email: 'fabio@fixa.test',
    phone: '(11) 99999-0006',
    specialty: 'Hidráulica',
    assessedSpecialty: null,
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
    endTime: '10:00',
    location: 'Sala de reuniões',
    description: 'Alinhamento das solicitações abertas.',
    observation: '',
    technicianId: 't-1',
  },
  {
    id: 'e-2',
    title: 'Inspeção elétrica',
    date: '2026-03-12',
    time: '14:00',
    endTime: '15:00',
    location: 'Bloco A',
    description: 'Verificação preventiva.',
    observation: '',
    technicianId: 't-5',
  },
  {
    id: 'e-3',
    title: 'Manutenção hidráulica',
    date: '2026-03-18',
    time: '10:30',
    endTime: '11:30',
    location: 'Bloco B',
    description: 'Revisão do sistema hidráulico.',
    observation: '',
    technicianId: 't-2',
  },
]

export const initialProfile: ManagerProfile = {
  ...demoAddress,
  name: 'Raphaely Sales',
  email: 'demo@fixa.test',
  company: 'FIXA',
  phone: '(11) 99999-0100',
  birthDate: '2000-03-11',
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

// Distribuição sintética equilibrada: as parcelas somam os totais de cada mês.
// Não representa produtividade real nem deriva dos eventos cadastrados.
export const dashboardByTechnician: Record<string, DashboardRecord[]> = Object.fromEntries(
  initialTechnicians.map((technician, index) => [
    technician.id,
    dashboardRecords.map((record) => ({
      month: record.month,
      opened:
        Math.floor(record.opened / initialTechnicians.length) +
        Number(index < record.opened % initialTechnicians.length),
      completed:
        Math.floor(record.completed / initialTechnicians.length) +
        Number(index < record.completed % initialTechnicians.length),
      hours: record.hours.filter((_, hourIndex) => hourIndex % initialTechnicians.length === index),
    })),
  ]),
)
