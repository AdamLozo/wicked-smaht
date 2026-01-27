import { useState, useEffect } from 'react';
import { useSaveGame } from './hooks/useSaveGame';
import { useAutoSave } from './hooks/useAutoSave';
import {
  TitleScreen,
  CharacterSelectScreen,
  MapScreen,
  LocationScreen,
  RedemptionScreen,
  GauntletScreen,
  EndingScreen,
  CollectionScreen,
  SettingsScreen,
} from './screens';
import type { ScreenId } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('title');
  const [screenData, setScreenData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  const { loadGame, restoreGame } = useSaveGame();

  // Enable auto-save on key events
  useAutoSave();

  // Check for existing save on mount
  useEffect(() => {
    const saveData = loadGame();
    if (saveData) {
      restoreGame(saveData);
    }
    setIsLoading(false);
  }, [loadGame, restoreGame]);

  const navigate = (screen: ScreenId, data?: Record<string, unknown>) => {
    setScreenData(data || {});
    setCurrentScreen(screen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-boston-navy flex items-center justify-center">
        <p className="text-boston-cream">Loading...</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'title':
        return <TitleScreen onNavigate={navigate} />;
      case 'character_select':
        return <CharacterSelectScreen onNavigate={navigate} />;
      case 'map':
        return <MapScreen onNavigate={navigate} />;
      case 'location':
        return <LocationScreen onNavigate={navigate} data={screenData} />;
      case 'redemption':
        return <RedemptionScreen onNavigate={navigate} data={screenData} />;
      case 'gauntlet':
        return <GauntletScreen onNavigate={navigate} />;
      case 'ending':
        return <EndingScreen onNavigate={navigate} />;
      case 'collection':
        return <CollectionScreen onNavigate={navigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigate} />;
      default:
        return <TitleScreen onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-boston-navy">
      {renderScreen()}
    </div>
  );
}

export default App;
