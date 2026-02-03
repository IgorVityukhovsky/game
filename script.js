const POINTS = [100, 200, 300, 400, 500, 600, 700, 800];

let categories = ['Заклинания', 'Квиддич', 'Персонажи', 'Предметы', 'Существа', 'Хогвартс'];
let questions = {};
let used = {};
let players = [];

let currentTurnPlayer = 0;     // чей ход
let currentAnswerPlayer = 0;   // кто отвечает сейчас
let currentQuestion = null;

let awaitingSteal = false;
let answeredPlayers = [];

const board = document.getElementById('gameBoard');
const playersDiv = document.getElementById('players');
const questionScreen = document.getElementById('questionScreen');
const answerEl = document.getElementById('answer');
const questionImage = document.getElementById('questionImage');

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

// ---------- Отрисовка игроков с кнопками + и - ----------
function renderPlayers() {
  playersDiv.innerHTML = '';
  players.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-row';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${p.name}: ${p.score}`;
    if (i === currentAnswerPlayer) nameSpan.classList.add('active');
    div.appendChild(nameSpan);

    // кнопка "+"
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.onclick = () => {
      p.score += 100;
      renderPlayers();
    };
    div.appendChild(plusBtn);

    // кнопка "-"
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '-';
    minusBtn.onclick = () => {
      p.score -= 100;
      renderPlayers();
    };
    div.appendChild(minusBtn);

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

  answeredPlayers = [];
  currentAnswerPlayer = currentTurnPlayer;
  answeredPlayers.push(currentAnswerPlayer);

  questionScreen.classList.add('active');
  board.classList.add('hidden');

  document.getElementById('questionText').textContent = questions[cat][index];

  // ---------- Картинка ----------
  const imgPath = `Вопросы/Категории/${cat}/${index + 1}.png`;
  fetch(imgPath).then(res => {
    if(res.ok) {
      questionImage.src = imgPath;
      questionImage.style.display = 'block';
    } else {
      questionImage.style.display = 'none';
    }
  });

  answerEl.textContent = '';
  answerEl.style.display = 'none';

  const steal = document.getElementById('stealPlayers');
  if (steal) steal.remove();

  updateQuestionInfo();
}

// ---------- Показ ответа ----------
async function showAnswer() {
  if (!currentQuestion) return;
  const { cat, index } = currentQuestion;
  const text = await fetch(`Вопросы/Категории/${cat}/Ответ${index + 1}.txt`).then(r => r.text());
  answerEl.textContent = text;
  answerEl.style.display = 'block';
}

// ---------- Показ игроков для перехвата (с чекбоксами) ----------
function showStealPlayers() {
  const old = document.getElementById('stealPlayers');
  if (old) old.remove();

  const container = document.createElement('div');
  container.id = 'stealPlayers';
  container.innerHTML = '<h3>Кто отвечает?</h3>';

  // Вариант "никто"
  const labelNone = document.createElement('label');
  const checkboxNone = document.createElement('input');
  checkboxNone.type = 'checkbox';
  checkboxNone.value = 'none';
  labelNone.appendChild(checkboxNone);
  labelNone.append(' Никто');
  container.appendChild(labelNone);
  container.appendChild(document.createElement('br'));

  // Остальные игроки, кто ещё не отвечал
  players.forEach((p, i) => {
    if (answeredPlayers.includes(i)) return;

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

// ---------- Выбор игрока для перехвата ----------
function selectStealPlayer(container) {
  const checked = [...container.querySelectorAll('input:checked')].map(i => i.value);

  if (checked.length === 0) {
    alert('Выберите хотя бы одного игрока или "никто"');
    return;
  }

  if (checked.includes('none')) {
    finish(false); // закрываем вопрос и вычитаем очки текущему игроку
  } else {
    // Случайный выбор из нескольких
    const randomIndex = Math.floor(Math.random() * checked.length);
    currentAnswerPlayer = Number(checked[randomIndex]);
    answeredPlayers.push(currentAnswerPlayer);
    awaitingSteal = true;
  }

  container.remove();
  updateQuestionInfo();
  renderPlayers();
}

// ---------- Завершение вопроса ----------
function finish(correct) {
  if (!currentQuestion) return;

  const { cat, index } = currentQuestion;
  const pts = POINTS[index];

  if (correct) {
    players[currentAnswerPlayer].score += pts;
  }

  used[cat][index] = true;

  currentTurnPlayer = (currentTurnPlayer + 1) % players.length;
  currentAnswerPlayer = currentTurnPlayer;

  questionScreen.classList.remove('active');
  board.classList.remove('hidden');
  questionImage.style.display = 'none';

  awaitingSteal = false;
  currentQuestion = null;

  const steal = document.getElementById('stealPlayers');
  if (steal) steal.remove();

  renderBoard();
  renderPlayers();
}

// ---------- Кнопки ----------
document.getElementById('showAnswer').onclick = showAnswer;
document.getElementById('correct').onclick = () => finish(true);
document.getElementById('wrong').onclick = () => {
  if (!currentQuestion) return;

  const { index } = currentQuestion;
  players[currentAnswerPlayer].score -= POINTS[index];

  const remaining = players
    .map((_, i) => i)
    .filter(i => !answeredPlayers.includes(i));

  if (remaining.length > 0) {
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
  questionImage.style.display = 'none';
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
  answeredPlayers = [];

  renderBoard();
  renderPlayers();
}

start();
