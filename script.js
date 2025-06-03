let produtos = {};
let mapaNotasCores = {};
let corIndex = 0;

const coresDisponiveis = [
  '#ffadad',
  '#ffd6a5',
  '#fdffb6',
  '#caffbf',
  '#9bf6ff',
  '#a0c4ff',
  '#bdb2ff',
  '#ffc6ff',
  '#fffffc',
  '#d0f4de',
  '#fef9c7',
  '#fcd5ce',
];

const form = document.getElementById('formProduto');
const listaProdutos = document.getElementById('listaProdutos');
const notasProdutos = document.getElementById('notasProdutos');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  adicionarProduto();
});

document.getElementById('limparDados').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar todos os dados?')) {
    localStorage.removeItem('produtosNotas');
    localStorage.removeItem('coresNotas');
    produtos = {};
    mapaNotasCores = {};
    corIndex = 0;
    atualizarInterface();
  }
});

function adicionarProduto() {
  const codigo = document.getElementById('codigo').value.trim();
  const notasInput = document.getElementById('notas').value.trim();

  if (!codigo || !notasInput) return;

  const notas = notasInput
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n !== '');

  if (!produtos[codigo]) {
    produtos[codigo] = [];
  }

  notas.forEach((nota) => {
    if (!produtos[codigo].includes(nota)) {
      produtos[codigo].push(nota);

      if (!mapaNotasCores[nota]) {
        mapaNotasCores[nota] =
          coresDisponiveis[corIndex % coresDisponiveis.length];
        corIndex++;
      }
    }
  });

  atualizarInterface();
  salvarDados();
  form.reset();
}

function atualizarInterface() {
  listaProdutos.innerHTML = '';
  for (const codigo in produtos) {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${codigo}</strong> `;
    produtos[codigo].forEach((nota) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = nota;
      span.style.backgroundColor = mapaNotasCores[nota] || '#ccc';
      div.appendChild(span);
    });
    listaProdutos.appendChild(div);
  }

  // Visão por nota (reverso)
  notasProdutos.innerHTML = '<h2>🔍 Notas e Produtos Relacionados</h2>';
  const notasMapeadas = {};

  for (const codigo in produtos) {
    produtos[codigo].forEach((nota) => {
      if (!notasMapeadas[nota]) {
        notasMapeadas[nota] = [];
      }
      if (!notasMapeadas[nota].includes(codigo)) {
        notasMapeadas[nota].push(codigo);
      }
    });
  }

  for (const nota in notasMapeadas) {
    const div = document.createElement('div');
    div.className = 'card-nota';

    const cor = mapaNotasCores[nota] || '#ddd';

    const titulo = document.createElement('strong');
    titulo.textContent = `Nota: ${nota}`;
    titulo.style.backgroundColor = cor;

    div.appendChild(titulo);

    const produtosDiv = document.createElement('div');
    produtosDiv.className = 'produtos-lista';

    notasMapeadas[nota].forEach((codigo) => {
      const tag = document.createElement('span');
      tag.className = 'produto-tag';
      tag.textContent = codigo;
      produtosDiv.appendChild(tag);
    });

    div.appendChild(produtosDiv);
    notasProdutos.appendChild(div);
  }
}

function salvarDados() {
  localStorage.setItem('produtosNotas', JSON.stringify(produtos));
  localStorage.setItem('coresNotas', JSON.stringify(mapaNotasCores));
}

function carregarDados() {
  const dadosProdutos = localStorage.getItem('produtosNotas');
  const dadosCores = localStorage.getItem('coresNotas');

  if (dadosProdutos) {
    produtos = JSON.parse(dadosProdutos);
  }

  if (dadosCores) {
    mapaNotasCores = JSON.parse(dadosCores);
    corIndex = Object.keys(mapaNotasCores).length;
  }
}

carregarDados();
atualizarInterface();
