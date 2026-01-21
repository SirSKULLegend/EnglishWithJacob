// State
const savedLang = localStorage.getItem('app_lang') || 'en';
const savedTheme = localStorage.getItem('app_theme') || 'light';
let state = {
    lang: savedLang,
    theme: savedTheme,
    soundEnabled: true,
    leaderboardFilter: 'daily'
};

// Sound functions
window.playTone = (frequency) => {
    if (!state.soundEnabled) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.value = 0.12;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    } catch (e) {
        console.log('Audio not supported');
    }
};

window.toggleSound = () => {
    state.soundEnabled = !state.soundEnabled;
    const soundStatus = document.getElementById('soundStatus');
    const indicator = document.getElementById('soundIndicator');

    if (state.soundEnabled) {
        if (indicator) indicator.classList.remove('off');
        if (soundStatus) soundStatus.textContent = strings[state.lang].soundOn;
        playTone(520);
    } else {
        if (indicator) indicator.classList.add('off');
        if (soundStatus) soundStatus.textContent = strings[state.lang].soundOff;
    }
};

// Theme toggle
window.toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('app_theme', state.theme);

    // Update icon
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = state.theme === 'light' ? '🌙' : '☀️';

    playTone(400);
};

// Language toggle
window.toggleLanguage = () => {
    state.lang = state.lang === 'en' ? 'ar' : 'en';
    localStorage.setItem('app_lang', state.lang);
    updateContent();
    playTone(640);
};

const updateContent = () => {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (strings[state.lang][key]) {
            if (el.children.length === 0) {
                el.textContent = strings[state.lang][key];
            } else {
                el.textContent = strings[state.lang][key];
            }
        }
    });

    const langToggle = document.getElementById('langToggle');
    if (langToggle) langToggle.textContent = strings[state.lang].toggleLabel;

    const soundStatus = document.getElementById('soundStatus');
    if (soundStatus) soundStatus.textContent = state.soundEnabled ? strings[state.lang].soundOn : strings[state.lang].soundOff;
};

// Leaderboard filter
const setLeaderboardFilter = (btn, filter) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.leaderboardFilter = filter;
    playTone(740);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', state.theme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = state.theme === 'light' ? '🌙' : '☀️';

    updateContent(); // Apply correct language immediately
    if (state.soundEnabled) {
        const indicator = document.getElementById('soundIndicator');
        if (indicator) indicator.classList.remove('off');
    }
});
