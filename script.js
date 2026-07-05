
(function gate(){
  const canvas   = document.getElementById('gameCanvas');
  const ctx      = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const scoreBadge   = document.getElementById('scoreBadge');
  const startOverlay = document.getElementById('startOverlay');
  const loseOverlay   = document.getElementById('loseOverlay');
  const winOverlay    = document.getElementById('winOverlay');
  const startBtn = document.getElementById('startBtn');
  const retryBtn = document.getElementById('retryBtn');
  const enterBtn = document.getElementById('enterBtn');

  const PILLARS_TO_WIN = 19;
  const GRAVITY   = 0.45;
  const FLAP_VEL  = -7.6;
  const PIPE_W    = 54;
  const GAP_H     = 158;
  const PIPE_SPEED= 2.5;
  const PIPE_GAP_DIST = 210; // horizontal distance between pipe spawns

  let bird, pipes, score, state, lastSpawnX, rafId;

  function seededWobble(seed, i){
    // deterministic pseudo-random wobble so the doodle outline doesn't flicker each frame
    return Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453 % 1;
  }

  function resetGame(){
    bird = { x: 68, y: H/2, r: 14, vy: 0 };
    pipes = [];
    score = 0;
    lastSpawnX = W + 40;
    scoreBadge.textContent = `0 / ${PILLARS_TO_WIN}`;
  }

  function spawnPipe(x){
    const margin = 60;
    const gapTop = margin + Math.random() * (H - margin*2 - GAP_H);
    pipes.push({ x, gapTop, scored:false, seed: Math.random()*1000 });
  }

  function flap(){
    if (state === 'ready'){ startGame(); return; }
    if (state !== 'playing') return;
    bird.vy = FLAP_VEL;
  }

  function startGame(){
    resetGame();
    state = 'playing';
    startOverlay.classList.add('hidden');
    loseOverlay.classList.add('hidden');
    winOverlay.classList.add('hidden');
    spawnPipe(W + 40);
    loop();
  }

  function lose(){
    state = 'lost';
    cancelAnimationFrame(rafId);
    loseOverlay.classList.remove('hidden');
  }

  function win(){
    state = 'won';
    cancelAnimationFrame(rafId);
    winOverlay.classList.remove('hidden');
  }

  function update(){
    bird.vy += GRAVITY;
    bird.y  += bird.vy;

    if (bird.y - bird.r < 0 || bird.y + bird.r > H){ lose(); return; }

    for (const p of pipes) p.x -= PIPE_SPEED;

    if (pipes.length && pipes[pipes.length-1].x < W - PIPE_GAP_DIST){
      spawnPipe(W + 20);
    }
    pipes = pipes.filter(p => p.x + PIPE_W > -10);

    for (const p of pipes){
      const withinX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_W;
      if (withinX){
        const hitsTop    = bird.y - bird.r < p.gapTop;
        const hitsBottom = bird.y + bird.r > p.gapTop + GAP_H;
        if (hitsTop || hitsBottom){ lose(); return; }
      }
      if (!p.scored && p.x + PIPE_W < bird.x){
        p.scored = true;
        score++;
        scoreBadge.textContent = `${score} / ${PILLARS_TO_WIN}`;
        if (score >= PILLARS_TO_WIN){ win(); return; }
      }
    }
  }

  function drawBackground(){
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#e3d9bd';
    ctx.lineWidth = 1;
    for (let y = 20; y < H; y += 26){
      ctx.beginPath();
      ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
    // ground scribble
    ctx.strokeStyle = '#2e2b26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H-2);
    for (let x = 0; x <= W; x += 14){
      ctx.lineTo(x, H - 2 + Math.sin(x*0.4)*1.5);
    }
    ctx.stroke();
  }

  function drawPillar(p){
    const wobble = (i)=> (seededWobble(p.seed, i) - 0.5) * 3;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2e2b26';
    ctx.fillStyle = '#eadfc4';

    // top pillar (from 0 to gapTop)
    ctx.beginPath();
    ctx.moveTo(p.x + wobble(1), 0);
    ctx.lineTo(p.x + wobble(2), p.gapTop + wobble(3));
    ctx.lineTo(p.x + PIPE_W + wobble(4), p.gapTop + wobble(5));
    ctx.lineTo(p.x + PIPE_W + wobble(6), 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // bottom pillar
    const bottomStart = p.gapTop + GAP_H;
    ctx.beginPath();
    ctx.moveTo(p.x + wobble(7), H);
    ctx.lineTo(p.x + wobble(8), bottomStart + wobble(9));
    ctx.lineTo(p.x + PIPE_W + wobble(10), bottomStart + wobble(11));
    ctx.lineTo(p.x + PIPE_W + wobble(12), H);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // little doodle cross-hatches for texture
    ctx.strokeStyle = '#c9bc95';
    ctx.lineWidth = 1;
    for (let yy = 10; yy < p.gapTop; yy += 16){
      ctx.beginPath();
      ctx.moveTo(p.x+4, yy); ctx.lineTo(p.x+PIPE_W-4, yy+4);
      ctx.stroke();
    }
    for (let yy = bottomStart+10; yy < H; yy += 16){
      ctx.beginPath();
      ctx.moveTo(p.x+4, yy); ctx.lineTo(p.x+PIPE_W-4, yy+4);
      ctx.stroke();
    }
  }

  function drawBird(){
    ctx.save();
    ctx.translate(bird.x, bird.y);
    const tilt = Math.max(-0.5, Math.min(0.9, bird.vy * 0.06));
    ctx.rotate(tilt);

    ctx.fillStyle = '#eadfc4';
    ctx.strokeStyle = '#2e2b26';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0,0, bird.r+2, bird.r, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    // wing
    ctx.beginPath();
    ctx.ellipse(-2, 3, 7, 4.5, 0.4, 0, Math.PI*2);
    ctx.fillStyle = '#d9caa0';
    ctx.fill(); ctx.stroke();

    // beak
    ctx.beginPath();
    ctx.moveTo(bird.r, -2);
    ctx.lineTo(bird.r+9, 1);
    ctx.lineTo(bird.r, 5);
    ctx.closePath();
    ctx.fillStyle = '#b5533c';
    ctx.fill(); ctx.stroke();

    // eye
    ctx.beginPath();
    ctx.arc(4, -4, 1.8, 0, Math.PI*2);
    ctx.fillStyle = '#2e2b26';
    ctx.fill();

    ctx.restore();
  }

  function draw(){
    drawBackground();
    for (const p of pipes) drawPillar(p);
    drawBird();
  }

  function loop(){
    if (state !== 'playing') return;
    update();
    if (state === 'playing'){
      draw();
      rafId = requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  canvas.addEventListener('pointerdown', flap);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space'){ e.preventDefault(); flap(); }
  });
  startBtn.addEventListener('click', startGame);
  retryBtn.addEventListener('click', startGame);
  enterBtn.addEventListener('click', enterBook);

  state = 'ready';
  resetGame();
  draw();

  function enterBook(){
    document.getElementById('gate').classList.add('hidden');
    const book = document.getElementById('book');
    book.classList.remove('hidden');
    window.scrollTo(0,0);
    initBook();
  }
})();

let __bookInitialized = false;

async function initBook(){
  if (__bookInitialized) return;
  __bookInitialized = true;

  const pageContentEl = document.getElementById('pageContent');
  const pageCounterEl = document.getElementById('pageCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const exportBtn = document.getElementById('exportBtn');
  const saveToast = document.getElementById('saveToast');

  const STORAGE_KEY = 'bookReplies';

  let pages = [];
  try{
    const res = await fetch('pages.json', { cache: 'no-store' });
    pages = await res.json();
  } catch (err){
    pageContentEl.innerHTML = `<p class="page-text">wait may error sorry hehehehe</p>`;
    console.error(err);
    return;
  }

  let idx = 0;

  function loadReplies(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e){ return {}; }
  }
  function saveReply(pageId, pageTitle, reply){
    const all = loadReplies();
    all[pageId] = { pageTitle, reply, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function renderPage(){
    const p = pages[idx];
    const replies = loadReplies();
    const existing = replies[p.id]?.reply || '';

    let mediaHtml = '';
    if (p.type === 'image'){
      mediaHtml = `
        <div class="page-image-wrap">
          <img src="${p.src}" alt="${p.title}">
          ${p.caption ? `<p class="page-caption">${p.caption}</p>` : ''}
        </div>`;
    } else {
      mediaHtml = `<p class="page-text">${escapeHtml(p.content || '')}</p>`;
    }

    pageContentEl.innerHTML = `
      <h2 class="page-title">${escapeHtml(p.title || '')}</h2>
      ${mediaHtml}
      <div class="reply-block">
        <label class="reply-label" for="replyBox">${escapeHtml(p.replyPrompt || 'write your reply')}</label>
        <textarea id="replyBox" class="reply-box" placeholder="type here...">${escapeHtml(existing)}</textarea>
        <div class="reply-actions">
          <button id="saveReplyBtn" class="doodle-btn small">save reply</button>
          <span id="replySavedNote" class="reply-saved-note hidden"></span>
        </div>
      </div>
    `;

    document.getElementById('saveReplyBtn').addEventListener('click', () => {
      const val = document.getElementById('replyBox').value;
      saveReply(p.id, p.title, val);
      const note = document.getElementById('replySavedNote');
      note.textContent = 'saved ✓';
      note.classList.remove('hidden');
      setTimeout(() => note.classList.add('hidden'), 1800);
    });

    pageCounterEl.textContent = `page ${idx+1} of ${pages.length}`;
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === pages.length - 1;
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('\n','<br>');
  }

  prevBtn.addEventListener('click', () => { if (idx > 0){ idx--; renderPage(); } });
  nextBtn.addEventListener('click', () => { if (idx < pages.length - 1){ idx++; renderPage(); } });

  exportBtn.addEventListener('click', () => {
    const replies = loadReplies();
    const rows = [['page_id','page_title','reply','updated_at']];
    for (const [pageId, r] of Object.entries(replies)){
      rows.push([pageId, r.pageTitle || '', r.reply || '', r.updatedAt || '']);
    }
    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(',')
    ).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'replies.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    saveToast.textContent = 'csv downloaded ✓';
    setTimeout(() => saveToast.textContent = '', 2400);
  });

  renderPage();
}
