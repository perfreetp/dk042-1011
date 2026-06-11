import { NavLink } from 'react-router-dom';
import { Tent, Home, Map, Hammer, Swords, BookOpen, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/useGameStore';
import { formatNumberFull, EXPEDITION_STATUS_NAMES, EXPEDITION_STATUS_COLORS } from '@/utils/formatters';
import { getIslandById } from '@/data/islands';
import { useMemo } from 'react';

const navItems = [
  { path: '/camp', label: '码头营地', icon: Tent },
  { path: '/hut', label: '宠物小屋', icon: Home },
  { path: '/map', label: '远征地图', icon: Map },
  { path: '/workshop', label: '采集工坊', icon: Hammer },
  { path: '/battle', label: '遭遇战', icon: Swords },
  { path: '/collection', label: '收藏册', icon: BookOpen },
];

const resourceConfig = [
  { key: 'gold' as const, label: '金币', emoji: '🪙', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { key: 'ore' as const, label: '矿石', emoji: '⛏️', color: 'text-gray-300', bg: 'bg-gray-500/20' },
  { key: 'herb' as const, label: '草药', emoji: '🌿', color: 'text-green-400', bg: 'bg-green-500/20' },
  { key: 'shell' as const, label: '贝壳', emoji: '🐚', color: 'text-pink-300', bg: 'bg-pink-500/20' },
  { key: 'exp' as const, label: '经验', emoji: '⭐', color: 'text-blue-400', bg: 'bg-blue-500/20' },
];

export default function Header() {
  const { resources, expedition } = useGameStore();

  const expeditionInfo = useMemo(() => {
    if (!expedition) return null;
    const island = getIslandById(expedition.islandId);
    return {
      island,
      status: expedition.status,
      elapsed: Date.now() - expedition.startTime,
    };
  }, [expedition]);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <h1 className="font-title text-2xl md:text-3xl text-white drop-shadow-lg tracking-wider">
            🏝️ 冒险岛宠物远征
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {resourceConfig.map(({ key, label, emoji, color, bg }) => (
              <div
                key={key}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  bg,
                  'border border-white/10 backdrop-blur-sm'
                )}
                title={`${label}: ${formatNumberFull(resources[key])}`}
              >
                <span className="text-lg">{emoji}</span>
                <span className={cn('font-game text-sm md:text-base font-bold', color)}>
                  {formatNumberFull(resources[key])}
                </span>
              </div>
            ))}
            {expeditionInfo && (
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm',
                  'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400/30',
                  'animate-pulse'
                )}
                title={`远征状态：${EXPEDITION_STATUS_NAMES[expeditionInfo.status]}`}
              >
                <Anchor size={16} className="text-cyan-300 animate-bounce" />
                <div className="flex flex-col leading-tight">
                  <span className="text-white/90 text-xs font-game">
                    {expeditionInfo.island?.emoji} {expeditionInfo.island?.name}
                  </span>
                  <span className={cn('text-xs font-bold', EXPEDITION_STATUS_COLORS[expeditionInfo.status])}>
                    {EXPEDITION_STATUS_NAMES[expeditionInfo.status]}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        <nav className="flex items-center gap-1 md:gap-2 flex-wrap">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm md:text-base transition-all duration-300 font-game',
                  isActive
                    ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-500/30 scale-105'
                    : 'text-white/90 hover:bg-white/15 hover:text-white hover:scale-105'
                )
              }
            >
              <Icon size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
