const $ = (s) => document.querySelector(s);
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const leer = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));

// ---------- Navegación ----------
document.querySelectorAll('nav button').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('nav button, section').forEach((e) => e.classList.remove('on'));
    b.classList.add('on');
    $('#' + b.dataset.s).classList.add('on');
  };
});

// ---------- Reproductor ----------
let lista = [];
let actual = -1;
let aleatorio = false;
let reproductor = null;
const velocidades = [1, 1.25, 1.5, 2, 0.75];
let velIdx = 0;

$('#archivos').onchange = (e) => {
  const nuevos = [...e.target.files].map((f) => ({
    nombre: f.name,
    url: URL.createObjectURL(f),
    tipo: f.type.startsWith('video') ? 'video' : 'audio',
  }));
  lista = lista.concat(nuevos);
  dibujarLista();
  if (actual === -1 && lista.length) reproducir(0);
};

$('#subs').onchange = (e) => {
  const f = e.target.files[0];
  if (!f || !reproductor || reproductor.tagName !== 'VIDEO') return;
  reproductor.querySelectorAll('track').forEach((t) => t.remove());
  const t = document.createElement('track');
  t.kind = 'subtitles';
  t.label = 'Español';
  t.srclang = 'es';
  t.src = URL.createObjectURL(f);
  t.default = true;
  reproductor.appendChild(t);
};

function reproducir(i) {
  if (i < 0 || i >= lista.length) return;
  guardarProgreso();
  actual = i;
  const it = lista[i];
  $('#zonaPlayer').innerHTML = '';
  reproductor = document.createElement(it.tipo);
  reproductor.src = it.url;
  reproductor.controls = true;
  reproductor.playbackRate = velocidades[velIdx];
  reproductor.onloadedmetadata = () => {
    const prog = leer('progreso', {})[it.nombre];
    if (prog && prog < reproductor.duration - 5) reproductor.currentTime = prog;
  };
  reproductor.ontimeupdate = guardarProgreso;
  reproductor.onended = siguiente;
  $('#zonaPlayer').appendChild(reproductor);
  reproductor.play().catch(() => {});
  registrarHistorial(it.nombre);
  dibujarLista();
}

function guardarProgreso() {
  if (!reproductor || actual < 0) return;
  const p = leer('progreso', {});
  p[lista[actual].nombre] = reproductor.currentTime;
  guardar('progreso', p);
}

function registrarHistorial(nombre) {
  const h = leer('historial', []).filter((x) => x !== nombre);
  h.unshift(nombre);
  guardar('historial', h.slice(0, 50));
}

function siguiente() {
  if (!lista.length) return;
  if (aleatorio) reproducir(Math.floor(Math.random() * lista.length));
  else reproducir((actual + 1) % lista.length);
}

function anterior() {
  if (!lista.length) return;
  reproducir((actual - 1 + lista.length) % lista.length);
}

$('#btnNext').onclick = siguiente;
$('#btnPrev').onclick = anterior;
$('#btnShuffle').onclick = (e) => {
  aleatorio = !aleatorio;
  e.target.textContent = '🔀 Aleatorio: ' + (aleatorio ? 'sí' : 'no');
};
$('#btnFS').onclick = () => {
  if (reproductor && reproductor.requestFullscreen) reproductor.requestFullscreen();
};
$('#btnVel').onclick = (e) => {
  velIdx = (velIdx + 1) % velocidades.length;
  e.target.textContent = 'Velocidad ' + velocidades[velIdx] + 'x';
  if (reproductor) reproductor.playbackRate = velocidades[velIdx];
};

function dibujarLista() {
  const q = $('#buscaLista').value.toLowerCase();
  const cont = $('#lista');
  cont.innerHTML = '';
  lista.forEach((it, i) => {
    if (q && !it.nombre.toLowerCase().includes(q)) return;
    const d = document.createElement('div');
    d.className = 'item' + (i === actual ? ' act' : '');
    d.innerHTML = '<span>' + (it.tipo === 'video' ? '🎬 ' : '🎵 ') + it.nombre + '</span>';
    const bP = document.createElement('button');
    bP.className = 'b';
    bP.textContent = '▶';
    bP.onclick = () => reproducir(i);
    const bQ = document.createElement('button');
    bQ.className = 'b g';
    bQ.textContent = '✕';
    bQ.onclick = () => {
      lista.splice(i, 1);
      if (actual >= i) actual--;
      dibujarLista();
    };
    d.append(bP, bQ);
    cont.appendChild(d);
  });
}
$('#buscaLista').oninput = dibujarLista;

