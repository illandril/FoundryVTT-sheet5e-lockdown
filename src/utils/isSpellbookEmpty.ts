import MagicItemsSupport from '../module-support/magicitems';

const isSpellbookEmpty = (actor: dnd5e.documents.Actor5e) => {
  if (actor.items.some((item) => item.type === 'spell')) {
    return false;
  }
  if (MagicItemsSupport.doesActorHaveSpells(actor)) {
    return false;
  }
  return true;
};

export default isSpellbookEmpty;
