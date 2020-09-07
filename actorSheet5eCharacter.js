import Locker from './locker.js';

const locker = new Locker(
  [
    // Elements to Disable
    'input[name="name"]',
    'input[name="data.details.race"]',
    'input[name="data.attributes.hp.max"]',
    'input[name="data.attributes.ac.value"]',
    'input[name="data.attributes.speed.value"]',
    'input[name="data.attributes.speed.special"]',
    'input[name="data.attributes.init.value"]',
    'input[name="data.resources.primary.label"]',
    'input[name="data.resources.secondary.label"]',
    'input[name="data.resources.tertiary.label"]',
    'input[name="data.resources.primary.max"]',
    'input[name="data.resources.secondary.max"]',
    'input[name="data.resources.tertiary.max"]',
    'input[name="data.resources.primary.sr"]',
    'input[name="data.resources.secondary.sr"]',
    'input[name="data.resources.tertiary.sr"]',
    'input[name="data.resources.primary.lr"]',
    'input[name="data.resources.secondary.lr"]',
    'input[name="data.resources.tertiary.lr"]',
    'input.ability-score',
    'select.actor-size',
    'input[name="data.traits.senses"]',
    'input[name^="data.currency."]',
    'select[name="data.attributes.spellcasting"]',
  ],
  [
    // Elements to hide parents
    'input[name="data.details.background"]',
    'input[name="data.details.alignment"]',
  ],
  [
    // Elements to hide parents when locked
    '.configure-flags',
  ],
  [
    // Conditionals
  ]
);

Hooks.on('renderActorSheet5eCharacter', (actorSheet) => {
  const sheetElem = actorSheet.element[0];
  if (!sheetElem) {
    return;
  }
  locker.lock(sheetElem);
});
