import { log } from '../module.js';

const MagicItemsSupport = {
  doesActorHaveSpells: (actor) => {
    if (window.MagicItems && window.MagicItems.actor) {
      try {
        const magicitemsActor = window.MagicItems.actor(actor.id);
        return magicitemsActor && magicitemsActor.hasItemsSpells();
      } catch (e) {
        log.error('Error checking for magicitems mod spells', e);
      }
    }
    return false;
  },
};
export default MagicItemsSupport;
