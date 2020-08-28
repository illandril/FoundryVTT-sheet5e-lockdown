const CSS_PREFIX = 'illandril-sheet5e-lockdown--';
const CSS_SHEET = CSS_PREFIX + 'sheet';
const CSS_EDIT = CSS_PREFIX + 'edit';
const CSS_LOCK = CSS_PREFIX + 'lock';

const elementsToDisable = [
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
].join(',');

Hooks.on('renderActorSheet5eCharacter', (actorSheet5eCharacter, html, data) => {
  const sheetElem = getSheetElem(html);
  if (!sheetElem) {
    return;
  }

  // Hide Background and Alignment
  // Note: This isn't in the CSS because there is no way to reliably select the node we want to hide
  forAll(
    sheetElem,
    'input[name="data.details.background"],input[name="data.details.alignment"]',
    (input) => {
      input.parentNode.style.display = 'none';
    }
  );
  if (sheetElem && !sheetElem.classList.contains(CSS_SHEET)) {
    initialize(sheetElem);
  }
  makeEditable(sheetElem, isEditable(sheetElem));
});

function stopPropagation(event) {
  event.stopPropagation();
}

function initialize(sheetElem) {
  sheetElem.classList.add(CSS_SHEET);
  if (game.user.isGM) {
    const sheetHeader = sheetElem.querySelector('.window-header');
    const sheetTitle = sheetHeader.querySelector('.window-title');

    const editLink = document.createElement('a');
    editLink.appendChild(faIcon('edit'));
    const toggleString = game.i18n.localize('illandril-sheet5e-lockdown.toggleEditable');
    editLink.appendChild(document.createTextNode(toggleString));
    editLink.addEventListener('click', () => toggleEditable(sheetElem), false);
    editLink.addEventListener('dblclick', stopPropagation, false);
    sheetHeader.insertBefore(editLink, sheetTitle.nextSibling);
  }
}

function isEditable(sheetElem) {
  return sheetElem.classList.contains(CSS_EDIT);
}

function toggleEditable(sheetElem) {
  makeEditable(sheetElem, !isEditable(sheetElem));
}

function makeEditable(sheetElem, editable) {
  if (editable) {
    sheetElem.classList.remove(CSS_LOCK);
    sheetElem.classList.add(CSS_EDIT);
  } else {
    sheetElem.classList.add(CSS_LOCK);
    sheetElem.classList.remove(CSS_EDIT);
  }
  forAll(sheetElem, elementsToDisable, (input) => {
    input.disabled = !editable;
  });
}

function getSheetElem(html) {
  let sheetElem = html[0];
  while (sheetElem && !sheetElem.classList.contains('sheet')) {
    sheetElem = sheetElem.parentNode;
  }
  return sheetElem;
}

function forAll(parent, selector, action) {
  Array.prototype.forEach.call(parent.querySelectorAll(selector), action);
}

function faIcon(name) {
  const icon = document.createElement('i');
  icon.classList.add('fas');
  icon.classList.add('fa-' + name);
  return icon;
}
