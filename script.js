document.addEventListener('DOMContentLoaded', () => {
    // Check if games / lessons data exists
    const gamesData = typeof games !== 'undefined' ? games : [];
    const lessonsData = typeof lessons !== 'undefined' ? lessons : [];
    const toolsData = typeof tools !== 'undefined' ? tools : [];
    
    // Status Translation Config
    const statusConfig = {
        completed: { label: 'สำเร็จแล้ว', class: 'badge-status-completed' },
        development: { label: 'กำลังพัฒนา', class: 'badge-status-development' },
        maintenance: { label: 'ปิดปรับปรุง', class: 'badge-status-maintenance' },
        available: { label: 'เปิดให้เล่น', class: 'badge-status-available' }
    };

    // DOM Elements
    const gameGrid = document.getElementById('game-grid');
    const gameCounter = document.getElementById('game-counter');
    const searchInput = document.getElementById('search-input');
    const filterGroup = document.getElementById('filter-group');
    const sortSelect = document.getElementById('sort-select');
    const emptyState = document.getElementById('empty-state');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    // State
    let currentCategory = 'ทั้งหมด';
    let currentSearch = '';
    let currentSort = 'latest';

    // Mobile Menu Toggle
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
    });

    // Close mobile menu on click link
    const mobileLinks = mobileNav.querySelectorAll('.nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
        });
    });

    // Format Date string
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Generate Categories Filter
    const generateFilters = () => {
        const categories = ['ทั้งหมด', ...new Set(gamesData.map(game => game.category))];
        
        filterGroup.innerHTML = '';
        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `filter-btn ${category === currentCategory ? 'active' : ''}`;
            btn.textContent = category;
            btn.addEventListener('click', () => {
                currentCategory = category;
                // Update active class
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderGames();
            });
            filterGroup.appendChild(btn);
        });
    };

    // Create a single Game Card HTML
    const createGameCard = (game) => {
        const status = statusConfig[game.status] || { label: game.status, class: 'badge-category' };
        const btnText = game.buttonText || 'เล่นเกม';
        
        // Handle missing url
        let playButtonHtml = '';
        if (game.url) {
            playButtonHtml = `<a href="${game.url}" target="_blank" rel="noopener noreferrer" class="btn-play">${btnText}</a>`;
        } else {
            playButtonHtml = `<button class="btn-play disabled" disabled>ยังไม่มีลิงก์เกม</button>`;
        }

        // Handle image error fallback in HTML
        const imageHtml = game.image 
            ? `<img src="${game.image}" alt="${game.title}" class="game-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="game-image-fallback" style="display: none;">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span style="margin-top: 0.5rem; font-size: 0.875rem;">ไม่มีรูปภาพ</span>
               </div>`
            : `<div class="game-image-fallback">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  <span style="margin-top: 0.5rem; font-size: 0.875rem;">ไม่มีรูปภาพ</span>
               </div>`;

        return `
            <div class="game-card">
                <div class="game-image-container">
                    ${imageHtml}
                </div>
                <div class="game-content">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-meta">
                        <div class="badges">
                            <span class="badge badge-category">${game.category}</span>
                            <span class="badge ${status.class}">${status.label}</span>
                        </div>
                        <div class="game-date">อัปเดตล่าสุด: ${formatDate(game.updatedAt)}</div>
                        ${playButtonHtml}
                    </div>
                </div>
            </div>
        `;
    };

    // Filter, Sort and Render Games
    const renderGames = () => {
        let filtered = gamesData.filter(game => {
            const matchesCategory = currentCategory === 'ทั้งหมด' || game.category === currentCategory;
            const searchLower = currentSearch.toLowerCase();
            const matchesSearch = 
                (game.title || '').toLowerCase().includes(searchLower) ||
                (game.description || '').toLowerCase().includes(searchLower) ||
                (game.category || '').toLowerCase().includes(searchLower);
            return matchesCategory && matchesSearch;
        });

        // Sort
        if (currentSort === 'az') {
            filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (currentSort === 'za') {
            filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        } else if (currentSort === 'latest') {
            filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }

        // Render
        gameCounter.textContent = `เกมทั้งหมด: ${filtered.length}`;
        
        if (filtered.length > 0) {
            gameGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            gameGrid.innerHTML = filtered.map(game => createGameCard(game)).join('');
        } else {
            gameGrid.style.display = 'none';
            emptyState.style.display = 'block';
        }
    };

    // Render Lessons (separate from games: no search/filter, own data file)
    const renderLessons = () => {
        const grid = document.getElementById('lesson-grid');
        const counter = document.getElementById('lesson-counter');
        const sorted = [...lessonsData].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        counter.textContent = `บทเรียนทั้งหมด: ${sorted.length}`;
        grid.innerHTML = sorted.map(lesson => createGameCard({ ...lesson, buttonText: lesson.buttonText || 'เข้าดูบทเรียน' })).join('');
    };

    // Render Tools (separate section, own data file)
    const renderTools = () => {
        const grid = document.getElementById('tool-grid');
        const counter = document.getElementById('tool-counter');
        const sorted = [...toolsData].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        counter.textContent = `เครื่องมือทั้งหมด: ${sorted.length}`;
        grid.innerHTML = sorted.map(tool => createGameCard({ ...tool, buttonText: tool.buttonText || 'เปิดเครื่องมือ' })).join('');
    };

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderGames();
    });

    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderGames();
    });

    // Initialize
    generateFilters();
    renderGames();
    renderLessons();
    renderTools();
});
