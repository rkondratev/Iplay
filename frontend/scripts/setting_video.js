const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    const videos = document.querySelectorAll('.plyr-video');

    if (videos.length === 0) {
        console.error('Видео-элементы не найдены!');
        return;
    }

    const options = {
        controls: [
            'play-large', 'rewind', 'play', 'fast-forward',
            'progress', 'current-time', 'duration',
            'mute', 'volume', 'captions', 'settings',
            'pip', 'airplay', 'fullscreen'
        ],
        settings: ['quality', 'speed'],
        quality: {
    default: 720,
    options: [1080,720, 480, 360],
    forced: true,
    onChange: (newQuality) => {
        console.log('Качество изменено на:', newQuality);
    }
},
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] }
    };

    videos.forEach((video, index) => {
        const videoId = video.id.replace('player-', '');
        let hlsInstance;
        let viewRecorded = false;

        const player = new Plyr(video, options);

        player.on('play', () => {
            if (!viewRecorded) {
                viewRecorded = true;
                trackView(videoId);
                console.log(`[${videoId}] Просмотр засчитан`);
            }
        });

player.on('qualitychange', (event) => {
    if (!hlsInstance) return;
    const quality = event.detail.quality;
    
    if (quality === 0) {
        hlsInstance.currentLevel = -1;
    } else {
        const levels = hlsInstance.levels;
        const index = levels.findIndex(level => level.height === quality);
        if (index !== -1) {
            hlsInstance.currentLevel = index;
        }
    }
    
    setTimeout(() => {
        const badge = player.elements.buttons.settings?.querySelector('.plyr__badge');
        if (badge) {
            badge.textContent = quality === 0 ? 'Авто' : quality + 'p';
        }
    }, 50);
});

        loadVideoUrl(videoId).then(url => {
            if (!url) {
                console.error(`[${videoId}] URL не найден`);
                return;
            }
            
            if (Hls.isSupported()) {
                hlsInstance = new Hls();
                hlsInstance.loadSource(url);
                hlsInstance.attachMedia(video);

                hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                    const availableQualities = hlsInstance.levels
                        .map(level => level.height)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .sort((a, b) => b - a);

                    player.options.quality = {
                        default: availableQualities[0] || 480,
                        options: [0, ...availableQualities],
                        forced: true
                    };

                    console.log(`[${videoId}] HLS загружен, качества:`, availableQualities);
                });

                hlsInstance.on(Hls.Events.ERROR, (event, data) => {
                    console.error(`[${videoId}] Ошибка HLS:`, data);
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            }
        });
    });

    setTimeout(() => {
        loadAllVideoInfo();
    }, 1000);
});

async function loadVideoUrl(videoId) {
    try {
        const response = await fetch(`${API_URL}/api/video-info/${videoId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.video_url;
    } catch (error) {
        console.error(`Ошибка загрузки URL для видео #${videoId}:`, error);
        return null;
    }
}

function trackView(videoId) {
    fetch(`${API_URL}/api/video/${videoId}/view`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            console.log(`[${videoId}] Новое кол-во просмотров:`, data.views);
            updateViewsDisplay(videoId, data.views);
        })
        .catch(err => console.error(err));
}

function updateViewsDisplay(videoId, newViews) {
    const container = document.querySelector(`.video-info[data-video-id="${videoId}"]`);
    if (container) {
        const viewsElement = container.querySelector('.views-number');
        if (viewsElement) {
            viewsElement.textContent = formatViews(newViews);
        }
    }
}

async function loadVideoInfo(videoId) {
    try {
        const response = await fetch(`${API_URL}/api/video-info/${videoId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Ошибка загрузки данных для видео #${videoId}:`, error);
        return null;
    }
}

function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

function renderVideoInfo(container, data) {
    if (!data) {
        container.innerHTML = '<p class="video-meta">Данные недоступны</p>';
        return;
    }
    
    const videoId = data.id;
    
    container.innerHTML = `
        <div class="video-info-right">
            <a href="video.html?id=${videoId}" class="video-title-link">
                <h5 class="video-title">${data.title}</h5>
            </a>
            <p class="video-meta">
                ${data.channel} • <span class="views-count"><span class="views-number">${formatViews(data.views)}</span> Просмотров</span> • ${data.date}
            </p>
        </div>
    `;
    
    const playerCard = container.closest('.player-card');
    if (playerCard) {
        playerCard.style.cursor = 'pointer';
        playerCard.addEventListener('dblclick', (e) => {
            e.preventDefault();
            window.open(`video.html?id=${videoId}`, '_blank');
        });
    }
}

async function loadAllVideoInfo() {
    const infoContainers = document.querySelectorAll('.video-info[data-video-id]');
    
    if (infoContainers.length === 0) {
        console.warn('Контейнеры для видео-инфо не найдены');
        return;
    }
    
    console.log(`Загрузка данных для ${infoContainers.length} видео...`);
    
    const promises = Array.from(infoContainers).map(async (container) => {
        const videoId = container.getAttribute('data-video-id');
        const data = await loadVideoInfo(videoId);
        renderVideoInfo(container, data);
        console.log(`[Видео #${videoId}] данные загружены`);
    });
    
    await Promise.all(promises);
    console.log('Все данные загружены');
}

function updateQualityDisplay(player, qualityText) {
    setTimeout(() => {
        const settingsButton = player.elements.buttons.settings;
        if (settingsButton) {
            const badge = settingsButton.querySelector('.plyr__badge');
            if (badge) {
                badge.textContent = qualityText;
            }
        }
        
        const menuContainer = player.elements.menu;
        if (menuContainer) {
            const qualityItems = menuContainer.querySelectorAll('[data-plyr="quality"]');
            qualityItems.forEach(item => {
                const valueSpan = item.querySelector('.plyr__menu__value');
                if (valueSpan) {
                    valueSpan.textContent = qualityText;
                }
            });
        }
    }, 100);
}
