import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import Landing from './routes/Landing';
import { Product } from './routes/Product';
import { Pricing } from './routes/Pricing';
import { Documentation } from './routes/Documentation';
import Dashboard from './routes/Dashboard';
import CreateInstance from './routes/CreateInstance';
import InstanceDetail from './routes/InstanceDetail';
import Usage from './routes/Usage';
import Classroom from './routes/Classroom';

function App() {
  return (
    <Routes>
      {/* Public pages without sidebar */}
      <Route path="/" element={<Landing />} />
      <Route path="/product" element={<Product />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/docs" element={<Documentation />} />
      
      {/* Application routes with sidebar */}
      <Route element={<AppShell showSidebar={true} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateInstance />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/classroom" element={<Classroom />} />
      </Route>
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
