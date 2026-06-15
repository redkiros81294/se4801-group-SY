import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageShell } from './components/PageShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { Forbidden } from './pages/Forbidden';
import { Scan } from './pages/Scan';
import { ProvenanceViewer } from './pages/ProvenanceViewer';
import { ProductsList } from './pages/ProductsList';
import { CreateProduct } from './pages/CreateProduct';
import { EditProduct } from './pages/EditProduct';
import { CreateBatch } from './pages/CreateBatch';
import { BatchDetail } from './pages/BatchDetail';
import { LogMovement } from './pages/LogMovement';
import { TransactionHistory } from './pages/TransactionHistory';
import { DashboardRouter } from './pages/DashboardRouter';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forbidden" element={<Forbidden />} />
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
            <ProtectedRoute requiredRoles={['ADMIN', 'MANUFACTURER']}>
              <PageShell title="Dashboard">
                <DashboardRouter />
              </PageShell>
            </ProtectedRoute>
          } />
          {/* Additional routes will be added as pages are created */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
