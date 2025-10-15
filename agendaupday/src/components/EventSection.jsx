import React from 'react';
import { Plus, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventSection({ events, onEventClick, onComplete }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-6 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Todos os Eventos</h2>
        <button onClick={onEventClick} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md inline-flex items-center">
  <Plus className="w-4 h-4 mr-2" />
  Novo Evento
        </button>
      </div>
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-zinc-400 text-center py-8">Nenhum evento encontrado. Crie um novo!</p>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className={`flex items-center justify-between bg-zinc-800 p-4 rounded-lg transition-all ${event.completed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                {event.completed ? (
                  <div className="w-8 h-8 flex items-center justify-center bg-emerald-600 rounded-full">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <button 
                    onClick={() => onComplete(event)}
                    className="w-8 h-8 flex items-center justify-center border-2 border-zinc-600 hover:bg-zinc-700 rounded-full transition-colors"
                    aria-label="Marcar como completo"
                  />
                )}
                <div>
                  <p className={`font-medium ${event.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                    {event.title}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {format(parseISO(event.date), "dd 'de' MMMM, HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}