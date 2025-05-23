let allData = [];
let animeData = [];
let filmData = [];
let currentPage = 1;
const itemsPerPage = 10;

document.body.style.background = "url('background.jpg') no-repeat center center fixed";
document.body.style.backgroundSize = "cover";
document.body.style.backgroundAttachment = "fixed";

Promise.all([
  fetch('AnimeData.json').then(res => res.json()),
  fetch('FilmData.json').then(res => res.json())
]).then(([anime, film]) => {
  animeData = anime;
  filmData = film;
  allData = [...anime, ...film];

  const container = document.getElementById("animeCardsContainer") || document.getElementById("animeListContainer");

  if (container && container.id === "animeCardsContainer") {
    renderPaginatedAnimeCards(container, animeData, currentPage);
    renderPaginationControls(animeData.length);
    renderFilmSection(filmData);
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    const suggestionBox = document.createElement("div");
    suggestionBox.className = "position-absolute bg-white border rounded mt-1 shadow w-150";
    suggestionBox.style.zIndex = "9999";
    suggestionBox.style.maxHeight = "300px";
    suggestionBox.style.overflowY = "auto";
    searchInput.parentNode.appendChild(suggestionBox);

    let selectedIndex = -1;

    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase();
      suggestionBox.innerHTML = "";
      selectedIndex = -1;

      if (!keyword) return;

      const filtered = allData.filter(item => item.title.toLowerCase().includes(keyword)).slice(0, 10);
      if (filtered.length === 1) selectedIndex = 0;

      filtered.forEach((item, index) => {
        const option = document.createElement("div");
        option.className = "d-flex align-items-center gap-2 px-2 py-2 search-suggestion border-bottom";
        option.style.cursor = "pointer";
        option.dataset.index = index;

        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.title;
        img.style.width = "40px";
        img.style.height = "60px";
        img.style.objectFit = "cover";
        img.className = "rounded";

        const info = document.createElement("div");
        info.className = "d-flex flex-column";

        const title = document.createElement("strong");
        title.textContent = item.title;

        const label = document.createElement("small");
        label.className = "text-muted";
        label.textContent = animeData.includes(item) ? "Anime" : "Film";

        info.appendChild(title);
        info.appendChild(label);
        option.appendChild(img);
        option.appendChild(info);
        option.onclick = () => {
          window.location.href = `AnimeList.html?id=${item.id}`;
        };

        suggestionBox.appendChild(option);
      });
    });

    searchInput.addEventListener("keydown", (e) => {
      const options = suggestionBox.querySelectorAll(".search-suggestion");
      if (options.length === 0) return;

      if (e.key === "ArrowDown") selectedIndex = (selectedIndex + 1) % options.length;
      else if (e.key === "ArrowUp") selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex === -1 && options.length === 1) options[0].click();
        else if (selectedIndex >= 0 && selectedIndex < options.length) options[selectedIndex].click();
      }

      options.forEach((opt, i) => {
        opt.style.backgroundColor = i === selectedIndex ? "#e9ecef" : "transparent";
      });
    });

    document.addEventListener("click", (e) => {
      if (!suggestionBox.contains(e.target) && e.target !== searchInput) {
        suggestionBox.innerHTML = "";
      }
    });
  }

  if (window.location.pathname.includes("VideoPlayer.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const episode = parseInt(urlParams.get("ep"));
    const season = urlParams.get("season");

    const item = allData.find(entry => entry.id === id);
    if (item) {
      const titleEl = document.getElementById("animeTitle");
      titleEl.style.backgroundColor = "rgba(255,255,255,0.85)";
      titleEl.style.padding = "10px";
      titleEl.style.borderRadius = "8px";

      const epList = item.episodes[season];
      const ep = epList?.[episode];
      if (ep) {
        titleEl.textContent = `${item.title} - ${ep.title}`;
        document.getElementById("animeVideo").src = ep.url;

        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");

        prevBtn.style.display = "inline-block";
        nextBtn.style.display = "inline-block";
        prevBtn.disabled = episode <= 0;
        nextBtn.disabled = episode >= epList.length - 1;

        prevBtn.onclick = () => {
          if (episode > 0) {
            window.location.href = `VideoPlayer.html?id=${item.id}&season=${encodeURIComponent(season)}&ep=${episode - 1}`;
          }
        };

        nextBtn.onclick = () => {
          if (episode < epList.length - 1) {
            window.location.href = `VideoPlayer.html?id=${item.id}&season=${encodeURIComponent(season)}&ep=${episode + 1}`;
          }
        };
      }
    }
  }

  if (window.location.pathname.includes("AnimeList.html")) {
    renderAnimeList(allData);
  }
  if (document.getElementById("latestUpdatesContainer")) {
  renderLatestUpdates();
}
});

