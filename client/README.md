# Quizlet App - React Frontend

This is the React + Vite frontend for the Quizlet Learning App.

## Development

```bash
# Install dependencies
npm install

# Start development server (with proxy to backend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Main app component with routing
├── components/              # React components
│   ├── layout/             # Layout components (Navigation, Layout, etc.)
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Dashboard page
│   ├── sets/               # Sets management
│   ├── folders/            # Folders management
│   ├── flashcards/         # Flashcards management
│   ├── study/              # Study session
│   ├── shares/             # Sharing features
│   ├── admin/              # Admin pages
│   └── common/             # Shared components
├── contexts/               # React contexts (Auth, Flash)
├── hooks/                  # Custom hooks
├── services/               # API services
├── utils/                  # Utility functions
└── styles/                 # Global styles
```

## Configuration

- **Vite Proxy**: Configured to proxy `/api` and `/auth` requests to `http://localhost:3000` (backend)
- **Tailwind CSS**: Configured with custom `xs` breakpoint at 475px
- **Build Output**: `dist/` directory

## API Integration

The frontend communicates with the Express backend via:
- Session-based authentication (cookies with `credentials: 'include'`)
- RESTful API endpoints under `/api/*`
- Auth endpoints under `/auth/*`

## Notes

- Currently uses Tailwind CDN in development (will be optimized in production build)
- FontAwesome for icons
- React Router for client-side routing
- Axios for HTTP requests with interceptors
