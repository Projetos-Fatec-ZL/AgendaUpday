import React from 'react';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UpcomingEvents({ events }) {
  const upcoming = events.filter(event => 
    !event.completed && isAfter(parseISO(event.date), startOfToday())
  ).slice(0, 5); // Mostra apenas os próximos 5

  return (
    <div className="bg-zinc-900 rounded-xl p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Próximos Eventos</h2>
      <div className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhum evento futuro na agenda.</p>
        ) : (
          upcoming.map(event => (
            <div key={event.id} className="bg-zinc-800/50 p-3 rounded-lg flex justify-between items-center">
              <p className="text-white text-sm font-medium">{event.title}</p>
              <p className="text-zinc-400 text-xs">
                {format(parseISO(event.date), "dd/MM", { locale: ptBR })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}