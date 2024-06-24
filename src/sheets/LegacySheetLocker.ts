import module from '../module';
import * as Settings from '../settings';
import ActorBonuses from '../utils/ActorBonuses';
import { addRemoveClass, faIcon, qs, qsa, stopPropagation } from '../utils/html';
import isEffectsEmpty from '../utils/isEffectsEmpty';
import isSpellbookEmpty from '../utils/isSpellbookEmpty';
import SheetLocker from './SheetLocker';
import lockUnlock, { type ElementCollection, LockMode } from './lockUnlock';

const CSS_TOGGLE_EDIT_ON = module.cssPrefix.child('toggleEditOn');
const CSS_TOGGLE_EDIT_OFF = module.cssPrefix.child('toggleEditOff');
const CSS_HIDE_IMPORT_BUTTONS = module.cssPrefix.child('hideImportButtons');

export default class LegacySheetLocker extends SheetLocker<dnd5e.applications.actor.ActorSheet5e> {
  constructor(
    public readonly sheetName: string,
    public readonly isLegacySheet: boolean,
  ) {
    super(sheetName, isLegacySheet, dnd5e.applications.actor.ActorSheet5e);
  }

  onInitialize(sheet: ActorSheet<dnd5e.documents.Actor5e>, sheetElem: HTMLElement) {
    const isSheetEditable = sheet.isEditable;
    if (isSheetEditable && game.user?.hasRole(Settings.ShowToggleEditRole.get())) {
      const sheetHeader = qs(sheetElem, '.window-header');
      if (!sheetHeader) {
        module.logger.error('window-header not found in sheet');
        return;
      }
      const sheetTitle = qs(sheetHeader, '.window-title');
      if (!sheetTitle) {
        module.logger.error('window-title not found in window-header');
        return;
      }

      const editOnLink = document.createElement('a');
      editOnLink.classList.add(CSS_TOGGLE_EDIT_ON);
      editOnLink.addEventListener(
        'click',
        () => {
          this.setIsLocked(sheet, false);
          this.onUpdate(sheet, sheetElem);
        },
        false,
      );
      editOnLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editOnLink, sheetTitle.nextSibling);

      const editOffLink = document.createElement('a');
      editOffLink.classList.add(CSS_TOGGLE_EDIT_OFF);
      editOffLink.addEventListener(
        'click',
        () => {
          this.setIsLocked(sheet, true);
          this.onUpdate(sheet, sheetElem);
        },
        false,
      );
      editOffLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editOffLink, sheetTitle.nextSibling);

      const toggleStyle = Settings.LockToggleStyle.get();
      if (toggleStyle !== 'labelOnly') {
        editOnLink.appendChild(faIcon('lock'));
        editOffLink.appendChild(faIcon('unlock'));
      }

      let labelKeyType: '' | 'Short' | null;
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

  onUpdate(sheet: ActorSheet<dnd5e.documents.Actor5e>, sheetElem: HTMLElement) {
    this.showSpecialTraits(sheetElem, sheet.actor);
    this.makeLocked(sheetElem, sheet.actor, this.isLocked(sheet), sheet.isEditable);
  }

