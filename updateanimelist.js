fetch('AnimeData.json')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('update-anime-list');
    list.className = 'row g-2'; // row grid kecil

    const ongoingAnime = data.filter(a => a.status.toLowerCase() === 'ongoing');

    ongoingAnime.slice(0, 10).forEach(anime => {
      const seasons = Object.keys(anime.episodes);
      const lastSeason = seasons[seasons.length - 1];
      const lastEpList = anime.episodes[lastSeason];
      const lastEpisode = lastEpList[lastEpList.length - 1];

      const col = document.createElement('div');
      col.className = 'col-4 col-sm-3 col-md-2'; // lebih kecil dan rapat

      col.innerHTML = `
        <div class="card border-0" style="font-size: 11px;">
          <a href="VideoPlayer.html?id=${anime.id}" style="text-decoration: none; color: inherit;">
            <img src="${anime.image}" class="card-img-top rounded" alt="${anime.title}" style="height: 120px; object-fit: cover;">
            <div class="card-body p-1">
              <div class="fw-bold text-truncate" title="${anime.title}">${anime.title}</div>
              <div class="text-muted text-truncate"><small>${lastEpisode.title}</small></div>
            </div>
          </a>
        </div>
      `;

      list.appendChild(col);
    });
  });