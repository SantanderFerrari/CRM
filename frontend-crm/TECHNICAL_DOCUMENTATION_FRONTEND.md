# DEJAVU CRM v2 - Frontend Technical Documentation

## Overview
The frontend of DEJAVU CRM v2 is a React-based single-page application (SPA) located in the `frontend-crm/` directory. It interacts with the backend via RESTful APIs and provides interfaces for managing customers, devices, jobcards, tickets, users, and dashboards.

## Project Structure
- **public/**: Static files (HTML, manifest, robots.txt)
- **src/**: Main source code
  - **api/**: API service modules for backend communication
  - **components/**: Reusable UI components, organized by feature
  - **context/**: React Context for global state (e.g., authentication)
  - **hooks/**: Custom React hooks for data fetching and logic
  - **pages/**: Top-level route components (pages)

## Key Technologies
- **React**: UI library
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests

## Main Modules
- **Authentication**: Login, registration, and session management
- **Customers**: CRUD operations for customer data
- **Devices**: Device management
- **Jobcards**: Jobcard tracking and management
- **Tickets**: Support ticketing system
- **Users**: User management
- **Dashboard**: Overview and analytics

## State Management
- **AuthContext**: Provides authentication state and methods across the app
- **Custom Hooks**: (e.g., `useCustomers`, `useDevices`) encapsulate data fetching and logic

## API Integration
- All API calls are handled via modules in `src/api/` using Axios.
- Endpoints are organized by resource (e.g., `customers.api.js`, `devices.api.js`).
- Authentication tokens are managed and attached to requests as needed.

## Routing
- Implemented using React Router in `src/`.
- Pages are mapped to routes (e.g., `/customers`, `/devices`, `/tickets`).
- Unauthorized access is redirected to `UnauthorizedPage.jsx`.

## Styling
- Tailwind CSS is configured via `tailwind.config.js` and `postcss.config.js`.
- Component-level styling is preferred for maintainability.

## Component Structure
- **Common**: Shared UI elements (buttons, modals, etc.)
- **Feature Folders**: Each feature (customers, devices, etc.) has its own folder for related components

## How to Run
1. Install dependencies: `npm install` in `frontend-crm/`
2. Start development server: `npm start`
3. The app runs on the port specified in the configuration (default: 3000)

## Deployment
- Dockerized via `Dockerfile` and served with Nginx (`nginx.conf`)
- Static build: `npm run build`

## Extending the Frontend
- Add new features by creating new folders in `components/`, `api/`, and `pages/` as needed
- Use custom hooks for data logic
- Follow existing patterns for API integration and state management

## Additional Notes
- Ensure backend is running and accessible for API calls
- Update environment variables as needed for API endpoints

---
For more details, see the README.md in `frontend-crm/` and inline code comments.