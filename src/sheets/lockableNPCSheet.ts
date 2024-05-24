import * as Settings from '../settings';
import LockableSheet, { LockMode, lockUnlock } from './lockableSheet.js';

export default class LockableNPCSheet extends LockableSheet {
  makeLocked(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, locked: boolean, isSheetEditable: boolean) {
    super.makeLocked(sheetElem, actor, locked, isSheetEditable);

    // Basic Details section
    // CR/Type/Source included in BasicDetails
    // TODO: Optionally hide Source

    // Attributes
    lockUnlock(this.getLegendaryAndLairActions(sheetElem), locked, Settings.LockLegendaryAndLair, isSheetEditable);
    this.hideLegendaryAndLairRows(sheetElem, actor, locked && Settings.LockLegendaryAndLair.get(), isSheetEditable);
  }

  getBasicDetailInputs(sheetElem: HTMLElement) {
    // Override of super
    return [
      super.getBasicDetailInputs(sheetElem),
      {
        elements: sheetElem.querySelectorAll<HTMLElement>(
          [
            'input[name="system.details.type"]',
            'input[name="system.details.source"]',
            'input[name="system.details.cr"]',
          ].join(','),
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }

  getLegendaryAndLairActions(sheetElem: HTMLElement) {
    return [
      {
        elements: sheetElem.querySelectorAll<HTMLElement>(
          [
            'input[name="system.resources.legact.max"]',
            'input[name="system.resources.legres.max"]',
            'input[name="system.resources.lair.value"]',
            'input[name="system.resources.lair.initiative"]',
          ].join(','),
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }

  hideLegendaryAndLairRows(
    sheetElem: HTMLElement,
    actor: dnd5e.documents.Actor5e,
    hideIfUnused: boolean,
    isSheetEditable: boolean,
  ) {
    const maxLegendaryActions = foundry.utils.getProperty(actor.system, 'resources.legact.max');
    const noLegendaryActions = !(typeof maxLegendaryActions === 'number' && maxLegendaryActions > 0);
    lockUnlock(this.getLegendaryActionsRow(sheetElem), hideIfUnused, noLegendaryActions, isSheetEditable);

    const maxLegendaryResistances = foundry.utils.getProperty(actor.system, 'resources.legres.max');
    const noLegendaryResistance = !(typeof maxLegendaryResistances === 'number' && maxLegendaryResistances > 0);
    lockUnlock(this.getLegendaryResistanceRow(sheetElem), hideIfUnused, noLegendaryResistance, isSheetEditable);

    const usesLairActions = foundry.utils.getProperty(actor.system, 'resources.lair.value');
    const noLairActions = !usesLairActions;
    lockUnlock(this.getLairActionsRow(sheetElem), hideIfUnused, noLairActions, isSheetEditable);
  }

  getLegendaryActionsRow(sheetElem: HTMLElement) {
    const input = sheetElem.querySelector<HTMLElement>('input[name="system.resources.legact.max"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentElement;
    }
    if (!row) {
      return null;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLegendaryResistanceRow(sheetElem: HTMLElement) {
    const input = sheetElem.querySelector<HTMLElement>('input[name="system.resources.legres.max"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentElement;
    }
    if (!row) {
      return null;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getLairActionsRow(sheetElem: HTMLElement) {
    const input = sheetElem.querySelector<HTMLElement>('input[name="system.resources.lair.value"]');
    let row = input;
    while (row && !row.classList.contains('flexrow')) {
      row = row.parentElement;
    }
    if (!row) {
      return null;
    }
    return {
      elements: [row],
      lockMode: LockMode.HIDE,
    };
  }

  getUnsorteds(sheetElem: HTMLElement) {
    // Override of super
    return [
      super.getUnsorteds(sheetElem),
      {
        elements: sheetElem.querySelectorAll<HTMLElement>(
          ['input[name="system.attributes.hp.formula"]', 'input[name="system.details.spellLevel"]'].join(','),
        ),
        lockMode: LockMode.FORM_DISABLED,
      },
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('.attribute.health .attribute-name.rollable'),
        lockMode: LockMode.CSS_POINTER_EVENTS,
      },
    ];
  }
}