// ---------- Catálogo legal ----------
const catalogo = [
  { t: 'Internet Archive: películas', c: 'Películas de dominio público', d: 'Cine clásico y cortos', dur: '60-120 min', u: 'https://archive.org/details/feature_films' },
  { t: 'Internet Archive: video', c: 'Documentales', d: 'Documentales históricos y educativos', dur: '10-120 min', u: 'https://archive.org/details/movies' },
  { t: 'Classic Cinema Online', c: 'Películas de dominio público', d: 'Cine clásico', dur: '60-120 min', u: 'https://www.classiccinemaonline.com' },
  { t: 'TED', c: 'Conferencias', d: 'Charlas con subtítulos en español', dur: '5-20 min', u: 'https://www.ted.com' },
  { t: 'MIT OpenCourseWare', c: 'Cursos', d: 'Clases y cursos completos de MIT', dur: 'Semestre', u: 'https://ocw.mit.edu' },
  { t: 'Khan Academy', c: 'Cursos', d: 'Ciencias, matemáticas y más, en español', dur: '5-15 min por lección', u: 'https://es.khanacademy.org' },
  { t: 'edX', c: 'Cursos', d: 'Cursos universitarios gratis sin certificado', dur: 'Semanas', u: 'https://www.edx.org' },
  { t: 'Coursera (modo oyente)', c: 'Cursos', d: 'Muchos cursos se pueden ver gratis', dur: 'Semanas', u: 'https://www.coursera.org' },
  { t: 'DW Documental', c: 'Documentales', d: 'Documentales en español de Deutsche Welle', dur: '20-50 min', u: 'https://www.youtube.com/@dwdocumental' },
  { t: 'Pluto TV', c: 'Entretenimiento', d: 'Canales en vivo y cine a la carta', dur: 'Continuo', u: 'https://pluto.tv' },
  { t: 'Plex gratis', c: 'Entretenimiento', d: 'Más de 50.000 títulos con anuncios', dur: 'Variable', u: 'https://www.plex.tv' },
  { t: 'Tubi', c: 'Entretenimiento', d: 'Cine y series con anuncios', dur: 'Variable', u: 'https://tubitv.com' },
  { t: 'VIX', c: 'Entretenimiento', d: 'Cine y series en español', dur: 'Variable', u: 'https://vix.com' },
  { t: 'Jamendo', c: 'Música libre', d: 'Música con licencia Creative Commons', dur: 'Variable', u: 'https://www.jamendo.com' },
  { t: 'Free Music Archive', c: 'Música libre', d: 'Música de licencia libre', dur: 'Variable', u: 'https://freemusicarchive.org' },
  // ---- Dibujos animados retro ----
  { t: 'Internet Archive: dibujos animados', c: 'Dibujos animados retro', d: 'Cortos animados antiguos de dominio público, como Betty Boop y Popeye de los años 30 y 40', dur: '6-10 min por corto', u: 'https://archive.org/details/animationandcartoons' },
  { t: 'Pluto TV: canales de animación', c: 'Dibujos animados retro', d: 'Canales de caricaturas clásicas, según disponibilidad en tu país', dur: 'Continuo', u: 'https://pluto.tv' },
  { t: 'Tubi: animación', c: 'Dibujos animados retro', d: 'Caricaturas y animación clásica con anuncios', dur: 'Variable', u: 'https://tubitv.com' },
  { t: 'YouTube: canales oficiales de caricaturas', c: 'Dibujos animados retro', d: 'Busca canales oficiales que suban caricaturas clásicas con permiso', dur: 'Variable', u: 'https://www.youtube.com/results?search_query=caricaturas+clasicas+canal+oficial' },
  // ---- Series clásicas de los ochenta ----
  { t: 'Lobo del Aire', c: 'Series clásicas de los 80', d: 'Busca dónde verla legalmente en Chile', dur: 'Episodios de 45 min', u: 'https://www.justwatch.com/cl/buscar?q=Airwolf' },
  { t: 'El Auto Fantástico', c: 'Series clásicas de los 80', d: 'Busca dónde verla legalmente en Chile', dur: 'Episodios de 45 min', u: 'https://www.justwatch.com/cl/buscar?q=Knight+Rider' },
  { t: 'Los Magníficos (El Equipo A)', c: 'Series clásicas de los 80', d: 'Busca dónde verla legalmente en Chile', dur: 'Episodios de 45 min', u: 'https://www.justwatch.com/cl/buscar?q=The+A-Team' },
  { t: 'JustWatch Chile', c: 'Series clásicas de los 80', d: 'Buscador que te dice en qué servicio está cada título, gratis o de pago', dur: 'Buscador', u: 'https://www.justwatch.com/cl' },
  // ---- Películas clásicas ----
  { t: 'Calles de Fuego (Streets of Fire)', c: 'Películas clásicas', d: 'Clásico de culto de 1984, rock y neón. Busca dónde verla en Chile', dur: '93 min', u: 'https://www.justwatch.com/cl/buscar?q=Streets+of+Fire' },
  { t: 'Rocky', c: 'Películas clásicas', d: 'La película original de 1976. Busca dónde verla en Chile', dur: '119 min', u: 'https://www.justwatch.com/cl/buscar?q=Rocky' },
  { t: 'Rocky II', c: 'Películas clásicas', d: 'Segunda parte de la saga, de 1979. Busca dónde verla en Chile', dur: '119 min', u: 'https://www.justwatch.com/cl/buscar?q=Rocky+II' },
  { t: 'Rocky III', c: 'Películas clásicas', d: 'Tercera parte, de 1982. Busca dónde verla en Chile', dur: '99 min', u: 'https://www.justwatch.com/cl/buscar?q=Rocky+III' },
  { t: 'Rocky IV', c: 'Películas clásicas', d: 'Cuarta parte, de 1985. Busca dónde verla en Chile', dur: '91 min', u: 'https://www.justwatch.com/cl/buscar?q=Rocky+IV' },
  { t: 'La Máscara (The Mask)', c: 'Películas clásicas', d: 'Comedia de 1994 con Jim Carrey. Busca dónde verla en Chile', dur: '101 min', u: 'https://www.justwatch.com/cl/buscar?q=The+Mask+1994' },
  // ---- Acción clásica ----
  { t: 'Contacto Sangriento (Bloodsport)', c: 'Acción clásica', d: 'Van Damme en el torneo de artes marciales, de 1988. Busca dónde verla en Chile', dur: '92 min', u: 'https://www.justwatch.com/cl/buscar?q=Bloodsport' },
  { t: 'Kickboxer', c: 'Acción clásica', d: 'Van Damme y el muay thai, de 1989. Busca dónde verla en Chile', dur: '97 min', u: 'https://www.justwatch.com/cl/buscar?q=Kickboxer+1989' },
  { t: 'Soldado Universal (Universal Soldier)', c: 'Acción clásica', d: 'Ciencia ficción y acción con Van Damme y Dolph Lundgren, de 1992. Busca dónde verla en Chile', dur: '104 min', u: 'https://www.justwatch.com/cl/buscar?q=Universal+Soldier+1992' },
  { t: 'Timecop', c: 'Acción clásica', d: 'Van Damme como policía del tiempo, de 1994. Busca dónde verla en Chile', dur: '99 min', u: 'https://www.justwatch.com/cl/buscar?q=Timecop' },
  // ---- Conciertos ----
  { t: 'Live Music Archive', c: 'Conciertos', d: 'Miles de conciertos en vivo autorizados por las bandas, en Internet Archive', dur: 'Variable', u: 'https://archive.org/details/etree' },
  { t: 'YouTube: conciertos oficiales', c: 'Conciertos', d: 'Busca conciertos completos en canales oficiales de artistas y festivales', dur: '60-180 min', u: 'https://www.youtube.com/results?search_query=concierto+completo+canal+oficial' },
  { t: 'YouTube Music', c: 'Conciertos', d: 'Música y presentaciones en vivo, gratis con anuncios', dur: 'Variable', u: 'https://music.youtube.com' },
];

