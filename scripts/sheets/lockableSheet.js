import Settings, { SETTINGS_UPDATED } from '../settings.js';
import log from '../log.js';

export const REGISTERED = 'illandril-sheet5e-lockdown.SheetsRegistered';

const CSS_PREFIX = 'illandril-sheet5e-lockdown--';
const CSS_SHEET = CSS_PREFIX + 'sheet';
const CSS_EDIT = CSS_PREFIX + 'edit';
const CSS_LOCK = CSS_PREFIX + 'lock';
const CSS_HIDE_IMPORT_BUTTONS = CSS_PREFIX + 'hideImportButtons';

const CSS_HIDE = CSS_PREFIX + 'hide';
const CSS_HIDE_RESERVE_SPACE = CSS_PREFIX + 'hideReserveSpace';
const CSS_FLEXFIX = CSS_PREFIX + 'flexfix';

const CSS_NO_POINTER_EVENTS = CSS_PREFIX + 'noPointerEvents';

export const LockMode = {
  CSS_POINTER_EVENTS: 0,
  FORM_DISABLED: 1,
  HIDE: 2,
  HIDE_RESERVE_SPACE: 3,
  HIDE_PARENTS: 4,
  CONTENT_EDITABLE: 5,
};

const SHOWN_SHEETS = new Set();

Hooks.on(SETTINGS_UPDATED, () => {
  SHOWN_SHEETS.forEach((sheet) => {
    if (sheet.rendered) {
      sheet.render();
    }
  });
});

setInterval(() => {
  // Avoid excess memory overhead by clearing out the shown sheets list periodically
  SHOWN_SHEETS.forEach((sheet) => {
    if (!sheet.rendered) {
      SHOWN_SHEETS.delete(sheet);
    }
  });
}, 10000);

const LOCKABLE_SHEET_NAMES = new Set();
export const isLockableSheet = (sheetName) => LOCKABLE_SHEET_NAMES.has(sheetName);

export default class LockableSheet {
  constructor(sheetName, sheetDisabledSetting) {
    LOCKABLE_SHEET_NAMES.add(sheetName);
    log.info(`Sheet Registered: ${sheetName}`);
    Hooks.on('render' + sheetName, (actorSheet) => {
      if (!actorSheet.isEditable || (sheetDisabledSetting && sheetDisabledSetting.get())) {
        return;
      }
      SHOWN_SHEETS.add(actorSheet);
      const sheetElem = actorSheet.element[0];
      const actor = actorSheet.object;
      if (!sheetElem) {
        return;
      }
      this.onRender(sheetElem, actor);
    });
  }

  onRender(sheetElem, actor) {
    this.initialize(sheetElem, actor);

    const isLocked = this.isLocked(sheetElem);
    this.makeLocked(sheetElem, actor, isLocked);
  }

