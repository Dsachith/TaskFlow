const DueSoonManager = {
    currentFilter: 'all',
    tasks: new Map(),

    init() {
        console.log('Initializing Due Soon Manager...');
        this.loadTasks();
        this.setupEventListeners();
        this.setupCurrentDate();
        this.renderTasks();
    },

    loadTasks() {
        try {
            const stored = localStorage.getItem('taskflow-tasks');
            if (stored) {
                const tasksArray = JSON.parse(stored);
                this.tasks = new Map(tasksArray);
                console.log('Loaded tasks for due soon:', this.tasks.size);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = new Map();
        }
    },

    setupEventListeners() {
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterTasks(e.target.value);
            });
        }

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    },

    setupCurrentDate() {
        const now = new Date();
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },

    setFilter(filter) {
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.renderTasks();
    },

    getDueSoonTasks() {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const tasks = Array.from(this.tasks.values()).filter(task => {
            if (!task.dueDate || task.status === 'done') return false;

            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const timeDiff = dueDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            switch (this.currentFilter) {
                case 'overdue':
                    return daysDiff < 0;
                case 'today':
                    return daysDiff === 0;
                case 'week':
                    return daysDiff >= 0 && daysDiff <= 7;
                case 'all':
                default:
                    return daysDiff <= 14; 
            }
        });

        return tasks.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB;
        });
    },

    renderTasks() {
        const tasks = this.getDueSoonTasks();
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');

        this.updateStatistics(tasks);

        if (tasks.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    },

    createTaskElement(task) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const timeDiff = dueDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let dueClass = '';
        let dueText = '';
        let priorityClass = '';

        if (daysDiff < 0) {
            dueClass = 'overdue';
            dueText = `${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''} overdue`;
        } else if (daysDiff === 0) {
            dueClass = 'due-soon';
            dueText = 'Due today';
        } else if (daysDiff === 1) {
            dueClass = 'due-soon';
            dueText = 'Due tomorrow';
        } else if (daysDiff <= 7) {
            dueClass = 'due-soon';
            dueText = `Due in ${daysDiff} days`;
        } else {
            dueClass = 'due-later';
            dueText = `Due in ${daysDiff} days`;
        }

        switch (task.priority) {
            case 'high':
            case 'urgent':
                priorityClass = 'urgent';
                break;
            case 'medium':
                priorityClass = 'warning';
                break;
            default:
                priorityClass = '';
        }

        const assigneeImages = {
            'user1': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
            'user2': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80',
            'user3': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
        };

        const assigneeImage = assigneeImages[task.assignee] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80';

        const taskDiv = document.createElement('div');
        taskDiv.className = `col-md-6 col-lg-4 mb-4`;
        taskDiv.innerHTML = `
            <div class="task-card ${priorityClass} h-100">
                <div class="task-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="task-title mb-1">${this.escapeHtml(task.title)}</h5>
                            <span class="due-badge ${dueClass}">${dueText}</span>
                        </div>
                        <span class="task-priority priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
                
                <div class="task-description mt-2">${this.escapeHtml(task.description)}</div>
                
                <div class="task-footer mt-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            ${task.assignee ? `
                                <div class="task-assignee me-2">
                                    <img src="${assigneeImage}" alt="Assignee" class="rounded-circle" width="32" height="32">
                                </div>
                            ` : ''}
                            <div class="task-labels">
                                ${task.labels.map(label => 
                                    `<span class="label-tag small" style="background-color: ${this.getLabelColor(label)}">${label}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="text-muted small">
                            <i class="fas fa-calendar me-1"></i>
                            ${dueDate.toLocaleDateString()}
                        </div>
                    </div>
                </div>
                
                <div class="task-meta mt-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-light text-dark">
                            <i class="fas fa-project-diagram me-1"></i>
                            ${this.getProjectName(task.projectId)}
                        </span>
                        <span class="badge bg-light text-dark">
                            <i class="fas fa-columns me-1"></i>
                            ${task.status}
                        </span>
                    </div>
                </div>
            </div>
        `;

        taskDiv.addEventListener('click', () => {
            window.location.href = `index.html?project=${task.projectId}&task=${task.id}`;
        });

        return taskDiv;
    },

    updateStatistics(tasks) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const overdue = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < now;
        }).length;

        const dueSoon = tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff >= 0 && daysDiff <= 3;
        }).length;

        document.getElementById('totalTasks').textContent = tasks.length;
        document.getElementById('overdueTasks').textContent = overdue;
        document.getElementById('dueSoonTasks').textContent = dueSoon;
    },

    filterTasks(searchTerm) {
        const tasks = this.getDueSoonTasks();
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');

        if (!searchTerm.trim()) {
            this.renderTasks();
            return;
        }

        const filteredTasks = tasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `
                <i class="fas fa-search fa-4x mb-3 text-muted"></i>
                <h3>No matching tasks</h3>
                <p class="text-muted">No tasks found for "${searchTerm}"</p>
            `;
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = '';

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    },

    getProjectName(projectId) {
        const projects = {
            'project-1': 'Website Redesign',
            'project-2': 'Mobile App',
            'project-3': 'Marketing Campaign',
            'project-4': 'Product Launch'
        };
        return projects[projectId] || 'Unknown Project';
    },

    getLabelColor(label) {
        const colors = {
            'frontend': '#3498db',
            'backend': '#e74c3c',
            'design': '#2ecc71',
            'bug': '#f39c12',
            'feature': '#9b59b6',
            'documentation': '#34495e',
            'optimization': '#1abc9c',
            'mobile': '#e67e22',
            'ios': '#000000',
            'android': '#3ddc84',
            'marketing': '#e74c3c',
            'social': '#9b59b6',
            'campaign': '#e67e22',
            'email': '#3498db',
            'content': '#2ecc71',
            'security': '#c0392b',
            'responsive': '#f39c12',
            'database': '#8e44ad',
            'planning': '#34495e',
            'launch': '#e74c3c',
            'coordination': '#3498db',
            'development': '#2ecc71'
        };
        return colors[label.toLowerCase()] || '#95a5a6';
    },

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    DueSoonManager.init();
});