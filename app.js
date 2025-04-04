'use strict';

const DB_NAME = 'secretGardenDB_v2';
let activeCountdowns = [];
let isCountdownInit = false;

function initDB() {
    if (!localStorage.getItem(DB_NAME)) {
        localStorage.setItem(DB_NAME, JSON.stringify({
            diaries: [],
            countdowns: [],
            wishes: [],
            settings: {
                sidebarCollapsed: false,
                volume: 0.7
            }
        }));
    }
    loadData();
}

function loadData() {
    const db = JSON.parse(localStorage.getItem(DB_NAME));

    if (db.settings.sidebarCollapsed) {
        toggleSidebar();
    }

    renderDiaries();
    renderCountdowns();
    startCountdownTimers();
    renderWishlist();

    const player = document.getElementById('player');
    if (player) {
        player.volume = db.settings.volume || 0.7;
        player.addEventListener('volumechange', () => {
            const db = JSON.parse(localStorage.getItem(DB_NAME));
            db.settings.volume = player.volume;
            localStorage.setItem(DB_NAME, JSON.stringify(db));
        });
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarIcon = document.getElementById('sidebarIcon');
    const musicPlayer = document.querySelector('div[style*="position:fixed; bottom:0"]');
    if (!sidebar ||!mainContent ||!sidebarIcon) return;

    const sidebarCollapsedWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-collapsed-width'));

    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
        mainContent.style.marginLeft = `${sidebarCollapsedWidth}px`;
        if (musicPlayer) musicPlayer.style.left = `${sidebarCollapsedWidth}px`;
        sidebarIcon.classList.remove('fa-chevron-left');
        sidebarIcon.classList.add('fa-chevron-right');
    } else {
        mainContent.style.marginLeft = '280px';
        if (musicPlayer) musicPlayer.style.left = '280px';
        sidebarIcon.classList.remove('fa-chevron-right');
        sidebarIcon.classList.add('fa-chevron-left');
    }

    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.settings.sidebarCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem(DB_NAME, JSON.stringify(db));
}

