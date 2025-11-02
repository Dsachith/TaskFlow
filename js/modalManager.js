const ModalManager = {
    currentEditingTaskId: null,
    selectedLabels: new Set(),

    init() {
        console.log('Initializing ModalManager...');
        this.setupEventListeners();
        this.setupLabelSelection();
    },

    setupEventListeners() {
        console.log('Setting up event listeners...');

        const createTaskBtn = document.getElementById('createTaskBtn');
        if (createTaskBtn) {
            createTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Main create task button clicked');
                this.openCreateTaskModal();
            });
        } else {
            console.error('Create task button not found!');
        }

        const addTaskButtons = document.querySelectorAll('.btn-add-task');
        console.log('Found add task buttons:', addTaskButtons.length);

        addTaskButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const column = button.getAttribute('data-column');
                console.log('Add task button clicked for column:', column);
                this.openCreateTaskModal(column);
            });
        });

        const saveBtn = document.getElementById('saveTaskBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTask();
            });
        }

        console.log('Event listeners setup complete');
    },

    setupLabelSelection() {
        console.log('Label selection setup ready');
    },

    setupLabelClickHandlers() {
        console.log('Setting up label click handlers...');
        const labels = document.querySelectorAll('.label-tag');
        console.log('Found labels:', labels.length);

        labels.forEach(label => {
            label.replaceWith(label.cloneNode(true));
        });

        document.querySelectorAll('.label-tag').forEach(label => {
            label.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Label clicked:', label.textContent);
                this.toggleLabelSelection(label);
            });
        });
    },

    toggleLabelSelection(labelElement) {
        const label = labelElement.textContent.trim().toLowerCase();
        console.log('Toggling label:', label);

        if (this.selectedLabels.has(label)) {
            this.selectedLabels.delete(label);
            labelElement.classList.remove('selected');
        } else {
            this.selectedLabels.add(label);
            labelElement.classList.add('selected');
        }

        console.log('Selected labels:', Array.from(this.selectedLabels));
    },

    openCreateTaskModal(prefillStatus = null) {
        console.log('Opening create task modal...');

        this.resetModal();

        if (prefillStatus) {
            const statusSelect = document.getElementById('taskStatus');
            if (statusSelect) {
                statusSelect.value = prefillStatus;
            }
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dueDateInput = document.getElementById('taskDueDate');
        if (dueDateInput) {
            dueDateInput.value = tomorrow.toISOString().split('T')[0];
        }

        const assigneeSelect = document.getElementById('taskAssignee');
        if (assigneeSelect && TaskManager.currentUser) {
            assigneeSelect.value = TaskManager.currentUser;
        }

        const modalTitle = document.querySelector('#createTaskModal .modal-title');
        const saveButton = document.getElementById('saveTaskBtn');

        if (modalTitle) modalTitle.textContent = 'Create New Task';
        if (saveButton) {
            saveButton.textContent = 'Create Task';
            saveButton.className = 'btn btn-primary';
        }

        this.setupLabelClickHandlers();

        const modalElement = document.getElementById('createTaskModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Modal shown successfully');
        } else {
            console.error('Modal element not found!');
        }
    },

    openEditTaskModal(taskId) {
        const task = TaskManager.tasks.get(taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        this.resetModal();

        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskAssignee').value = task.assignee;
        document.getElementById('taskDueDate').value = task.dueDate;

        this.selectedLabels = new Set(task.labels);
        this.updateLabelSelection();

        document.querySelector('#createTaskModal .modal-title').textContent = 'Edit Task';
        document.getElementById('saveTaskBtn').textContent = 'Update Task';
        document.getElementById('saveTaskBtn').className = 'btn btn-warning';

        this.currentEditingTaskId = taskId;

        this.setupLabelClickHandlers();

        const modalElement = document.getElementById('createTaskModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    },

    updateLabelSelection() {
        document.querySelectorAll('.label-tag').forEach(tag => {
            tag.classList.remove('selected');
        });

        this.selectedLabels.forEach(label => {
            const labelText = label.toLowerCase();
            const labelElement = Array.from(document.querySelectorAll('.label-tag'))
                .find(tag => tag.textContent.trim().toLowerCase() === labelText);
            if (labelElement) {
                labelElement.classList.add('selected');
            }
        });
    },

    async saveTask() {
        const isEditing = this.currentEditingTaskId !== null;

        const taskData = {
            title: document.getElementById('taskTitle').value.trim(),
            description: document.getElementById('taskDescription').value.trim(),
            status: document.getElementById('taskStatus').value,
            priority: document.getElementById('taskPriority').value,
            assignee: document.getElementById('taskAssignee').value,
            dueDate: document.getElementById('taskDueDate').value,
            labels: Array.from(this.selectedLabels)
        };

        console.log('Saving task with data:', taskData);

        if (!taskData.title) {
            alert('Task title is required!');
            return;
        }

        this.setLoadingState(true);

        try {
            let savedTask;
            if (isEditing) {
                savedTask = await TaskManager.updateTask(this.currentEditingTaskId, taskData);
            } else {
                savedTask = await TaskManager.createTask(taskData);
            }

            console.log('Task saved successfully:', savedTask);

            const modalElement = document.getElementById('createTaskModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }

            setTimeout(() => {
                TaskManager.checkEmptyStates(ProjectManager.currentProject);
            }, 100);

        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving task. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    },

    setLoadingState(loading) {
        const saveButton = document.getElementById('saveTaskBtn');
        if (!saveButton) return;

        if (loading) {
            saveButton.disabled = true;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        } else {
            saveButton.disabled = false;
            saveButton.textContent = this.currentEditingTaskId ? 'Update Task' : 'Create Task';
        }
    },

    resetModal() {
        console.log('Resetting modal...');

        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();
        }

        this.selectedLabels.clear();
        document.querySelectorAll('.label-tag').forEach(tag => {
            tag.classList.remove('selected');
        });

        this.currentEditingTaskId = null;

        this.setLoadingState(false);
    }
};