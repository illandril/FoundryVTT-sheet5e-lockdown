/* eslint-disable max-lines-per-function */
import { Setting } from '@illandril/foundryvtt-utils/dist/ModuleSettings.js';
import module from '../module';
import MagicItemsSupport from '../module-support/magicitems';
import * as Settings from '../settings';

export const REGISTERED = `illandril-sheet5e-lockdown.SheetsRegistered`;

const CSS_SHEET = module.cssPrefix.child('sheet');
const CSS_EDIT = module.cssPrefix.child('edit');
const CSS_TOGGLE_EDIT_ON = module.cssPrefix.child('toggleEditOn');
const CSS_TOGGLE_EDIT_OFF = module.cssPrefix.child('toggleEditOff');
const CSS_LOCK = module.cssPrefix.child('lock');
const CSS_HIDE_IMPORT_BUTTONS = module.cssPrefix.child('hideImportButtons');

const CSS_HIDE = module.cssPrefix.child('hide');
const CSS_HIDE_RESERVE_SPACE = module.cssPrefix.child('hideReserveSpace');

const CSS_NO_POINTER_EVENTS = module.cssPrefix.child('noPointerEvents');

export enum LockMode {
  CSS_POINTER_EVENTS = 'CSS_POINTER_EVENTS',
  FORM_DISABLED = 'FORM_DISABLED',
  HIDE = 'HIDE',
  HIDE_RESERVE_SPACE = 'HIDE_RESERVE_SPACE',
  HIDE_PARENTS = 'HIDE_PARENTS',
  CONTENT_EDITABLE = 'CONTENT_EDITABLE',
  DISABLE_CONTEXT_MENU = 'DISABLE_CONTEXT_MENU',
}

const BONUSES = [
  { name: 'bonuses.mwak.attack', label: 'DND5E.BonusMWAttack' },
  { name: 'bonuses.mwak.damage', label: 'DND5E.BonusMWDamage' },
  { name: 'bonuses.rwak.attack', label: 'DND5E.BonusRWAttack' },
  { name: 'bonuses.rwak.damage', label: 'DND5E.BonusRWDamage' },
  { name: 'bonuses.msak.attack', label: 'DND5E.BonusMSAttack' },
  { name: 'bonuses.msak.damage', label: 'DND5E.BonusMSDamage' },
  { name: 'bonuses.rsak.attack', label: 'DND5E.BonusRSAttack' },
  { name: 'bonuses.rsak.damage', label: 'DND5E.BonusRSDamage' },
  { name: 'bonuses.abilities.check', label: 'DND5E.BonusAbilityCheck' },
  { name: 'bonuses.abilities.save', label: 'DND5E.BonusAbilitySave' },
  { name: 'bonuses.abilities.skill', label: 'DND5E.BonusAbilitySkill' },
  { name: 'bonuses.spell.dc', label: 'DND5E.BonusSpellDC' },
];

const SHOWN_SHEETS = new Set<ActorSheet>();
const refreshShownSheets = () => {
  SHOWN_SHEETS.forEach((sheet) => {
    if (sheet.rendered) {
      sheet.render();
    }
  });
};
Hooks.on(Settings.SETTINGS_UPDATED, () => {
  refreshShownSheets();
});

setInterval(() => {
  // Avoid excess memory overhead by clearing out the shown sheets list periodically
  SHOWN_SHEETS.forEach((sheet) => {
    if (!sheet.rendered) {
      SHOWN_SHEETS.delete(sheet);
    }
  });
}, 10000);

const LOCKABLE_SHEET_NAMES = new Set<string>();
export const isLockableSheet = (sheetName: string) => LOCKABLE_SHEET_NAMES.has(sheetName);

export default class LockableSheet {
  constructor(public readonly sheetName: string) {
    const onRenderHook = (actorSheet: ActorSheet<dnd5e.documents.Actor5e>) => {
      if (actorSheet.constructor.name !== sheetName) {
        // It's a custom sheet that extends some other sheet, and we're in the parent
        // class's hook - skip it to avoid inappropriate locking.
        return;
      }
      SHOWN_SHEETS.add(actorSheet);

      const sheetElem = actorSheet.element[0];
      if (!sheetElem) {
        return;
      }
      this.onRender(sheetElem, actorSheet.actor, actorSheet.isEditable);
    };

    LOCKABLE_SHEET_NAMES.add(sheetName);
    module.logger.info(`Sheet Registered: ${sheetName}`);
    Hooks.on(`render${sheetName}` as keyof HookCallbacks, onRenderHook);
  }

  onRender(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, isSheetEditable: boolean) {
    module.logger.info('render', actor.name);
    this.initialize(sheetElem, actor, isSheetEditable);

    const isLocked = !isSheetEditable || this.isLocked(sheetElem);
    this.makeLocked(sheetElem, actor, isLocked, isSheetEditable);
  }

