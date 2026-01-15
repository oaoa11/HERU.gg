import { useEffect, useState } from 'react';
import { Progress } from '@/app/components/ui/progress';
import { api } from '@/lib/api';
import type { LevelProgress } from '@/types';
import { Zap } from 'lucide-react';

export function XPBar() {
  const [progress, setProgress] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const response = await api.getLevelProgress();
    if (response.success && response.data) {
      setProgress(response.data);
    }
    setLoading(false);
  };

  if (loading || !progress) {
    return <div className="h-2 bg-zinc-800 rounded-full animate-pulse" />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00ff88]" />
          <span className="font-bold text-white">
            Level {progress.currentLevel}
          </span>
        </div>
        <span className="text-zinc-400">
          {progress.currentXp.toLocaleString()} / {progress.nextLevelXp.toLocaleString()} XP
        </span>
      </div>
      <Progress 
        value={Math.min(progress.percentage, 100)} 
        className="h-2 bg-zinc-800"
        indicatorClassName="bg-gradient-to-r from-[#EF4444] to-[#00ff88]"
      />
      {progress.percentage < 100 && (
        <div className="text-xs text-zinc-500 text-right">
          {progress.xpToNextLevel.toLocaleString()} XP to level {progress.currentLevel + 1}
        </div>
      )}
    </div>
  );
}
