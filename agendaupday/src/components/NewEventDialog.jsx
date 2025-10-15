import React, { useState } from 'react';


export default function NewEventDialog({ open, onOpenChange, onSave }) {
  // Estado local para os campos do formulário
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('study');

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !date) {
      alert("Por favor, preencha o título e a data.");
      return;
    }
    // Envia os dados para a função onSave do componente pai (Home.jsx)
    onSave({ title, date, category });
    
    // Limpa o formulário
    setTitle('');
    setDate('');
    setCategory('study');
  };

  return (
    // Fundo escuro (overlay)
    <div 
      onClick={() => onOpenChange(false)}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    >
      {/* Container do Dialog (para evitar fechar ao clicar dentro) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-800"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Criar Novo Evento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">Título</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-zinc-300 mb-1">Data e Hora</label>
            <input
              id="date"
              type="datetime-local" // Facilita a escolha de data e hora
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1">Categoria</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2 text-white"
            >
              <option value="study">Estudo</option>
              <option value="work">Trabalho</option>
              <option value="personal">Pessoal</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
           <button type="button" onClick={() => onOpenChange(false)} className="bg-transparent hover:bg-zinc-800 text-zinc-300 font-semibold py-2 px-4 rounded-md">
  Cancelar
</button>
<button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md">
  Salvar Evento
</button>
          </div>
        </form>
      </div>
    </div>
  );
}
