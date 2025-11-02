
## Installation & Usage

1. **Clone or Download** the project files
2. **Open** `index.html` in a modern web browser
3. **Start Managing Tasks** immediately - no setup required!

### Browser Requirements
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Key Features Implementation

### Task Management
- Create, read, update, delete tasks
- Assign priorities (Low, Medium, High, Urgent)
- Set due dates with visual indicators
- Add labels with color coding
- Assign to team members

### Kanban Board
- Backlog, To Do, In Progress, Review, Done columns
- Visual task counts per column
- Smooth drag-and-drop between columns
- Touch-friendly for mobile devices

### Theme System
- CSS custom properties for theming
- System preference detection
- Persistent user preference
- Smooth transitions

## Customization

### Adding New Task Statuses
1. Update `kanban-board` grid in HTML
2. Add column styling in CSS
3. Update status options in modal
4. Modify task filtering logic

### Custom Labels
Edit the label colors in `taskManager.js`:
```javascript
const colors = {
    'your-label': '#hex-color'
};