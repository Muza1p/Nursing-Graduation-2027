import React from 'react';
import { Hero } from '../components/Hero';
import { TeamSection } from '../components/TeamSection';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-2">
      {/* 1. Nursing Institute Graduation 2027 Identity, Branding & Accurate Countdown */}
      <Hero />

      {/* 2. Verified Graduation Supervisors & Official Social Media Links */}
      <TeamSection />
    </div>
  );
};
