import { supabase, isSupabaseConfigured } from '../services/supabase';
import { User } from '../types';

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  xp: number; // XP relevante para la tabla (mensual o total)
  rank: number;
  level: number;
}

export interface LeaderboardData {
  monthly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  userRankMonthly: LeaderboardEntry | null;
  userRankAllTime: LeaderboardEntry | null;
}

export const getLeaderboard = async (currentUserId?: string): Promise<LeaderboardData> => {
  if (!isSupabaseConfigured || !supabase) {
    // Datos Mock si no hay DB conectada
    return {
      monthly: [],
      allTime: [],
      userRankMonthly: null,
      userRankAllTime: null
    };
  }

  try {
    // 1. Obtener perfiles (Limitamos a 100 para demo, en prod se paginaría o usaría una view SQL)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, avatar, xp, level, activityLog')
      .limit(100);

    if (error) throw error;
    if (!profiles) return { monthly: [], allTime: [], userRankMonthly: null, userRankAllTime: null };

    // 2. Procesar Histórico (Total XP)
    const allTimeSorted = [...profiles]
      .sort((a, b) => b.xp - a.xp)
      .map((p, index) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        xp: p.xp,
        level: p.level,
        rank: index + 1
      }));

    // 3. Procesar Mensual (Calcular desde activityLog)
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    
    const monthlySorted = [...profiles]
      .map(p => {
        const logs = Array.isArray(p.activityLog) ? p.activityLog : [];
        const monthlyXP = logs
          .filter((log: any) => log.date && log.date.startsWith(currentMonthPrefix))
          .reduce((sum: number, log: any) => sum + (Number(log.xpEarned) || 0), 0);
        
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          xp: monthlyXP,
          level: p.level
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .map((p, index) => ({
        ...p,
        rank: index + 1
      }));

    // 4. Encontrar posición del usuario actual
    const userRankAllTime = currentUserId ? allTimeSorted.find(p => p.id === currentUserId) || null : null;
    const userRankMonthly = currentUserId ? monthlySorted.find(p => p.id === currentUserId) || null : null;

    return {
      monthly: monthlySorted.slice(0, 5), // Top 5
      allTime: allTimeSorted.slice(0, 5), // Top 5
      userRankMonthly,
      userRankAllTime
    };

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return { monthly: [], allTime: [], userRankMonthly: null, userRankAllTime: null };
  }
};