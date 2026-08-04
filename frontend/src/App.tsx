import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageShell } from './components/PageShell';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Route-level code splitting: each page loads only when first visited,
// which cuts the initial bundle size dramatically.
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const InvitationAccept = lazy(() => import('./pages/InvitationAccept').then(m => ({ default: m.InvitationAccept })));
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Forbidden = lazy(() => import('./pages/Forbidden').then(m => ({ default: m.Forbidden })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const Error = lazy(() => import('./pages/Error').then(m => ({ default: m.Error })));
const Scan = lazy(() => import('./pages/Scan').then(m => ({ default: m.Scan })));
const ProvenanceViewer = lazy(() => import('./pages/ProvenanceViewer').then(m => ({ default: m.ProvenanceViewer })));
const ProductsList = lazy(() => import('./pages/ProductsList').then(m => ({ default: m.ProductsList })));
const CreateProduct = lazy(() => import('./pages/CreateProduct').then(m => ({ default: m.CreateProduct })));
const EditProduct = lazy(() => import('./pages/EditProduct').then(m => ({ default: m.EditProduct })));
const CreateBatch = lazy(() => import('./pages/CreateBatch').then(m => ({ default: m.CreateBatch })));
const BatchDetail = lazy(() => import('./pages/BatchDetail').then(m => ({ default: m.BatchDetail })));
const LogMovement = lazy(() => import('./pages/LogMovement').then(m => ({ default: m.LogMovement })));
const TransactionHistory = lazy(() => import('./pages/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const DashboardRouter = lazy(() => import('./pages/DashboardRouter').then(m => ({ default: m.DashboardRouter })));
const AdminInviteUsers = lazy(() => import('./pages/AdminInviteUsers').then(m => ({ default: m.AdminInviteUsers })));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg0)]">
    <div className="flex items-center space-x-3">
      <div className="h-5 w-5 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
      <span className="text-[var(--t2)]">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/invite/:token" element={<InvitationAccept />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="/not-found" element={<NotFound />} />
              <Route path="/error" element={<Error />} />
              <Route path="/" element={<Landing />} />
              <Route path="/products" element={
                <ProtectedRoute>
                  <PageShell title="Products">
                    <ProductsList />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/products/new" element={
                <ProtectedRoute requiredRoles={['MANUFACTURER']}>
                  <PageShell title="Create Product">
                    <CreateProduct />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/products/:id/edit" element={
                <ProtectedRoute requiredRoles={['MANUFACTURER']}>
                  <PageShell title="Edit Product">
                    <EditProduct />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/batches/new" element={
                <ProtectedRoute requiredRoles={['MANUFACTURER']}>
                  <PageShell title="Create Batch">
                    <CreateBatch />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/transactions/new" element={
                <ProtectedRoute requiredRoles={['MANUFACTURER', 'SHIPPER', 'RETAILER']}>
                  <PageShell title="Log Movement">
                    <LogMovement />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/batches/:id" element={
                <ProtectedRoute>
                  <PageShell title="Batch Detail">
                    <BatchDetail />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/batches/:id/history" element={
                <ProtectedRoute>
                  <PageShell title="Transaction History">
                    <TransactionHistory />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/verify/:token" element={<ProvenanceViewer />} />
              <Route path="/scan" element={
                <ProtectedRoute>
                  <PageShell title="QR Verification">
                    <Scan />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute requiredRoles={['ADMIN', 'MANUFACTURER', 'SHIPPER', 'RETAILER']}>
                  <PageShell title="Dashboard">
                    <DashboardRouter />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="/admin/invite" element={
                <ProtectedRoute requiredRoles={['ADMIN']}>
                  <PageShell title="Invite Users">
                    <AdminInviteUsers />
                  </PageShell>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/not-found" replace state={{ from: window.location.pathname }} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
