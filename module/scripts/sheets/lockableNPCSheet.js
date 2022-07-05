import Settings from '../settings.js';
import { log } from '../module.js';

import LockableSheet, { LockMode, lockUnlock } from './lockableSheet.js';

export default class LockableNPCSheet extends LockableSheet {
  constructor(sheetName, sheetDisabledSetting) {
    super(sheetName, sheetDisabledSetting);
  }

  makeLocked(sheetElem, actor, locked, isSheetEditable) {
    super.makeLocked(sheetElem, actor, locked, isSheetEditable);

    // Basic Details section
    // CR/Type/Source included in BasicDetails
    // TODO: Optionally hide Source

    // Attributes
    lockUnlock(
      this.getLegendaryAndLairActions(sheetElem),
      locked,
      Settings.LockLegendaryAndLair,
      isSheetEditable
    );
    this.hideLegendaryAndLairRows(
      sheetElem,
      actor,
      locked && Settings.LockLegendaryAndLair.get(),
      isSheetEditable
    );
  }

  getBasicDetailInputs(sheetElem) {
    // Override of super
    return [
      super.getBasicDetailInputs(sheetElem),
      {
        elements: sheetElem.querySelectorAll(
          [
            'input[name="data.details.type"]',
            'input[name="data.details.source"]',
            'input[name="data.details.cr"]',
          ].join(',')
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }

  getLegendaryAndLairActions(sheetElem) {
    return [
      {
        elements: sheetElem.querySelectorAll(
          [
            'input[name="data.resources.legact.max"]',
            'input[name="data.resources.legres.max"]',
            'input[name="data.resources.lair.value"]',
            'input[name="data.resources.lair.initiative"]',
          ].join(',')
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }

  hideLegendaryAndLairRows(sheetElem, actor, hideIfUnused, isSheetEditable) {
    const maxLegendaryActions = getProperty(actor, 'data.data.resources.legact.max');
    const noLegendaryActions = maxLegendaryActions < 1;
    lockUnlock(
      this.getLegendaryActionsRow(sheetElem),
      hideIfUnused,
      noLegendaryActions,
      isSheetEditable
    );

    const maxLegendaryResistances = getProperty(actor, 'data.data.resources.legres.max');
    const noLegendaryResistance = maxLegendaryResistances < 1;
    lockUnlock(
      this.getLegendaryResistanceRow(sheetElem),
      hideIfUnused,
      noLegendaryResistance,
      isSheetEditable
    );

    const usesLairActions = getProperty(actor, 'data.data.resources.lair.value');
    const noLairActions = !usesLairActions;
    lockUnlock(this.getLairActionsRow(sheetElem), hideIfUnused, noLairActions, isSheetEditable);
  }

  getLegendaryActionsRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="data.resources.legact.max"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLegendaryResistanceRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="data.resources.legres.max"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLairActionsRow(sheetElem) {
    const input = sheetElem.querySelector('input[name="data.resources.lair.value"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentNode;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getUnsorteds(sheetElem) {
    // Override of super
    return [
      super.getUnsorteds(sheetElem),
      {
        elements: sheetElem.querySelectorAll(
          [
            'input[name="data.attributes.hp.formula"]',
            'input[name="data.details.spellLevel"]',
          ].join(',')
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
      {
        elements: sheetElem.querySelectorAll('.attribute.health .attribute-name.rollable'),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
    ];
  }
}