  makeLocked(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, locked: boolean, isSheetEditable: boolean) {
    module.logger.debug(`Make Locked? ${locked.toString()} (${this.sheetName})`);

    // Import buttons are added in by other modules, and might have their hooks fire after this one,
    // so we hide them via CSS rules instead
    // TODO: Make this configurable?
    addRemoveClass(sheetElem, CSS_HIDE_IMPORT_BUTTONS, locked);

    // Basic Details section
    lockUnlock(this.getNameInput(sheetElem), locked, Settings.LockName, isSheetEditable);
    lockUnlock(this.getBasicDetailInputs(sheetElem), locked, Settings.LockBasicDetails, isSheetEditable);
    lockUnlock(this.getAlignmentForHide(sheetElem), locked, Settings.ShowAlignmentRole, isSheetEditable);

    // Attributes
    lockUnlock(this.getAbilityScoreInputs(sheetElem), locked, Settings.LockAbilityScores, isSheetEditable);
    lockUnlock(this.getProficiencyToggles(sheetElem), locked, Settings.LockProficiencies, isSheetEditable);
    lockUnlock(this.getTraits(sheetElem), locked, Settings.LockTraits, isSheetEditable);

    // Inventory + Features + Spellbook
    lockUnlock(this.getAddItemButtons(sheetElem), locked, Settings.HideAddItemButtons, isSheetEditable);
    lockUnlock(this.getRemoveItemButtons(sheetElem), locked, Settings.HideRemoveItemButtons, isSheetEditable);
    lockUnlock(this.getEditItemButtons(sheetElem), locked, Settings.HideEditItemButtons, isSheetEditable);
    lockUnlock(this.getItemContextMenus(sheetElem), locked, Settings.DisableItemContextMenu, isSheetEditable);

    // Features
    lockUnlock(
      this.getAvailableItemFeatureUses(sheetElem),
      locked,
      Settings.LockAvailableItemFeatureUses,
      isSheetEditable,
    );

    // Spellbook
    lockUnlock(this.getAvailableSpellSlots(sheetElem), locked, Settings.LockAvailableSpellSlots, isSheetEditable);
    lockUnlock(this.getMaxSpellSlotOverride(sheetElem), locked, Settings.LockMaxSpellSlotOverride, isSheetEditable);
    const hideEmptySpellbook = locked && (Settings.HideAddItemButtons.get() || Settings.HideEmptySpellbook.get());
    const isSpellbookEmptyAndHidden = hideEmptySpellbook && isSpellbookEmpty(actor);
    lockUnlock(this.getSpellbookTab(sheetElem), hideEmptySpellbook, isSpellbookEmptyAndHidden, isSheetEditable);

    // Effects
    lockUnlock(this.getEffectControls(sheetElem), locked, Settings.LockEffects, isSheetEditable);
    const hideEmptyEffects = locked && Settings.LockEffects.get();
    const isEffectsEmptyAndHidden = hideEmptyEffects && isEffectsEmpty(actor);
    lockUnlock(
      this.getEffectsTab(sheetElem),
      locked,
      isEffectsEmptyAndHidden || Settings.ShowEffectsRole,
      isSheetEditable,
    );

    // Biography
    lockUnlock(this.getBiographyForHide(sheetElem), locked, Settings.ShowBiographyRole, isSheetEditable);

    // Unsorted stuff
    lockUnlock(this.getUnsorteds(sheetElem), locked, Settings.LockUnsorteds, isSheetEditable);
    module.logger.debug('Make Locked Complete');
  }

