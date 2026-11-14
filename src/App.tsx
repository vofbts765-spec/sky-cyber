import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHUD } from './components/GameHUD';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { MobileControls } from './components/MobileControls';
import {
  AchievementsModal,
  PauseModal,
  RunEndModal,
  SettingsModal,
} from './components/Modals';
import { ModeSelect } from './components/ModeSelect';
import { ShipGarage } from './components/ShipGarage';
import { soundEngine } from './game/audio';
import { SHIPS, UPGRADE_META } from './game/constants';
import { NeonGalaxyEngine } from './game/engine';
import {
  getUpgradeCost,
  loadSaveData,
  persistSaveData,
  resetAllSaveData,
} from './game/storage';
import {
  BannerAlert,
  ChallengeModifierId,
  GameMode,
  GameScreen,
  GameSettings,
  HudSnapshot,
  RunSummary,
  SaveData,
  ShipId,
  UpgradeKey,
  WeaponType,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  score: 0,
  highScore: 0,
  wave: 1,
  hp: 100,
  maxHp: 100,
  shield: 50,
  maxShield: 50,
  weapon: 'laser',
  weaponLevel: 1,
  combo: 1,
  comboTimerRatio: 0,
  kills: 0,
  runCoins: 0,
  tripleTimer: 0,
  rapidTimer: 0,
  overdriveTimer: 0,
  timeRemaining: null,
  bossRushIndex: 1,
  bossRushTotal: 5,
  boss: null,
  mode: 'classic',
  critFlash: false,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<NeonGalaxyEngine | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [screen, setScreen] = useState<GameScreen>('loading');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [challengeMod, setChallengeMod] = useState<ChallengeModifierId>('hyper_velocity');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [banner, setBanner] = useState<BannerAlert | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch support once on mount
  useEffect(() => {
    const hasTouch =
      'ontouchstart' in window ||
      (navigator.maxTouchPoints !== undefined && navigator.maxTouchPoints > 0);
    setIsTouchDevice(hasTouch);
  }, []);

  // Sync audio settings
  useEffect(() => {
    soundEngine.updateSettings(saveData.settings);
    engineRef.current?.updateSaveData(saveData);
  }, [saveData]);

  // Initialize Canvas Engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new NeonGalaxyEngine(canvas, loadSaveData(), {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onBanner: (nextBanner) => {
        setBanner(nextBanner);
        if (bannerTimerRef.current !== null) {
          window.clearTimeout(bannerTimerRef.current);
        }
        bannerTimerRef.current = window.setTimeout(() => {
          setBanner(null);
          bannerTimerRef.current = null;
        }, 2500);
      },
      onRunEnd: (summary) => {
        setRunSummary(summary);
        setScreen(summary.victory ? 'victory' : 'gameover');
      },
      onPauseRequest: () => {
        setScreen((prev) => {
          if (prev === 'playing') {
            engine.setPaused(true);
            return 'paused';
          }
          if (prev === 'paused') {
            engine.setPaused(false);
            return 'playing';
          }
          return prev;
        });
      },
      onSaveUpdate: (updated) => {
        setSaveData({ ...updated });
      },
      onAchievementUnlocked: () => {
        // Banner already emitted by engine
      },
    });

    engineRef.current = engine;
    return () => {
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleLoadingDone = useCallback(() => {
    setScreen('menu');
  }, []);

  const launchGame = useCallback(
    (mode: GameMode) => {
      soundEngine.play('menuClick');
      setSelectedMode(mode);
      setRunSummary(null);
      setBanner(null);
      setSettingsOpen(false);
      setScreen('playing');
      engineRef.current?.startGame(mode, challengeMod);
    },
    [challengeMod]
  );

  const handlePause = useCallback(() => {
    soundEngine.play('menuClick');
    engineRef.current?.setPaused(true);
    setScreen('paused');
  }, []);

  const handleResume = useCallback(() => {
    soundEngine.play('menuClick');
    engineRef.current?.setPaused(false);
    setScreen('playing');
  }, []);

  const handleMainMenu = useCallback(() => {
    soundEngine.play('menuClick');
    engineRef.current?.startMenuAmbient();
    setBanner(null);
    setScreen('menu');
  }, []);

  const handleToggleMute = useCallback(() => {
    setSaveData((prev) => {
      const next: SaveData = {
        ...prev,
        settings: {
          ...prev.settings,
          muted: !prev.settings.muted,
        },
      };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSaveData((prev) => {
      const next: SaveData = {
        ...prev,
        settings: {
          ...prev.settings,
          ...patch,
        },
      };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = resetAllSaveData();
    setSaveData(fresh);
    soundEngine.play('menuClick');
  }, []);

  const handleSelectShip = useCallback((shipId: ShipId) => {
    soundEngine.play('menuClick');
    setSaveData((prev) => {
      if (!prev.unlockedShips.includes(shipId)) return prev;
      const next: SaveData = { ...prev, selectedShip: shipId };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleUnlockShip = useCallback((shipId: ShipId) => {
    setSaveData((prev) => {
      const cost = SHIPS[shipId].unlockCost;
      if (prev.unlockedShips.includes(shipId) || prev.coins < cost) return prev;
      soundEngine.play('upgrade');
      const unlockedShips = [...prev.unlockedShips, shipId];
      const achievements = [...prev.achievements];
      let bonusCoins = 0;
      if (unlockedShips.length >= 3 && !achievements.includes('fleet_commander')) {
        achievements.push('fleet_commander');
        bonusCoins = 300;
        soundEngine.play('achievement');
      }
      const next: SaveData = {
        ...prev,
        coins: prev.coins - cost + bonusCoins,
        unlockedShips,
        selectedShip: shipId,
        achievements,
      };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleUpgradeShip = useCallback((shipId: ShipId, key: UpgradeKey) => {
    setSaveData((prev) => {
      if (!prev.unlockedShips.includes(shipId)) return prev;
      const curLvl = prev.upgrades[shipId][key];
      if (curLvl >= UPGRADE_META[key].maxLevel) return prev;
      const cost = getUpgradeCost(key, curLvl);
      if (prev.coins < cost) return prev;
      soundEngine.play('upgrade');
      const next: SaveData = {
        ...prev,
        coins: prev.coins - cost,
        upgrades: {
          ...prev.upgrades,
          [shipId]: {
            ...prev.upgrades[shipId],
            [key]: curLvl + 1,
          },
        },
      };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleSwitchWeapon = useCallback((w: WeaponType) => {
    engineRef.current?.switchWeapon(w);
  }, []);

  const handleJoystickChange = useCallback((active: boolean, dx: number, dy: number) => {
    engineRef.current?.setVirtualJoystick(active, dx, dy);
  }, []);

  const handleFireChange = useCallback((active: boolean) => {
    engineRef.current?.setTouchFire(active);
  }, []);

  const showMobileControls =
    screen === 'playing' &&
    (saveData.settings.controlScheme === 'joystick' ||
      (saveData.settings.controlScheme === 'auto' && isTouchDevice));

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030308] text-white">
      {/* Persistent Full-Viewport Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
      />

      {/* Loading Screen */}
      {screen === 'loading' && <LoadingScreen onComplete={handleLoadingDone} />}

      {/* Main Menu */}
      {screen === 'menu' && (
        <div className="absolute inset-0 z-10">
          <MainMenu
            saveData={saveData}
            selectedMode={selectedMode}
            onPlayNow={() => launchGame(selectedMode)}
            onOpenModes={() => {
              soundEngine.play('menuClick');
              setScreen('modes');
            }}
            onOpenGarage={() => {
              soundEngine.play('menuClick');
              setScreen('garage');
            }}
            onOpenAchievements={() => {
              soundEngine.play('menuClick');
              setScreen('achievements');
            }}
            onOpenSettings={() => {
              soundEngine.play('menuClick');
              setSettingsOpen(true);
            }}
          />
        </div>
      )}

      {/* Mode Selection */}
      {screen === 'modes' && (
        <div className="absolute inset-0 z-10">
          <ModeSelect
            saveData={saveData}
            selectedMode={selectedMode}
            challengeModifier={challengeMod}
            onSelectMode={(m) => {
              soundEngine.play('menuClick');
              setSelectedMode(m);
            }}
            onSelectChallengeMod={(mod) => {
              soundEngine.play('menuClick');
              setChallengeMod(mod);
            }}
            onLaunchMode={launchGame}
            onBack={() => {
              soundEngine.play('menuClick');
              setScreen('menu');
            }}
          />
        </div>
      )}

      {/* Ship Hangar & Upgrades */}
      {screen === 'garage' && (
        <div className="absolute inset-0 z-10">
          <ShipGarage
            saveData={saveData}
            onSelectShip={handleSelectShip}
            onUnlockShip={handleUnlockShip}
            onUpgradeShip={handleUpgradeShip}
            onPlayWithShip={() => launchGame(selectedMode)}
            onBack={() => {
              soundEngine.play('menuClick');
              setScreen('menu');
            }}
          />
        </div>
      )}

      {/* Achievements */}
      {screen === 'achievements' && (
        <div className="absolute inset-0 z-10">
          <AchievementsModal
            saveData={saveData}
            onBack={() => {
              soundEngine.play('menuClick');
              setScreen('menu');
            }}
          />
        </div>
      )}

      {/* Active Gameplay HUD */}
      {(screen === 'playing' || screen === 'paused') && (
        <GameHUD
          hud={hud}
          banner={banner}
          muted={saveData.settings.muted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onSwitchWeapon={handleSwitchWeapon}
        />
      )}

      {/* Mobile Touch Controls */}
      <MobileControls
        visible={showMobileControls}
        controlScheme={saveData.settings.controlScheme}
        autoFire={saveData.settings.autoFire}
        onJoystickChange={handleJoystickChange}
        onFireChange={handleFireChange}
      />

      {/* Pause Overlay */}
      {screen === 'paused' && !settingsOpen && (
        <PauseModal
          onResume={handleResume}
          onRestart={() => launchGame(selectedMode)}
          onOpenSettings={() => {
            soundEngine.play('menuClick');
            setSettingsOpen(true);
          }}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Game Over / Victory Screen */}
      {(screen === 'gameover' || screen === 'victory') && runSummary && (
        <RunEndModal
          summary={runSummary}
          onRestart={() => launchGame(selectedMode)}
          onOpenGarage={() => {
            soundEngine.play('menuClick');
            engineRef.current?.startMenuAmbient();
            setScreen('garage');
          }}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
          onClose={() => {
            soundEngine.play('menuClick');
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