function renderPaginatedAnimeCards(container, data, page) {
  data.sort((a, b) => {
    if (a.status === "Ongoing" && b.status !== "Ongoing") return -1;
    if (a.status !== "Ongoing" && b.status === "Ongoing") return 1;
    return 0;
  });

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = data.slice(start, end);

  container.innerHTML = `
    <div class="d-flex flex-row flex-nowrap overflow-auto gap-3 pb-2">
      ${paginatedData.map(item => {
        const statusBadge = item.status === "Ongoing"
          ? '<span class="badge bg-warning">Ongoing</span>'
          : '<span class="badge bg-success">Complete</span>';

        return `
          <div class="anime-card text-center" style="flex: 0 0 auto; width: 150px;">
            <a href="AnimeList.html?id=${item.id}" class="text-decoration-none">
              <img src="${item.image}" alt="${item.title}" class="img-fluid rounded mb-2">
              <div class="anime-card-title" style="background-color: rgba(255,255,255,0.8); padding: 5px; border-radius: 6px;">
                ${statusBadge} ${item.title}
              </div>
            </a>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPaginationControls(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById("paginationControls") || createPaginationContainer();
  paginationContainer.innerHTML = '';

  const prevBtn = document.createElement("img");
  prevBtn.src = "prev.png";
  prevBtn.alt = "Previous";
  prevBtn.style.width = "32px";
  prevBtn.className = "me-2";

  if (currentPage === 1) {
    prevBtn.style.opacity = 0.5;
    prevBtn.style.pointerEvents = "none";
    prevBtn.style.cursor = "default";
  } else {
    prevBtn.style.cursor = "pointer";
    prevBtn.onclick = () => changePage(currentPage - 1);
  }

  const nextBtn = document.createElement("img");
  nextBtn.src = "next.png";
  nextBtn.alt = "Next";
  nextBtn.style.width = "32px";
  nextBtn.className = "ms-2";

  if (currentPage === totalPages) {
    nextBtn.style.opacity = 0.5;
    nextBtn.style.pointerEvents = "none";
    nextBtn.style.cursor = "default";
  } else {
    nextBtn.style.cursor = "pointer";
    nextBtn.onclick = () => changePage(currentPage + 1);
  }

  paginationContainer.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const dot = document.createElement("img");
    dot.src = i === currentPage ? "bulatbesar.png" : "bulatkecil.png";
    dot.alt = `Page ${i}`;
    dot.style.width = i === currentPage ? "32px" : "16px";
    dot.style.cursor = "pointer";
    dot.style.margin = "0 4px";
    dot.onclick = () => changePage(i);
    paginationContainer.appendChild(dot);
  }

  paginationContainer.appendChild(nextBtn);
}

function createPaginationContainer() {
  const container = document.getElementById("animeCardsContainer");
  const paginationDiv = document.createElement("div");
  paginationDiv.id = "paginationControls";
  paginationDiv.className = "d-flex justify-content-center align-items-center mt-3";
  paginationDiv.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
  paginationDiv.style.borderRadius = "10px";
  paginationDiv.style.padding = "10px 20px";
  paginationDiv.style.marginTop = "20px";
  paginationDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
  container.parentNode.insertBefore(paginationDiv, container.nextSibling);
  return paginationDiv;
}

function changePage(newPage) {
  currentPage = newPage;
  const container = document.getElementById("animeCardsContainer");
  const keyword = document.getElementById("searchInput")?.value?.toLowerCase();
  const filtered = keyword ? animeData.filter(a => a.title.toLowerCase().includes(keyword)) : animeData;
  renderPaginatedAnimeCards(container, filtered, currentPage);
  renderPaginationControls(filtered.length);
}

