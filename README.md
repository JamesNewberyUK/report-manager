# Report Manager

A modern web application for managing and generating reports with customizable components.

## Features

- Create, edit, and delete reports
- Add multiple components to each report
- Set word or character limits for each component
- Enable GPT prompts for AI-generated content
- Responsive design with a clean, intuitive interface

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd report-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  components/       # Reusable UI components
  ├── layout/       # Layout components (Header, Sidebar)
  └── reports/     # Report-specific components
  types/           # TypeScript type definitions
  App.tsx          # Main application component
  main.tsx         # Application entry point
  index.css        # Global styles
```

## Technologies Used

- React 18
- TypeScript
- Material-UI (MUI) for UI components
- React Router for navigation
- Vite for build tooling

## License

This project is licensed under the MIT License.
