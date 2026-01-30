const POINTS = [100, 200, 300, 400, 500, 600, 700, 800];

let categories = ['Заклинания', 'Квиддич', 'Персонажи', 'Предметы', 'Существа', 'Хогвартс'];
let questions = {};
let used = {};
let players = [];
let currentPlayer = 0;
let currentQuestion = null;

const board = document.getElementById('gameBoard');
const playersDiv = document.getElementById('players');
const questionScreen = document.getElementById('questionScreen');
const answerEl = document.getElementById('answer');

// --- Загрузка игроков ---
async function loadPlayers() {
  const text = await fetch('players.txt').then(r => r.text());
  players = text.trim().split('\n').map(name => ({ name, score: 0 }));
}

// --- Загрузка вопросов ---
async function loadQuestions() {
  for (const cat of categories) {
    const text = await fetch(`Вопросы/Категории/${cat}/Вопросы.txt`).then(r => r.text());
    questions[cat] = text.trim().split('\n');
    used[cat] = Array(POINTS.length).fill(false);
  }
}

// --- Отрисовка игрового поля ---
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

// --- Отрисовка игроков ---
function renderPlayers() {
  playersDiv.innerHTML = '';
  players.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = `${p.name}: ${p.score}`;
    if (i === currentPlayer) div.classList.add('active');
    playersDiv.appendChild(div);
  });
}

// --- Открытие вопроса ---
function openQuestion(cat, index) {
  currentQuestion = { cat, index };

  questionScreen.classList.add('active'); // показываем экран вопроса
  board.classList.add('hidden');          // скрываем доску

  document.getElementById('questionText').textContent = questions[cat][index];
  document.getElementById('questionPoints').textContent = POINTS[index] + ' очков';

  // очищаем и скрываем предыдущий ответ
  answerEl.textContent = '';
  answerEl.style.display = 'none';
}

// --- Показ правильного ответа ---
async function showAnswer() {
  if (!currentQuestion) return; // защита от клика без выбранного вопроса
  const { cat, index } = currentQuestion;
  const text = await fetch(`Вопросы/Категории/${cat}/Ответ${index + 1}.txt`).then(r => r.text());
  answerEl.textContent = text;
  answerEl.style.display = 'block';
}

// --- Завершение вопроса и начисление очков ---
function finish(correct) {
  if (!currentQuestion) return;

  const { cat, index } = currentQuestion;
  const pts = POINTS[index];
  players[currentPlayer].score += correct ? pts : -pts;
  used[cat][index] = true;

  // переключаем игрока
  currentPlayer = (currentPlayer + 1) % players.length;

  // возвращаемся к доске
  questionScreen.classList.remove('active');
  board.classList.remove('hidden');

  renderBoard();
  renderPlayers();

  currentQuestion = null; // сброс текущего вопроса
}

// --- Назначение обработчиков кнопок ---
document.getElementById('showAnswer').onclick = showAnswer;
document.getElementById('correct').onclick = () => finish(true);
document.getElementById('wrong').onclick = () => finish(false);
document.getElementById('back').onclick = () => {
  questionScreen.classList.remove('active');
  board.classList.remove('hidden');
  answerEl.textContent = '';
  answerEl.style.display = 'none';
};
document.getElementById('newGame').onclick = async () => start();

// --- Старт игры ---
async function start() {
  await loadPlayers();
  await loadQuestions();
  renderBoard();
  renderPlayers();
  currentPlayer = 0;
  currentQuestion = null;
}

// --- Запуск ---
start();