  initialize(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, isSheetEditable: boolean) {
    this.showSpecialTraits(sheetElem, actor);
    if (sheetElem.classList.contains(CSS_SHEET)) {
      return;
    }
    sheetElem.classList.add(CSS_SHEET);
    sheetElem.classList.add(CSS_LOCK);
    if (isSheetEditable && game.user?.hasRole(Settings.ShowToggleEditRole.get())) {
      const sheetHeader = sheetElem.querySelector<HTMLElement>('.window-header');
      if (!sheetHeader) {
        module.logger.error('window-header not found in sheet');
        return;
      }
      const sheetTitle = sheetHeader.querySelector<HTMLElement>('.window-title');
      if (!sheetTitle) {
        module.logger.error('window-title not found in window-header');
        return;
      }

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
        const toggleOnString = module.localize(`toggleEditOn${labelKeyType}`);
        const toggleOffString = module.localize(`toggleEditOff${labelKeyType}`);
        editOnLink.appendChild(document.createTextNode(toggleOnString));
        editOffLink.appendChild(document.createTextNode(toggleOffString));
      }
    }
  }

  isLocked(sheetElem: HTMLElement) {
    return sheetElem.classList.contains(CSS_LOCK);
  }

  makeLocked(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, locked: boolean, isSheetEditable: boolean) {
    module.logger.debug(`Make Locked? ${locked.toString()} (${this.sheetName})`);
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
      isSheetEditable,
    );
    lockUnlock(
      this.getAlignmentForHide(sheetElem),
      locked,
      Settings.ShowAlignmentRole,
      isSheetEditable,
    );

    // Attributes
    lockUnlock(
      this.getAbilityScoreInputs(sheetElem),
      locked,
      Settings.LockAbilityScores,
      isSheetEditable,
    );
    lockUnlock(
      this.getProficiencyToggles(sheetElem),
      locked,
      Settings.LockProficiencies,
      isSheetEditable,
    );
    lockUnlock(this.getTraits(sheetElem), locked, Settings.LockTraits, isSheetEditable);

    // Inventory + Features + Spellbook
    lockUnlock(
      this.getAddItemButtons(sheetElem),
      locked,
      Settings.HideAddItemButtons,
      isSheetEditable,
    );
    lockUnlock(
      this.getRemoveItemButtons(sheetElem),
      locked,
      Settings.HideRemoveItemButtons,
      isSheetEditable,
    );
    lockUnlock(
      this.getEditItemButtons(sheetElem),
      locked,
      Settings.HideEditItemButtons,
      isSheetEditable,
    );
    lockUnlock(
      this.getItemContextMenus(sheetElem),
      locked,
      Settings.DisableItemContextMenu,
      isSheetEditable,
    );

    // Features
    lockUnlock(
      this.getAvailableItemFeatureUses(sheetElem),
      locked,
      Settings.LockAvailableItemFeatureUses,
      isSheetEditable,
    );

    // Spellbook
    lockUnlock(
      this.getAvailableSpellSlots(sheetElem),
      locked,
      Settings.LockAvailableSpellSlots,
      isSheetEditable,
    );
    lockUnlock(
      this.getMaxSpellSlotOverride(sheetElem),
      locked,
      Settings.LockMaxSpellSlotOverride,
      isSheetEditable,
    );
    const hideEmptySpellbook
      = locked && (Settings.HideAddItemButtons.get() || Settings.HideEmptySpellbook.get());
    const isSpellbookEmptyAndHidden = hideEmptySpellbook && this.isSpellbookEmpty(actor);
    lockUnlock(
      this.getSpellbookTab(sheetElem),
      hideEmptySpellbook,
      isSpellbookEmptyAndHidden,
      isSheetEditable,
    );

    // Effects
    lockUnlock(this.getEffectControls(sheetElem), locked, Settings.LockEffects, isSheetEditable);
    const hideEmptyEffects = locked && Settings.LockEffects.get();
    const isEffectsEmptyAndHidden = hideEmptyEffects && this.isEffectsEmpty(actor);
    lockUnlock(
      this.getEffectsTab(sheetElem),
      locked,
      isEffectsEmptyAndHidden || Settings.ShowEffectsRole,
      isSheetEditable,
    );

    // Biography
    lockUnlock(
      this.getBiographyForHide(sheetElem),
      locked,
      Settings.ShowBiographyRole,
      isSheetEditable,
    );

    // Unsorted stuff
    lockUnlock(this.getUnsorteds(sheetElem), locked, Settings.LockUnsorteds, isSheetEditable);
    module.logger.debug('Make Locked Complete');
  }

  isSpellbookEmpty(actor: dnd5e.documents.Actor5e) {
    if (actor.items.some((item) => item.type === 'spell')) {
      return false;
    }
    if (MagicItemsSupport.doesActorHaveSpells(actor)) {
      return false;
    }
    return true;
  }

  isEffectsEmpty(actor: dnd5e.documents.Actor5e) {
    return actor.effects.size === 0;
  }

  getNameInput(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input[name="name"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getBasicDetailInputs(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>(
        [
          'input[name="system.details.race"]',
          'input[name="system.details.background"]',
          'input[name="system.details.alignment"]',
          'select.actor-size',
        ].join(','),
      ),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getAlignmentForHide(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input[name="system.details.alignment"]'),
      lockMode: LockMode.HIDE_PARENTS,
      always: true,
    };
  }

  getAbilityScoreInputs(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input.ability-score'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }

  getProficiencyToggles(sheetElem: HTMLElement) {
    return [
      {
        // Proficiency toggles
        elements: sheetElem.querySelectorAll<HTMLElement>('.proficiency-toggle'),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
      {
        elements: sheetElem.querySelectorAll<HTMLElement>([
          // Saving throw proficiency configure button
          '.config-button[data-action="ability"]',

          // Skill proficiency configure button
          '.config-button[data-action="skill"]',
        ].join(',')),
        lockMode: LockMode.HIDE,
      },
    ];
  }

  getTraits(sheetElem: HTMLElement) {
    return [
      this.getSensesInput(sheetElem),
      {
        elements: sheetElem.querySelectorAll<HTMLElement>(
          [
            // Trait edit icons
            '.trait-selector',
            // Trait config icons
            '.traits .config-button',
            // Empty trait rows (this only matches some... so use the more complicated selector below instead)
            // '.traits .form-group.inactive',
            // Empty Special Traits row
            '.traits .form-group.empty-special-traits',
          ].join(','),
        ),
        lockMode: LockMode.HIDE,
      },
      {
        // Empty trait rows
        elements: [
          ...sheetElem.querySelectorAll<HTMLElement>('.traits .form-group > .traits-list'),
        ].filter((element) => !element.textContent?.trim()),
        lockMode: LockMode.HIDE_PARENTS,
      },
      ...Settings.ShowSpecialTraits.get() ? [] : [this.getConfigureSpecialTraitsRow(sheetElem)],
    ];
  }

  getSensesInput(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input[name="system.traits.senses"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getConfigureSpecialTraitsRow(sheetElem: HTMLElement) {
    return {
      // Special Traits
      elements: sheetElem.querySelectorAll<HTMLElement>('.traits .configure-flags'),
      lockMode: LockMode.HIDE_PARENTS,
    };
  }

  getAddItemButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.inventory-list .item-create'),
      lockMode: LockMode.HIDE,
    };
  }

  getRemoveItemButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.inventory-list .item-delete'),
      lockMode: LockMode.HIDE,
    };
  }

  getEditItemButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.inventory-list .item-edit'),
      lockMode: LockMode.HIDE,
    };
  }

  getItemContextMenus(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.inventory-list .item'),
      lockMode: LockMode.DISABLE_CONTEXT_MENU,
    };
  }

  getAvailableItemFeatureUses(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.item-detail.item-uses > input'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getAvailableSpellSlots(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input[name^="system.spells."][name$=".value"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getMaxSpellSlotOverride(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.slot-max-override'),
      lockMode: LockMode.HIDE,
    };
  }

  getEffectControls(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.effect-control'),
      lockMode: LockMode.HIDE,
    };
  }

  getEffectsTab(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.tabs .item[data-tab="effects"]'),
      lockMode: LockMode.HIDE,
      always: true,
    };
  }

  getSpellbookTab(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.tabs .item[data-tab="spellbook"]'),
      lockMode: LockMode.HIDE,
    };
  }

  getBiographyForHide(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.tabs .item[data-tab="biography"]'),
      lockMode: LockMode.HIDE,
      always: true,
    };
  }

  getUnsorteds(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        elements: sheetElem.querySelectorAll<HTMLElement>(
          [
            'input[name="system.attributes.hp.max"]',
            'input[name="system.attributes.ac.value"]',
            'input[name="system.attributes.speed.value"]',
            'input[name="system.attributes.speed.special"]',
            'input[name="system.attributes.init.value"]',
            'select[name="system.attributes.spellcasting"]',
          ].join(','),
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('.attribute .config-button'),
        lockMode: LockMode.HIDE,
      },
    ];
  }

  showSpecialTraits(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e) {
    if (!Settings.ShowSpecialTraits.get()) {
      return;
    }
    const specialTraitsRow = this.getSpecialTraitsRow(sheetElem);
    if (!specialTraitsRow) {
      return;
    }
    let traitsList: HTMLElement | DocumentFragment;
    if (this.showSpecialTraitsAsUL()) {
      traitsList = document.createElement('ul');
      traitsList.classList.add('traits-list');
    } else {
      traitsList = document.createDocumentFragment();
    }

    for (const [key, flag] of Object.entries(dnd5e.config.characterFlags)) {
      const value = foundry.utils.getProperty(actor, `flags.dnd5e.${key}`);
      if (value && (
        value === true
        || typeof value === 'number'
        || typeof value === 'string'
      )) {
        this.addTag(traitsList, flag.name, value);
      }
    }

    BONUSES.forEach((bonus) => {
      const value = foundry.utils.getProperty(actor.system, bonus.name);
      if (value && (
        value === true
        || typeof value === 'number'
        || typeof value === 'string'
      )) {
        this.addTag(traitsList, bonus.label, value);
      }
    });
    if (traitsList.childElementCount > 0) {
      specialTraitsRow.traitListContainer.appendChild(traitsList);
      specialTraitsRow.row.classList.remove('empty-special-traits');
    } else {
      specialTraitsRow.row.classList.add('empty-special-traits');
    }
  }

  addTag(traitsList: Node, labelLocaleKey: string, value: string | number | true) {
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

  getSpecialTraitsRow(sheetElem: HTMLElement) {
    const flagsToggle = sheetElem.querySelector<HTMLElement>('.traits [data-action="flags"]');
    if (!flagsToggle) {
      return null;
    }
    const row = flagsToggle.parentElement;
    if (!row) {
      return null;
    }
    return {
      row: row,
      traitListContainer: row,
    };
  }
}

