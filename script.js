const POINTS = [100,200,300,400,500,600,700,800];

let categories = ['Города','Страны','Животные'];
let questions = {};
let used = {};
let players = [];
let currentPlayer = 0;
let currentQuestion = null;

const board = document.getElementById('gameBoard');
const playersDiv = document.getElementById('players');
const questionScreen = document.getElementById('questionScreen');

async function loadPlayers() {
  const text = await fetch('players.txt').then(r => r.text());
  players = text.trim().split('\n').map(name => ({ name, score: 0 }));
}

async function loadQuestions() {
  for (const cat of categories) {
    const text = await fetch(`Вопросы/Категории/${cat}/Вопросы.txt`).then(r => r.text());
    questions[cat] = text.trim().split('\n');
    used[cat] = Array(8).fill(false);
  }
}

function renderBoard() {
  board.innerHTML = '';
  const table = document.createElement('table');

  categories.forEach(cat => {
    const tr = document.createElement('tr');

    const catTd = document.createElement('td');
    catTd.textContent = cat;
    catTd.className = 'category';
    tr.appendChild(catTd);

    POINTS.forEach((p, i) => {
      const td = document.createElement('td');
      if (used[cat][i]) {
        td.className = 'used';
      } else {
        td.textContent = p;
        td.onclick = () => openQuestion(cat, i);
      }
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  board.appendChild(table);
}

function renderPlayers() {
  playersDiv.innerHTML = '';
  players.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = `${p.name}: ${p.score}`;
    if (i === currentPlayer) div.classList.add('active');
    playersDiv.appendChild(div);
  });
}

function openQuestion(cat, index) {
  currentQuestion = { cat, index };
  questionScreen.classList.remove('hidden');
  board.classList.add('hidden');

  document.getElementById('questionText').textContent = questions[cat][index];
  document.getElementById('questionPoints').textContent = POINTS[index] + ' очков';
  document.getElementById('answer').innerHTML = '';
}

async function showAnswer() {
  const { cat, index } = currentQuestion;
  const text = await fetch(`Вопросы/Категории/${cat}/Ответ${index+1}.txt`).then(r => r.text());
  document.getElementById('answer').textContent = text;
}

function finish(correct) {
  const { cat, index } = currentQuestion;
  const pts = POINTS[index];
  players[currentPlayer].score += correct ? pts : -pts;
  used[cat][index] = true;
  currentPlayer = (currentPlayer + 1) % players.length;

  questionScreen.classList.add('hidden');
  board.classList.remove('hidden');

  renderBoard();
  renderPlayers();
}

document.getElementById('showAnswer').onclick = showAnswer;
document.getElementById('correct').onclick = () => finish(true);
document.getElementById('wrong').onclick = () => finish(false);
document.getElementById('back').onclick = () => {
  questionScreen.classList.add('hidden');
  board.classList.remove('hidden');
};

document.getElementById('newGame').onclick = async () => start();

async function start() {
  await loadPlayers();
  await loadQuestions();
  renderBoard();
  renderPlayers();
}

start();
