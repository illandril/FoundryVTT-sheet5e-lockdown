import Locker, { forAll } from './locker.js';

const locker = new Locker(
  [
    // Elements to Disable
    'input[name="name"]',
    'input[name="data.details.cr"]',
    'input[name="data.details.type"]',
    'input[name="data.attributes.hp.max"]',
    'input[name="data.attributes.hp.formula"]',
    'input[name="data.attributes.ac.value"]',
    'input[name="data.attributes.speed.value"]',
    'input[name="data.attributes.speed.special"]',
    'input[name="data.resources.legact.max"]',
    'input[name="data.resources.legres.max"]',
    'input[name="data.resources.lair.value"]',
    'input[name="data.resources.lair.initiative"]',
    'input.ability-score',
    'select.actor-size',
    'input[name="data.traits.senses"]',
    'input[name="data.details.spellLevel"]',
    'select[name="data.attributes.spellcasting"]',
  ],
  [
    // Elements to hide parents
    'input[name="data.details.source"]',
    'input[name="data.details.alignment"]',
  ],
  [
    // Elements to hide parents when locked
    '.configure-flags',
  ],
  [
    // Conditionals
    {
      // Legendary Actions
      shouldHide: (sheetElem, isEditable) => {
        if (isEditable) {
          return false;
        }
        const input = sheetElem.querySelector('input[name="data.resources.legact.max"]');
        return parseInt(input.value,10) < 1;
      },
      elementToHide: (sheetElem) => {
        const input = sheetElem.querySelector('input[name="data.resources.legact.max"]');
        return input.parentNode.parentNode;
      },
    },
    {
      // Legendary Resistances
      shouldHide: (sheetElem, isEditable) => {
        if (isEditable) {
          return false;
        }
        const input = sheetElem.querySelector('input[name="data.resources.legres.max"]');
        return parseInt(input.value,10) < 1;
      },
      elementToHide: (sheetElem) => {
        const input = sheetElem.querySelector('input[name="data.resources.legres.max"]');
        return input.parentNode.parentNode;
      },
    },
    {
      // Lair Actions
      shouldHide: (sheetElem, isEditable) => {
        if (isEditable) {
          return false;
        }
        const input = sheetElem.querySelector('input[name="data.resources.lair.value"]');
        return !input.checked;
      },
      elementToHide: (sheetElem) => {
        const input = sheetElem.querySelector('input[name="data.resources.lair.value"]');
        return input.parentNode.parentNode;
      },
    },
    {
      // Spellbook
      shouldHide: (sheetElem, isEditable) => {
        if (isEditable) {
          return false;
        }
        const spellbookEmpty = sheetElem.querySelector('.tab.spellbook .spellbook-empty');
        return !!spellbookEmpty;
      },
      elementToHide: (sheetElem) => {
        const input = sheetElem.querySelector('.sheet-navigation .item[data-tab="spellbook"]');
        return input;
      },
    },
  ]
);

Hooks.on('renderActorSheet5eNPC', (actorSheet) => {
  const sheetElem = actorSheet.element[0];
  if (!sheetElem) {
    return;
  }
  locker.lock(sheetElem);
});
