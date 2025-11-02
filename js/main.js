document.addEventListener('DOMContentLoaded', function () {
    console.log('=== TASKFLOW INITIALIZATION ===');

    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap not loaded!');
        return;
    }

    try {
        ThemeManager.init();
        console.log('ThemeManager initialized successfully');
    } catch (error) {
        console.error('ThemeManager initialization error:', error);
    }

    try {
        ProjectManager.init();
        TaskManager.init();
        ModalManager.init();
        DragDropManager.init();
        TaskManager.initFilters();

        console.log('All modules initialized successfully');
        setupEventListeners();
        window.testApp = function () {
            console.log('=== APP TEST ===');
            console.log('Projects:', ProjectManager.projects.size);
            console.log('Tasks:', TaskManager.tasks.size);
            console.log('Modal element:', document.getElementById('createTaskModal'));
            console.log('Add task buttons:', document.querySelectorAll('.btn-add-task').length);
        };

        loadSampleData();

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

function loadSampleData() {
    const hasExistingTasks = TaskManager.tasks.size > 0;
    const hasExistingProjects = ProjectManager.projects.size > 4;

    if (hasExistingTasks || hasExistingProjects) {
        console.log('Existing data found, skipping sample data');
        return;
    }

    console.log('Loading sample data...');

    const sampleTasks = [
        {
            id: 'task-1',
            title: 'Design Homepage Layout',
            description: 'Create wireframes and mockups for the new homepage design with modern UI/UX principles',
            status: 'todo',
            priority: 'high',
            assignee: 'user2',
            dueDate: '2024-02-15',
            labels: ['design', 'frontend'],
            projectId: 'project-1',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-25')
        },
        {
            id: 'task-2',
            title: 'Implement User Authentication',
            description: 'Set up secure login, registration, and password reset functionality with JWT tokens',
            status: 'inprogress',
            priority: 'high',
            assignee: 'user1',
            dueDate: '2024-02-10',
            labels: ['backend', 'feature', 'security'],
            projectId: 'project-1',
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-26')
        },
        {
            id: 'task-3',
            title: 'Fix Mobile Responsive Issues',
            description: 'Address layout problems on mobile devices and optimize for different screen sizes',
            status: 'review',
            priority: 'medium',
            assignee: 'user3',
            dueDate: '2024-02-05',
            labels: ['frontend', 'bug', 'responsive'],
            projectId: 'project-1',
            createdAt: new Date('2024-01-22'),
            updatedAt: new Date('2024-01-27')
        },
        {
            id: 'task-4',
            title: 'Write API Documentation',
            description: 'Document all API endpoints with examples and usage guidelines for developers',
            status: 'backlog',
            priority: 'low',
            assignee: 'user1',
            dueDate: '2024-02-20',
            labels: ['documentation', 'backend'],
            projectId: 'project-1',
            createdAt: new Date('2024-01-24'),
            updatedAt: new Date('2024-01-24')
        },
        {
            id: 'task-5',
            title: 'Optimize Database Queries',
            description: 'Improve performance of slow database queries and add proper indexing',
            status: 'done',
            priority: 'medium',
            assignee: 'user2',
            dueDate: '2024-01-30',
            labels: ['backend', 'optimization', 'database'],
            projectId: 'project-1',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-28')
        },
        {
            id: 'task-6',
            title: 'iOS App Development',
            description: 'Begin development of iOS mobile application with Swift and SwiftUI',
            status: 'todo',
            priority: 'high',
            assignee: 'user1',
            dueDate: '2024-03-01',
            labels: ['mobile', 'ios', 'development'],
            projectId: 'project-2',
            createdAt: new Date('2024-01-24'),
            updatedAt: new Date('2024-01-24')
        },
        {
            id: 'task-7',
            title: 'Android App UI Design',
            description: 'Design user interface for Android version of the mobile application',
            status: 'inprogress',
            priority: 'medium',
            assignee: 'user2',
            dueDate: '2024-02-28',
            labels: ['design', 'mobile', 'android'],
            projectId: 'project-2',
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-26')
        },
        {
            id: 'task-8',
            title: 'Social Media Campaign',
            description: 'Plan and execute Q2 social media marketing campaign across all platforms',
            status: 'backlog',
            priority: 'medium',
            assignee: 'user2',
            dueDate: '2024-02-28',
            labels: ['marketing', 'social', 'campaign'],
            projectId: 'project-3',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-28')
        },
        {
            id: 'task-9',
            title: 'Email Newsletter',
            description: 'Create and send monthly email newsletter to subscriber list',
            status: 'todo',
            priority: 'low',
            assignee: 'user3',
            dueDate: '2024-02-10',
            labels: ['marketing', 'email', 'content'],
            projectId: 'project-3',
            createdAt: new Date('2024-01-22'),
            updatedAt: new Date('2024-01-27')
        },
        {
            id: 'task-10',
            title: 'Product Launch Planning',
            description: 'Coordinate product launch event and marketing materials',
            status: 'inprogress',
            priority: 'high',
            assignee: 'user1',
            dueDate: '2024-03-15',
            labels: ['planning', 'launch', 'coordination'],
            projectId: 'project-4',
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-26')
        }
    ];

    let loadedCount = 0;
    sampleTasks.forEach(task => {
        const createdTask = TaskManager.createTask(task, false);
        if (createdTask) loadedCount++;
    });

    console.log(`Loaded ${loadedCount} sample tasks`);

    ProjectManager.projects.forEach((project, projectId) => {
        ProjectManager.updateProjectTaskCount(projectId);
    });

    TaskManager.loadProjectTasks(ProjectManager.currentProject);
}

function setupEventListeners() {
    document.getElementById('createTaskBtn').addEventListener('click', function () {
        ModalManager.openCreateTaskModal();
    });

    document.getElementById('themeToggle').addEventListener('click', function () {
        ThemeManager.toggleTheme();
    });

    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        TaskManager.filterTasks(searchTerm);
    });

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            ModalManager.openCreateTaskModal();
        }
    });

    setupMobileNavigation();
}
const dueSoonFilter = document.querySelector('.filter-item:nth-child(2)');
if (dueSoonFilter) {
    dueSoonFilter.addEventListener('click', () => {
        window.location.href = 'due-soon.html';
    });
}
function setupMobileNavigation() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

}

