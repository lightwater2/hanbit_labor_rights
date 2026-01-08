document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('#hero');
    const muteLine = document.querySelector('#mute-line');
    const soundWaves = document.querySelector('#sound-waves');
    // Force scroll to top on refresh
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const body = document.body;

    // Text Splitting for Typewriter Effect
    const splitText = (el) => {
        const text = el.innerText;
        el.innerHTML = '';
        const chars = text.split('');
        chars.forEach((char, index) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.dataset.threshold = (index / chars.length).toString();
            span.innerText = char === ' ' ? '\u00A0' : char;
            el.appendChild(span);
        });
    };

    const mainTitle = document.querySelector('#main-title');
    if (mainTitle) {
        splitText(mainTitle);
    }

    // Create Cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.innerText = '|';

    // Keyboard Typing Sound (Cheerful & Crisp Clack)
    let audioCtx = null;
    const playTypingSound = () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const t = audioCtx.currentTime;

        // 1. 선명한 고주파 클릭 (Crisp High-end)
        const bufferSize = audioCtx.sampleRate * 0.015; // 15ms (더 짧고 snappy하게)
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(3800, t); // 더 높은 주파수 대역

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.25, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        // 2. 밝은 금속성 공명 (Bright Resonance)
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle'; // Square보다 약간 더 부드럽지만 선명하게
        osc.frequency.setValueAtTime(1400 + Math.random() * 600, t); // 피치 상향 조정

        const oscGain = audioCtx.createGain();
        oscGain.gain.setValueAtTime(0.04, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);

        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);

        noise.start(t);
        osc.start(t);
        osc.stop(t + 0.015);
    };

    // Auto-animate speaker icon (1.5 seconds)
    const animateSpeaker = () => {
        const duration = 1500; // 1.5 seconds
        const startTime = Date.now();
        const muteLine = document.querySelector('#mute-line');
        const soundWaves = document.querySelector('#sound-waves');
        const waveArcs = soundWaves.querySelectorAll('.wave-arc');

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 1. Mute line disappears (0% to 30% of 1.5s)
            const muteProgress = Math.min(progress / 0.3, 1);
            muteLine.style.opacity = 1 - muteProgress;
            muteLine.style.transform = `translate(${muteProgress * 20}px, -${muteProgress * 20}px)`;

            // 2. Sound waves appear (30% to 100% of 1.5s)
            if (progress >= 0.3) {
                soundWaves.classList.remove('hidden');
                soundWaves.style.opacity = 1;

                const waveProgress = (progress - 0.3) / 0.7;
                waveArcs.forEach((arc, index) => {
                    const threshold = index / waveArcs.length;
                    if (waveProgress > threshold) {
                        arc.classList.add('visible');
                    }
                });
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        return new Promise((resolve) => {
            animate();
            setTimeout(resolve, duration);
        });
    };

    // Auto-typing animation for main title (1.8 seconds)
    const animateTypewriter = () => {
        const titleChars = mainTitle.querySelectorAll('.char');
        const duration = 1800; // 1.8 seconds
        const startTime = Date.now();
        let lastRevealedIndex = -1;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            let lastVisibleChar = null;

            cursor.classList.add('visible');

            titleChars.forEach((char, index) => {
                const threshold = parseFloat(char.dataset.threshold);
                if (progress > threshold) {
                    if (!char.classList.contains('visible')) {
                        char.classList.add('visible');
                        // Play sound when a new character appears (skip for spaces)
                        if (index > lastRevealedIndex) {
                            const isSpace = char.innerText === '\u00A0' || char.innerText === ' ';
                            if (!isSpace) {
                                playTypingSound();
                            }
                            lastRevealedIndex = index;
                        }
                    }
                    lastVisibleChar = char;
                } else {
                    char.classList.remove('visible');
                }
            });

            // Position cursor after the last visible character, or before first if none visible
            if (lastVisibleChar) {
                if (cursor.previousSibling !== lastVisibleChar) {
                    lastVisibleChar.after(cursor);
                }
            } else {
                // No characters visible yet, put cursor at the beginning
                const firstChar = titleChars[0];
                if (firstChar && cursor.nextSibling !== firstChar) {
                    firstChar.before(cursor);
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        return new Promise((resolve) => {
            animate();
            setTimeout(resolve, duration);
        });
    };

    const maxScroll = hero.offsetHeight - window.innerHeight;

    // Initially lock scroll
    document.body.classList.add('no-scroll');

    // Start experience on click
    let experienceStarted = false;
    const startExperience = async () => {
        if (experienceStarted) return;
        experienceStarted = true;

        // Unlock audio context
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Show "화면 너머 듣는" Header & Brand Logo
        const heroMain = document.querySelector('.hero-main');
        const brandLogo = document.querySelector('.brand-logo');
        if (heroMain) heroMain.style.opacity = '1';
        if (brandLogo) brandLogo.style.opacity = '1';

        // Update Interaction Guide
        const guide = document.querySelector('#interaction-guide');
        if (guide) {
            const guideText = guide.querySelector('.guide-text');
            const chevrons = guide.querySelector('.chevrons');
            if (guideText) guideText.innerText = '스크롤하여 더 보기';
            if (chevrons) {
                chevrons.classList.remove('up');
                chevrons.classList.add('down');
            }
        }

        // Step 1: Animate Speaker (1.5s)
        await animateSpeaker();

        // Step 2: Animate Typewriter (1.8s)
        if (mainTitle) {
            mainTitle.style.opacity = '1';
            await animateTypewriter();
        }

        // Step 3: Unlock scroll only AFTER typing is done
        document.body.classList.remove('no-scroll');

        // Reveal other sections
        const hiddenElements = document.querySelectorAll('.content-section, #gallery-section, .scroll-reveal-section, footer');
        hiddenElements.forEach(el => el.style.opacity = '1');

        // Add scroll listener to hide guide after experience starts
        const handleGuideHide = () => {
            if (window.scrollY > 100) {
                if (guide) guide.classList.add('hidden');
                window.removeEventListener('scroll', handleGuideHide);
            }
        };
        window.addEventListener('scroll', handleGuideHide);

        // Remove trigger listeners
        ['click', 'touchstart'].forEach(evt => {
            window.removeEventListener(evt, startExperience);
        });
    };

    // Only click or touch to start (to satisfy audio policies and UI state)
    ['click', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, startExperience, { once: true, passive: true });
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Progress from 0 to 1 based on the first sticky section
        let progress = Math.min(scrollY / maxScroll, 1);

        // Mute animation is now time-sequenced on start
        // Keeping scroll logic for other sections (stats, reveal etc)
    });

    // 6. Statistics Count-Up Animation
    const counters = document.querySelectorAll('.counter');
    const speed = 2000; // 2 seconds

    const countUp = (el) => {
        const target = parseFloat(el.getAttribute('data-target'));
        const isFloat = el.getAttribute('data-target').includes('.');
        let start = 0;
        const increment = target / (speed / 16); // 60fps approx

        const updateCount = () => {
            start += increment;
            if (start < target) {
                el.innerText = isFloat ? start.toFixed(1) : Math.ceil(start);
                requestAnimationFrame(updateCount);
            } else {
                el.innerText = target;
            }
        };
        updateCount();
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                countUp(counter);
                statsObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => statsObserver.observe(counter));

    // 7. Scroll Reveal Logic (Word by Word)
    const revealContainer = document.querySelector('.reveal-container');
    const revealText = document.querySelector('.reveal-text');

    if (revealText) {
        const paragraphs = revealText.innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i);
        revealText.innerHTML = '';

        paragraphs.forEach((pText, pIndex) => {
            const pDiv = document.createElement('div');
            pDiv.className = 'reveal-paragraph';

            // Clean up text and split by words
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pText;
            const words = tempDiv.innerText.trim().split(/\s+/);

            words.forEach(word => {
                const span = document.createElement('span');
                span.className = 'reveal-word';
                span.innerText = word;
                pDiv.appendChild(span);
                pDiv.appendChild(document.createTextNode(' '));
            });

            revealText.appendChild(pDiv);
        });

        const handleRevealScroll = () => {
            const viewportHeight = window.innerHeight;
            const revealWords = document.querySelectorAll('.reveal-word');

            revealWords.forEach(word => {
                const rect = word.getBoundingClientRect();
                const wordCenter = rect.top + rect.height / 2;
                const viewportCenter = viewportHeight / 2;

                // Distance from viewport center (normalized)
                const distanceFromCenter = (wordCenter - viewportCenter) / (viewportHeight / 2);

                // Active range: middle of the screen
                if (Math.abs(distanceFromCenter) < 0.2) {
                    word.classList.add('active');
                    word.classList.remove('past');
                } else if (distanceFromCenter < -0.2) {
                    // Past words: above the active range
                    word.classList.remove('active');
                    word.classList.add('past');
                } else {
                    // Future words: below the active range
                    word.classList.remove('active');
                    word.classList.remove('past');
                }
            });
        };

        window.addEventListener('scroll', handleRevealScroll);
        // Initial run
        handleRevealScroll();
    }

    // 8. Initialize Masonry Gallery with CSV Data
    const initGallery = async () => {
        const data = await DataLoader.getAllData();
        if (data && data.quotes) {
            new MasonryGallery('gallery-container', data.quotes);
        }
    };

    initGallery();

    // Initial check
    window.dispatchEvent(new Event('scroll'));
});