const addRemoveClass = (element: HTMLElement, cssClass: string, isAdd: boolean) => {
  if (!element) {
    return;
  }
  if (isAdd) {
    element.classList.add(cssClass);
  } else {
    element.classList.remove(cssClass);
  }
};

type ElementGroup = {
  elements: HTMLElement[] | NodeListOf<HTMLElement>
  lockMode: LockMode
  always?: boolean
};

type ElementCollection = ElementGroup | (ElementGroup | ElementCollection)[];

type LockSetting = boolean | Setting<boolean> | Setting<string>;
const parseLockSetting = (lockSetting: LockSetting) => {
  if (typeof lockSetting === 'boolean') {
    return lockSetting;
  }
  const value = lockSetting.get();
  if (typeof value === 'boolean') {
    return value;
  }
  return !game.user?.hasRole(value);
};

const disableContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

export const lockUnlock = (elementGroups: null | ElementCollection, sheetLocked: boolean, lockSettingInput: LockSetting, isSheetEditable: boolean) => {
  if (!elementGroups) {
    return;
  }
  const lockSetting = parseLockSetting(lockSettingInput);
  if (Array.isArray(elementGroups)) {
    elementGroups.forEach((elementGroup) => {
      lockUnlock(elementGroup, sheetLocked, lockSetting, isSheetEditable);
    });
  } else {
    const { elements, lockMode, always } = elementGroups;
    const lock = (always ? true : sheetLocked) && lockSetting;

    if (isSheetEditable || lock) {
      switch (lockMode) {
        case LockMode.CSS_POINTER_EVENTS:
          elements.forEach((element) => {
            addRemoveClass(element, CSS_NO_POINTER_EVENTS, lock);
          });
          break;
        case LockMode.FORM_DISABLED:
          elements.forEach((element) => {
            (element as HTMLInputElement).disabled = lock;
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
            addRemoveClass(element.parentElement!, CSS_HIDE, lock);
          });
          break;
        case LockMode.CONTENT_EDITABLE:
          elements.forEach((element) => {
            element.setAttribute('contenteditable', (!lock).toString());
          });
          break;
        case LockMode.DISABLE_CONTEXT_MENU:
          elements.forEach((element) => {
            if (lock) {
              element.addEventListener('contextmenu', disableContextMenu, { capture: true });
            } else {
              element.removeEventListener('contextmenu', disableContextMenu, { capture: true });
            }
            element.setAttribute('contenteditable', (!lock).toString());
          });
          break;
        default:
          // Typescript says lockMode is never (which is true, as long as no types were incorrect
          // and nobody added a new LockMode without updating this switch block)
          module.logger.error(`Unexpected lockMode: ${lockMode as string}`);
      }
    }
  }
};

export const isHideReserveSpace = (element: HTMLElement) => element.classList.contains(CSS_HIDE_RESERVE_SPACE);

const faIcon = (name: string) => {
  const icon = document.createElement('i');
  icon.classList.add('fas');
  icon.classList.add('fa-' + name);
  return icon;
};

const stopPropagation = (event: Event) => {
  event.stopPropagation();
};