  getNameInput(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, 'input[name="name"]'),
      lockMode: LockMode.FormDisabled,
    };
  }

  getBasicDetailInputs(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, [
        'input[name="system.details.race"]',
        'input[name="system.details.background"]',
        'input[name="system.details.alignment"]',
        'select.actor-size',
      ]),
      lockMode: LockMode.FormDisabled,
    };
  }

  getAlignmentForHide(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, 'input[name="system.details.alignment"]'),
      lockMode: LockMode.HideParent,
      always: true,
    };
  }

  getAbilityScoreInputs(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, 'input.ability-score'),
      lockMode: LockMode.FormDisabled,
    };
  }

  getProficiencyToggles(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        // Proficiency toggles
        elements: qsa(sheetElem, '.proficiency-toggle'),
        lockMode: LockMode.PointerEvents,
      },
      {
        elements: qsa(sheetElem, [
          // Saving throw proficiency configure button
          '.config-button[data-action="ability"]',

          // Skill proficiency configure button
          '.config-button[data-action="skill"]',
        ]),
        lockMode: LockMode.Hide,
      },
    ];
  }

  getTraits(sheetElem: HTMLElement): ElementCollection {
    return [
      this.getSensesInput(sheetElem),
      {
        elements: qsa(sheetElem, [
          // Trait edit icons
          '.trait-selector',
          // Trait config icons
          '.traits .config-button',
          // Empty trait rows (this only matches some... so use the more complicated selector below instead)
          // '.traits .form-group.inactive',
          // Empty Special Traits row
          '.traits .form-group.empty-special-traits',
        ]),
        lockMode: LockMode.Hide,
      },
      {
        // Empty trait rows
        elements: [...qsa(sheetElem, '.traits .form-group > .traits-list')].filter(
          (element) => !element.textContent?.trim(),
        ),
        lockMode: LockMode.HideParent,
      },
      ...(Settings.ShowSpecialTraits.get() ? [] : [this.getConfigureSpecialTraitsRow(sheetElem)]),
    ];
  }

  getSensesInput(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, 'input[name="system.traits.senses"]'),
      lockMode: LockMode.FormDisabled,
    };
  }

  getConfigureSpecialTraitsRow(sheetElem: HTMLElement): ElementCollection {
    return {
      // Special Traits
      elements: qsa(sheetElem, '.traits .configure-flags'),
      lockMode: LockMode.HideParent,
    };
  }

  getAddItemButtons(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        // Pre-3.0.0
        elements: qsa(sheetElem, '.inventory-list .item-create'),
        lockMode: LockMode.Hide,
      },
      {
        // 3.0.0 Legacy Sheet
        elements: qsa(sheetElem, '.inventory-list .item-action[data-action="create"]'),
        lockMode: LockMode.Hide,
      },
    ];
  }

  getRemoveItemButtons(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        // Pre-3.0.0
        elements: qsa(sheetElem, '.inventory-list .item-delete'),
        lockMode: LockMode.Hide,
      },
      {
        // 3.0.0 Legacy Sheet
        elements: qsa(sheetElem, '.inventory-list .item-action[data-action="delete"]'),
        lockMode: LockMode.Hide,
      },
    ];
  }

  getEditItemButtons(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        // Pre-3.0.0
        elements: qsa(sheetElem, '.inventory-list .item-edit'),
        lockMode: LockMode.Hide,
      },
      {
        // 3.0.0 Legacy Sheet
        elements: qsa(sheetElem, '.inventory-list .item-action[data-action="edit"]'),
        lockMode: LockMode.Hide,
      },
    ];
  }

  getItemContextMenus(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.inventory-list .item'),
      lockMode: LockMode.DisableContextMenu,
    };
  }

  getAvailableItemFeatureUses(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.item-detail.item-uses > input'),
      lockMode: LockMode.FormDisabled,
    };
  }

  getAvailableSpellSlots(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, 'input[name^="system.spells."][name$=".value"]'),
      lockMode: LockMode.FormDisabled,
    };
  }

  getMaxSpellSlotOverride(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.slot-max-override'),
      lockMode: LockMode.Hide,
    };
  }

  getEffectControls(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.effect-control'),
      lockMode: LockMode.Hide,
    };
  }

  getEffectsTab(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.tabs .item[data-tab="effects"]'),
      lockMode: LockMode.Hide,
      always: true,
    };
  }

  getSpellbookTab(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.tabs .item[data-tab="spellbook"]'),
      lockMode: LockMode.Hide,
    };
  }

  getBiographyForHide(sheetElem: HTMLElement): ElementCollection {
    return {
      elements: qsa(sheetElem, '.tabs .item[data-tab="biography"]'),
      lockMode: LockMode.Hide,
      always: true,
    };
  }

  getUnsorteds(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        elements: qsa(sheetElem, [
          'input[name="system.attributes.hp.max"]',
          'input[name="system.attributes.ac.value"]',
          'input[name="system.attributes.speed.value"]',
          'input[name="system.attributes.speed.special"]',
          'input[name="system.attributes.init.value"]',
          'select[name="system.attributes.spellcasting"]',
        ]),
        lockMode: LockMode.FormDisabled,
      },
      {
        elements: qsa(sheetElem, '.attribute .config-button'),
        lockMode: LockMode.Hide,
      },
    ];
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Legacy
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
      if (value && (value === true || typeof value === 'number' || typeof value === 'string')) {
        this.addTag(traitsList, flag.name, value);
      }
    }

    for (const bonus of ActorBonuses) {
      const value = foundry.utils.getProperty(actor.system, bonus.name);
      if (value && (value === true || typeof value === 'number' || typeof value === 'string')) {
        this.addTag(traitsList, bonus.label, value);
      }
    }
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
    const tagElem = this.showSpecialTraitsAsUL() ? document.createElement('li') : document.createElement('span');
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
    const flagsToggle = qs(sheetElem, '.traits [data-action="flags"]');
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
