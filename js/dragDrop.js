const DragDropManager = {
    init() {
        this.setupDragAndDrop();
    },

    setupDragAndDrop() {
        const taskLists = document.querySelectorAll('.task-list');

        taskLists.forEach(list => {
            list.addEventListener('dragover', this.handleDragOver.bind(this));
            list.addEventListener('drop', this.handleDrop.bind(this));
            list.addEventListener('dragenter', this.handleDragEnter.bind(this));
            list.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });

        document.addEventListener('dragstart', this.handleDragStart.bind(this));
        document.addEventListener('dragend', this.handleDragEnd.bind(this));
    },

    handleDragStart(e) {
        if (!e.target.classList.contains('task-card')) return;

        const taskId = e.target.getAttribute('data-task-id');
        e.dataTransfer.setData('text/plain', taskId);
        e.target.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleDrop(e) {
        e.preventDefault();

        const taskId = e.dataTransfer.getData('text/plain');
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const dropZone = e.currentTarget;

        if (!taskElement || !dropZone) return;

        const column = dropZone.closest('.board-column');
        const newStatus = column.getAttribute('data-status');

        console.log(`Moving task ${taskId} to ${newStatus}`);

        TaskManager.moveTask(taskId, newStatus).then(() => {
            this.updateEmptyStatesAfterDrag(taskId, newStatus);
        });

        this.removeDropZoneStyles(dropZone);
    },

    updateEmptyStatesAfterDrag(taskId, newStatus) {
        const task = TaskManager.tasks.get(taskId);
        if (!task) return;

        const previousTaskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        let oldStatus = null;

        if (previousTaskElement) {
            const oldColumn = previousTaskElement.closest('.task-list');
            if (oldColumn) {
                const oldColumnElement = oldColumn.closest('.board-column');
                oldStatus = oldColumnElement ? oldColumnElement.getAttribute('data-status') : null;
            }
        }

        console.log(`Task moved from ${oldStatus} to ${newStatus}`);

        if (oldStatus && oldStatus !== newStatus) {
            TaskManager.checkEmptyStates(ProjectManager.currentProject);
        } else {
            TaskManager.checkEmptyStates(ProjectManager.currentProject);
        }

        TaskManager.updateTaskCounts();
    },

    handleDragEnter(e) {
        if (!e.currentTarget.classList.contains('task-list')) return;

        e.currentTarget.classList.add('drop-zone');
        e.preventDefault();
    },

    handleDragLeave(e) {
        if (!e.currentTarget.classList.contains('task-list')) return;

        if (!e.currentTarget.contains(e.relatedTarget)) {
            this.removeDropZoneStyles(e.currentTarget);
        }
    },

    handleDragEnd(e) {
        if (!e.target.classList.contains('task-card')) return;

        e.target.classList.remove('dragging');

        document.querySelectorAll('.drop-zone').forEach(zone => {
            this.removeDropZoneStyles(zone);
        });
    },

    removeDropZoneStyles(element) {
        element.classList.remove('drop-zone');
    }
};