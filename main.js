document.addEventListener('DOMContentLoaded', () => {
    // Loading Screen Manager
    const loadingScreen = document.getElementById('loading-screen');
    const loadingProgressBar = document.getElementById('loading-progress-bar');
    let loadingProgress = 0;

    const updateLoadingProgress = (progress) => {
        loadingProgress = Math.min(progress, 100);
        if (loadingProgressBar) {
            loadingProgressBar.style.width = `${loadingProgress}%`;
        }
    };

    const hideLoadingScreen = () => {
        updateLoadingProgress(100);
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 300);
    };

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
        const voiceIcon = document.querySelector('#voice-icon');
        const muteLine = document.querySelector('#mute-line');
        const soundWaves = document.querySelector('#sound-waves');
        const waveArcs = soundWaves.querySelectorAll('.wave-arc');
        const duration = 1500;
        const startTime = Date.now();

        // Start shift and unmute animation together
        voiceIcon.classList.add('shifted');

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Mute line disappears (0% to 30%)
            const muteProgress = Math.min(progress / 0.3, 1);
            muteLine.style.opacity = 1 - muteProgress;
            muteLine.style.transform = `translate(${muteProgress * 20}px, -${muteProgress * 20}px)`;

            // Sound waves appear (30% to 100%)
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

    // Auto-typing animation for main title (1.2 seconds)
    const animateTypewriter = () => {
        const titleChars = mainTitle.querySelectorAll('.char');
        const duration = 1200; // 1.2 seconds (1.5x faster)
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
    document.documentElement.classList.add('no-scroll');

    // Start experience on click
    let experienceStarted = false;
    let loadingComplete = false; // Flag to track loading status
    const startExperience = async () => {
        if (experienceStarted) return;
        if (!loadingComplete) return; // Prevent starting before loading completes
        experienceStarted = true;

        // Unlock audio context
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Show "화면 너머 듣는" Header & Top Navbar
        const heroMain = document.querySelector('.hero-main');
        const topNavbar = document.querySelector('.top-navbar');
        if (heroMain) heroMain.style.opacity = '1';
        if (topNavbar) topNavbar.classList.add('visible');

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
        document.documentElement.classList.remove('no-scroll');

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

    // startExperience will be registered after loading completes (in initAll)

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
                const viewportCenter = viewportHeight * 0.75;

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

    // 8. Flipping Cards Data Loading and Filtering
    const flippingCardsGrid = document.querySelector('#flipping-cards-grid');
    const filterContainers = {
        '업종': document.querySelector('#filter-sector'),
        '직군': document.querySelector('#filter-job'),
        '주제': document.querySelector('#filter-topic')
    };

    let allQuotes = [];
    let selectedFilters = {
        '업종': [],
        '직군': [],
        '주제': []
    };
    let refreshMobileStack = null; // Will be set by initMobileStack

    // Get filtered quote indices based on current filters
    const getFilteredQuoteIndices = () => {
        const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);
        if (!hasFilters) {
            return allQuotes.map((_, i) => i);
        }
        return allQuotes.reduce((indices, quote, index) => {
            const matchesSector = selectedFilters['업종'].length === 0 ||
                selectedFilters['업종'].includes(quote['업종']);
            const matchesJob = selectedFilters['직군'].length === 0 ||
                selectedFilters['직군'].includes(quote['직군']);
            const matchesTopic = selectedFilters['주제'].length === 0 ||
                selectedFilters['주제'].includes(quote['주제']);
            if (matchesSector && matchesJob && matchesTopic) {
                indices.push(index);
            }
            return indices;
        }, []);
    };

    // Seeded random number generator
    const seededRandom = (seed) => {
        const m = 0x80000000;
        const a = 1103515245;
        const c = 12345;
        let state = seed;
        return () => {
            state = (a * state + c) % m;
            return state / m;
        };
    };

    // Shuffle array (Fisher-Yates with fixed seed)
    const shuffleArray = (array) => {
        const random = seededRandom(12345); // Fixed seed
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Dark color palette for card backs (good contrast with white text)
    const cardColorPalette = [
        '#2D4A3E', // Deep forest
        '#8B4513', // Saddle brown
        '#4A5568', // Cool gray
        '#744210', // Dark orange
        '#553C9A', // Purple
        '#2C5282', // Blue
        '#975A16', // Amber
        '#285E61', // Teal
        '#702459', // Pink dark
        '#1A365D', // Navy
        '#22543D', // Green dark
        '#7B341E', // Red brown
        '#5F370E', // Brown
        '#3C366B', // Indigo
        '#234E52', // Cyan dark
        '#742A2A', // Red dark
        '#2D3748', // Gray dark
        '#44337A', // Violet
        '#276749', // Emerald
        '#9C4221', // Orange dark
    ];

    // Get card color based on index (deterministic)
    const getCardColor = (index) => {
        const colorRandom = seededRandom(index + 54321); // Fixed seed offset
        return cardColorPalette[Math.floor(colorRandom() * cardColorPalette.length)];
    };

    const initFlippingCards = async () => {
        const data = await DataLoader.getAllData();
        if (!data) return;

        // Shuffle quotes randomly
        allQuotes = shuffleArray(data.quotes);

        // Setup Filter Buttons
        setupFilters(data.categories);

        // Initial Render
        renderCards(allQuotes);
    };

    const setupFilters = (categories) => {
        // Extract unique options from categories.csv
        const sectorOptions = [...new Set(categories.map(c => c['업종']).filter(Boolean))];
        const jobOptions = [...new Set(categories.map(c => c['직군']).filter(Boolean))];
        const topicOptions = [...new Set(categories.map(c => c['주제']).filter(Boolean))];

        renderFilterButtons('업종', sectorOptions);
        renderFilterButtons('직군', jobOptions);
        renderFilterButtons('주제', topicOptions);
    };

    const renderFilterButtons = (category, options) => {
        const container = filterContainers[category];
        if (!container) return;

        container.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = opt;
            btn.dataset.category = category;
            btn.dataset.value = opt;

            btn.addEventListener('click', () => toggleFilter(category, opt, btn));
            container.appendChild(btn);
        });
    };

    const toggleFilter = (category, value, btn) => {
        // Play typing sound on filter click
        playTypingSound();

        const index = selectedFilters[category].indexOf(value);
        if (index > -1) {
            selectedFilters[category].splice(index, 1);
            btn.classList.remove('active');
        } else {
            selectedFilters[category].push(value);
            btn.classList.add('active');
        }

        applyFilters();
    };

    const applyFilters = () => {
        const hasFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

        const cards = document.querySelectorAll('.flip-card');

        cards.forEach(card => {
            const cardData = JSON.parse(card.dataset.info);

            // Check each category: AND between categories, OR within category
            const matchesSector = selectedFilters['업종'].length === 0 ||
                selectedFilters['업종'].includes(cardData['업종']);
            const matchesJob = selectedFilters['직군'].length === 0 ||
                selectedFilters['직군'].includes(cardData['직군']);
            const matchesTopic = selectedFilters['주제'].length === 0 ||
                selectedFilters['주제'].includes(cardData['주제']);

            const isMatch = matchesSector && matchesJob && matchesTopic;

            if (!hasFilters) {
                card.classList.remove('highlight');
            } else if (isMatch) {
                card.classList.add('highlight');
            } else {
                card.classList.remove('highlight');
            }
        });

        updateFilterButtonAvailability();

        // Refresh mobile stack with filtered cards
        if (refreshMobileStack) {
            refreshMobileStack();
        }
    };

    const updateFilterButtonAvailability = () => {
        const allButtons = document.querySelectorAll('.filter-btn');
        allButtons.forEach(btn => {
            const category = btn.dataset.category;
            const value = btn.dataset.value;
            const isActive = btn.classList.contains('active');

            // Active buttons should always be clickable (to allow deselection)
            if (isActive) {
                btn.classList.remove('disabled');
                return;
            }

            // Check if selecting this value would result in at least one matching card
            // considering the other categories' current selections
            const testFilters = {
                '업종': category === '업종' ? [value] : selectedFilters['업종'],
                '직군': category === '직군' ? [value] : selectedFilters['직군'],
                '주제': category === '주제' ? [value] : selectedFilters['주제']
            };

            const possibleMatch = allQuotes.some(quote => {
                const matchesSector = testFilters['업종'].length === 0 ||
                    testFilters['업종'].includes(quote['업종']);
                const matchesJob = testFilters['직군'].length === 0 ||
                    testFilters['직군'].includes(quote['직군']);
                const matchesTopic = testFilters['주제'].length === 0 ||
                    testFilters['주제'].includes(quote['주제']);
                return matchesSector && matchesJob && matchesTopic;
            });

            if (possibleMatch) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        });
    };

    // Card Modal
    const cardModalOverlay = document.createElement('div');
    cardModalOverlay.className = 'card-modal-overlay';
    cardModalOverlay.innerHTML = `
        <button class="card-modal-close">
            <svg viewBox="0 0 24 24" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="card-modal"></div>
    `;
    document.body.appendChild(cardModalOverlay);

    const cardModalContainer = cardModalOverlay.querySelector('.card-modal');

    const closeCardModal = () => {
        cardModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const openCardModal = (quote, index, bgColor) => {
        playTypingSound();

        cardModalContainer.innerHTML = `
            <div class="flip-card">
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <div class="card-content">
                            <div class="card-header">
                                <span class="card-font">${quote['업종'] || 'Industry'}</span>
                                <span class="card-job">${quote['직군'] || 'Job'}</span>
                            </div>
                            <span class="card-title">${(index + 1).toString().padStart(3, '0')}</span>
                            <div class="card-footer">
                                <span class="card-topic">${quote['주제'] || 'Topic'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flip-card-back" style="background-color: ${bgColor}">
                        <div class="card-back-content">
                            <div class="card-back-header">
                                <span class="card-back-sector">${quote['업종'] || 'Industry'}-${quote['직군'] || 'Job'}</span>
                                <span class="card-back-number">${(index + 1).toString().padStart(3, '0')}</span>
                            </div>
                            <div class="marquee-container">
                                <div class="marquee-content">${quote['멘트'] || ''}</div>
                            </div>
                            <div class="card-footer-back">
                                <span class="card-topic">${quote['주제'] || 'Topic'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        cardModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Modal event listeners
    cardModalOverlay.addEventListener('click', (e) => {
        if (e.target === cardModalOverlay) closeCardModal();
    });
    cardModalOverlay.querySelector('.card-modal-close').addEventListener('click', closeCardModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCardModal();
    });

    const renderCards = (quotes) => {
        if (!flippingCardsGrid) return;
        flippingCardsGrid.innerHTML = '';

        quotes.forEach((quote, index) => {
            const card = document.createElement('div');
            card.className = 'flip-card';
            card.dataset.info = JSON.stringify(quote);
            card.dataset.index = index;

            // Get color from curated palette (deterministic by index)
            const cardColor = getCardColor(index);
            card.dataset.bgColor = cardColor;

            card.innerHTML = `
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <div class="card-content">
                            <div class="card-header">
                                <span class="card-font">${quote['업종'] || 'Industry'}</span>
                                <span class="card-job">${quote['직군'] || 'Job'}</span>
                            </div>
                            <span class="card-title">${(index + 1).toString().padStart(3, '0')}</span>
                            <div class="card-footer">
                                <span class="card-topic">${quote['주제'] || 'Topic'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flip-card-back" style="background-color: ${cardColor}">
                        <div class="card-back-content card-back-simple">
                            <div class="marquee-container">
                                <div class="marquee-content">${quote['멘트'] || ''}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Click to open modal
            card.addEventListener('click', () => {
                openCardModal(quote, index, cardColor);
            });

            flippingCardsGrid.appendChild(card);
        });
    };

    // 9. Navigation Menu
    const initNavigation = () => {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = ['story', 'stats', 'flipping-cards-section', 'interview-history'];

        // Smooth scroll on click
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    const rect = targetSection.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const targetPosition = rect.top + scrollTop - 70; // Account for navbar height
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Update active link on scroll
        const updateActiveNav = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // At the very top of the page, default to 'story'
            if (scrollY < 100) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.dataset.section === 'story') {
                        link.classList.add('active');
                    }
                });
                return;
            }

            // If at bottom of page, activate the last section (interview-history)
            const isAtBottom = (scrollY + windowHeight) >= (documentHeight - 50);
            if (isAtBottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.dataset.section === 'interview-history') {
                        link.classList.add('active');
                    }
                });
                return;
            }

            // Get section positions relative to viewport
            // Use a detection zone at 100px from top of viewport
            const detectionPoint = 100;
            let currentSection = 'story'; // Default to story

            // Check sections in order: story, stats, flipping-cards-section, interview-history
            // Find the LAST section whose top is above the detection point
            for (let i = 0; i < sections.length; i++) {
                const section = document.getElementById(sections[i]);
                if (section) {
                    const rect = section.getBoundingClientRect();
                    // If section top is above detection point (meaning we've scrolled past it)
                    if (rect.top <= detectionPoint) {
                        currentSection = sections[i];
                    }
                }
            }

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === currentSection) {
                    link.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', updateActiveNav);
        updateActiveNav();
    };

    // 10. Sticky Scroll Reveal
    const initStickyReveal = () => {
        const revealItems = document.querySelectorAll('.reveal-item');
        const stickyImages = document.querySelectorAll('.sticky-image');

        if (revealItems.length === 0) return;

        const handleStickyReveal = () => {
            const viewportCenter = window.innerHeight / 2;

            let closestIndex = 0;
            let closestDistance = Infinity;

            revealItems.forEach((item, index) => {
                const rect = item.getBoundingClientRect();
                const itemCenter = rect.top + rect.height / 2;
                const distance = Math.abs(itemCenter - viewportCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });

            // Update active states
            revealItems.forEach((item, index) => {
                item.classList.toggle('active', index === closestIndex);
            });

            stickyImages.forEach((img, index) => {
                img.classList.toggle('active', index === closestIndex);
            });
        };

        window.addEventListener('scroll', handleStickyReveal);
        handleStickyReveal();
    };

    // 11. Mobile Card Stack
    const initMobileStack = () => {
        const stackContainer = document.getElementById('stack-container');
        const prevBtn = document.getElementById('stack-prev');
        const nextBtn = document.getElementById('stack-next');

        if (!stackContainer || allQuotes.length === 0) return;

        const VISIBLE_CARDS = 5; // Number of cards visible in the stack
        const DRAG_THRESHOLD = 100; // Minimum drag distance to send card away

        let cardStack = []; // Current visible cards in stack
        let cardHistory = []; // History of dismissed cards for undo
        let usedIndices = new Set(); // Track which quotes have been shown

        // Get a random unused quote index from filtered quotes
        const getRandomUnusedIndex = () => {
            const filteredIndices = getFilteredQuoteIndices();
            const availableIndices = filteredIndices.filter(i => !usedIndices.has(i));

            if (availableIndices.length === 0) {
                // Reset if all filtered quotes have been shown
                usedIndices.clear();
                const resetIndices = filteredIndices.filter(i => !usedIndices.has(i));
                if (resetIndices.length === 0) return null;
                const index = resetIndices[Math.floor(Math.random() * resetIndices.length)];
                usedIndices.add(index);
                return index;
            }

            const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            usedIndices.add(index);
            return index;
        };

        // Create a card element
        const createCardElement = (quoteIndex, stackIndex) => {
            const quote = allQuotes[quoteIndex];
            const bgColor = getCardColor(quoteIndex);

            const card = document.createElement('div');
            card.className = 'stack-card';
            card.dataset.quoteIndex = quoteIndex;
            card.dataset.bgColor = bgColor;
            card.style.backgroundColor = bgColor;
            card.style.zIndex = VISIBLE_CARDS - stackIndex;

            // Calculate initial transform
            const rotation = stackIndex * 4;
            const scale = 1 - stackIndex * 0.05;
            card.style.transform = `rotate(${rotation}deg) scale(${scale})`;
            card.style.transformOrigin = '90% 90%';

            card.innerHTML = `
                <div class="stack-card-content">
                    <div class="stack-card-header">
                        <span class="stack-card-sector">${quote['업종'] || ''}-${quote['직군'] || ''}</span>
                        <span class="stack-card-number">${(quoteIndex + 1).toString().padStart(3, '0')}</span>
                    </div>
                    <div class="stack-card-quote">${quote['멘트'] || ''}</div>
                    <div class="stack-card-footer">
                        <span class="stack-card-topic">${quote['주제'] || ''}</span>
                    </div>
                </div>
            `;

            return card;
        };

        // Update card transforms based on their position in stack
        const updateStackTransforms = () => {
            cardStack.forEach((card, index) => {
                card.style.zIndex = VISIBLE_CARDS - index;
                const rotation = index * 4;
                const scale = 1 - index * 0.05;
                card.classList.add('animating');
                card.style.transform = `rotate(${rotation}deg) scale(${scale})`;

                setTimeout(() => {
                    card.classList.remove('animating');
                }, 400);
            });
        };

        // Send top card to back (or away)
        const sendTopCardAway = () => {
            if (cardStack.length === 0) return;

            const topCard = cardStack[0];

            // Save to history
            cardHistory.push({
                quoteIndex: parseInt(topCard.dataset.quoteIndex),
                bgColor: topCard.dataset.bgColor
            });
            prevBtn.disabled = false;

            // Animate card away
            topCard.classList.add('sending-away');
            topCard.style.transform = `translateX(-150%) rotate(-30deg) scale(0.8)`;

            setTimeout(() => {
                topCard.remove();
                cardStack.shift();

                // Add new card at the bottom
                const newIndex = getRandomUnusedIndex();
                const newCard = createCardElement(newIndex, cardStack.length);
                stackContainer.appendChild(newCard);
                cardStack.push(newCard);
                setupCardDrag(newCard);

                updateStackTransforms();
            }, 300);
        };

        // Go to previous card (restore last dismissed)
        const goToPrev = () => {
            if (cardHistory.length === 0) return;

            const lastCard = cardHistory.pop();
            if (cardHistory.length === 0) {
                prevBtn.disabled = true;
            }

            // Remove bottom card
            if (cardStack.length > 0) {
                const bottomCard = cardStack.pop();
                bottomCard.remove();
            }

            // Create and insert the restored card at top
            const quote = allQuotes[lastCard.quoteIndex];
            const card = document.createElement('div');
            card.className = 'stack-card';
            card.dataset.quoteIndex = lastCard.quoteIndex;
            card.dataset.bgColor = lastCard.bgColor;
            card.style.backgroundColor = lastCard.bgColor;
            card.style.zIndex = VISIBLE_CARDS;
            card.style.transform = `translateX(-150%) rotate(-30deg) scale(0.8)`;
            card.style.opacity = '0';
            card.style.transformOrigin = '90% 90%';

            card.innerHTML = `
                <div class="stack-card-content">
                    <div class="stack-card-header">
                        <span class="stack-card-sector">${quote['업종'] || ''}-${quote['직군'] || ''}</span>
                        <span class="stack-card-number">${(lastCard.quoteIndex + 1).toString().padStart(3, '0')}</span>
                    </div>
                    <div class="stack-card-quote">${quote['멘트'] || ''}</div>
                    <div class="stack-card-footer">
                        <span class="stack-card-topic">${quote['주제'] || ''}</span>
                    </div>
                </div>
            `;

            stackContainer.appendChild(card);
            cardStack.unshift(card);
            setupCardDrag(card);

            // Animate in
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                updateStackTransforms();
            });
        };

        // Setup drag interaction for a card
        const setupCardDrag = (card) => {
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let currentX = 0;
            let currentY = 0;

            let dragDirection = null; // 'horizontal' | 'vertical' | null
            let touchStartedInQuote = false;
            let isPotentialDrag = false;

            const onDragStart = (e) => {
                if (cardStack[0] !== card) return; // Only top card is draggable

                // Check if touch started in quote area
                touchStartedInQuote = e.target.closest('.stack-card-quote') !== null;

                if (e.type === 'touchstart') {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                } else {
                    startX = e.clientX;
                    startY = e.clientY;
                }

                currentX = 0;
                currentY = 0;
                dragDirection = null;
                isPotentialDrag = true;
                isDragging = !touchStartedInQuote; // Don't start drag immediately in quote area
            };

            const onDragMove = (e) => {
                if (!isPotentialDrag) return;

                let clientX, clientY;
                if (e.type === 'touchmove') {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                const deltaX = clientX - startX;
                const deltaY = clientY - startY;

                // Determine direction on first significant movement
                if (dragDirection === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                    dragDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';

                    if (dragDirection === 'horizontal') {
                        isDragging = true;
                        card.classList.add('dragging');
                    } else {
                        // Vertical in quote = scroll, elsewhere = do nothing
                        isDragging = false;
                        isPotentialDrag = false;
                        return;
                    }
                }

                // Horizontal drag = move card
                if (isDragging && dragDirection === 'horizontal') {
                    // Only prevent default if NOT started in quote area
                    if (!touchStartedInQuote) {
                        e.preventDefault();
                    }
                    currentX = deltaX;
                    currentY = deltaY;

                    const rotation = currentX * 0.1;
                    card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg) scale(1)`;
                }
            };

            const onDragEnd = () => {
                if (!isPotentialDrag && !isDragging) return;

                card.classList.remove('dragging');

                // Only process if it was horizontal drag
                if (isDragging && dragDirection === 'horizontal') {
                    const distance = Math.sqrt(currentX * currentX + currentY * currentY);

                    if (distance > DRAG_THRESHOLD) {
                        sendTopCardAway();
                    } else {
                        card.classList.add('animating');
                        card.style.transform = `rotate(0deg) scale(1)`;
                        setTimeout(() => {
                            card.classList.remove('animating');
                        }, 400);
                    }
                }

                isDragging = false;
                isPotentialDrag = false;
                dragDirection = null;
                touchStartedInQuote = false;
            };

            // Quote area touch handling - separate from card drag
            const quoteEl = card.querySelector('.stack-card-quote');
            if (quoteEl) {
                let quoteStartX = 0;
                let quoteStartY = 0;
                let quoteDirection = null;

                quoteEl.addEventListener('touchstart', (e) => {
                    if (cardStack[0] !== card) return;
                    quoteStartX = e.touches[0].clientX;
                    quoteStartY = e.touches[0].clientY;
                    quoteDirection = null;
                }, { passive: true });

                quoteEl.addEventListener('touchmove', (e) => {
                    if (cardStack[0] !== card) return;

                    const deltaX = e.touches[0].clientX - quoteStartX;
                    const deltaY = e.touches[0].clientY - quoteStartY;

                    // Determine direction
                    if (quoteDirection === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                        quoteDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
                    }

                    // Vertical = scroll (do nothing, let browser handle)
                    if (quoteDirection === 'vertical') {
                        return;
                    }

                    // Horizontal = card drag
                    if (quoteDirection === 'horizontal') {
                        e.preventDefault();
                        e.stopPropagation();

                        isDragging = true;
                        card.classList.add('dragging');
                        currentX = deltaX;
                        currentY = deltaY;
                        const rotation = currentX * 0.1;
                        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg) scale(1)`;
                    }
                }, { passive: false });

                quoteEl.addEventListener('touchend', () => {
                    if (quoteDirection === 'horizontal' && isDragging) {
                        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
                        if (distance > DRAG_THRESHOLD) {
                            sendTopCardAway();
                        } else {
                            card.classList.add('animating');
                            card.style.transform = `rotate(0deg) scale(1)`;
                            setTimeout(() => card.classList.remove('animating'), 400);
                        }
                        isDragging = false;
                        card.classList.remove('dragging');
                    }
                    quoteDirection = null;
                });
            }

            // Card touch events (excluding quote area)
            card.addEventListener('touchstart', (e) => {
                if (e.target.closest('.stack-card-quote')) return;
                onDragStart(e);
            }, { passive: true });
            card.addEventListener('touchmove', (e) => {
                if (e.target.closest('.stack-card-quote')) return;
                onDragMove(e);
            }, { passive: false });
            card.addEventListener('touchend', onDragEnd);
            card.addEventListener('touchcancel', onDragEnd);

            // Mouse events
            card.addEventListener('mousedown', onDragStart);
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
        };

        // Initialize stack with cards
        const initStack = () => {
            stackContainer.innerHTML = '';
            cardStack = [];
            cardHistory = [];
            usedIndices.clear();
            prevBtn.disabled = true;

            const filteredIndices = getFilteredQuoteIndices();
            const cardsToShow = Math.min(VISIBLE_CARDS, filteredIndices.length);

            for (let i = 0; i < cardsToShow; i++) {
                const quoteIndex = getRandomUnusedIndex();
                if (quoteIndex === null) break;
                const card = createCardElement(quoteIndex, i);
                stackContainer.appendChild(card);
                cardStack.push(card);
                setupCardDrag(card);
            }
        };

        // Expose initStack for filter refresh
        refreshMobileStack = initStack;

        // Arrow buttons
        prevBtn.addEventListener('click', goToPrev);
        nextBtn.addEventListener('click', sendTopCardAway);

        // Initialize
        initStack();
    };

    // 12. Preload Images
    const preloadImages = () => {
        return new Promise((resolve) => {
            const images = document.querySelectorAll('img');
            const totalImages = images.length;

            if (totalImages === 0) {
                resolve();
                return;
            }

            let loadedImages = 0;
            const baseProgress = 30; // Start from 30%
            const imageProgressRange = 50; // Images take 30-80%

            const onImageLoad = () => {
                loadedImages++;
                const imageProgress = (loadedImages / totalImages) * imageProgressRange;
                updateLoadingProgress(baseProgress + imageProgress);

                if (loadedImages === totalImages) {
                    resolve();
                }
            };

            images.forEach((img) => {
                if (img.complete) {
                    onImageLoad();
                } else {
                    img.addEventListener('load', onImageLoad);
                    img.addEventListener('error', onImageLoad); // Count errors too
                }
            });

            // Timeout fallback
            setTimeout(resolve, 5000);
        });
    };

    // 13. Initialize All
    const initAll = async () => {
        updateLoadingProgress(10); // Start

        await initFlippingCards();
        updateLoadingProgress(30); // Data loaded

        await preloadImages();
        updateLoadingProgress(80); // Images loaded

        initMobileStack();
        updateLoadingProgress(90);

        initNavigation();
        initStickyReveal();
        updateLoadingProgress(100);

        window.dispatchEvent(new Event('scroll'));

        // Mark loading as complete BEFORE hiding screen
        loadingComplete = true;

        // Hide loading screen
        hideLoadingScreen();

        // Only register click/touch listeners AFTER loading is complete
        ['click', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, startExperience, { once: true, passive: true });
        });
    };

    initAll();
});
