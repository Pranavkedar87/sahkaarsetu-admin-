import React, { useState, useEffect } from 'react';
import { SahkaarSetuLogo } from './SahkaarSetuLogo';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1200,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const exitTimer = setTimeout(onComplete, 350);
      return () => clearTimeout(exitTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [onComplete, minDurationMs]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      className={`admin-splash-screen ${isFadingOut ? 'splash-fade-out' : ''}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label="SahkaarSetu Operations Console Loading"
    >
      <div className="admin-splash-content">
        <div className="admin-splash-logo-circle">
          <SahkaarSetuLogo size={120} className="admin-splash-logo-img" />
        </div>

        <div className="admin-splash-titles">
          <h1 className="admin-splash-title">SahkaarSetu</h1>
          <p className="admin-splash-subtitle">
            सहकार से समृद्धि
          </p>
          <p className="admin-splash-subtext">
            Cooperative Operations & Administration
          </p>
          <span className="admin-splash-badge">
            Operations Console v2.1
          </span>
        </div>

        <div className="admin-splash-spinner-container">
          <div className="admin-splash-spinner-ring" />
          <span className="admin-splash-loading-text">Initializing workspace...</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
