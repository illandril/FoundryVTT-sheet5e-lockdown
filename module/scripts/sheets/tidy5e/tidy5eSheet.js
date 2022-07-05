import LockableCharacterSheet from '../lockableCharacterSheet.js';
import { LockMode } from '../lockableSheet.js';
import Settings from '../../settings.js';
import * as Common from './tidy5eCommon.js';

class LockableTidy5eSheet extends LockableCharacterSheet {
  constructor() {
    super('Tidy5eSheet', Settings.DisableTidy5eSheet);
    Hooks.on('renderedTidy5eSheet', (actorSheet) => {
      this.onRenderHook(actorSheet);
    });
  }

  customSheetInitialize(sheetElem, actor, isSheetEditable) {
    super.customSheetInitialize(sheetElem, actor, isSheetEditable);
    const favoritesTarget = sheetElem.querySelector('.favorites-target');
    if (favoritesTarget) {
      const observer = new MutationObserver(() => {
        this.onRender(sheetElem, actor, isSheetEditable);
        observer.disconnect();
      });
      observer.observe(favoritesTarget, { childList: true });
    }
  }

  getNameInput(sheetElem) {
    return [
      {
        elements: sheetElem.querySelectorAll('.character-details .char-name'),
        lockMode: LockMode.CONTENT_EDITABLE,
      },
    ];
  }

  getBasicDetailInputs(sheetElem) {
    return [
      {
        elements: sheetElem.querySelectorAll(
          [
            '.origin-summary [data-target$="-race"]',
            '.origin-summary [data-target$="-background"]',
            '.origin-summary [data-target$="-alignment"]',
          ].join(',')
        ),
        lockMode: LockMode.CONTENT_EDITABLE,
      },
      {
        elements: sheetElem.querySelectorAll('.character-details .actor-size-select'),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
    ];
  }

  getAlignmentForHide(sheetElem) {
    return Common.getAlignmentForHide(sheetElem);
  }

  getBackgroundForHide(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.origin-summary [data-target$="-background"]'),
      lockMode: LockMode.HIDE,
      always: true,
    };
  }

  getRestButtons(sheetElem) {
    return [
      super.getRestButtons(sheetElem),
      {
        elements: sheetElem.querySelectorAll('.resting'),
        lockMode: LockMode.HIDE,
      },
    ];
  }

  getSensesInput(sheetElem) {
    return Common.getSensesInput(sheetElem);
  }

  getConfigureSpecialTraitsRow(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.traits .configure-flags'),
      lockMode: LockMode.HIDE,
    };
  }

  getRemoveItemButtons(sheetElem) {
    return Common.getRemoveItemButtons(super.getRemoveItemButtons(sheetElem), sheetElem);
  }

  getAvailableItemFeatureUses(sheetElem) {
    return Common.getAvailableItemFeatureUses(sheetElem);
  }

  getUnsorteds(sheetElem) {
    return super.getUnsorteds(sheetElem).concat([Common.getSpeedConfigureIcon(sheetElem)]);
  }

  showSpecialTraitsAsUL() {
    return false;
  }

  getSpecialTraitsRow(sheetElem) {
    return Common.getSpecialTraitsRow(sheetElem);
  }

  getEquipItemButtons(sheetElem) {
    return [
      super.getEquipItemButtons(sheetElem),
      {
        elements: sheetElem.querySelectorAll(
          '.favorites .inventory-list > .items-header:first-child:not(.spellbook-header) + .item-list .item-toggle'
        ),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
    ];
  }

  getPrepareSpellButtons(sheetElem) {
    return [
      super.getPrepareSpellButtons(sheetElem),
      {
        elements: sheetElem.querySelectorAll(
          '.favorites .inventory-list > .items-header.spellbook-header + .item-list .item-toggle'
        ),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
    ];
  }
}
new LockableTidy5eSheet();
