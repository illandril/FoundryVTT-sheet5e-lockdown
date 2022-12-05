import LockableNPCSheet from '../lockableNPCSheet.js';
import { LockMode } from '../lockableSheet.js';
import Settings from '../../settings.js';
import * as Common from './tidy5eCommon.js';

class LockableTidy5eNPC extends LockableNPCSheet {
  constructor() {
    super('Tidy5eNPC', Settings.DisableTidy5eSheet);
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
            '.origin-summary [data-target$="-alignment"]',
            '.origin-summary [data-target$="-type"]',
            '.origin-summary [data-target$="-source"]',
            '.origin-summary [data-target$="-environment"]',
            '.origin-summary [data-target$="-cr"]',
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

  getSensesInput(sheetElem) {
    return Common.getSensesInput(sheetElem);
  }

  getConfigureSpecialTraitsRow(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll(
        ['.traits .configure-flags', '.traits .toggle-traits'].join(',')
      ),
      lockMode: LockMode.HIDE,
    };
  }

  getRemoveItemButtons(sheetElem) {
    return Common.getRemoveItemButtons(super.getRemoveItemButtons(sheetElem), sheetElem);
  }

  getAvailableItemFeatureUses(sheetElem) {
    return Common.getAvailableItemFeatureUses(sheetElem);
  }

  getSpellbookTab(sheetElem) {
    return {
      elements: [
        sheetElem.querySelector('.spellbook-title'),
        sheetElem.querySelector('.spellbook-title + .inventory-list'),
        sheetElem.querySelector('.spellcasting-ability'),
      ],
      lockMode: LockMode.HIDE,
    };
  }

  getLegendaryActionsRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="system.resources.legact.max"]');
    let row = input;
    while (row && !row.classList.contains('counter')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLegendaryResistanceRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="system.resources.legres.max"]');
    let row = input;
    while (row && !row.classList.contains('counter')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLairActionsRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="system.resources.lair.value"]');
    let row = input;
    while (row && !row.classList.contains('counter')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
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
}
new LockableTidy5eNPC();
