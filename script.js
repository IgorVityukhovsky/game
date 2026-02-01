const POINTS = [100, 200, 300, 400, 500, 600, 700, 800];

let categories = ['Заклинания', 'Квиддич', 'Персонажи', 'Предметы', 'Существа', 'Хогвартс'];
let questions = {};
let used = {};
let players = [];

let currentTurnPlayer = 0;    // чей ход по очереди
let currentAnswerPlayer = 0;  // кто отвечает сейчас
let currentQuestion = null;

let awaitingSteal = false;

const board = document.getElementById('gameBoard');
const playersDiv = document.getElementById('players');
const questionScreen = document.getElementById('questionScreen');
const answerEl = document.getElementById('answer');

// ---------- Загрузка игроков ----------
async function loadPlayers() {
  const text = await fetch('players.txt').then(r => r.text());
  players = text.trim().split('\n').map(name => ({ name, score: 0 }));
}

// ---------- Загрузка вопросов ----------
async function loadQuestions() {
  for (const cat of categories) {
    const text = await fetch(`Вопросы/Категории/${cat}/Вопросы.txt`).then(r => r.text());
    questions[cat] = text.trim().split('\n');
    used[cat] = Array(POINTS.length).fill(false);
  }
}

// ---------- Отрисовка поля ----------
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

// ---------- Отрисовка игроков ----------
function renderPlayers() {
  playersDiv.innerHTML = '';
  players.forEach((p, i) => {
    const div = document.createElement('div');
    div.textContent = `${p.name}: ${p.score}`;

    if (i === currentTurnPlayer) div.classList.add('active');

    playersDiv.appendChild(div);
  });
}

// ---------- Информация о вопросе ----------
function updateQuestionInfo() {
  if (!currentQuestion) return;

  const { index } = currentQuestion;
  document.getElementById('questionPoints').textContent =
    `${POINTS[index]} очков — отвечает: ${players[currentAnswerPlayer].name}`;
}

// ---------- Открытие вопроса ----------
function openQuestion(cat, index) {
  currentQuestion = { cat, index };
  awaitingSteal = false;

  currentAnswerPlayer = currentTurnPlayer;

  questionScreen.classList.add('active');
  board.classList.add('hidden');

  document.getElementById('questionText').textContent = questions[cat][index];
  updateQuestionInfo();

  answerEl.textContent = '';
  answerEl.style.display = 'none';

  const steal = document.getElementById('stealPlayers');
  if (steal) steal.remove();
}

// ---------- Показ ответа ----------
async function showAnswer() {
  if (!currentQuestion) return;
  const { cat, index } = currentQuestion;
  const text = await fetch(`Вопросы/Категории/${cat}/Ответ${index + 1}.txt`).then(r => r.text());
  answerEl.textContent = text;
  answerEl.style.display = 'block';
}

// ---------- Выбор игроков для перехвата ----------
function showStealPlayers() {
  const container = document.createElement('div');
  container.id = 'stealPlayers';
  container.innerHTML = '<h3>Кто отвечает?</h3>';

  players.forEach((p, i) => {
    if (i === currentAnswerPlayer) return;

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = i;

    label.appendChild(checkbox);
    label.append(` ${p.name}`);
    container.appendChild(label);
    container.appendChild(document.createElement('br'));
  });

  const btn = document.createElement('button');
  btn.textContent = 'Выбрать';
  btn.onclick = () => selectStealPlayer(container);

  container.appendChild(btn);
  questionScreen.appendChild(container);
}

// ---------- Выбор игрока ----------
function selectStealPlayer(container) {
  const checked = [...container.querySelectorAll('input:checked')]
    .map(i => Number(i.value));

  if (checked.length === 0) {
    alert('Выбери хотя бы одного игрока');
    return;
  }

  currentAnswerPlayer =
    checked.length === 1
      ? checked[0]
      : checked[Math.floor(Math.random() * checked.length)];

  awaitingSteal = true;

  container.remove();
  updateQuestionInfo();
}

// ---------- Завершение вопроса ----------
function finish(correct) {
  if (!currentQuestion) return;

  const { cat, index } = currentQuestion;
  const pts = POINTS[index];

  players[currentAnswerPlayer].score += correct ? pts : -pts;
  used[cat][index] = true;

  // ход переходит ПО ОЧЕРЕДИ, а не от отвечающего
  currentTurnPlayer = (currentTurnPlayer + 1) % players.length;

  questionScreen.classList.remove('active');
  board.classList.remove('hidden');

  awaitingSteal = false;

  const steal = document.getElementById('stealPlayers');
  if (steal) steal.remove();

  renderBoard();
  renderPlayers();

  currentQuestion = null;
}

// ---------- Кнопки ----------
document.getElementById('showAnswer').onclick = showAnswer;

document.getElementById('correct').onclick = () => finish(true);

document.getElementById('wrong').onclick = () => {
  if (!currentQuestion) return;

  const { index } = currentQuestion;

  if (!awaitingSteal) {
    players[currentAnswerPlayer].score -= POINTS[index];
    awaitingSteal = true;
    showStealPlayers();
    renderPlayers();
  } else {
    finish(false);
  }
};

document.getElementById('back').onclick = () => {
  questionScreen.classList.remove('active');
  board.classList.remove('hidden');
  answerEl.textContent = '';
  answerEl.style.display = 'none';
  awaitingSteal = false;

  const steal = document.getElementById('stealPlayers');
  if (steal) steal.remove();
};

document.getElementById('newGame').onclick = () => start();

// ---------- Старт ----------
async function start() {
  await loadPlayers();
  await loadQuestions();

  currentTurnPlayer = 0;
  currentAnswerPlayer = 0;
  currentQuestion = null;
  awaitingSteal = false;

  renderBoard();
  renderPlayers();
}

start();
