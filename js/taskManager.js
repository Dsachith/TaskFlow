const TaskManager = {
    tasks: new Map(),
    currentFilter: 'all',
    currentPriorityFilter: 'all',

    setCurrentUser(userId) {
        this.currentUser = userId;
        console.log('Current user set to:', userId);
        this.applyCurrentFilters();
    },
    getCurrentUser() {
        return this.currentUser;
    },
    passesMainFilter(task) {
        switch (this.currentFilter) {
            case 'all':
                return true;

            case 'assigned-to-me':
                return task.assignee === this.currentUser;

            case 'priority':
                return task.priority === 'high' || task.priority === 'urgent';

            case 'due-soon':
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const timeDiff = dueDate.getTime() - today.getTime();
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                return daysDiff <= 3 && daysDiff >= 0;

            case 'overdue':
                if (!task.dueDate) return false;
                const overdueDate = new Date(task.dueDate);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                return overdueDate < now;

            default:
                return true;
        }
    },

    init() {
        this.loadFromStorage();
        console.log('TaskManager initialized with', this.tasks.size, 'tasks');
    },


    createTask(taskData, showNotification = true) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const task = {
                    id: taskData.id || generateId(),
                    title: taskData.title,
                    description: taskData.description || '',
                    status: taskData.status || 'backlog',
                    priority: taskData.priority || 'medium',
                    assignee: taskData.assignee || '',
                    dueDate: taskData.dueDate || '',
                    labels: taskData.labels || [],
                    projectId: taskData.projectId || ProjectManager.currentProject,
                    createdAt: taskData.createdAt || new Date(),
                    updatedAt: new Date()
                };

                console.log('Creating task:', task.title, 'Labels:', task.labels);

                this.tasks.set(task.id, task);

                const project = ProjectManager.projects.get(task.projectId);
                if (project) {
                    project.tasks.set(task.id, task);
                    ProjectManager.updateProjectTaskCount(task.projectId);
                }

                if (task.projectId === ProjectManager.currentProject) {
                    this.renderTask(task);
                }

                this.updateTaskCounts();
                this.saveToStorage();

                if (showNotification) {
                    NotificationSystem.show(`Task "${task.title}" created successfully`, 'success');
                }

                resolve(task);
            });
        });
    },

    updateTask(taskId, updates) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const task = this.tasks.get(taskId);
                if (!task) {
                    console.warn('Task not found for update:', taskId);
                    resolve(null);
                    return;
                }

                const oldStatus = task.status;
                Object.assign(task, updates, { updatedAt: new Date() });

                if (updates.status && updates.status !== oldStatus) {
                    this.removeTaskFromDOM(taskId);
                    if (task.projectId === ProjectManager.currentProject) {
                        this.renderTask(task);
                    }
                } else if (task.projectId === ProjectManager.currentProject) {
                    this.renderTask(task);
                }

                this.updateTaskCounts();
                this.saveToStorage();

                NotificationSystem.show(`Task "${task.title}" updated successfully`, 'success');
                resolve(task);
            });
        });
    },

    deleteTask(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            console.warn('Task not found for deletion:', taskId);
            return false;
        }

        this.tasks.delete(taskId);

        const project = ProjectManager.projects.get(task.projectId);
        if (project) {
            project.tasks.delete(taskId);
            ProjectManager.updateProjectTaskCount(task.projectId);
        }

        this.removeTaskFromDOM(taskId);
        this.updateTaskCounts();
        this.saveToStorage();

        NotificationSystem.show(`Task "${task.title}" deleted`, 'warning');
        return true;
    },

    moveTask(taskId, newStatus) {
        return this.updateTask(taskId, { status: newStatus }).then((updatedTask) => {
            if (updatedTask) {
                this.checkEmptyStates(ProjectManager.currentProject);
                this.updateTaskCounts();
            }
            return updatedTask;
        });
    },

    loadProjectTasks(projectId) {
        console.log('Loading tasks for project:', projectId);

        this.clearTaskDisplay();

        let renderedCount = 0;
        this.tasks.forEach(task => {
            if (task.projectId === projectId) {
                this.renderTask(task);
                renderedCount++;
            }
        });

        console.log(`Rendered ${renderedCount} tasks for project ${projectId}`);

        this.updateTaskCounts();

        this.checkEmptyStates(projectId);
    },

    checkEmptyStates(projectId) {
        const columns = ['backlog', 'todo', 'inprogress', 'review', 'done'];

        columns.forEach(status => {
            const taskList = document.getElementById(`${status}-tasks`);
            const column = document.querySelector(`[data-status="${status}"]`);

            if (taskList && column) {
                const hasTasks = Array.from(taskList.children).some(child =>
                    child.classList.contains('task-card') && child.style.display !== 'none'
                );

                console.log(`Column ${status} has tasks:`, hasTasks);

                const existingEmptyState = taskList.querySelector('.empty-state');
                if (existingEmptyState) {
                    existingEmptyState.remove();
                } if (!hasTasks) {
                    const emptyState = this.createEmptyState(status);
                    taskList.appendChild(emptyState);
                    console.log(`Added empty state to ${status}`);
                } else {
                    console.log(`No empty state needed for ${status} - has tasks`);
                }
            }
        });
    },


    createEmptyState(status) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';

        const statusMessages = {
            'backlog': 'No tasks in backlog',
            'todo': 'No tasks to do',
            'inprogress': 'No tasks in progress',
            'review': 'No tasks under review',
            'done': 'No completed tasks'
        };

        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <h4>${statusMessages[status] || 'No tasks'}</h4>
            <p>Add a new task to get started</p>
        `;

        return emptyState;
    },

    clearTaskDisplay() {
        const taskLists = document.querySelectorAll('.task-list');
        taskLists.forEach(list => {
            list.innerHTML = '';
        });
    },

    renderTask(task) {
        this.removeTaskFromDOM(task.id);

        const taskList = document.getElementById(`${task.status}-tasks`);
        if (!taskList) {
            console.warn('Task list not found for status:', task.status);
            return;
        }

        const existingEmptyState = taskList.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
            console.log(`Removed empty state from ${task.status}`);
        }

        const taskElement = this.createTaskElement(task);
        taskList.appendChild(taskElement);

        console.log(`Rendered task in ${task.status}:`, task.title);
    },

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-card fade-in';
        taskDiv.setAttribute('data-task-id', task.id);
        taskDiv.draggable = true;

        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let dueClass = '';
        if (dueDate) {
            dueDate.setHours(0, 0, 0, 0);
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);

            if (daysDiff < 0) {
                dueClass = 'overdue';
            } else if (daysDiff <= 3) {
                dueClass = 'due-soon';
            }
        }

        const assigneeImages = {
            'user1': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
            'user2': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80',
            'user3': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2061&q=80'
        };

        const assigneeImage = assigneeImages[task.assignee] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80';

        taskDiv.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="task-actions">
                    <button class="btn-icon btn-edit-task" data-task-id="${task.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            <div class="task-description">${this.escapeHtml(task.description)}</div>
            <div class="task-footer">
                <div class="task-meta">
                    ${task.assignee ? `<div class="task-assignee">
                        <img src="${assigneeImage}" alt="Assignee">
                    </div>` : ''}
                    <div class="task-labels">
                        ${task.labels.map(label =>
            `<span class="label-tag" style="background-color: ${this.getLabelColor(label)}">${label}</span>`
        ).join('')}
                    </div>
                </div>
                ${dueDate ? `<div class="task-due-date ${dueClass}">
                    <i class="fas fa-calendar"></i>
                    ${dueDate.toLocaleDateString()}
                </div>` : ''}
            </div>
        `;

        taskDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-edit-task')) {
                ModalManager.openTaskDetailModal(task.id);
            }
        });

        taskDiv.querySelector('.btn-edit-task').addEventListener('click', (e) => {
            e.stopPropagation();
            ModalManager.openEditTaskModal(task.id);
        });

        taskDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskDiv.classList.add('dragging');
        });

        taskDiv.addEventListener('dragend', (e) => {
            taskDiv.classList.remove('dragging');
        });

        return taskDiv;
    },

    removeTaskFromDOM(taskId) {
        const existingTask = document.querySelector(`[data-task-id="${taskId}"]`);
        if (existingTask) {
            const taskList = existingTask.closest('.task-list');
            existingTask.remove();

            if (taskList) {
                const hasTasks = Array.from(taskList.children).some(child =>
                    child.classList.contains('task-card') && child.style.display !== 'none'
                );

                if (!hasTasks) {
                    const status = taskList.closest('.board-column').getAttribute('data-status');
                    const emptyState = this.createEmptyState(status);
                    taskList.appendChild(emptyState);
                    console.log(`Added empty state to ${status} after task removal`);
                }
            }
        }
    },

    renderAllTasks() {
        const currentProjectId = ProjectManager.currentProject;
        console.log('Rendering all tasks for project:', currentProjectId);

        this.clearTaskDisplay();

        let renderedCount = 0;
        this.tasks.forEach(task => {
            if (task.projectId === currentProjectId) {
                this.renderTask(task);
                renderedCount++;
            }
        });

        console.log(`Rendered ${renderedCount} tasks for current project`);
        this.updateTaskCounts();
        this.checkEmptyStates(currentProjectId);
    },

    updateTaskCounts() {
        const columns = ['backlog', 'todo', 'inprogress', 'review', 'done'];
        const currentProjectId = ProjectManager.currentProject;

        console.log('Updating task counts for project:', currentProjectId);

        columns.forEach(status => {
            const count = Array.from(this.tasks.values()).filter(task =>
                task.status === status && task.projectId === currentProjectId
            ).length;

            const countElement = document.querySelector(`[data-status="${status}"] .task-count`);
            if (countElement) {
                countElement.textContent = count;
                console.log(`Column ${status}: ${count} tasks`);
            }
        });

        this.updateBoardStats();
    },

    updateBoardStats() {
        const currentProjectId = ProjectManager.currentProject;
        const projectTasks = Array.from(this.tasks.values()).filter(task =>
            task.projectId === currentProjectId
        );

        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(task => task.status === 'done').length;

        const overdueTasks = projectTasks.filter(task => {
            if (!task.dueDate || task.status === 'done') return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return dueDate < today;
        }).length;

        const totalElement = document.querySelector('.board-stats .stat-number:nth-child(1)');
        const completedElement = document.querySelector('.board-stats .stat-number:nth-child(2)');
        const overdueElement = document.querySelector('.board-stats .stat-number:nth-child(3)');

        if (totalElement) totalElement.textContent = totalTasks;
        if (completedElement) completedElement.textContent = completedTasks;
        if (overdueElement) overdueElement.textContent = overdueTasks;

        ProjectManager.updateProjectTaskCount(currentProjectId);

        console.log(`Board stats - Total: ${totalTasks}, Completed: ${completedTasks}, Overdue: ${overdueTasks}`);
    },

    filterTasks(searchTerm) {
        const currentProjectId = ProjectManager.currentProject;
        const allTasks = document.querySelectorAll('.task-card');

        let visibleCount = 0;

        allTasks.forEach(taskElement => {
            const taskId = taskElement.getAttribute('data-task-id');
            const task = this.tasks.get(taskId);

            if (!task || task.projectId !== currentProjectId) {
                taskElement.style.display = 'none';
                return;
            }

            const searchLower = searchTerm.toLowerCase();
            const matches = task.title.toLowerCase().includes(searchLower) ||
                task.description.toLowerCase().includes(searchLower) ||
                task.labels.some(label => label.toLowerCase().includes(searchLower));

            if (matches) {
                taskElement.style.display = 'block';
                visibleCount++;
            } else {
                taskElement.style.display = 'none';
            }
        });

        console.log(`Filtered tasks: ${visibleCount} visible for search: "${searchTerm}"`);

        this.checkEmptyStatesAfterFilter(searchTerm);
    },

    checkEmptyStatesAfterFilter(searchTerm) {
        const columns = ['backlog', 'todo', 'inprogress', 'review', 'done'];
        const currentProjectId = ProjectManager.currentProject;

        if (!searchTerm) {
            this.checkEmptyStates(currentProjectId);
            return;
        }

        columns.forEach(status => {
            const taskList = document.getElementById(`${status}-tasks`);
            if (taskList) {
                const hasVisibleTasks = Array.from(taskList.children).some(child => {
                    return child.style.display !== 'none' && !child.classList.contains('empty-state');
                });

                const existingEmptyState = taskList.querySelector('.empty-state');
                if (existingEmptyState) {
                    existingEmptyState.remove();
                }

                if (!hasVisibleTasks) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = `
                        <i class="fas fa-search"></i>
                        <h4>No matching tasks</h4>
                        <p>No tasks found for "${searchTerm}" in this column</p>
                    `;
                    taskList.appendChild(emptyState);
                }
            }
        });
    },

    getCurrentProjectTasks() {
        const currentProjectId = ProjectManager.currentProject;
        return Array.from(this.tasks.values()).filter(task =>
            task.projectId === currentProjectId
        );
    },

    getTasksByStatus(status) {
        const currentProjectId = ProjectManager.currentProject;
        return Array.from(this.tasks.values()).filter(task =>
            task.status === status && task.projectId === currentProjectId
        );
    },

    getOverdueTasks() {
        const currentProjectId = ProjectManager.currentProject;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return Array.from(this.tasks.values()).filter(task => {
            if (!task.dueDate || task.status === 'done') return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today && task.projectId === currentProjectId;
        });
    },

    getDueSoonTasks() {
        const currentProjectId = ProjectManager.currentProject;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        return Array.from(this.tasks.values()).filter(task => {
            if (!task.dueDate || task.status === 'done') return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today && dueDate <= threeDaysFromNow && task.projectId === currentProjectId;
        });
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

    saveToStorage() {
        try {
            const tasksArray = Array.from(this.tasks.entries());
            localStorage.setItem('taskflow-tasks', JSON.stringify(tasksArray));
            console.log('Saved tasks to storage:', tasksArray.length);
        } catch (error) {
            console.error('Error saving tasks to storage:', error);
        }
    },

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('taskflow-tasks');
            if (stored) {
                const tasksArray = JSON.parse(stored);
                this.tasks = new Map(tasksArray);
                console.log('Loaded tasks from storage:', this.tasks.size);

                if (ProjectManager && ProjectManager.projects) {
                    ProjectManager.projects.forEach(project => {
                        project.tasks.clear();
                    });

                    this.tasks.forEach(task => {
                        const project = ProjectManager.projects.get(task.projectId);
                        if (project) {
                            project.tasks.set(task.id, task);
                        } else {
                            console.warn('Project not found for task:', task.projectId, task.title);
                        }
                    });

                    ProjectManager.projects.forEach((project, projectId) => {
                        ProjectManager.updateProjectTaskCount(projectId);
                    });
                }
            } else {
                console.log('No stored tasks found');
            }
        } catch (error) {
            console.error('Error loading tasks from storage:', error);
            this.tasks = new Map();
        }
    },

    exportTasks() {
        const currentProjectTasks = this.getCurrentProjectTasks();
        return JSON.stringify(currentProjectTasks, null, 2);
    },

    importTasks(tasksJson) {
        try {
            const tasks = JSON.parse(tasksJson);
            tasks.forEach(taskData => {
                this.createTask(taskData, false);
            });
            NotificationSystem.show(`Imported ${tasks.length} tasks successfully`, 'success');
        } catch (error) {
            console.error('Error importing tasks:', error);
            NotificationSystem.show('Error importing tasks', 'danger');
        }
    },

    clearAllTasks() {
        this.tasks.clear();
        this.clearTaskDisplay();
        this.updateTaskCounts();
        this.saveToStorage();

        ProjectManager.projects.forEach(project => {
            project.tasks.clear();
            ProjectManager.updateProjectTaskCount(project.id);
        });

        NotificationSystem.show('All tasks cleared', 'warning');
    }
};

window.debugTasks = function () {
    console.log('=== TASK DEBUG INFO ===');
    console.log('Current Project:', ProjectManager.currentProject);
    console.log('Total Tasks in System:', TaskManager.tasks.size);
    console.log('Projects:', Array.from(ProjectManager.projects.entries()));

    const currentProjectTasks = Array.from(TaskManager.tasks.values()).filter(
        task => task.projectId === ProjectManager.currentProject
    );
    console.log('Current Project Tasks:', currentProjectTasks);

    const columns = ['backlog', 'todo', 'inprogress', 'review', 'done'];
    columns.forEach(status => {
        const element = document.getElementById(`${status}-tasks`);
        const taskElements = element ? Array.from(element.children).filter(child =>
            child.classList.contains('task-card')
        ) : [];
        console.log(`Column ${status}:`, taskElements.length, 'task elements');
    });

    const stored = localStorage.getItem('taskflow-tasks');
    console.log('Stored tasks:', stored ? JSON.parse(stored).length : 'none');
};

window.TaskManager = TaskManager;