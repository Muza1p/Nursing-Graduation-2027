import React from 'react';
import { Hero } from '../components/Hero';
import { OfficialGraduationPoster } from '../components/OfficialGraduationPoster';
import { EventOverview } from '../components/EventOverview';
import { GallerySection } from '../components/GallerySection';
import { TeamSection } from '../components/TeamSection';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-8">
      {/* 1. Nursing Institute Graduation 2027 Identity, Branding & Countdown Timer */}
      <Hero />

      {/* 1.5 Official Graduation Poster with zoom modal */}
      <OfficialGraduationPoster />

      {/* 2. Original Event Cards (حفلة السكراب، التخرج الرسمي، التسجيل، التبليغات) */}
      <EventOverview />

      {/* 3. Original Gallery & Photos Section (معرض صور معهد التمريض والدفعة) */}
      <div className="border-t border-white/10 pt-2">
        <GallerySection limit={6} />
      </div>

      {/* 4. Verified Graduation Supervisors & Official Social Media Links */}
      <div className="border-t border-white/10 pt-2">
        <TeamSection />
      </div>
    </div>
  );
};
