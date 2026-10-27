import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MusicProvider } from './context/MusicContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { ReceiptModal } from './components/ReceiptModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { ScrubNightPage } from './pages/ScrubNightPage';
import { OfficialGraduationPage } from './pages/OfficialGraduationPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { MusicLibraryPage } from './pages/MusicLibraryPage';
import { AuthPage } from './pages/AuthPage';
import { GraduateDashboard } from './pages/GraduateDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { GallerySection } from './components/GallerySection';
import { TeamSection } from './components/TeamSection';
import { AnimatedMedicalBackground } from './components/AnimatedMedicalBackground';

const MainContent: React.FC = () => {
  const { currentPage } = useApp();

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0A0D12] text-[#F4F8FC] overflow-x-hidden">
      {/* Subtle Animated Medical Background Layer */}
      <AnimatedMedicalBackground />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 pb-6 sm:pb-10">
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'scrub_night' && <ScrubNightPage />}
        {currentPage === 'official_grad' && <OfficialGraduationPage />}
        {currentPage === 'payments' && <PaymentsPage />}
        {currentPage === 'music' && <MusicLibraryPage />}
        {currentPage === 'announcements' && (
          <div className="py-6 sm:py-10">
            <AnnouncementsSection />
          </div>
        )}
        {currentPage === 'gallery' && (
          <div className="py-6 sm:py-10">
            <GallerySection />
          </div>
        )}
        {currentPage === 'team' && (
          <div className="py-6 sm:py-10">
            <TeamSection />
          </div>
        )}
        {currentPage === 'login' && <AuthPage initialMode="otp" />}
        {currentPage === 'register' && <AuthPage initialMode="register" />}
        {currentPage === 'graduate_dashboard' && <GraduateDashboard />}
        {currentPage === 'admin_dashboard' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

      {/* Persistent Floating Liquid Glass Bottom Navigation (Mobile-first) */}
      <BottomNav />

      {/* Global Modals & Controls */}
      <ReceiptModal />
      <AudioPlayerBar />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MusicProvider>
        <MainContent />
      </MusicProvider>
    </AppProvider>
  );
}
