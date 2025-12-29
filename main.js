document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('#hero');
    const muteLine = document.querySelector('#mute-line');
    const soundWaves = document.querySelector('#sound-waves');
    const textContent = document.querySelector('.text-content');
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
    const subTitle = document.querySelector('#sub-title');
    splitText(mainTitle);
    splitText(subTitle);

    // Create Cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.innerText = '|';
    // Position it initially
    mainTitle.appendChild(cursor);

    const maxScroll = hero.offsetHeight - window.innerHeight;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Progress from 0 to 1 based on the first sticky section
        let progress = Math.min(scrollY / maxScroll, 1);

        // 1. Background Color Transition (Black to #f8f9fa)
        const bgVal = Math.round(progress * 248);
        body.style.backgroundColor = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;

        // 2. Text Color Transition (White to #121212)
        const textVal = 255 - Math.round(progress * (255 - 18));
        body.style.color = `rgb(${textVal}, ${textVal}, ${textVal})`;

        // 3. Mute Line Animation (0% to 30% progress)
        if (progress < 0.3) {
            const lineOpacity = 1 - (progress / 0.3);
            const lineTranslate = (progress / 0.3) * 20;
            muteLine.style.opacity = lineOpacity;
            muteLine.style.transform = `translate(${lineTranslate}px, -${lineTranslate}px)`;
            soundWaves.classList.add('hidden');
        } else {
            muteLine.style.opacity = 0;
            soundWaves.classList.remove('hidden');
        }

        // 4. Sound Waves Animation (30% to 60% progress)
        if (progress >= 0.3) {
            const waveArcs = soundWaves.querySelectorAll('.wave-arc');
            const waveProgress = Math.min((progress - 0.3) / 0.3, 1);

            waveArcs.forEach((arc, index) => {
                const threshold = index / waveArcs.length;
                if (waveProgress > threshold) {
                    arc.classList.add('visible');
                } else {
                    arc.classList.remove('visible');
                }
            });

            soundWaves.style.opacity = 1;
        }

        // 5. Typewriter Text Reveal (50% to 100% progress)
        if (progress > 0.5) {
            textContent.style.opacity = 1;

            // A. Main Title Reveal (50% to 80%)
            const titleProgress = Math.min(Math.max((progress - 0.5) / 0.3, 0), 1);
            const titleChars = mainTitle.querySelectorAll('.char');
            let lastTitleChar = null;

            cursor.classList.add('visible');

            titleChars.forEach((char) => {
                const threshold = parseFloat(char.dataset.threshold);
                if (titleProgress > threshold) {
                    char.classList.add('visible');
                    lastTitleChar = char;
                } else {
                    char.classList.remove('visible');
                }
            });

            if (lastTitleChar && cursor.previousSibling !== lastTitleChar) {
                lastTitleChar.after(cursor);
            }

            // B. Subtitle Reveal (80% to 100%)
            const subProgress = Math.min(Math.max((progress - 0.8) / 0.2, 0), 1);
            const subChars = subTitle.querySelectorAll('.char');

            subChars.forEach((char) => {
                const threshold = parseFloat(char.dataset.threshold);
                if (subProgress > threshold) {
                    char.classList.add('visible');
                } else {
                    char.classList.remove('visible');
                }
            });
        } else {
            textContent.style.opacity = 0;
            cursor.classList.remove('visible');
        }
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
        const text = revealText.innerText;
        revealText.innerHTML = '';
        const words = text.split(/\s+/);
        words.forEach(word => {
            const span = document.createElement('span');
            span.className = 'reveal-word';
            span.innerText = word;
            revealText.appendChild(span);
            revealText.appendChild(document.createTextNode(' '));
        });

        const revealWords = document.querySelectorAll('.reveal-word');
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

    // Initial check
    window.dispatchEvent(new Event('scroll'));
});
