# Project Monitoring Frontend Integration Guide

## Overview
This guide explains how to integrate the Project Monitoring components into your existing React app.

## Files Created

### API Services
- `src/services/projects.js` — API calls for project CRUD and metrics
- `src/services/tasks.js` — API calls for task creation and completion

### Components
- `src/features/projects/components/MetricsDisplay.jsx` — Shows project metrics (hours, progress%, time%)
- `src/features/projects/components/TaskList.jsx` — Displays tasks with completion buttons
- `src/features/projects/components/ProjectCard.jsx` — Card summary for project list

### Pages
- `src/features/projects/pages/ProjectsListPage.jsx` — Dashboard showing all projects
- `src/features/projects/pages/ProjectDetailPage.jsx` — Detailed view of one project
- `src/features/projects/pages/CreateProjectPage.jsx` — Form to create projects with tasks

### Styles
- `src/features/projects/styles/` — CSS files for each component/page

## Integration Steps

### 1. Update App.jsx

Add imports:
```jsx
import ProjectsListPage from '../features/projects/pages/ProjectsListPage'
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage'
import CreateProjectPage from '../features/projects/pages/CreateProjectPage'
import { MdAssignment } from "react-icons/md";
```

Add navigation item to sidebar (uncomment/update):
```jsx
<div
  className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}
  onClick={() => setCurrentPage('projects')}
  style={{ cursor: 'pointer' }}
>
  <MdAssignment size={20} />
  <span>Projets</span>
</div>
```

Add page rendering in the main content area (around line 140+):
```jsx
{currentPage === 'projects' && <ProjectsListPage />}
{currentPage === 'projectDetail' && <ProjectDetailPage />}
{currentPage === 'createProject' && <CreateProjectPage />}
```

### 2. Update Navigation

Replace the simp state-based routing with React Router (recommended):

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Wrap your pages in Routes
<Routes>
  <Route path="/projects" element={<ProjectsListPage />} />
  <Route path="/projects/create" element={<CreateProjectPage />} />
  <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
  {/* ... other routes ... */}
</Routes>
```

Or update the current page state system to handle `/projects/:id` paths.

### 3. Environment Variables

Ensure your backend API base is configured:
```env
REACT_APP_API_BASE=http://localhost:8081/api
```

Or update `src/services/projects.js` and `src/services/tasks.js` with your backend URL.

### 4. Authentication

The components assume `localStorage.getItem('userId')` for superviseur ID. Update as needed:

In `ProjectDetailPage.jsx`:
```jsx
const [superviseurId] = useState(localStorage.getItem('userId'));
```

Replace with your actual auth context/state.

### 5. Admin Dashboard Integration

Add to existing admin dashboard (`AdminPage` or similar):
```jsx
import ProjectsListPage from '../projects/pages/ProjectsListPage';

// In your admin page:
<section className="admin-section">
  <h2>Project Monitoring</h2>
  <ProjectsListPage />
</section>
```

## API Endpoints Expected

The frontend expects these backend endpoints:

### Projects
- `GET /api/projects` — List all projects with metrics
- `GET /api/projects/{id}/metrics` — Get project metrics
- `POST /api/projects` — Create project
- `PUT /api/projects/{id}` — Update project
- `DELETE /api/projects/{id}` — Delete project

### Tasks
- `POST /api/projects/{projectId}/tasks` — Create tasks (validates sum = 100%)
- `POST /api/projects/tasks/{taskId}/complete` — Mark task complete

## Features

✅ **Project List** — View all projects with metrics and alerts
✅ **Project Detail** — Detailed view with tasks and metrics
✅ **Create Project** — Form with live task weight validation (must sum to 100%)
✅ **Task Completion** — Superviseurs mark tasks complete
✅ **Metrics Display** — Hours, progress%, time%, alert if behind
✅ **Responsive Design** — Works on mobile and desktop

## Testing

1. Start your backend (port 8080)
2. Start your React app
3. Login as admin or responsable
4. Navigate to Projects
5. Create a project with tasks
6. View project detail
7. Mark tasks complete as superviseur

## Future Enhancements

- [ ] Implement React Router for better navigation
- [ ] Add project filtering/search
- [ ] Export project report to PDF
- [ ] Timeline/Gantt view for task scheduling
- [ ] Real-time updates with WebSockets
- [ ] Attendance association UI (optional backfill)