function renderAnimeList(data) {
  const container = document.getElementById("animeListContainer");
  const urlParams = new URLSearchParams(window.location.search);
  const animeId = urlParams.get("id");
  const anime = data.find(a => a.id === animeId);

  if (anime) {
    container.innerHTML = '';
    const infoCard = document.createElement("div");
    infoCard.style.backgroundColor = "rgba(255,255,255,0.85)";
    infoCard.style.padding = "20px";
    infoCard.style.borderRadius = "12px";
    infoCard.innerHTML = `
      <img src="${anime.image}" class="img-fluid mb-3" alt="${anime.title}">
      <h2>${anime.title}</h2>
      <p>${anime.description}</p>
      <p><strong>Date:</strong> ${anime.date}</p>
    `;
    container.appendChild(infoCard);

    for (const season of anime.season) {
      const episodes = anime.episodes[season];
      if (episodes && episodes.length > 0) {
        const seasonWrapper = document.createElement("div");
        seasonWrapper.className = "mb-4";

        const seasonTitle = document.createElement("h4");
        seasonTitle.innerHTML = `${season} <span class="badge bg-primary">${episodes.length} eps</span>`;
        seasonTitle.style.backgroundColor = "rgba(255,255,255,0.85)";
        seasonTitle.style.padding = "10px";
        seasonTitle.style.borderRadius = "8px";
        seasonTitle.style.marginTop = "20px";

        const episodeContainer = document.createElement("div");
        episodeContainer.className = "d-flex flex-wrap gap-2 p-3";
        episodeContainer.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
        episodeContainer.style.borderRadius = "12px";
        episodeContainer.style.maxHeight = "200px";
        episodeContainer.style.overflowY = "auto";

        episodes.forEach((ep, i) => {
          const link = `VideoPlayer.html?id=${anime.id}&ep=${i}&season=${encodeURIComponent(season)}`;
          const btn = document.createElement("a");
          btn.href = link;
          btn.className = "btn btn-sm btn-outline-primary";
          btn.textContent = ep.title;
          episodeContainer.appendChild(btn);
        });

        seasonWrapper.appendChild(seasonTitle);
        seasonWrapper.appendChild(episodeContainer);
        container.appendChild(seasonWrapper);
      }
    }
  }
}

function renderLatestUpdates(containerId = "latestUpdatesContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const ongoingAnime = animeData.filter(anime => anime.status?.toLowerCase() === "ongoing");

  const cards = ongoingAnime.map(anime => {
    const lastSeason = anime.season?.[anime.season.length - 1];
    const episodes = anime.episodes?.[lastSeason];
    const lastEpisodeIndex = episodes?.length - 1;
    const lastEpisode = episodes?.[lastEpisodeIndex];

    const epTitle = lastEpisode?.title || "Episode terbaru";
    const epUrl = lastEpisode?.url || "#";

return `
  <div class="anime-card text-center" style="width: 130px; flex: 0 0 auto;">
    <a href="VideoPlayer.html?id=${anime.id}&season=${encodeURIComponent(lastSeason)}&ep=${lastEpisodeIndex}" class="text-decoration-none">
      <img src="${anime.image}" alt="${anime.title}" class="img-fluid rounded mb-1" style="height: 160px; object-fit: cover;">
      <div style="background-color: rgba(255,255,255,0.9); padding: 6px; border-radius: 6px;">
        <span class="badge bg-warning mb-1" style="font-size: 10px;">Update</span>
        <div style="font-size: 12px;"><strong>${anime.title.length > 16 ? anime.title.slice(0, 14) + '…' : anime.title}</strong></div>
        <small style="font-size: 10px;">${epTitle.length > 25 ? epTitle.slice(0, 23) + '…' : epTitle}</small>
      </div>
    </a>
  </div>
`;
  }).join('');

  container.innerHTML = `
    <h3 class="mb-3" style="color: white;"></h3>
    <div class="d-flex flex-row flex-nowrap overflow-auto gap-3 pb-2">
      ${cards}
    </div>
  `;
}


function renderFilmSection(films) {
  const container = document.getElementById("filmSection");
  if (!container) return;

  films.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date

  container.innerHTML = `
  <h3 class="text-white mb-3" style="background-color: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px; display: inline-block;"></h3>
  <div class="d-flex flex-row flex-nowrap overflow-auto gap-3 pb-2">
    ${films.map(film => `
      <div class="anime-card text-center" style="flex: 0 0 auto; width: 150px;">
        <a href="AnimeList.html?id=${film.id}" class="text-decoration-none">
          <img src="${film.image}" alt="${film.title}" class="img-fluid rounded mb-2">
          <div class="anime-card-title" style="background-color: rgba(255,255,255,0.8); padding: 5px; border-radius: 6px;">
            <span class="badge bg-dark">Film</span> ${film.title}
          </div>
        </a>
      </div>
    `).join('')}
  </div>
`;
}