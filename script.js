(function() {
  'use strict';

  /* ============================================================
     PARTICLE CANVAS — floating embers, slow fade
     ============================================================ */
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      canvas.style.display = 'none';
    } else {
      const ctx = canvas.getContext('2d');
      let width, height;
      let particles = [];
      const PARTICLE_COUNT = 55;
      const MAX_SPEED = 0.18;

      function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.4 + 0.4,
            speedX: (Math.random() - 0.5) * MAX_SPEED,
            speedY: (Math.random() - 0.5) * MAX_SPEED - 0.02,
            opacity: Math.random() * 0.5 + 0.15,
          });
        }
      }

      function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
      }

      function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        for (let p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
          gradient.addColorStop(0, `rgba(210, 140, 140, ${p.opacity * 0.9})`);
          gradient.addColorStop(1, `rgba(140, 60, 60, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();

          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;
        }
        requestAnimationFrame(drawParticles);
      }

      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      drawParticles();
    }
  }

  /* ============================================================
     AUDIO PLAYER — custom controls, no autoplay
     ============================================================ */
  const audio = document.getElementById('heartbreakAudio');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playIcon = document.getElementById('playIcon');
  const timeDisplay = document.getElementById('timeDisplay');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');

  if (audio && playPauseBtn) {
    let isSeeking = false;

    function formatTime(seconds) {
      if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updatePlayState() {
      if (audio.paused) {
        playIcon.textContent = '▶';
        playPauseBtn.setAttribute('aria-label', 'Play audio');
      } else {
        playIcon.textContent = '❚❚';
        playPauseBtn.setAttribute('aria-label', 'Pause audio');
      }
    }

    function updateProgress() {
      if (isSeeking) return;
      const current = audio.currentTime;
      const duration = audio.duration || 0;
      timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      if (duration > 0) {
        const percent = (current / duration) * 100;
        progressFill.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', Math.round(percent));
      } else {
        progressFill.style.width = '0%';
      }
    }

    audio.addEventListener('loadedmetadata', updateProgress);
    playPauseBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => { playIcon.textContent = '▶'; });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', updatePlayState);
    audio.addEventListener('pause', updatePlayState);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', updatePlayState);
    audio.addEventListener('seeked', () => { isSeeking = false; updateProgress(); });

    updateProgress();
    updatePlayState();

    // Seeking: mouse, touch, keyboard
    function handleSeek(e) {
      e.preventDefault();
      isSeeking = true;
      const rect = progressBar.getBoundingClientRect();
      let clientX = e.touches ? e.touches[0].clientX : e.clientX;
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.min(1, Math.max(0, ratio));
      if (audio.duration) {
        audio.currentTime = ratio * audio.duration;
        progressFill.style.width = (ratio * 100) + '%';
        timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        progressBar.setAttribute('aria-valuenow', Math.round(ratio * 100));
      }
      setTimeout(() => { isSeeking = false; }, 150);
    }

    progressBar.addEventListener('mousedown', (e) => {
      handleSeek(e);
      function onMouseMove(moveEvent) {
        if (!isSeeking) return;
        const rect = progressBar.getBoundingClientRect();
        let ratio = (moveEvent.clientX - rect.left) / rect.width;
        ratio = Math.min(1, Math.max(0, ratio));
        if (audio.duration) {
          audio.currentTime = ratio * audio.duration;
          progressFill.style.width = (ratio * 100) + '%';
          timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
          progressBar.setAttribute('aria-valuenow', Math.round(ratio * 100));
        }
      }
      function onMouseUp() {
        isSeeking = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    progressBar.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleSeek(e);
      function onTouchMove(moveEvent) {
        e.preventDefault();
        if (!isSeeking) return;
        const rect = progressBar.getBoundingClientRect();
        const touch = moveEvent.touches[0];
        let ratio = (touch.clientX - rect.left) / rect.width;
        ratio = Math.min(1, Math.max(0, ratio));
        if (audio.duration) {
          audio.currentTime = ratio * audio.duration;
          progressFill.style.width = (ratio * 100) + '%';
          timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
          progressBar.setAttribute('aria-valuenow', Math.round(ratio * 100));
        }
      }
      function onTouchEnd() {
        isSeeking = false;
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
      }
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }, { passive: false });

    progressBar.addEventListener('keydown', (e) => {
      if (!audio.duration) return;
      let delta = 0;
      if (e.key === 'ArrowRight') delta = 5;
      else if (e.key === 'ArrowLeft') delta = -5;
      else if (e.key === 'Home') {
        audio.currentTime = 0;
        e.preventDefault();
        updateProgress();
        return;
      } else if (e.key === 'End') {
        audio.currentTime = audio.duration;
        e.preventDefault();
        updateProgress();
        return;
      } else return;
      e.preventDefault();
      const newTime = Math.min(audio.duration, Math.max(0, audio.currentTime + delta));
      audio.currentTime = newTime;
      updateProgress();
    });

    audio.addEventListener('error', () => {
      timeDisplay.textContent = '0:00 / 0:00';
      progressFill.style.width = '0%';
    });

    audio.addEventListener('timeupdate', () => {
      if (!isSeeking) updateProgress();
    });

    // Track play event anonymously
    audio.addEventListener('play', function trackPlay() {
      try {
        const payload = {
          event: 'audio_play',
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        };
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics', blob);
        } else {
          fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } catch (e) {}
    }, { once: true });
  }

  /* ============================================================
     ANALYTICS BEACON — page view
     ============================================================ */
  (function sendAnalytics() {
    try {
      const payload = {
        event: 'page_view',
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        screen: `${window.screen.width}x${window.screen.height}`,
        referrer: document.referrer || 'direct',
      };
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics', blob);
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {}
  })();

  console.log('· still, the light · — admin backend at /admin (protected)');
})();
