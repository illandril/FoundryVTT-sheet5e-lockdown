import Settings, { SETTINGS_UPDATED } from '../settings.js';
import { log, KEY as MODULE_KEY, CSS_PREFIX } from '../module.js';
import MagicItemsSupport from '../module-support/magicitems.js';

export const REGISTERED = `${MODULE_KEY}.SheetsRegistered`;

const CSS_SHEET = `${CSS_PREFIX}sheet`;
const CSS_EDIT = `${CSS_PREFIX}edit`;
const CSS_TOGGLE_EDIT_ON = `${CSS_PREFIX}toggleEditOn`;
const CSS_TOGGLE_EDIT_OFF = `${CSS_PREFIX}toggleEditOff`;
const CSS_LOCK = `${CSS_PREFIX}lock`;
const CSS_HIDE_IMPORT_BUTTONS = `${CSS_PREFIX}hideImportButtons`;

const CSS_HIDE = `${CSS_PREFIX}hide`;
const CSS_HIDE_RESERVE_SPACE = `${CSS_PREFIX}hideReserveSpace`;
const CSS_FLEXFIX = `${CSS_PREFIX}flexfix`;

const CSS_NO_POINTER_EVENTS = `${CSS_PREFIX}noPointerEvents`;

export const LockMode = {
  CSS_POINTER_EVENTS: 0,
  FORM_DISABLED: 1,
  HIDE: 2,
  HIDE_RESERVE_SPACE: 3,
  HIDE_PARENTS: 4,
  CONTENT_EDITABLE: 5,
};

