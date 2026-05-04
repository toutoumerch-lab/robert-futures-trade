import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PromotionBanner from './components/layout/PromotionBanner';

// Pages
import Home from './pages/Home';
import { Login, Register } from './pages/AuthPages';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyCode from './pages/VerifyCode';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRevenue from './pages/AdminRevenue';
import AdminAnalytics from './pages/AdminAnalytics';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import CourseLearn from './pages/CourseLearn';
import PropFirmList from './pages/PropFirmList';
import PaymentSuccess from './pages/PaymentSuccess';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicyPage';
import PrivacyPolicy from './pages/PrivacyPolicyPage';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

const AppContent = () => {
  const location = useLocation();
  return (
    <div className="app-container">
      <Navbar />
      <PromotionBanner />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"               element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/login"          element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register"       element={<PageWrapper><Register /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
            <Route path="/reset-password/:token" element={<PageWrapper><ResetPassword /></PageWrapper>} />
            <Route path="/verify-email/:token" element={<PageWrapper><VerifyEmail /></PageWrapper>} />
            <Route path="/verify-code"        element={<PageWrapper><VerifyCode /></PageWrapper>} />
            <Route path="/dashboard"      element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/profile"        element={<PageWrapper><Profile /></PageWrapper>} />
            <Route path="/settings"       element={<PageWrapper><Settings /></PageWrapper>} />
            <Route path="/admin"              element={<PageWrapper><AdminDashboard /></PageWrapper>} />
            <Route path="/admin/revenue"      element={<PageWrapper><AdminRevenue /></PageWrapper>} />
            <Route path="/admin/analytics"    element={<PageWrapper><AdminAnalytics /></PageWrapper>} />
            <Route path="/blog"           element={<PageWrapper><BlogList /></PageWrapper>} />
            <Route path="/blog/:id"       element={<PageWrapper><BlogDetail /></PageWrapper>} />
            <Route path="/courses"        element={<PageWrapper><CourseList /></PageWrapper>} />
            <Route path="/courses/:id"    element={<PageWrapper><CourseDetail /></PageWrapper>} />
            <Route path="/course/:id/learn" element={<PageWrapper><CourseLearn /></PageWrapper>} />
            <Route path="/prop-firms"     element={<PageWrapper><PropFirmList /></PageWrapper>} />
            <Route path="/about"           element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/contact"         element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="/terms"           element={<PageWrapper><TermsOfService /></PageWrapper>} />
            <Route path="/cookie-policy"   element={<PageWrapper><CookiePolicy /></PageWrapper>} />
            <Route path="/privacy"         element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
            <Route path="/payment/success" element={<PageWrapper><PaymentSuccess /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandingProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
