document.getElementById("cadastroForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const mensagem = document.getElementById("mensagem");

  if (nome && email && senha) {
    mensagem.textContent = "✅ Conta criada com sucesso!";
    mensagem.style.color = "lightgreen";
    this.reset();
  } else {
    mensagem.textContent = "⚠️ Preencha todos os campos!";
    mensagem.style.color = "tomato";
  }
});
