import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, BookOpen, LogOut } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

import StatCard from '../components/StatCard';
import EventSection from '../components/EventSection';
import UpcomingEvents from '../components/UpcomingEvents';
import NewEventDialog from '../components/NewEventDialog';
//alguns eventos
const MOCK_EVENTS = [
  { id: 1, title: 'Prova de matematica', date: '2025-10-15T10:00:00', completed: false, category: 'study' },
  { id: 2, title: 'Estudo em grupo de React', date: '2025-10-15T15:00:00', completed: true, category: 'study' },
  { id: 3, title: 'Entregar trabalho de História', date: '2025-10-16T23:59:00', completed: false, category: 'work' },
  { id: 4, title: 'Planejamento de Estudo da semana', date: '2025-10-17T09:00:00', completed: false, category: 'study' },
  { id: 5, title: 'Ir à academia', date: '2025-10-18T18:00:00', completed: false, category: 'personal' },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [showNewEvent, setShowNewEvent] = useState(false);

  useEffect(() => {
    const mockUser = { full_name: "Rachel" };
    setUser(mockUser);
    setEvents(MOCK_EVENTS);
  }, []);

  const handleCreateEvent = (eventData) => {
    const newEvent = { id: Date.now(), ...eventData, completed: false };
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    setShowNewEvent(false);
  };

  const handleCompleteEvent = (eventToComplete) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === eventToComplete.id ? { ...event, completed: true } : event
      )
    );
  };

  const handleLogout = () => {
    console.log("Usuário deslogado!");
  };

  const completedToday = events.filter(event => 
    event.completed && isToday(parseISO(event.date))
  ).length;

  const studyPlans = events.filter(event => event.category === 'study').length;

  return (
    // fundo branco
    <div className="min-h-screen bg-white text-zinc-900">
      
      <header
        // borda
        className="border-b border-gray-200 backdrop-blur-xl bg-white/50 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-xl">
                {}
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
               
                <h1 className="text-zinc-900 text-2xl font-bold">AgendaUpday</h1>
            
                <p className="text-zinc-600 text-sm">
                  Olá, {user?.full_name?.split(' ')[0] || 'Estudante'}!
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              // tema claro
              className="bg-transparent hover:bg-blue-500 text-zinc-600 hover:text-zinc-900 font-semibold py-2 px-4 rounded-md inline-flex items-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Eventos Totais" value={events.length} icon={Calendar} gradient="bg-gradient-to-br from-blue-600 to-blue-700" delay={0} />
          <StatCard title="Concluídos Hoje" value={completedToday} icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-600 to-emerald-700" delay={0.1} />
          <StatCard title="Planos de Estudo" value={studyPlans} icon={BookOpen} gradient="bg-gradient-to-br from-purple-600 to-purple-700" delay={0.2} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EventSection
              events={events}
              onEventClick={() => setShowNewEvent(true)}
              onComplete={handleCompleteEvent}
            />
          </div>
          <div>
            <UpcomingEvents events={events} />
          </div>
        </div>
      </main>
      
      <NewEventDialog
        open={showNewEvent}
        onOpenChange={setShowNewEvent}
        onSave={handleCreateEvent}
      />
    </div>
  );
}
  