function generateId(prefix = 'task') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const NotificationSystem = {
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification fade-in`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            box-shadow: var(--shadow-lg);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        return notification;
    }
};



const ProjectManager = {
    currentProject: 'project-1',
    projects: new Map(),

    init() {
        this.loadProjects();
        this.setupProjectEventListeners();
        this.switchProject(this.currentProject);
    },

    loadProjects() {
        this.projects.set('project-1', {
            id: 'project-1',
            name: 'Website Redesign',
            color: '#3498db',
            description: 'Complete redesign of company website',
            tasks: new Map()
        });

        this.projects.set('project-2', {
            id: 'project-2',
            name: 'Mobile App',
            color: '#e74c3c',
            description: 'New mobile application development',
            tasks: new Map()
        });

        this.projects.set('project-3', {
            id: 'project-3',
            name: 'Marketing Campaign',
            color: '#2ecc71',
            description: 'Q2 marketing campaign planning',
            tasks: new Map()
        });

        this.projects.set('project-4', {
            id: 'project-4',
            name: 'Product Launch',
            color: '#f39c12',
            description: 'New product launch preparation',
            tasks: new Map()
        });

        this.loadFromStorage();
    },

    setupProjectEventListeners() {
        document.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const projectId = item.getAttribute('data-project-id');
                if (projectId) {
                    this.switchProject(projectId);
                }
            });
        });

        document.querySelector('.btn-new-project').addEventListener('click', () => {
            this.openCreateProjectModal();
        });
    },

    switchProject(projectId) {
        if (!this.projects.has(projectId)) return;

        this.currentProject = projectId;
        const project = this.projects.get(projectId);

        this.updateProjectUI(project);

        TaskManager.loadProjectTasks(projectId);

        this.updateActiveProject(projectId);

        this.saveToStorage();

        NotificationSystem.show(`Switched to ${project.name}`, 'info');
    },

    updateProjectUI(project) {
        const boardTitle = document.querySelector('.board-title h1');
        if (boardTitle) {
            boardTitle.textContent = project.name;
        }

        const boardDescription = document.querySelector('.board-description');
        if (!boardDescription) {
            const titleContainer = document.querySelector('.board-title');
            const descElement = document.createElement('p');
            descElement.className = 'board-description text-muted';
            descElement.textContent = project.description;
            titleContainer.appendChild(descElement);
        } else {
            boardDescription.textContent = project.description;
        }
    },

    updateActiveProject(activeProjectId) {
        document.querySelectorAll('.project-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeProject = document.querySelector(`[data-project-id="${activeProjectId}"]`);
        if (activeProject) {
            activeProject.classList.add('active');
        }
    },

    createProject(projectData) {
        const project = {
            id: projectData.id || generateId('project'),
            name: projectData.name,
            color: projectData.color || this.generateRandomColor(),
            description: projectData.description || '',
            createdAt: new Date(),
            tasks: new Map()
        };

        this.projects.set(project.id, project);
        this.renderProject(project);
        this.saveToStorage();

        NotificationSystem.show(`Project "${project.name}" created successfully`, 'success');
        return project;
    },

    renderProject(project) {
        const projectList = document.querySelector('.project-list');
        const projectItem = this.createProjectElement(project);
        projectList.appendChild(projectItem);
    },

    createProjectElement(project) {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.setAttribute('data-project-id', project.id);

        projectDiv.innerHTML = `
            <div class="project-color" style="background-color: ${project.color};"></div>
            <span>${project.name}</span>
            <span class="project-count">0</span>
        `;

        projectDiv.addEventListener('click', () => {
            this.switchProject(project.id);
        });

        return projectDiv;
    },

    generateRandomColor() {
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    openCreateProjectModal() {
        const projectName = prompt('Enter project name:');
        if (projectName && projectName.trim()) {
            this.createProject({
                name: projectName.trim(),
                description: prompt('Enter project description:') || ''
            });
        }
    },

    updateProjectTaskCount(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return;

        const taskCount = project.tasks.size;
        const projectElement = document.querySelector(`[data-project-id="${projectId}"] .project-count`);
        if (projectElement) {
            projectElement.textContent = taskCount;
        }
    },

    saveToStorage() {
        const projectsData = Array.from(this.projects.entries()).map(([id, project]) => {
            return {
                id: project.id,
                name: project.name,
                color: project.color,
                description: project.description,
                createdAt: project.createdAt,
                tasks: Array.from(project.tasks.entries())
            };
        });

        localStorage.setItem('taskflow-projects', JSON.stringify(projectsData));
        localStorage.setItem('taskflow-current-project', this.currentProject);
    },

    loadFromStorage() {
        try {
            const storedProjects = localStorage.getItem('taskflow-projects');
            const storedCurrentProject = localStorage.getItem('taskflow-current-project');

            if (storedProjects) {
                const projectsArray = JSON.parse(storedProjects);
                projectsArray.forEach(projectData => {
                    const project = {
                        ...projectData,
                        tasks: new Map(projectData.tasks || [])
                    };
                    this.projects.set(project.id, project);
                });
            }

            if (storedCurrentProject && this.projects.has(storedCurrentProject)) {
                this.currentProject = storedCurrentProject;
            }
        } catch (error) {
            console.error('Error loading projects from storage:', error);
        }
    }
};

window.TaskFlow = {
    TaskManager,
    DragDropManager,
    ModalManager,
    ThemeManager,
    NotificationSystem
};