const BONUSES = [
  { name: 'data.bonuses.mwak.attack', label: 'DND5E.BonusMWAttack' },
  { name: 'data.bonuses.mwak.damage', label: 'DND5E.BonusMWDamage' },
  { name: 'data.bonuses.rwak.attack', label: 'DND5E.BonusRWAttack' },
  { name: 'data.bonuses.rwak.damage', label: 'DND5E.BonusRWDamage' },
  { name: 'data.bonuses.msak.attack', label: 'DND5E.BonusMSAttack' },
  { name: 'data.bonuses.msak.damage', label: 'DND5E.BonusMSDamage' },
  { name: 'data.bonuses.rsak.attack', label: 'DND5E.BonusRSAttack' },
  { name: 'data.bonuses.rsak.damage', label: 'DND5E.BonusRSDamage' },
  { name: 'data.bonuses.abilities.check', label: 'DND5E.BonusAbilityCheck' },
  { name: 'data.bonuses.abilities.save', label: 'DND5E.BonusAbilitySave' },
  { name: 'data.bonuses.abilities.skill', label: 'DND5E.BonusAbilitySkill' },
  { name: 'data.bonuses.spell.dc', label: 'DND5E.BonusSpellDC' },
];

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
    this.sheetName = sheetName;
    this.onRenderHook = (actorSheet) => {
      if (actorSheet.constructor.name !== sheetName) {
        // It's a custom sheet that extends some other sheet, and we're in the parent
        // class's hook - skip it to avoid inappropriate locking.
        return;
      }
      if (sheetDisabledSetting && sheetDisabledSetting.get()) {
        return;
      }
      SHOWN_SHEETS.add(actorSheet);
      const sheetElem = actorSheet.element[0];
      const actor = actorSheet.object;
      if (!sheetElem) {
        return;
      }
      this.onRender(sheetElem, actor, actorSheet.isEditable);
    };
    LOCKABLE_SHEET_NAMES.add(sheetName);
    log.info(`Sheet Registered: ${sheetName}`);
    Hooks.on('render' + sheetName, this.onRenderHook);
  }

  onRender(sheetElem, actor, isSheetEditable) {
    console.log('render', actor.name);
    this.initialize(sheetElem, actor, isSheetEditable);

    const isLocked = !isSheetEditable || this.isLocked(sheetElem);
    this.makeLocked(sheetElem, actor, isLocked, isSheetEditable);
  }

  initialize(sheetElem, actor, isSheetEditable) {
    this.showSpecialTraits(sheetElem, actor);
    if (sheetElem.classList.contains(CSS_SHEET)) {
      return;
    }
    sheetElem.classList.add(CSS_SHEET);
    sheetElem.classList.add(CSS_LOCK);
    if (isSheetEditable && game.user.hasRole(Settings.ShowToggleEditRole.get())) {
      const sheetHeader = sheetElem.querySelector('.window-header');
      const sheetTitle = sheetHeader.querySelector('.window-title');

      const editOnLink = document.createElement('a');
      editOnLink.classList.add(CSS_TOGGLE_EDIT_ON);
      editOnLink.addEventListener('click', () => this.makeLocked(sheetElem, actor, false, isSheetEditable), false);
      editOnLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editOnLink, sheetTitle.nextSibling);

      const editOffLink = document.createElement('a');
      editOffLink.classList.add(CSS_TOGGLE_EDIT_OFF);
      editOffLink.addEventListener('click', () => this.makeLocked(sheetElem, actor, true, isSheetEditable), false);
      editOffLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editOffLink, sheetTitle.nextSibling);

      const toggleStyle = Settings.LockToggleStyle.get();
      if (toggleStyle !== 'labelOnly') {
        editOnLink.appendChild(faIcon('lock'));
        editOffLink.appendChild(faIcon('unlock'));
      }

      let labelKeyType;
      if (toggleStyle === 'full') {
        labelKeyType = '';
      } else if (toggleStyle === 'iconOnly') {
        labelKeyType = null;
      } else {
        labelKeyType = 'Short';
      }
      if (labelKeyType !== null) {
        const toggleOnString = game.i18n.localize(`${MODULE_KEY}.toggleEditOn${labelKeyType}`);
        const toggleOffString = game.i18n.localize(`${MODULE_KEY}.toggleEditOff${labelKeyType}`);
        editOnLink.appendChild(document.createTextNode(toggleOnString));
        editOffLink.appendChild(document.createTextNode(toggleOffString));
      }
    }
    this.customSheetInitialize(sheetElem, actor, isSheetEditable);
  }

  customSheetInitialize(sheetElem, actor, isSheetEditable) {
    // Nothing here, but some sheets do special stuff
  }

  isLocked(sheetElem) {
    return sheetElem.classList.contains(CSS_LOCK);
  }

  makeLocked(sheetElem, actor, locked, isSheetEditable) {
    log.debug(`Make Locked? ${locked} (${this.sheetName})`);
    addRemoveClass(sheetElem, CSS_LOCK, locked);
    addRemoveClass(sheetElem, CSS_EDIT, !locked);

    // Import buttons are added in by other modules, and might have their hooks fire after this one,
    // so we hide them via CSS rules instead
    // TODO: Make this configurable?
    addRemoveClass(sheetElem, CSS_HIDE_IMPORT_BUTTONS, locked);

    // Basic Details section
    lockUnlock(this.getNameInput(sheetElem), locked, Settings.LockName, isSheetEditable);
    lockUnlock(
      this.getBasicDetailInputs(sheetElem),
      locked,
      Settings.LockBasicDetails,
      isSheetEditable
    );
    lockUnlock(
      this.getAlignmentForHide(sheetElem),
      locked,
      Settings.ShowAlignmentRole,
      isSheetEditable
    );

    // Attributes
    lockUnlock(
      this.getAbilityScoreInputs(sheetElem),
      locked,
      Settings.LockAbilityScores,
      isSheetEditable
    );
    lockUnlock(
      this.getProficiencyToggles(sheetElem),
      locked,
      Settings.LockProficiencies,
      isSheetEditable
    );
    lockUnlock(this.getTraits(sheetElem), locked, Settings.LockTraits, isSheetEditable);

    // Inventory + Features + Spellbook
    lockUnlock(
      this.getAddItemButtons(sheetElem),
      locked,
      Settings.HideAddItemButtons,
      isSheetEditable
    );
    lockUnlock(
      this.getRemoveItemButtons(sheetElem),
      locked,
      Settings.HideRemoveItemButtons,
      isSheetEditable
    );
    lockUnlock(
      this.getEditItemButtons(sheetElem),
      locked,
      Settings.HideEditItemButtons,
      isSheetEditable
    );

    // Features
    lockUnlock(
      this.getAvailableItemFeatureUses(sheetElem),
      locked,
      Settings.LockAvailableItemFeatureUses,
      isSheetEditable
    );

    // Spellbook
    lockUnlock(
      this.getAvailableSpellSlots(sheetElem),
      locked,
      Settings.LockAvailableSpellSlots,
      isSheetEditable
    );
    lockUnlock(
      this.getMaxSpellSlotOverride(sheetElem),
      locked,
      Settings.LockMaxSpellSlotOverride,
      isSheetEditable
    );
    const hideEmptySpellbook =
      locked && (Settings.HideAddItemButtons.get() || Settings.HideEmptySpellbook.get());
    const isSpellbookEmptyAndHidden = hideEmptySpellbook && this.isSpellbookEmpty(actor);
    lockUnlock(
      this.getSpellbookTab(sheetElem),
      hideEmptySpellbook,
      isSpellbookEmptyAndHidden,
      isSheetEditable
    );

    // Effects
    lockUnlock(this.getEffectControls(sheetElem), locked, Settings.LockEffects, isSheetEditable);
    const hideEmptyEffects = locked && Settings.LockEffects.get();
    const isEffectsEmptyAndHidden = hideEmptyEffects && this.isEffectsEmpty(actor);
    lockUnlock(
      this.getEffectsTab(sheetElem),
      locked,
      isEffectsEmptyAndHidden || Settings.ShowEffectsRole,
      isSheetEditable
    );

    // Biography
    lockUnlock(
      this.getBiographyForHide(sheetElem),
      locked,
      Settings.ShowBiographyRole,
      isSheetEditable
    );

    // Unsorted stuff
    lockUnlock(this.getUnsorteds(sheetElem), locked, Settings.LockUnsorteds, isSheetEditable);
    log.debug('Make Locked Complete');
  }

  isSpellbookEmpty(actor) {
    if (actor.data.items.some((item) => item.type === 'spell')) {
      return false;
    }
    if (MagicItemsSupport.doesActorHaveSpells(actor)) {
      return false;
    }
    return true;
  }

  isEffectsEmpty(actor) {
    return actor.data.effects.size == 0;
  }

  getNameInput(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name="name"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getBasicDetailInputs(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll(
        [
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
            // Trait config icons
            '.traits .config-button',
            // Empty trait rows
            '.traits .form-group.inactive',
          ].join(',')
        ),
        lockMode: LockMode.HIDE,
      },
      Settings.ShowSpecialTraits.get() ? null : this.getConfigureSpecialTraitsRow(sheetElem),
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

  getAddItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.inventory-list .item-create'),
      lockMode: LockMode.HIDE,
    };
  }

  getRemoveItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.inventory-list .item-delete'),
      lockMode: LockMode.HIDE,
    };
  }

  getEditItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.inventory-list .item-edit'),
      lockMode: LockMode.HIDE,
    };
  }

  getAvailableItemFeatureUses(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.item-detail.item-uses > input'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getAvailableSpellSlots(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name^="data.spells."][name$=".value"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getMaxSpellSlotOverride(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.slot-max-override'),
      lockMode: LockMode.HIDE,
    };
  }

  getEffectControls(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.effect-control'),
      lockMode: LockMode.HIDE,
    };
  }

  getEffectsTab(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.tabs .item[data-tab="effects"]'),
      lockMode: LockMode.HIDE,
      always: true,
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
      {
        elements: sheetElem.querySelectorAll('.attribute .config-button'),
        lockMode: LockMode.HIDE,
      },
    ];
  }

  showSpecialTraits(sheetElem, actor) {
    if (!Settings.ShowSpecialTraits.get()) {
      return;
    }
    const specialTraitsRow = this.getSpecialTraitsRow(sheetElem);
    if (!specialTraitsRow) {
      return;
    }
    let traitsList;
    if (this.showSpecialTraitsAsUL()) {
      traitsList = document.createElement('ul');
      traitsList.classList.add('traits-list');
    } else {
      traitsList = document.createDocumentFragment();
    }

    const actorFlags = actor.data.flags;
    for (let [key, flag] of Object.entries(CONFIG.DND5E.characterFlags)) {
      const value = getProperty(actorFlags, `dnd5e.${key}`);
      if (value) {
        this.addTag(traitsList, flag.name, value);
      }
    }

    BONUSES.forEach((bonus) => {
      const value = getProperty(actor.data, bonus.name);
      if (value) {
        this.addTag(traitsList, bonus.label, value);
      }
    });
    if (traitsList.childElementCount > 0) {
      specialTraitsRow.traitListContainer.appendChild(traitsList);
    } else {
      specialTraitsRow.row.classList.add('inactive');
    }
  }

  addTag(traitsList, labelLocaleKey, value) {
    if (!this.showSpecialTraitsAsUL()) {
      traitsList.appendChild(document.createTextNode(' '));
    }
    const tagElem = this.showSpecialTraitsAsUL()
      ? document.createElement('li')
      : document.createElement('span');
    tagElem.classList.add('tag');
    tagElem.appendChild(document.createTextNode(game.i18n.localize(labelLocaleKey)));
    if (typeof value !== 'boolean') {
      tagElem.appendChild(document.createTextNode(` ${value}`));
    }
    traitsList.appendChild(tagElem);
  }

  showSpecialTraitsAsUL() {
    return true;
  }

  getSpecialTraitsRow(sheetElem) {
    const flagsToggle = sheetElem.querySelector('.traits [data-action="flags"]');
    if (!flagsToggle) {
      return null;
    }
    const row = flagsToggle.parentElement;
    return {
      row: row,
      traitListContainer: row,
    };
  }
}

const addRemoveClass = (element, cssClass, isAdd) => {
  if (!element) {
    return;
  }
  isAdd ? element.classList.add(cssClass) : element.classList.remove(cssClass);
};

export const lockUnlock = (elementGroups, sheetLocked, lockSetting, isSheetEditable) => {
  if (typeof isSheetEditable !== 'boolean') {
    log.error(`isSheetEditable was not a boolean - please submit a bug report in GitHub with a screenshot of the stack trace for this error`);
    isSheetEditable = true;
  }
  if (typeof lockSetting !== 'boolean') {
    lockSetting = lockSetting.get();
    if (typeof lockSetting === 'string') {
      lockSetting = !game.user.hasRole(lockSetting);
    }
  }
  if (!elementGroups) {
    return;
  }
  if (Array.isArray(elementGroups)) {
    elementGroups.forEach((elementGroup) => {
      lockUnlock(elementGroup, sheetLocked, lockSetting, isSheetEditable);
    });
  } else {
    const { elements, lockMode, always } = elementGroups;
    const lock = (sheetLocked || always) && lockSetting;

    if (isSheetEditable || lock) {
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
