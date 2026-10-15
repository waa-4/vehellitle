(() => {
  'use strict';
  const configured = Array.isArray(window.CHARACTERS) ? window.CHARACTERS : [];
  const characters = configured.filter(x => x && typeof x.NAME === 'string' && x.NAME.trim() && typeof x.IMAGE === 'string' && x.IMAGE.trim()).map(x => ({ name: x.NAME.trim(), image: x.IMAGE.trim() }));
  const unique = new Set(characters.map(x => x.name.toLowerCase()));
  if (characters.length !== unique.size) console.warn('Character names in stuff.js must be unique.');
  const modes = {
    classic: { length: 8, attempts: 6, choices: 4 },
    hard: { length: 10, attempts: 6, choices: 8 },
    insane: { length: 12, attempts: 5, choices: 16 },
    nightmare: { length: 16, attempts: 4, choices: 24 }
  };
  const $ = id => document.getElementById(id);
  const state = { mode: 'classic', answer: [], guesses: [], draft: [], complete: false, won: false, voice: true, pool: [] };
  let audioCtx;
  const randomNumber = max => {
    if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % max; }
    return Math.floor(Math.random() * max);
  };
  const setMessage = (value, kind = '') => { $('message').textContent = value; $('message').className = 'message ' + kind; };
  function makeButton(character, index) {
    const button = document.createElement('button');
    button.className = 'character'; button.type = 'button'; button.title = 'Choose ' + character.name;
    button.setAttribute('aria-label', 'Choose ' + character.name);
    const img = document.createElement('img'); img.src = character.image; img.alt = ''; img.loading = 'lazy';
    const label = document.createElement('span'); label.textContent = character.name;
    button.append(img, label); button.addEventListener('click', () => choose(index)); return button;
  }
  function drawChoices() {
    $('left-panel').replaceChildren(); $('right-panel').replaceChildren();
    state.pool.forEach((character, i) => (i % 2 === 0 ? $('left-panel') : $('right-panel')).append(makeButton(character, i)));
  }
  function speak(name) {
    if (!state.voice || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.volume = 0.45; utterance.rate = 0.68; utterance.pitch = 0.55;
      const voices = speechSynthesis.getVoices();
      const english = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
      utterance.voice = english.find(v => /soft|whisper/i.test(v.name)) || english[0] || null;
      speechSynthesis.speak(utterance);
    } catch (error) { console.warn('Voice unavailable:', error); }
  }
  function choose(index) {
    if (state.complete || state.draft.length >= modes[state.mode].length) return;
    state.draft.push(index); speak(state.pool[index].name); render();
  }
  function score(guess, answer) {
    const feedback = Array(guess.length).fill('absent'); const counts = new Map();
    for (let i = 0; i < answer.length; i++) {
      if (guess[i] === answer[i]) feedback[i] = 'exact';
      else counts.set(answer[i], (counts.get(answer[i]) || 0) + 1);
    }
    for (let i = 0; i < guess.length; i++) {
      if (feedback[i] === 'exact') continue;
      const available = counts.get(guess[i]) || 0;
      if (available > 0) { feedback[i] = 'present'; counts.set(guess[i], available - 1); }
    }
    return feedback;
  }
  function makeCell(index, status = '') {
    const cell = document.createElement('div'); cell.className = 'cell ' + status;
    if (index !== undefined) {
      const img = document.createElement('img'); img.src = state.pool[index].image; img.alt = state.pool[index].name;
      img.title = state.pool[index].name;
      cell.append(img);
    }
    return cell;
  }
  function render() {
    const mode = modes[state.mode]; $('board').replaceChildren();
    $('attempt-count').textContent = state.complete ? (state.won ? 'SEQUENCE FOUND' : 'NO ATTEMPTS LEFT') : `Attempt ${state.guesses.length + 1} / ${mode.attempts}`;
    for (let rowNum = 0; rowNum < mode.attempts; rowNum++) {
      const row = document.createElement('div'); row.className = 'guess-row' + (rowNum === state.guesses.length && !state.complete ? ' current' : '');
      row.style.setProperty('--columns', String(mode.length));
      let guess, statuses;
      if (rowNum < state.guesses.length) { guess = state.guesses[rowNum]; statuses = score(guess, state.answer); }
      else if (rowNum === state.guesses.length && !state.complete) guess = state.draft;
      else guess = [];
      for (let col = 0; col < mode.length; col++) row.append(makeCell(guess[col], statuses ? statuses[col] : ''));
      $('board').append(row);
    }
    $('submit-btn').disabled = state.complete || state.draft.length !== mode.length;
    $('delete-btn').disabled = state.complete || !state.draft.length;
  }
  function submit() {
    const mode = modes[state.mode];
    if (state.complete || state.draft.length !== mode.length) return;
    state.guesses.push([...state.draft]);
    state.won = state.draft.every((value, i) => value === state.answer[i]);
    state.draft = [];
    state.complete = state.won || state.guesses.length >= mode.attempts;
    if (state.won) setMessage('You found it. Somehow.', 'success');
    else if (state.complete) setMessage('The sequence wins. Press Reset Current to try again.', 'error');
    else setMessage('Not quite. Try another sequence.');
    render();
  }
  function resetCurrent() {
    state.guesses = []; state.draft = []; state.complete = false; state.won = false;
    setMessage('Same hidden sequence. Fresh attempts.'); render();
  }
  function newRound() {
    const mode = modes[state.mode];
    if (!characters.length) { setMessage('Add characters to stuff.js first.', 'error'); return; }
    state.pool = characters.slice(0, Math.min(mode.choices, characters.length));
    // An expansion with fewer characters than a difficulty's requested count still works.
    const previous = state.answer.join(','); let answer;
    for (let attempt = 0; attempt < 10; attempt++) {
      answer = Array.from({length:mode.length}, () => randomNumber(state.pool.length));
      if (answer.join(',') !== previous) break;
    }
    state.answer = answer; drawChoices(); resetCurrent();
    if (state.pool.length < mode.choices) setMessage(`${state.pool.length}/${mode.choices} characters configured. Add more in stuff.js to unlock full difficulty.`);
    else setMessage('Choose a character to begin.');
  }
  $('difficulty').addEventListener('change', event => { state.mode = event.target.value; newRound(); });
  $('voice-button').addEventListener('click', () => {
    state.voice = !state.voice;
    $('voice-button').textContent = 'VOICE: ' + (state.voice ? 'ON' : 'OFF');
    $('voice-button').setAttribute('aria-pressed', String(state.voice));
    if (!state.voice && 'speechSynthesis' in window) speechSynthesis.cancel();
  });
  $('delete-btn').addEventListener('click', () => { if (!state.complete) { state.draft.pop(); render(); } });
  $('submit-btn').addEventListener('click', submit);
  $('reset-btn').addEventListener('click', resetCurrent);
  $('new-btn').addEventListener('click', newRound);
  window.addEventListener('keydown', event => {
    if (event.target.matches('select, input, textarea')) return;
    if (event.key === 'Backspace') { event.preventDefault(); if (!state.complete) { state.draft.pop(); render(); } }
    else if (event.key === 'Enter') submit();
  });
  newRound();
})();
