let player;
let hlsInstance;

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');

    // ⚠️ Замените на реальный URL вашего HLS-потока
    const source = 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8';

    if (!video) {
        console.error('Видео-элемент не найден!');
        return;
    }

    // Инициализация Plyr (до загрузки HLS, чтобы Plyr отрисовал контролы)
    const options = {
        controls: [
            'play-large',
            'rewind',
            'play',
            'fast-forward',
            'progress',
            'current-time',
            'duration',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen'
        ],
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] }
    };

    player = new Plyr(video, options);

    // Подключаем HLS
    if (Hls.isSupported()) {
        hlsInstance = new Hls();
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            // Получаем доступные качества
            const availableQualities = hlsInstance.levels.map(level => level.height);
            availableQualities.sort((a, b) => b - a);

            // Обновляем настройки качества в Plyr
            player.options.quality = {
                default: availableQualities[0],
                options: availableQualities,
                forced: true,
                onChange: updateQuality
            };

            console.log('HLS загружен, качества:', availableQualities);
        });

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            console.error('Ошибка HLS:', data);
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Нативная поддержка HLS (Safari)
        video.src = source;
    } else {
        console.warn('HLS не поддерживается');
    }

    // Функция смены качества
    function updateQuality(newQuality) {
        if (!hlsInstance) return;
        const levels = hlsInstance.levels;
        for (let i = 0; i < levels.length; i++) {
            if (levels[i].height === newQuality) {
                hlsInstance.currentLevel = i;
                console.log(`Качество переключено на ${newQuality}p`);
                break;
            }
        }
    }
});