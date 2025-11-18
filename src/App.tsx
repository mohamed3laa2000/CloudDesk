import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { DemoWrapper } from './components/Demo/DemoWrapper';
import Landing from './routes/Landing';
import Login from './routes/Login';
import Onboarding from './routes/Onboarding';
import { Product } from './routes/Product';
import { Pricing } from './routes/Pricing';
import { UseCases } from './routes/UseCases';
import { Documentation } from './routes/Documentation';
import { GettingStarted } from './routes/GettingStarted';
import { APIReference } from './routes/APIReference';
import { FAQ } from './routes/FAQ';
import { FAQAccordion } from './routes/FAQAccordion';
import { Community } from './routes/Community';
import { Support } from './routes/Support';
import { Security } from './routes/Security';
import { InteractiveDemo } from './routes/InteractiveDemo';
import { About } from './routes/About';
import { Contact } from './routes/Contact';
import { PrivacyPolicy } from './routes/PrivacyPolicy';
import { TermsOfService } from './routes/TermsOfService';
import Dashboard from './routes/Dashboard';
import CreateInstance from './routes/CreateInstance';
import InstanceDetail from './routes/InstanceDetail';
import Usage from './routes/Usage';
import Classroom from './routes/Classroom';
import Settings from './routes/Settings';

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <Routes>
        {/* Public pages without sidebar */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/product" element={<Product />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/docs/getting-started" element={<GettingStarted />} />
        <Route path="/docs/api" element={<APIReference />} />
        <Route path="/docs/faq" element={<FAQ />} />
        <Route path="/docs/faq-accordion" element={<FAQAccordion />} />
        <Route path="/community" element={<Community />} />
        <Route path="/support" element={<Support />} />
        <Route path="/security" element={<Security />} />
        <Route path="/interactive-demo" element={<InteractiveDemo />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Demo routes - no authentication required */}
        <Route element={<DemoWrapper />}>
          <Route path="/demo/dashboard" element={<Dashboard />} />
          <Route path="/demo/create" element={<CreateInstance />} />
          <Route path="/demo/usage" element={<Usage />} />
          <Route path="/demo/classroom" element={<Classroom />} />
        </Route>
        
        {/* Protected application routes with sidebar */}
        <Route element={<AuthGuard><AppShell showSidebar={true} /></AuthGuard>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateInstance />} />
          <Route path="/instances/:id" element={<InstanceDetail />} />
          <Route path="/usage" element={<Usage />} />
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
