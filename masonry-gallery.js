/**
 * MasonryGallery - Infinite scrolling masonry layout
 * Entire layout scrolls upward together, new rows spawn at bottom
 */
class MasonryGallery {
    constructor(containerId, data, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('MasonryGallery: Container not found');
            return;
        }

        this.data = data || [];
        this.options = {
            speed: 0.32,
            gap: 12,
            ...options
        };

        this.scrollY = 0;
        this.cards = [];
        this.dataIndex = 0;
        this.isRunning = false;
        this.animationId = null;

        this.init();
    }

    init() {
        this.buildDOM();
        this.createModal();
        this.updateColumns();
        this.buildInitialLayout();
        this.addEventListeners();
        this.start();
    }

    getColumns() {
        const w = window.innerWidth;
        if (w >= 1500) return 5;
        if (w >= 1000) return 4;
        if (w >= 600) return 3;
        if (w >= 400) return 2;
        return 1;
    }

    updateColumns() {
        this.columns = this.getColumns();
        const containerWidth = this.container.offsetWidth;
        const gap = this.options.gap;
        // 카드 너비 = (전체 너비 - (컬럼수+1)*gap) / 컬럼수
        this.cardWidth = (containerWidth - (this.columns + 1) * gap) / this.columns;
        this.colHeights = new Array(this.columns).fill(0);
    }

    buildDOM() {
        this.container.innerHTML = `
            <div class="masonry-flow">
                <div class="masonry-flow__track"></div>
                <div class="masonry-flow__fade masonry-flow__fade--top"></div>
                <div class="masonry-flow__fade masonry-flow__fade--bottom"></div>
            </div>
        `;
        this.flowContainer = this.container.querySelector('.masonry-flow');
        this.track = this.container.querySelector('.masonry-flow__track');
    }

    createModal() {
        if (!document.getElementById('masonry-modal')) {
            const modal = document.createElement('div');
            modal.id = 'masonry-modal';
            modal.className = 'masonry-modal';
            modal.innerHTML = `
                <div class="masonry-modal__content">
                    <button class="masonry-modal__close">&times;</button>
                    <div class="masonry-modal__category"></div>
                    <div class="masonry-modal__quote"></div>
                    <div class="masonry-modal__source"></div>
                </div>
            `;
            document.body.appendChild(modal);
            this.modal = modal;
            modal.querySelector('.masonry-modal__close').addEventListener('click', () => this.closeModal());
            modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); });
        } else {
            this.modal = document.getElementById('masonry-modal');
        }
    }

    getNextData() {
        // 랜덤하게 데이터 선택
        const randomIndex = Math.floor(Math.random() * this.data.length);
        return this.data[randomIndex];
    }

    createCard() {
        const data = this.getNextData();
        const gap = this.options.gap;

        // 가장 낮은 컬럼 찾기
        const col = this.colHeights.indexOf(Math.min(...this.colHeights));
        const x = gap + col * (this.cardWidth + gap);
        const y = this.colHeights[col];

        const wrapper = document.createElement('div');
        wrapper.className = 'masonry-card';

        const content = document.createElement('div');
        content.className = 'masonry-card__content';

        const category = document.createElement('div');
        category.className = 'masonry-card__category';
        category.textContent = `${data['주제'] || data['대주제'] || ''} · ${data['직종'] || ''}`;

        const text = document.createElement('div');
        text.className = 'masonry-card__text';
        text.textContent = data['멘트'] || '';

        content.appendChild(category);
        content.appendChild(text);
        wrapper.appendChild(content);
        this.track.appendChild(wrapper);

        wrapper.style.width = this.cardWidth + 'px';
        wrapper.style.left = x + 'px';
        wrapper.style.top = y + 'px';

        // 강제 리플로우 후 높이 측정 (폰트 로딩 고려)
        wrapper.offsetHeight; // force reflow
        const height = Math.max(wrapper.offsetHeight, 60); // 최소 높이 60px
        this.colHeights[col] += height + this.options.gap + 6; // 추가 버퍼 6px

        const card = {
            element: wrapper,
            data: data,
            x: x,
            y: y,
            height: height
        };

        wrapper.addEventListener('click', () => this.showDetail(data));
        this.cards.push(card);

        return card;
    }

    buildInitialLayout() {
        const containerHeight = this.container.offsetHeight;

        // 화면의 2배 높이까지 카드 생성
        while (Math.min(...this.colHeights) < containerHeight * 2) {
            this.createCard();
        }
    }

    addMoreCards() {
        const containerHeight = this.container.offsetHeight;

        // 아래쪽에 여유 공간이 부족하면 카드 추가
        // 매 반복마다 colHeights를 다시 계산해야 무한루프 방지
        while (Math.max(...this.colHeights) - this.scrollY < containerHeight * 1.5) {
            this.createCard();
        }
    }

    removeOldCards() {
        // 화면 위로 벗어난 카드 제거
        const removeThreshold = this.scrollY - 200;

        this.cards = this.cards.filter(card => {
            if (card.y + card.height < removeThreshold) {
                card.element.remove();
                return false;
            }
            return true;
        });
    }

    update() {
        this.scrollY += this.options.speed;
        this.track.style.transform = `translateY(${-this.scrollY}px)`;

        this.addMoreCards();
        this.removeOldCards();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const animate = () => {
            if (!this.isRunning) return;
            this.update();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    showDetail(data) {
        this.modal.querySelector('.masonry-modal__category').textContent =
            `${data['주제'] || data['대주제'] || ''} (${data['직종'] || ''})`;
        this.modal.querySelector('.masonry-modal__quote').textContent =
            `"${data['멘트'] || ''}"`;
        this.modal.querySelector('.masonry-modal__source').textContent =
            `— ${data['출처'] || ''}`;
        this.modal.classList.add('visible');
    }

    closeModal() {
        this.modal.classList.remove('visible');
    }

    handleResize() {
        // 리사이즈 시 전체 재구성
        this.updateColumns();
        this.track.innerHTML = '';
        this.cards = [];
        this.colHeights = new Array(this.columns).fill(0);
        this.scrollY = 0;
        this.dataIndex = 0;
        this.buildInitialLayout();
    }

    addEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 200);
        });

        // 화면 밖으로 나가면 애니메이션 멈춤 (성능)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.start();
                } else {
                    this.stop();
                }
            });
        }, { threshold: 0 });

        observer.observe(this.container);
    }
}

window.MasonryGallery = MasonryGallery;
