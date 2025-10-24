import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import FlashMessage from './components/FlashMessage';
import LoadingSpinner from './components/LoadingSpinner';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import MFAVerify from './pages/auth/MFAVerify';
import MFASetup from './pages/auth/MFASetup';
import ChangePassword from './pages/auth/ChangePassword';

// Pages - Main
import Dashboard from './pages/Dashboard';

// Pages - Sets
import SetsList from './pages/sets/SetsList';
import CreateSet from './pages/sets/CreateSet';
import EditSet from './pages/sets/EditSet';
import ViewSet from './pages/sets/ViewSet';
import ImportSet from './pages/sets/ImportSet';
import ExportSet from './pages/sets/ExportSet';

// Pages - Folders
import FoldersList from './pages/folders/FoldersList';
import CreateFolder from './pages/folders/CreateFolder';
import EditFolder from './pages/folders/EditFolder';
import ViewFolder from './pages/folders/ViewFolder';
import ManageSets from './pages/folders/ManageSets';

// Pages - Study
import StudySession from './pages/study/StudySession';

// Pages - Shares
import MyShares from './pages/shares/MyShares';
import ShareSet from './pages/shares/ShareSet';
import ShareFolder from './pages/shares/ShareFolder';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <FlashMessage />
            
            <main className="flex-grow container mx-auto px-4 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/mfa-verify" element={<MFAVerify />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Sets Routes */}
                <Route
                  path="/sets"
                  element={
                    <ProtectedRoute>
                      <SetsList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sets/create"
                  element={
                    <ProtectedRoute>
                      <CreateSet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sets/:id"
                  element={
                    <ProtectedRoute>
                      <ViewSet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sets/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditSet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sets/:id/import"
                  element={
                    <ProtectedRoute>
                      <ImportSet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sets/:id/export"
                  element={
                    <ProtectedRoute>
                      <ExportSet />
                    </ProtectedRoute>
                  }
                />

                {/* Folders Routes */}
                <Route
                  path="/folders"
                  element={
                    <ProtectedRoute>
                      <FoldersList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/folders/create"
                  element={
                    <ProtectedRoute>
                      <CreateFolder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/folders/:id"
                  element={
                    <ProtectedRoute>
                      <ViewFolder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/folders/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditFolder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/folders/:id/manage-sets"
                  element={
                    <ProtectedRoute>
                      <ManageSets />
                    </ProtectedRoute>
                  }
                />

                {/* Study Routes */}
                <Route
                  path="/study/:type/:id"
                  element={
                    <ProtectedRoute>
                      <StudySession />
                    </ProtectedRoute>
                  }
                />

                {/* Shares Routes */}
                <Route
                  path="/shares"
                  element={
                    <ProtectedRoute>
                      <MyShares />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shares/sets/:id"
                  element={
                    <ProtectedRoute>
                      <ShareSet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shares/folders/:id"
                  element={
                    <ProtectedRoute>
                      <ShareFolder />
                    </ProtectedRoute>
                  }
                />

                {/* Auth Routes */}
                <Route
                  path="/auth/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/auth/mfa-setup"
                  element={
                    <ProtectedRoute>
                      <MFASetup />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users/create"
                  element={
                    <ProtectedRoute requireAdmin>
                      <CreateUser />
                    </ProtectedRoute>
                  }
                />

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
