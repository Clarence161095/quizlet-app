import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FlashProvider } from './contexts/FlashContext';

// Layout
import Layout from './components/layout/Layout';
import PrivateRoute from './components/layout/PrivateRoute';

// Auth pages
import Login from './components/auth/Login';
import MFAVerify from './components/auth/MFAVerify';
import MFASetup from './components/auth/MFASetup';
import ChangePassword from './components/auth/ChangePassword';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// Sets
import SetsList from './components/sets/SetsList';
import SetCreate from './components/sets/SetCreate';
import SetEdit from './components/sets/SetEdit';
import SetView from './components/sets/SetView';
import SetImport from './components/sets/SetImport';
import SetExport from './components/sets/SetExport';

// Folders
import FoldersList from './components/folders/FoldersList';
import FolderCreate from './components/folders/FolderCreate';
import FolderEdit from './components/folders/FolderEdit';
import FolderView from './components/folders/FolderView';
import FolderManageSets from './components/folders/FolderManageSets';

// Flashcards
import FlashcardCreate from './components/flashcards/FlashcardCreate';
import FlashcardEdit from './components/flashcards/FlashcardEdit';

// Study
import StudySession from './components/study/StudySession';

// Shares
import ShareSet from './components/shares/ShareSet';
import ShareFolder from './components/shares/ShareFolder';
import MyShares from './components/shares/MyShares';

// Admin
import AdminDashboard from './components/admin/AdminDashboard';
import CreateUser from './components/admin/CreateUser';

function App() {
  return (
    <Router>
      <AuthProvider>
        <FlashProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/mfa-verify" element={<MFAVerify />} />

            {/* Protected routes */}
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Auth */}
              <Route path="/auth/mfa-setup" element={<MFASetup />} />
              <Route path="/auth/change-password" element={<ChangePassword />} />

              {/* Sets */}
              <Route path="/sets" element={<SetsList />} />
              <Route path="/sets/create" element={<SetCreate />} />
              <Route path="/sets/:id" element={<SetView />} />
              <Route path="/sets/:id/edit" element={<SetEdit />} />
              <Route path="/sets/:id/import" element={<SetImport />} />
              <Route path="/sets/:id/export" element={<SetExport />} />

              {/* Folders */}
              <Route path="/folders" element={<FoldersList />} />
              <Route path="/folders/create" element={<FolderCreate />} />
              <Route path="/folders/:id" element={<FolderView />} />
              <Route path="/folders/:id/edit" element={<FolderEdit />} />
              <Route path="/folders/:id/manage-sets" element={<FolderManageSets />} />

              {/* Flashcards */}
              <Route path="/sets/:setId/flashcards/create" element={<FlashcardCreate />} />
              <Route path="/flashcards/:id/edit" element={<FlashcardEdit />} />

              {/* Study */}
              <Route path="/study/:type/:id" element={<StudySession />} />

              {/* Shares */}
              <Route path="/shares" element={<MyShares />} />
              <Route path="/shares/set/:id" element={<ShareSet />} />
              <Route path="/shares/folder/:id" element={<ShareFolder />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/create-user" element={<CreateUser />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FlashProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
