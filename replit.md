# Pointage Project UI

A React + Vite frontend application for managing employee time tracking (pointage) for CA2E / IBITEK GROUP.

## Tech Stack

- **Framework**: React 19 with Vite 7
- **Routing**: React Router DOM v7
- **UI**: Framer Motion, React Icons, FontAwesome
- **Utilities**: react-datepicker, xlsx (Excel export)
- **Language**: JavaScript (JSX)

## Project Structure

```
src/
  components/
    Admin/          - Admin panel components
    Gestionnaire/   - Manager components
    login/          - Login page
    Notification/   - Notification system
    Parametre/      - Settings/parameters page
  context/
    NotificationContext.jsx  - Global notification state
  Lists/
    Liste_des_Gestionnaires/       - Manager list view
    Liste_vue_globale_du_pointage/ - Global timesheet view
  App.jsx / App.css  - Root component
  main.jsx           - Entry point
  index.css          - Global styles
```

## Running the App

```bash
npm run dev     # Development server on port 5000
npm run build   # Production build
npm run preview # Preview production build
```

## Replit Configuration

- Dev server runs on `0.0.0.0:5000` with `allowedHosts: true` for proxy compatibility
- Deployment: static site, builds to `dist/` via `npm run build`
