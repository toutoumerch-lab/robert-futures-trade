import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PromotionBanner from './components/layout/PromotionBanner';

// Pages
import Home from './pages/Home';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import PropFirmList from './pages/PropFirmList';

const AppContent = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <PromotionBanner />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/prop-firms" element={<PropFirmList />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandingProvider>
          <AppContent />
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