let favoritos = leer('favoritos', []);

function llenarFiltro() {
  const cats = [...new Set(catalogo.map((x) => x.c))];
  cats.forEach((c) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    $('#filtroCat').appendChild(o);
  });
}

function tarjeta(it) {
  const esFav = favoritos.includes(it.t);
  const d = document.createElement('div');
  d.className = 'card';
  d.innerHTML =
    '<h3>' + it.t + '</h3><p>' + it.d + '</p><p class="tag">' + it.c + ' · ' + it.dur + '</p>';
  const a = document.createElement('a');
  a.href = it.u;
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = '<button class="b">Abrir</button>';
  const f = document.createElement('button');
  f.className = 'b g';
  f.textContent = esFav ? '⭐ Quitar' : '☆ Favorito';
  f.onclick = () => {
    favoritos = esFav ? favoritos.filter((x) => x !== it.t) : favoritos.concat(it.t);
    guardar('favoritos', favoritos);
    dibujarCatalogo();
    dibujarFavoritos();
  };
  d.append(a, f);
  return d;
}

function dibujarCatalogo() {
  const q = $('#buscaCat').value.toLowerCase();
  const cat = $('#filtroCat').value;
  const cont = $('#catalogo');
  cont.innerHTML = '';
  catalogo
    .filter((x) => (!cat || x.c === cat) && (!q || (x.t + x.d).toLowerCase().includes(q)))
    .forEach((x) => cont.appendChild(tarjeta(x)));
}

function dibujarFavoritos() {
  const cont = $('#listaFav');
  cont.innerHTML = '';
  const items = catalogo.filter((x) => favoritos.includes(x.t));
  if (!items.length) cont.innerHTML = '<p class="tag">Aún no tienes favoritos. Marca alguno en Descubrir.</p>';
  items.forEach((x) => cont.appendChild(tarjeta(x)));
}

function dibujarAprender() {
  const cont = $('#listaAprender');
  cont.innerHTML = '';
  catalogo
    .filter((x) => x.c === 'Cursos' || x.c === 'Conferencias' || x.c === 'Documentales')
    .forEach((x) => cont.appendChild(tarjeta(x)));
}

$('#buscaCat').oninput = dibujarCatalogo;
$('#filtroCat').onchange = dibujarCatalogo;

llenarFiltro();
dibujarCatalogo();
dibujarFavoritos();
dibujarAprender();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
