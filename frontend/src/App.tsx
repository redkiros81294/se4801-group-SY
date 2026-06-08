import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageShell } from './components/PageShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Scan } from './pages/Scan';
import { ProductsList } from './pages/ProductsList';
import { CreateProduct } from './pages/CreateProduct';
import { EditProduct } from './pages/EditProduct';
import { CreateBatch } from './pages/CreateBatch';
import { BatchDetail } from './pages/BatchDetail';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={
            <ProtectedRoute>
              <PageShell title="Products">
                <ProductsList />
              </PageShell>
            </ProtectedRoute>
          } />
          <Route path="/products/new" element={
            <ProtectedRoute>
              <PageShell title="Create Product">
                <CreateProduct />
              </PageShell>
            </ProtectedRoute>
          } />
          <Route path="/products/:id/edit" element={
            <ProtectedRoute>
              <PageShell title="Edit Product">
                <EditProduct />
              </PageShell>
            </ProtectedRoute>
          } />
          <Route path="/batches/new" element={
            <ProtectedRoute>
              <PageShell title="Create Batch">
                <CreateBatch />
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
          <Route path="/scan" element={
            <ProtectedRoute>
              <PageShell title="QR Verification">
                <Scan />
              </PageShell>
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <PageShell title="ChainTrack Dashboard">
                <div className="space-y-6">
                  <h1 className="text-3xl font-bold">ChainTrack Dashboard</h1>
                  <p className="text-[var(--t2)]">Welcome to your supply chain provenance platform</p>
                </div>
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
