// src/app.js
const ENDPOINT = (prompt) => `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

async function fetchJSON(path){
  const r = await fetch(path);
  return r.ok ? r.json() : null;
}

// DOM refs
const promptInput = document.getElementById('prompt-input');
const presetSelect = document.getElementById('preset-select');
const countInput = document.getElementById('count');
const gallery = document.getElementById('gallery');
const savedGallery = document.getElementById('savedGallery');
const generateBtn = document.getElementById('generate');
const shareLink = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link');
const saveFavsBtn = document.getElementById('save-favs');
const clearSavedBtn = document.getElementById('clear-gallery');

let presets = [];

async function init(){
  presets = await fetchJSON('src/prompts.json') || [];
  presets.forEach(p=>{
    const opt = document.createElement('option');
    opt.value = p.prompt;
    opt.innerText = p.label;
    presetSelect.appendChild(opt);
  });

  // load URL param
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const n = urlParams.get('n');
  if (q) promptInput.value = q;
  if (n) countInput.value = n;

  // populate saved
  renderSaved();

  updateShareLink();
}

function updateShareLink(){
  const q = promptInput.value.trim();
  const n = countInput.value;
  const url = new URL(window.location.href.split('?')[0]);
  if (q) url.searchParams.set('q', q);
  if (n) url.searchParams.set('n', n);
  shareLink.value = url.toString();
}

presetSelect.addEventListener('change', (e)=>{
  promptInput.value = e.target.value;
  updateShareLink();
});

promptInput.addEventListener('input', updateShareLink);
countInput.addEventListener('input', updateShareLink);

generateBtn.addEventListener('click', async ()=>{
  const prompt = promptInput.value.trim() || 'fantasy landscape, soft light';
  const num = Math.min(12, Math.max(1, parseInt(countInput.value || '6')));
  gallery.innerHTML = '';
  for (let i=0;i<num;i++){
    const p = prompt + ` — variation ${i+1}`;
    const url = ENDPOINT(p);
    const card = document.createElement('div');
    card.className='card';
    const img = document.createElement('img');
    img.alt = p;
    img.src = url;
    img.loading = 'lazy';
    const meta = document.createElement('div');
    meta.className='meta';
    const lbl = document.createElement('div');
    lbl.className='small';
    lbl.innerText = p;
    const actions = document.createElement('div');
    const dl = document.createElement('button');
    dl.className='button';
    dl.innerText='Download';
    dl.onclick = () => downloadImage(url, `prompt-${i+1}.jpg`);
    const fav = document.createElement('button');
    fav.className='button';
    fav.innerText='♥';
    fav.onclick = () => saveFavorite({prompt:p, url});
    actions.appendChild(dl);
    actions.appendChild(fav);
    meta.appendChild(lbl);
    meta.appendChild(actions);
    card.appendChild(img);
    card.appendChild(meta);
    gallery.appendChild(card);
  }
});

copyLinkBtn.addEventListener('click', ()=>{
  navigator.clipboard.writeText(shareLink.value).then(()=> {
    copyLinkBtn.innerText = 'Copied!';
    setTimeout(()=>copyLinkBtn.innerText='Copy',1000);
  }).catch(()=>{ copyLinkBtn.innerText='Copy (failed)'; setTimeout(()=>copyLinkBtn.innerText='Copy',1200); });
});

saveFavsBtn.addEventListener('click', ()=>{
  const images = Array.from(gallery.querySelectorAll('img')).map(img=>({prompt:img.alt,url:img.src}));
  const existing = JSON.parse(localStorage.getItem('pollinations-favs')||'[]');
  const merged = existing.concat(images).slice(-200);
  localStorage.setItem('pollinations-favs', JSON.stringify(merged));
  renderSaved();
});

clearSavedBtn.addEventListener('click', ()=>{
  localStorage.removeItem('pollinations-favs');
  renderSaved();
});

function saveFavorite(item){
  const existing = JSON.parse(localStorage.getItem('pollinations-favs')||'[]');
  existing.unshift(item);
  localStorage.setItem('pollinations-favs', JSON.stringify(existing.slice(0,200)));
  renderSaved();
}

function renderSaved(){
  savedGallery.innerHTML = '';
  const items = JSON.parse(localStorage.getItem('pollinations-favs')||'[]');
  items.forEach((it, idx) => {
    const card = document.createElement('div');
    card.className='card';
    const img = document.createElement('img');
    img.src = it.url;
    img.alt = it.prompt;
    const meta = document.createElement('div');
    meta.className='meta';
    const lbl = document.createElement('div');
    lbl.className='small';
    lbl.innerText = it.prompt;
    const actions = document.createElement('div');
    const dl = document.createElement('button');
    dl.className='button';
    dl.innerText = 'Download';
    dl.onclick = () => downloadImage(it.url, `fav-${idx+1}.jpg`);
    const rm = document.createElement('button');
    rm.className='button';
    rm.innerText = 'Remove';
    rm.onclick = () => {
      const arr = JSON.parse(localStorage.getItem('pollinations-favs')||'[]');
      arr.splice(idx,1);
      localStorage.setItem('pollinations-favs', JSON.stringify(arr));
      renderSaved();
    };
    actions.appendChild(dl);
    actions.appendChild(rm);
    meta.appendChild(lbl);
    meta.appendChild(actions);
    card.appendChild(img);
    card.appendChild(meta);
    savedGallery.appendChild(card);
  });
}

function downloadImage(url, filename){
  // quick download via anchor to avoid CORS issues in some browsers.
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

init();