function switchView(view, element) {
    const sections = document.querySelectorAll('main > section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(view + 'View');
    if (targetSection) targetSection.style.display = 'block';

    const sidebarLis = document.querySelectorAll('#sidebar li');
    sidebarLis.forEach(li => {
        li.style.background = 'transparent';
    });
    if (element) element.style.background = 'rgba(0, 0, 0, 0.05)';
}

function saveDiary() {
    const content = document.getElementById('diaryContent');
    const color = document.getElementById('moodColor');
    if (!content ||!color) return;
    const diaryContentVal = content.value;
    const moodColorVal = color.value;

    if (!diaryContentVal.trim()) return;

    const diary = {
        id: Date.now(),
        content: diaryContentVal,
        color: moodColorVal,
        date: new Date().toLocaleString()
    };

    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.diaries.unshift(diary);
    localStorage.setItem(DB_NAME, JSON.stringify(db));

    renderDiaries();
    content.value = '';
}

function renderDiaries() {
    const container = document.getElementById('diaryContainer');
    if (!container) return;
    const db = JSON.parse(localStorage.getItem(DB_NAME));

    container.innerHTML = db.diaries.map(diary => `
        <div style="background:${diary.color}; border-radius:18px; padding:1.5rem; animation:fadeIn 0.3s ease;">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <small>${diary.date}</small>
            </div>
            <p style="white-space:pre-wrap;">${diary.content}</p >
        </div>
    `).join('');
}

function addCountdown() {
    const name = document.getElementById('countdownName');
    const date = document.getElementById('countdownDate');
    if (!name ||!date) return;
    const nameVal = name.value;
    const dateVal = date.value;

    if (!nameVal ||!dateVal) return;

    const countdown = {
        id: Date.now(),
        name: nameVal,
        date: new Date(dateVal).toISOString()
    };

    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.countdowns.push(countdown);
    localStorage.setItem(DB_NAME, JSON.stringify(db));

    name.value = '';
    date.value = '';

    renderCountdowns();
    startCountdownTimers();
}

function renderCountdowns() {
    const container = document.getElementById('countdownContainer');
    if (!container) return;
    const db = JSON.parse(localStorage.getItem(DB_NAME));

    container.innerHTML = db.countdowns.map(countdown => `
        <div class="countdown-item fade-in" data-id="${countdown.id}">
            <div>
                <h4>${countdown.name}</h4>
                <div class="countdown-display" id="countdown-${countdown.id}"></div>
            </div>
            <button onclick="deleteCountdown(${countdown.id})" style="background:none; border:none; cursor:pointer; color:var(--primary);">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function startCountdownTimers() {
    if (isCountdownInit) {
        activeCountdowns.forEach(interval => clearInterval(interval));
    }
    activeCountdowns = [];
    const db = JSON.parse(localStorage.getItem(DB_NAME));

    db.countdowns.forEach(countdown => {
        const update = () => {
            const targetDate = new Date(countdown.date);
            const now = new Date();
            const diff = targetDate - now;

            let displayText = '';

            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                displayText = `还有 ${days}天 ${hours}小时 ${mins}分钟`;
            } else if (diff === 0) {
                displayText = '就是今天！';
            } else {
                const daysPassed = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
                displayText = `已过 ${daysPassed}天`;
            }

            const displayElement = document.getElementById(`countdown-${countdown.id}`);
            if (displayElement) {
                displayElement.textContent = displayText;
            }
        };

        update();
        activeCountdowns.push(setInterval(update, 60000));
    });
    isCountdownInit = true;
}

function deleteCountdown(id) {
    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.countdowns = db.countdowns.filter(c => c.id !== id);
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    renderCountdowns();
    startCountdownTimers();
}

function addWish() {
    const input = document.getElementById('wishInput');
    if (!input) return;
    const inputVal = input.value;

    if (!inputVal.trim()) return;

    const wish = {
        id: Date.now(),
        text: inputVal,
        done: false,
        date: new Date().toLocaleDateString()
    };

    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.wishes.unshift(wish);
    localStorage.setItem(DB_NAME, JSON.stringify(db));

    input.value = '';
    renderWishlist();
}

function renderWishlist() {
    const container = document.getElementById('wishlistContainer');
    if (!container) return;
    const db = JSON.parse(localStorage.getItem(DB_NAME));

    container.innerHTML = db.wishes.map(wish => `
        <div class="fade-in" style="background:var(--card-bg); border-radius:12px; padding:1rem; display:flex; align-items:center; gap:12px;">
            <input type="checkbox" ${wish.done? 'checked' : ''} 
                   onchange="toggleWish(${wish.id})" style="width:20px; height:20px;">
            <span style="flex:1; ${wish.done? 'text-decoration:line-through; opacity:0.7;' : ''}">
                ${wish.text}
            </span>
            <small>${wish.date}</small>
            <button onclick="deleteWish(${wish.id})" style="background:none; border:none; cursor:pointer; color:var(--primary);">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function toggleWish(id) {
    const db = JSON.parse(localStorage.getItem(DB_NAME));
    const wish = db.wishes.find(w => w.id === id);
    if (wish) wish.done =!wish.done;
    localStorage.setItem(DB_NAME, JSON.stringify(db));
}

function deleteWish(id) {
    const db = JSON.parse(localStorage.getItem(DB_NAME));
    db.wishes = db.wishes.filter(w => w.id !== id);
    localStorage.setItem(DB_NAME, JSON.stringify(db));
    renderWishlist();
}

function openImage(src) {
    document.getElementById('viewedImage').src = src;
    document.getElementById('imageViewer').style.display = 'flex';
}

function closeImage() {
    document.getElementById('imageViewer').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    const firstLi = document.querySelector('#sidebar li:first-child');
    if (firstLi) switchView('home', firstLi);
});