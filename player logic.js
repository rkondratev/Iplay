class IfbestPlayer {
    constructor(videoElement) {
        this.video = videoElement;
        this.hls = null;
        this.currentLevel = -1;
        this.levels = [];
        this.isPlaying = false;
        this.onLevelsReady = null;
        this.currentUrl = null;
    }

    loadManifest(url) {
        this.currentUrl = url;
        
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
            this.video.src = url;
            this.video.addEventListener('loadedmetadata', () => {
                console.log('Нативное воспроизведение HLS');
                if (this.onLevelsReady) {
                    this.onLevelsReady([{ height: 1080 }, { height: 720 }, { height: 480 }]);
                }
            });
            return;
}

        if (Hls.isSupported()) {
            this.hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferLength: 30,
                maxMaxBufferLength: 600,
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                this.levels = this.hls.levels;
                this.currentLevel = -1;
                
                console.log('Доступные качества:', this.levels.map(l => l.height + 'p'));
                
                if (this.onLevelsReady) {
                    this.onLevelsReady(this.levels);
                }
            });

            this.hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.log('Ошибка сети, пытаемся восстановить...');
                            this.hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('Ошибка медиа, пытаемся восстановить...');
                            this.hls.recoverMediaError();
                            break;
                        default:
                            console.log('Фатальная ошибка HLS');
                            break;
                    }
                }
            });

            this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                console.log(`Уровень качества: ${data.level}`);
            });
        } else {
            console.error('HLS не поддерживается в этом браузере');
        }
    }

    play() {
        if (this.video) {
            const promise = this.video.play();
            if (promise !== undefined) {
                promise
                    .then(() => {
                        this.isPlaying = true;
                    })
                    .catch(error => {
                        console.warn('Play был заблокирован:', error);
                        this.isPlaying = false;
                    });
            }
        }
    }

    pause() {
        if (this.video) {
            this.video.pause();
            this.isPlaying = false;
        }
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
        return this.isPlaying;
    }

    setQuality(index) {
        if (!this.hls) {
            console.warn('HLS не инициализирован');
            return;
        }
        
        this.currentLevel = index;
        this.hls.currentLevel = index;
        console.log(`Качество переключено на уровень ${index}`);
    }

    setSpeed(rate) {
        if (this.video) {
            this.video.playbackRate = rate;
            console.log(`Скорость: ${rate}x`);
        }
    }

    toggleFullscreen() {
        const container = this.video.parentElement;
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    seekTo(time) {
        if (this.video) {
            this.video.currentTime = Math.max(0, Math.min(time, this.video.duration || 0));
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.src = '';
            this.video.load();
        }
        this.isPlaying = false;
    }

    get currentTime() {
        return this.video ? this.video.currentTime : 0;
    }

    get duration() {
        return this.video ? this.video.duration : 0;
    }

    get paused() {
        return this.video ? this.video.paused : true;
    }
}