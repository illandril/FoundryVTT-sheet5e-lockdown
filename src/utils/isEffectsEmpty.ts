const isEffectsEmpty = (actor: dnd5e.documents.Actor5e) => {
  return actor.effects.size === 0;
};

export default isEffectsEmpty;
