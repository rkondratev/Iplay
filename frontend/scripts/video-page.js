const API_URL = 'http://localhost:8000';

function getVideoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

document.addEventListener('DOMContentLoaded', async () => {
    const videoId = getVideoIdFromUrl();
    
    if (!videoId) {
        alert('ID видео не указан!');
        window.location.href = 'index.html';
        return;
    }
    
    const videoData = await loadVideoData(videoId);
    
    if (!videoData) {
        alert('Видео не найдено!');
        window.location.href = 'index.html';
        return;
    }
    
    initPlayer(videoId, videoData.video_url);
    
    renderVideoDetails(videoData);
    
    loadRelatedVideos(videoId);
    
    trackView(videoId);
});

function initPlayer(videoId, videoUrl) {
    const video = document.getElementById('main-player');
    
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
            options: [720, 480, 360],  
            forced: true,
            onChange: (newQuality) => {
                console.log('Качество изменено на:', newQuality);
            }
        },
        
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] }
    };
    
    const player = new Plyr(video, options);
    let hlsInstance;
    
    
    player.on('qualitychange', (event) => {
        if (!hlsInstance) return;
        const quality = event.detail.quality;
        
        if (quality === 0) {
            hlsInstance.currentLevel = -1;
            console.log(`[${videoId}] Качество → Авто`);
            updateQualityDisplay(player, 'Авто');
            return;
        }
        
        const levels = hlsInstance.levels;
        for (let i = 0; i < levels.length; i++) {
            if (levels[i].height === quality) {
                hlsInstance.currentLevel = i;
                console.log(`[${videoId}] Качество → ${quality}p`);
                updateQualityDisplay(player, quality + 'p');
                break;
            }
        }
    });
    
    if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(videoUrl);
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
            
            console.log(`[${videoId}] HLS загружен, качества:`, [0, ...availableQualities]);
        });
        
        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            console.error(`[${videoId}] Ошибка HLS:`, data);
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
    }
}


function updateQualityDisplay(player, qualityText) {
    setTimeout(() => {
        try {
            
            const settingsBtn = document.querySelector('.plyr__control[data-plyr="settings"]');
            if (settingsBtn) {
                
                let badge = settingsBtn.querySelector('.plyr__badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'plyr__badge';
                    badge.style.fontSize = '11px';
                    badge.style.marginLeft = '4px';
                    settingsBtn.appendChild(badge);
                }
                badge.textContent = qualityText;
            }
            
            
            const menu = player.elements.menu;
            if (menu) {
                
                const qualityItems = menu.querySelectorAll('[data-plyr="quality"]');
                qualityItems.forEach(item => {
                    const valueEl = item.querySelector('.plyr__menu__value');
                    if (valueEl) {
                        valueEl.textContent = qualityText;
                    }
                });
            }
            
            console.log(`[${player.id}] Отображение качества обновлено:`, qualityText);
        } catch (error) {
            console.error('Ошибка обновления качества:', error);
        }
    }, 150);
}
        
        
async function loadVideoData(videoId) {
    try {
        const response = await fetch(`${API_URL}/api/video-info/${videoId}`);
        if (!response.ok) throw new Error('Video not found');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
        return null;
    }
}

function renderVideoDetails(data) {
    document.getElementById('video-title').textContent = data.title;
    document.getElementById('video-views').innerHTML = 
        `<span class="views-number">${formatViews(data.views)}</span> Просмотров`;
    document.getElementById('video-date').textContent = data.date;
    document.getElementById('video-channel').textContent = data.channel;
    document.title = `${data.title} — Ifbest`;
}

function trackView(videoId) {
    fetch(`${API_URL}/api/video/${videoId}/view`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            console.log(`[${videoId}] Просмотр засчитан, новое значение:`, data.views);
            document.getElementById('video-views').innerHTML = 
                `<span class="views-number">${formatViews(data.views)}</span> Просмотров`;
        })
        .catch(err => console.error(err));
}

async function loadRelatedVideos(currentVideoId) {
    try {
        const response = await fetch(`${API_URL}/api/videos`);
        const allVideos = await response.json();
        
        const relatedVideos = allVideos.filter(v => v.id !== parseInt(currentVideoId));
        
        const container = document.getElementById('related-videos');
        container.innerHTML = relatedVideos.map(video => `
            <a href="video.html?id=${video.id}" class="related-video-item">
                <div class="related-video-thumb"></div>
                <div class="related-video-info">
                    <h6>${video.title}</h6>
                    <p>${video.channel_name} • ${formatViews(video.views)} просмотров</p>
                </div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Ошибка загрузки похожих видео:', error);
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
