import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Cadastro() {
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setMensagem("Conta criada com sucesso! 🚀");
  };

  return (
    <main className="container">
      <section className="left">
        <h1>
          Organize sua vida de <span>estudante</span>
        </h1>
        <p>
          Planeje provas, organize horários de estudo, cuide do seu bem-estar e
          conquiste seus objetivos acadêmicos com a <strong>AgendaUpday</strong>.
        </p>
      </section>

      <section className="right">
        <h2>Criar Conta</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="nome">Nome</label>
          <input type="text" id="nome" required />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" required />

          <label htmlFor="senha">Senha</label>
          <input type="password" id="senha" required />

          <button type="submit">Criar Conta</button>
          <p className="login-text">
            Já tem conta? <Link to="/">Entre</Link>
          </p>
        </form>
        <p>{mensagem}</p>
      </section>
    </main>
  );
}
