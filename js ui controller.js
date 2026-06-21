class UIController {
    constructor() {
        this.video = document.querySelector('video');
        this.playerContainer = document.querySelector('.player');
        this.viewsSpan = document.querySelector('.views span');
        
        this.btnPlay = document.querySelector('.custom-controls button:first-child');
        this.progressContainer = document.querySelector('.progress-container');
        this.progressBar = document.querySelector('.progress');
        this.timeDisplay = document.querySelector('.custom-controls span');
        this.selectQuality = document.querySelector('.custom-controls select:first-of-type');
        this.selectSpeed = document.querySelector('.custom-controls select:last-of-type');
        this.btnFullscreen = document.querySelector('.custom-controls button:last-child');
        
        this.videoButtons = document.querySelectorAll('.video-list button');
        this.isPlaying = false;
        this.qualityLevels = [];
        this.isDragging = false;
        this.initEvents();
    }

    initEvents() {
        if (this.btnPlay) {
            this.btnPlay.addEventListener('click', () => {
                this.togglePlay();
            });
        }

        if (this.progressContainer) {
            this.progressContainer.addEventListener('click', (e) => {
                const rect = this.progressContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = (x / rect.width) * 100;
                const time = (percent / 100) * this.video.duration;
                
                document.dispatchEvent(new CustomEvent('player:seek', {
                    detail: { time }
                }));
            });

            this.progressContainer.addEventListener('mousedown', () => {
                this.isDragging = true;
            });

            document.addEventListener('mouseup', () => {
                this.isDragging = false;
            });

            this.progressContainer.addEventListener('mousemove', (e) => {
                if (this.isDragging) {
                    const rect = this.progressContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                    const time = (percent / 100) * this.video.duration;
                    
                    document.dispatchEvent(new CustomEvent('player:seek', {
                        detail: { time }
                    }));
                }
            });
        }

        if (this.selectQuality) {
            this.selectQuality.addEventListener('change', (e) => {
                const value = e.target.value;
                let index;
                if (value === 'Auto') {
                    index = -1;
                } else {
                    index = this.qualityLevels.findIndex(l => `${l.height}p` === value);
                }
                document.dispatchEvent(new CustomEvent('player:quality', {
                    detail: { index }
                }));
            });
        }

        if (this.selectSpeed) {
            this.selectSpeed.addEventListener('change', (e) => {
                const speed = parseFloat(e.target.value);
                document.dispatchEvent(new CustomEvent('player:speed', {
                    detail: { rate: speed }
                }));
            });
        }

        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('player:fullscreen'));
            });
        }

        this.video.addEventListener('timeupdate', () => {
            if (!this.isDragging) {
                this.updateProgress();
            }
        });

        this.video.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });

        this.video.addEventListener('play', () => {
            this.setPlaying(true);
            document.dispatchEvent(new CustomEvent('player:play'));
        });

        this.video.addEventListener('pause', () => {
            this.setPlaying(false);
            document.dispatchEvent(new CustomEvent('player:pause'));
        });

        this.video.addEventListener('ended', () => {
            this.setPlaying(false);
        });

        this.videoButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('player:select-video', {
                    detail: { index }
                }));
                this.videoButtons.forEach(b => b.style.background = '#2563eb');
                btn.style.background = '#1d4ed8';
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'f':
                    document.dispatchEvent(new CustomEvent('player:fullscreen'));
                    break;
            }
        });
    }

    togglePlay() {
        document.dispatchEvent(new CustomEvent('player:toggle'));
    }

    setPlaying(state) {
        this.isPlaying = state;
        if (this.btnPlay) {
            this.btnPlay.textContent = state ? '⏸ Pause' : '▶ Play';
        }
    }

    updateProgress() {
        if (this.video.duration && !this.isDragging) {
            const progress = (this.video.currentTime / this.video.duration) * 100;
            this.progressBar.style.width = progress + '%';
            this.updateTimeDisplay();
        }
    }

    updateTimeDisplay() {
        if (this.timeDisplay) {
            const current = this.formatTime(this.video.currentTime);
            const duration = this.formatTime(this.video.duration);
            this.timeDisplay.textContent = `${current} / ${duration}`;
        }
    }

    updateDuration() {
        this.updateTimeDisplay();
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    setQualityLevels(levels) {
        this.qualityLevels = levels;
        if (!this.selectQuality) return;
        
        const currentValue = this.selectQuality.value;
        this.selectQuality.innerHTML = '';
        const autoOption = document.createElement('option');
        autoOption.value = 'Auto';
        autoOption.textContent = 'Auto';
        this.selectQuality.appendChild(autoOption);

        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = `${level.height}p`;
            option.textContent = `${level.height}p`;
            this.selectQuality.appendChild(option);
        });

        if (currentValue && this.selectQuality.querySelector(`option[value="${currentValue}"]`)) {
            this.selectQuality.value = currentValue;
        }
    
        this.selectQuality.style.display = levels.length > 1 ? 'block' : 'none';
    }

    updateViews(count) {
        if (this.viewsSpan) {
            this.viewsSpan.textContent = count;
        }
    }

    updateVideoTitle(title) {
        const titleElement = document.querySelector('.video-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    setVideoSource(url) {
        if (!url.includes('.m3u8')) {
            this.video.src = url;
            this.video.load();
        }
    }
}