  initialize(sheetElem, actor) {
    if (sheetElem.classList.contains(CSS_SHEET)) {
      return;
    }
    sheetElem.classList.add(CSS_SHEET);
    sheetElem.classList.add(CSS_LOCK);
    if (game.user.hasRole(Settings.ShowToggleEditRole.get())) {
      const sheetHeader = sheetElem.querySelector('.window-header');
      const sheetTitle = sheetHeader.querySelector('.window-title');

      const editLink = document.createElement('a');
      editLink.appendChild(faIcon('edit'));
      const toggleString = game.i18n.localize('illandril-sheet5e-lockdown.toggleEditable');
      editLink.appendChild(document.createTextNode(toggleString));
      editLink.addEventListener('click', () => this.toggleEditable(sheetElem, actor), false);
      editLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editLink, sheetTitle.nextSibling);
    }
  }

  isLocked(sheetElem) {
    return sheetElem.classList.contains(CSS_LOCK);
  }

  toggleEditable(sheetElem, actor) {
    log.debug('Toggling Editable');
    this.makeLocked(sheetElem, actor, !this.isLocked(sheetElem));
  }

  makeLocked(sheetElem, actor, locked) {
    log.debug('Make Locked? ' + locked);
    addRemoveClass(sheetElem, CSS_LOCK, locked);
    addRemoveClass(sheetElem, CSS_EDIT, !locked);

    // Import buttons are added in by other modules, and might have their hooks fire after this one,
    // so we hide them via CSS rules instead
    // TODO: Make this configurable?
    addRemoveClass(sheetElem, CSS_HIDE_IMPORT_BUTTONS, locked);

    // Basic Details section
    lockUnlock(this.getBasicDetailInputs(sheetElem), locked, Settings.LockBasicDetails);
    lockUnlock(this.getAlignmentForHide(sheetElem), locked, Settings.HideAlignment);

    // Attributes
    lockUnlock(this.getAbilityScoreInputs(sheetElem), locked, Settings.LockAbilityScores);
    lockUnlock(this.getProficiencyToggles(sheetElem), locked, Settings.LockProficiencies);
    lockUnlock(this.getTraits(sheetElem), locked, Settings.LockTraits);

    // Inventory + Features + Spellbook
    lockUnlock(this.getAddRemoveItemButtons(sheetElem), locked, Settings.HideAddRemoveItemButtons);
    lockUnlock(this.getEditItemButtons(sheetElem), locked, Settings.HideEditItemButtons);

    // Features -- nothing special here

    // Spellbook
    lockUnlock(this.getMaxSpellSlotOverride(sheetElem), locked, Settings.LockMaxSpellSlotOverride);
    const hideEmptySpellbook = locked && Settings.HideAddRemoveItemButtons.get();
    const isSpellbookEmpty = !actor.data.items.some((item) => item.type === 'spell');
    lockUnlock(this.getSpellbookTab(sheetElem), hideEmptySpellbook, isSpellbookEmpty);

    // Biography
    lockUnlock(this.getBiographyForHide(sheetElem), locked, Settings.HideBiography);

    // Unsorted stuff
    lockUnlock(this.getUnsorteds(sheetElem), locked, Settings.LockUnsorteds);
    log.debug('Make Locked Complete');
  }

  getBasicDetailInputs(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll(
        [
          'input[name="name"]',
          'input[name="data.details.race"]',
          'input[name="data.details.background"]',
          'input[name="data.details.alignment"]',
          'select.actor-size',
        ].join(',')
      ),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getAlignmentForHide(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name="data.details.alignment"]'),
      lockMode: LockMode.HIDE_PARENTS,
      always: true,
    };
  }

  getAbilityScoreInputs(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input.ability-score'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }

  getProficiencyToggles(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.proficiency-toggle'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }

  getTraits(sheetElem) {
    return [
      this.getSensesInput(sheetElem),
      {
        elements: sheetElem.querySelectorAll(
          [
            // Trait edit icons
            '.trait-selector',
            // Empty trait rows
            '.traits .form-group.inactive',
          ].join(',')
        ),
        lockMode: LockMode.HIDE,
      },
      this.getConfigureSpecialTraitsRow(sheetElem),
    ];
  }

  getSensesInput(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name="data.traits.senses"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getConfigureSpecialTraitsRow(sheetElem) {
    return {
      // Special Traits
      elements: sheetElem.querySelectorAll('.traits .configure-flags'),
      lockMode: LockMode.HIDE_PARENTS,
    };
  }

  getAddRemoveItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll(
        ['.inventory-list .item-create', '.inventory-list .item-delete'].join(',')
      ),
      lockMode: LockMode.HIDE,
    };
  }

  getEditItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.inventory-list .item-edit'),
      lockMode: LockMode.HIDE,
    };
  }

  getMaxSpellSlotOverride(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.slot-max-override'),
      lockMode: LockMode.HIDE,
    };
  }

  getSpellbookTab(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.tabs .item[data-tab="spellbook"]'),
      lockMode: LockMode.HIDE,
    };
  }

  getBiographyForHide(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.tabs .item[data-tab="biography"]'),
      lockMode: LockMode.HIDE,
      always: true,
    };
  }

  getUnsorteds(sheetElem) {
    return [
      {
        elements: sheetElem.querySelectorAll(
          [
            'input[name="data.attributes.hp.max"]',
            'input[name="data.attributes.ac.value"]',
            'input[name="data.attributes.speed.value"]',
            'input[name="data.attributes.speed.special"]',
            'input[name="data.attributes.init.value"]',
            'select[name="data.attributes.spellcasting"]',
          ].join(',')
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }
}

const addRemoveClass = (element, cssClass, isAdd) => {
  isAdd ? element.classList.add(cssClass) : element.classList.remove(cssClass);
};

export const lockUnlock = (elementGroups, sheetLocked, lockSetting) => {
  if (typeof lockSetting !== 'boolean') {
    lockSetting = lockSetting.get();
  }
  if (Array.isArray(elementGroups)) {
    elementGroups.forEach((elementGroup) => {
      lockUnlock(elementGroup, sheetLocked, lockSetting);
    });
  } else {
    const { elements, lockMode, always } = elementGroups;
    const lock = (sheetLocked || always) && lockSetting;
    switch (lockMode) {
      case LockMode.CSS_POINTER_EVENTS:
        elements.forEach((element) => {
          addRemoveClass(element, CSS_NO_POINTER_EVENTS, lock);
        });
        break;
      case LockMode.FORM_DISABLED:
        elements.forEach((element) => {
          element.disabled = lock;
        });
        break;
      case LockMode.HIDE:
        elements.forEach((element) => {
          addRemoveClass(element, CSS_HIDE, lock);
        });
        break;
      case LockMode.HIDE_RESERVE_SPACE:
        elements.forEach((element) => {
          addRemoveClass(element, CSS_HIDE_RESERVE_SPACE, lock);
        });
        break;
      case LockMode.HIDE_PARENTS:
        elements.forEach((element) => {
          addRemoveClass(element.parentNode, CSS_HIDE, lock);
        });
        break;
      case LockMode.CONTENT_EDITABLE:
        elements.forEach((element) => {
          element.setAttribute('contenteditable', !lock);
        });
        break;
      default:
        log.error('Unexpected lockMode: ' + lockMode);
    }
  }
};

export const isHideReserveSpace = (element) => element.classList.contains(CSS_HIDE_RESERVE_SPACE);

const faIcon = (name) => {
  const icon = document.createElement('i');
  icon.classList.add('fas');
  icon.classList.add('fa-' + name);
  return icon;
};

const stopPropagation = (event) => {
  event.stopPropagation();
};
