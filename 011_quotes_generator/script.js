// 011 - Quotes Generator (Pink Palette)

const quotes = [
  { q: "Fokus pada proses, biarkan hasil menyusul.", a: "Anonim" },
  { q: "Konsistensi mengalahkan intensitas.", a: "James Clear" },
  { q: "Kau tidak harus hebat untuk memulai, tapi kau harus memulai untuk menjadi hebat.", a: "Zig Ziglar" },
  { q: "Done is better than perfect.", a: "Sheryl Sandberg" },
  { q: "Setiap hari adalah versi beta. Iterasi!", a: "Anonim" },
  { q: "Jika kamu ingin pergi cepat, pergi sendiri. Jika ingin jauh, pergi bersama.", a: "Peribahasa Afrika" },
  { q: "Kualitas lahir dari kebiasaan, bukan kebetulan.", a: "Aristoteles" },
  { q: "Rencana tanpa eksekusi hanyalah ilusi.", a: "Anonim" },
  { q: "Belajar paling efektif saat kita membangun sesuatu.", a: "Anonim" },
  { q: "Small steps every day.", a: "Anonim" },
  { q: "Disiplin adalah jembatan antara tujuan dan pencapaian.", a: "Jim Rohn" },
  { q: "Progress over perfection.", a: "Anonim" },
  { q: "Tak ada kode yang sempurna, hanya yang terus diperbaiki.", a: "Anonim" },
  { q: "Kesalahan adalah data yang berharga.", a: "Anonim" },
  { q: "Think clearly, code simply.", a: "Anonim" },
  { q: "Kerjakan yang penting dulu, bukan yang mudah dulu.", a: "Anonim" },
  { q: "Setiap bug mengajarkan satu pelajaran.", a: "Anonim" },
  { q: "Mulai sekarang adalah waktu terbaik.", a: "Anonim" },
  { q: "Ketika ragu, tulis tes kecil.", a: "Anonim" },
  { q: "Sedikit lebih baik setiap hari.", a: "Anonim" }
];

// elemen DOM
const elText = document.getElementById('quoteText');
const elAuthor = document.getElementById('quoteAuthor');
const btnNew = document.getElementById('btnNew');
const btnCopy = document.getElementById('btnCopy');
const btnTweet = document.getElementById('btnTweet');

// shuffle bag (hindari pengulangan sampai semua tampil)
let bag = shuffle([...quotes]);
let idx = -1;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function nextQuote() {
  idx++;
  if (idx >= bag.length) {
    bag = shuffle([...quotes]);
    idx = 0;
  }
  const { q, a } = bag[idx];
  renderQuote(q, a);
}

function renderQuote(q, a) {
  elText.classList.remove('fade');
  elAuthor.classList.remove('fade');
  void elText.offsetWidth; // reflow untuk memicu animasi ulang
  elText.textContent = q;
  elAuthor.textContent = `— ${a}`;
  elText.classList.add('fade');
  elAuthor.classList.add('fade');
}

async function copyQuote() {
  const text = `“${elText.textContent}” — ${elAuthor.textContent.replace(/^—\s*/, "")}`;
  try {
    await navigator.clipboard.writeText(text);
    flash(btnCopy);
  } catch {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  flash(btnCopy);
}

function tweetQuote() {
  const text = `${elText.textContent} — ${elAuthor.textContent.replace(/^—\s*/, "")}`;
  const url = new URL('https://twitter.com/intent/tweet');
  url.searchParams.set('text', text);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function flash(el) {
  const original = el.style.boxShadow;
  el.style.boxShadow = '0 0 0 3px var(--ring)';
  setTimeout(() => (el.style.boxShadow = original), 250);
}

// event
btnNew.addEventListener('click', nextQuote);
btnCopy.addEventListener('click', copyQuote);
btnTweet.addEventListener('click', tweetQuote);

// keyboard shortcut
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'n') nextQuote();
  if (e.key.toLowerCase() === 'c') copyQuote();
  if (e.key.toLowerCase() === 't') tweetQuote();
});

// mulai dengan satu quote
nextQuote();