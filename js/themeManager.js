const ThemeManager = {
    init() {
        console.log('Initializing ThemeManager...');
        this.loadTheme();
        this.setupEventListeners();
        console.log('ThemeManager initialized with theme:', this.getCurrentTheme());
    },
    
    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
            console.log('Theme toggle event listener added');
        } else {
            console.error('Theme toggle button not found!');
        }
        
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    },
    
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        console.log('Toggling theme from', currentTheme, 'to', newTheme);
        this.setTheme(newTheme);
    },
    
    setTheme(theme) {
        console.log('Setting theme to:', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        } else {
            document.body.classList.remove('dark-theme');
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
        
        localStorage.setItem('theme', theme);
        
        window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
        
        console.log('Theme set to:', theme);
    },
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        console.log('Loading theme - Saved:', savedTheme, 'System prefers dark:', systemPrefersDark);
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (systemPrefersDark) {
            this.setTheme('dark');
        } else {
            this.setTheme('light'); 
        }
    },
    
    getCurrentTheme() {
        return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    }
};

window.ThemeManager = ThemeManager;