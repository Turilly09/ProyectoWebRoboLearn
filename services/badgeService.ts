
import { User } from '../types';
import { BADGES } from '../content/achievements';
import { supabase, isSupabaseConfigured } from './supabase';
import { showToast } from '../components/ToastNotification';

interface BadgeContext {
  actionType?: 'lesson_complete' | 'workshop_complete' | 'project_created' | 'forum_post' | 'wiki_approved';
  count?: number; // Opcional: Para pasar conteos externos (ej: número de posts)
}

/**
 * Evalúa las reglas de todos los logros y devuelve el usuario actualizado
 * si ha ganado alguno nuevo.
 */
export const evaluateBadges = (user: User, context: BadgeContext): User => {
  const currentBadges = user.badges || [];
  const newBadges: string[] = [];
  let updatedUser = { ...user };

  // Helper interno para desbloquear
  const tryUnlock = (badgeId: string, condition: boolean) => {
    if (condition && !currentBadges.includes(badgeId) && !newBadges.includes(badgeId)) {
      newBadges.push(badgeId);
    }
  };

  // --- REGLAS DE LOGROS (AQUÍ AÑADES TU LÓGICA) ---

  // 1. First Steps: Completar 1 lección
  tryUnlock('first_steps', user.completedLessons.length >= 1);

  // 2. Scholar: Alcanzar nivel 5
  tryUnlock('scholar', user.level >= 5);

  // 3. Certified: Completar 1 Workshop Final
  tryUnlock('certified', user.completedWorkshops.length >= 1);

  // 4. Builder: Crear un proyecto (Se activa desde ProjectEditor)
  if (context.actionType === 'project_created') {
      tryUnlock('builder', true);
  }

  // 5. Social: Postear en el foro (Se activa desde Forum)
  if (context.actionType === 'forum_post') {
      tryUnlock('social', true);
  }

  // 6. Contributor: Wiki aprobada (Se activa desde WikiRegistry)
  if (context.actionType === 'wiki_approved') {
      tryUnlock('contributor', true);
  }

  // --- PROCESAR RESULTADOS ---
  if (newBadges.length > 0) {
    // 1. Actualizar objeto usuario
    updatedUser.badges = [...currentBadges, ...newBadges];

    // 2. Mostrar notificaciones visuales
    newBadges.forEach(badgeId => {
      const badgeInfo = BADGES.find(b => b.id === badgeId);
      if (badgeInfo) {
        setTimeout(() => {
            showToast(`¡Logro Desbloqueado: ${badgeInfo.title}!`, 'success');
        }, 500); // Pequeño delay para que no salga encima de la XP
      }
    });

    // 3. Persistir en Supabase (Silenciosamente)
    if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ 
            badges: updatedUser.badges 
        }).eq('id', user.id).then(({ error }) => {
            if(error) console.error("Error guardando badges:", error);
        });
    }
  }

  return updatedUser;
};
