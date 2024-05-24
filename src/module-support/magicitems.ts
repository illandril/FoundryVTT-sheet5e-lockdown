import module from '../module';

declare global {
  interface Window {
    // biome-ignore lint/style/useNamingConvention: Not our name
    MagicItems?: {
      actor?: (id: string) => undefined | { hasItemsSpells?: () => boolean };
    };
  }
}

const MagicItemsSupport = {
  doesActorHaveSpells: (actor: Actor) => {
    if (window.MagicItems?.actor) {
      try {
        const magicitemsActor = window.MagicItems.actor(actor.id);
        return !!magicitemsActor?.hasItemsSpells?.();
      } catch (err) {
        module.logger.error('Error checking for magicitems mod spells', err);
      }
    }
    return false;
  },
};
export default MagicItemsSupport;
