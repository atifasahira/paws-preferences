class PawsAndPreferences {
    constructor() {
        this.cats = [];
        this.likedCats = [];
        this.currentCatIndex = 0;
        this.totalCats = 15;
        this.isLoading = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('🐱 Paws & Preferences initializing...');
        this.bindEvents();
        this.preloadCats();
    }

    bindEvents() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
            startBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.startGame();
                }
            });
        }

        const likeBtn = document.getElementById('likeBtn');
        const dislikeBtn = document.getElementById('dislikeBtn');
        
        if (likeBtn) likeBtn.addEventListener('click', () => this.handleLike());
        if (dislikeBtn) dislikeBtn.addEventListener('click', () => this.handleDislike());
        
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('gameScreen')?.classList.contains('hidden')) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case 'l':
                case 'L':
                    this.handleLike();
                    break;
                case 'ArrowLeft':
                case 'd':
                case 'D':
                    this.handleDislike();
                    break;
            }
        });

        const tryAgainBtn = document.getElementById('tryAgainBtn');
        const shareBtn = document.getElementById('shareBtn');
        
        if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => this.resetGame());
        if (shareBtn) shareBtn.addEventListener('click', () => this.shareResults());
    }

    async preloadCats() {
        console.log('🔄 Loading cat images...');
        this.showLoading(true);
        
        const loadPromises = [];
        
        for (let i = 0; i < this.totalCats; i++) {
            const loadPromise = this.loadSingleCat(i);
            loadPromises.push(loadPromise);
        }
        
        try {
            await Promise.all(loadPromises);
            console.log(`✅ Successfully loaded ${this.cats.length} cat images`);
        } catch (error) {
            console.error('❌ Error loading some cat images:', error);
        }
        
        this.showLoading(false);
    }

    async loadSingleCat(index) {
        const maxRetries = 3;
        let attempt = 0;
        
        while (attempt < maxRetries) {
            try {
                const timestamp = Date.now();
                const randomParam = Math.random().toString(36).substring(7);
                const response = await fetch(
                    `https://cataas.com/cat?width=400&height=400&t=${timestamp}&r=${randomParam}`,
                    { 
                        method: 'GET',
                        cache: 'no-cache'
                    }
                );
                
                if (response.ok) {
                    const blob = await response.blob();
                    const imageUrl = URL.createObjectURL(blob);
                    
                    const isValid = await this.validateImage(imageUrl);
                    if (isValid) {
                        this.cats.push({
                            url: imageUrl,
                            id: index,
                            timestamp: timestamp
                        });
                        return;
                    }
                }
            } catch (error) {
                console.warn(`Attempt ${attempt + 1} failed for cat ${index}:`, error);
            }
            
            attempt++;
            
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        
        console.warn(`Using fallback URL for cat ${index}`);
        this.cats.push({
            url: `https://cataas.com/cat?width=400&height=400&fallback=${index}`,
            id: index,
            timestamp: Date.now()
        });
    }

    validateImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            
            setTimeout(() => resolve(false), 5000);
        });
    }

    startGame() {
        console.log('🎮 Starting game...');
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (gameScreen) gameScreen.classList.remove('hidden');
        
        this.createCardStack();
        this.updateProgress();
    }

    createCardStack() {
        const container = document.getElementById('cardContainer');
        if (!container) return;
        
        container.innerHTML = '';

        const cardsToShow = Math.min(3, this.cats.length - this.currentCatIndex);
        
        for (let i = 0; i < cardsToShow; i++) {
            const catIndex = this.currentCatIndex + i;
            if (catIndex >= this.cats.length) break;
            
            const card = this.createCard(this.cats[catIndex], i);
            container.appendChild(card);
        }

        if (container.children.length > 0) {
            this.addSwipeListeners(container.children[0]);
        }
    }

    createCard(cat, stackIndex) {
        const card = document.createElement('div');
        card.className = 'cat-card absolute inset-0 bg-white rounded-xl shadow-2xl overflow-hidden cursor-pointer';
        card.style.transform = `scale(${1 - stackIndex * 0.05}) translateY(${stackIndex * 10}px)`;
        card.style.zIndex = 10 - stackIndex;

        const img = document.createElement('img');
        img.src = cat.url;
        img.alt = `Adorable cat waiting for your preference - Image ${cat.id + 1}`;
        img.className = 'w-full h-full object-cover';
        img.loading = 'lazy';

        card.classList.add('loading-placeholder');

        img.addEventListener('load', () => {
            card.classList.remove('loading-placeholder');
            console.log(`✅ Image loaded for cat ${cat.id}`);
        });

        img.addEventListener('error', () => {
            console.warn(`❌ Failed to load image for cat ${cat.id}`);
            this.setFallbackImage(img);
            card.classList.remove('loading-placeholder');
        });

        card.appendChild(img);
        return card;
    }

    setFallbackImage(img) {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI0NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QsTA8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q2F0IGltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
        img.alt = 'Cat image not available - placeholder image';
    }

    addSwipeListeners(card) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        let startTime = 0;

        card.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        card.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        function handleStart(e) {
            isDragging = true;
            startTime = Date.now();
            card.classList.add('dragging');
            
            const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
            
            startX = clientX;
            startY = clientY;
            
            e.preventDefault();
        }

        function handleMove(e) {
            if (!isDragging) return;
            
            const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
            
            currentX = clientX - startX;
            currentY = clientY - startY;
            
            const rotation = currentX * 0.1;
            const opacity = Math.max(0.7, 1 - Math.abs(currentX) / 300);
            
            card.style.transform = `translateX(${currentX}px) translateY(${currentY}px) rotate(${rotation}deg)`;
            card.style.opacity = opacity;
            
            const threshold = 50;
            if (Math.abs(currentX) > threshold) {
                if (currentX > 0) {
                    card.style.borderColor = '#10B981'; 
                    card.style.borderWidth = '4px';
                } else {
                    card.style.borderColor = '#EF4444';
                    card.style.borderWidth = '4px';
                }
            } else {
                card.style.borderWidth = '0px';
            }
            
            e.preventDefault();
        }

        function handleEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            
            card.classList.remove('dragging');
            card.style.borderWidth = '0px';
            
            const swipeThreshold = 100;
            const swipeVelocity = Math.abs(currentX) / (Date.now() - startTime);
            
            const isSwipe = Math.abs(currentX) > swipeThreshold || swipeVelocity > 0.5;
            
            if (isSwipe) {
                if (currentX > 0) {
                    app.handleLike();
                } else {
                    app.handleDislike();
                }
            } else {
                card.style.transform = '';
                card.style.opacity = '';
            }
            
            currentX = 0;
            currentY = 0;
        }
    }

    handleLike() {
        console.log(`👍 Liked cat ${this.currentCatIndex + 1}`);
        
        const currentCat = this.cats[this.currentCatIndex];
        this.likedCats.push(currentCat);
        this.animateCard('liked');
        this.addHeartAnimation();
        this.nextCat();
    }

    handleDislike() {
        console.log(`👎 Disliked cat ${this.currentCatIndex + 1}`);
        
        this.animateCard('disliked');
        this.nextCat();
    }

    animateCard(direction) {
        const topCard = document.querySelector('.cat-card');
        if (topCard) {
            topCard.classList.add(direction);
        }
    }

    addHeartAnimation() {
        const likesCount = document.getElementById('likesCount');
        if (likesCount) {
            likesCount.classList.add('heart-animation');
            setTimeout(() => {
                likesCount.classList.remove('heart-animation');
            }, 800);
        }
    }

    nextCat() {
        this.currentCatIndex++;
        
        setTimeout(() => {
            if (this.currentCatIndex >= this.cats.length) {
                this.showResults();
            } else {
                this.createCardStack();
                this.updateProgress();
            }
        }, 500);
    }

    updateProgress() {
        const currentCatEl = document.getElementById('currentCat');
        const totalCatsEl = document.getElementById('totalCats');
        const likesCountEl = document.getElementById('likesCount');
        
        if (currentCatEl) currentCatEl.textContent = this.currentCatIndex + 1;
        if (totalCatsEl) totalCatsEl.textContent = this.totalCats;
        if (likesCountEl) likesCountEl.textContent = this.likedCats.length;
    }

    showResults() {
        console.log('🎉 Showing results...');
        
        const gameScreen = document.getElementById('gameScreen');
        const resultsScreen = document.getElementById('resultsScreen');
        
        if (gameScreen) gameScreen.classList.add('hidden');
        if (resultsScreen) resultsScreen.classList.remove('hidden');
        
        const finalLikesCount = document.getElementById('finalLikesCount');
        const finalTotalCount = document.getElementById('finalTotalCount');
        
        if (finalLikesCount) finalLikesCount.textContent = this.likedCats.length;
        if (finalTotalCount) finalTotalCount.textContent = this.totalCats;
        
        this.displayLikedCats();
    }

    displayLikedCats() {
        const gallery = document.getElementById('likedCatsGallery');
        if (!gallery) return;
        
        gallery.innerHTML = '';
        
        if (this.likedCats.length === 0) {
            gallery.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="text-4xl mb-4">😿</div>
                    <p class="text-lg opacity-75 text-black">No cats were liked this time.</p>
                    <p class="text-sm opacity-60 mt-2 text-black">Maybe try again? You might find some adorable kitties! 😸</p>
                </div>
            `;
            return;
        }
        
        this.likedCats.forEach((cat, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'gallery-item relative group overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105';
            
            const img = document.createElement('img');
            img.src = cat.url;
            img.alt = `Liked cat number ${index + 1}`;
            img.className = 'w-full h-32 object-cover';
            img.loading = 'lazy';
            
            img.addEventListener('error', () => {
                this.setFallbackImage(img);
            });
            
            const overlay = document.createElement('div');
            overlay.className = 'gallery-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300';
            overlay.innerHTML = '<span class="text-white text-2xl">😻</span>';
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(overlay);
            gallery.appendChild(imgContainer);
        });

        console.log(`✅ Displayed ${this.likedCats.length} liked cats in gallery`);
    }

    resetGame() {
        console.log('🔄 Resetting game...');
        
        this.cats.forEach(cat => {
            if (cat.url.startsWith('blob:')) {
                URL.revokeObjectURL(cat.url);
            }
        });
        
        this.currentCatIndex = 0;
        this.likedCats = [];
        this.cats = [];
        
        const resultsScreen = document.getElementById('resultsScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        if (resultsScreen) resultsScreen.classList.add('hidden');
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        
        this.preloadCats();
    }

    shareResults() {
        const likedCount = this.likedCats.length;
        const totalCount = this.totalCats;
        const percentage = Math.round((likedCount / totalCount) * 100);
        
        const messages = [
            `I just discovered my cat preferences! I liked ${likedCount} out of ${totalCount} adorable kitties (${percentage}%) on Paws & Preferences! 🐱💕`,
            `Paws & Preferences revealed my cat taste: ${likedCount}/${totalCount} kitties won my heart! 😻`,
            `Just swiped through ${totalCount} cats and fell in love with ${likedCount} of them! 🐾 My cat preferences are now clear!`
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const shareData = {
            title: 'Paws & Preferences - My Cat Results',
            text: randomMessage,
            url: window.location.href
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => console.log('✅ Shared successfully'))
                .catch((error) => console.log('❌ Share failed:', error));
        } else if (navigator.clipboard) {
            const textToShare = `${randomMessage} ${window.location.href}`;
            navigator.clipboard.writeText(textToShare)
                .then(() => {
                    this.showShareFeedback('Results copied to clipboard! 📋');
                })
                .catch(() => {
                    this.showShareFeedback('Unable to copy to clipboard 😅');
                });
        } else {
            this.showShareFeedback('Share feature not available on this device 📱');
        }
    }

    showShareFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-white text-purple-600 px-6 py-3 rounded-full shadow-lg z-50 transition-all duration-300';
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);
        
        setTimeout(() => {
            feedback.style.transform = 'translateX(-50%) translateY(-100px)';
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 3000);
    }

    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        if (!indicator) return;
        
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
}

const app = new PawsAndPreferences();

window.pawsApp = app;
