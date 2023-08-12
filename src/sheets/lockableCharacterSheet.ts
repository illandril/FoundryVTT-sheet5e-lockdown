import * as Settings from '../settings';
import LockableSheet, { LockMode, lockUnlock, isHideReserveSpace } from './lockableSheet';

export default class LockableCharacterSheet extends LockableSheet {
  constructor(sheetName: string) {
    super(sheetName);
  }

  makeLocked(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, locked: boolean, isSheetEditable: boolean) {
    super.makeLocked(sheetElem, actor, locked, isSheetEditable);

    // Basic Details section
    lockUnlock(this.getXPInputs(sheetElem), locked, Settings.LockXP, isSheetEditable);
    lockUnlock(
      this.getBackgroundForHide(sheetElem),
      locked,
      Settings.ShowBackgroundRole,
      isSheetEditable,
    );
    lockUnlock(this.getRestButtons(sheetElem), locked, Settings.LockRests, isSheetEditable);

    // Attributes
    lockUnlock(
      this.getResourceNameAndMaxInputs(sheetElem, actor),
      locked,
      Settings.LockResources,
      isSheetEditable,
    );
    this.hideUnusedResources(
      sheetElem,
      actor,
      locked && Settings.LockResources.get(),
      isSheetEditable,
    );

    // Inventory
    lockUnlock(this.getCurrencyInputs(sheetElem), locked, Settings.LockCurrency, isSheetEditable);
    lockUnlock(
      this.getEquipItemButtons(sheetElem),
      locked,
      Settings.LockEquipItemButtons,
      isSheetEditable,
    );
    lockUnlock(
      this.getAttunementOverride(sheetElem),
      locked,
      Settings.LockAttunementOverride,
      isSheetEditable,
    );

    // Spellbook
    lockUnlock(
      this.getPrepareSpellButtons(sheetElem),
      locked,
      Settings.LockPrepareSpellButtons.get(),
      isSheetEditable,
    );
  }

  getXPInputs(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>([
        'input[name="system.details.xp.value"]',
        'select.level-selector',
      ].join(',')),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getRestButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('a.rest'),
      lockMode: LockMode.HIDE,
    };
  }

  getBackgroundForHide(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('input[name="system.details.background"]'),
      lockMode: LockMode.HIDE_PARENTS,
      always: true,
    };
  }

  getResources(actor: dnd5e.documents.Actor5e) {
    return 'resources' in actor.system && actor.system.resources ? Object.keys(actor.system.resources) : [];
  }

  getResourceNameAndMaxInputs(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e) {
    const elementSelectors: string[] = [];
    this.getResources(actor).forEach((resource) => {
      elementSelectors.push(this.getResourceNameSelector(resource));
      elementSelectors.push(`input[name="system.resources.${resource}.max"]`);
      elementSelectors.push(`input[name="system.resources.${resource}.sr"]`);
      elementSelectors.push(`input[name="system.resources.${resource}.lr"]`);
    });
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>(elementSelectors.join(',')),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getResourceNameSelector(resource: string) {
    return `input[name="system.resources.${resource}.label"]`;
  }

  hideUnusedResources(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, hideIfUnused: boolean, isSheetEditable: boolean) {
    let resourcesContainer: HTMLElement | null = null;
    for (const resource of this.getResources(actor)) {
      const resourceContainer = this.getResourceContainer(sheetElem, resource);
      if (!resourceContainer) {
        return;
      }
      if (!resourcesContainer) {
        resourcesContainer = resourceContainer.elements[0].parentElement;
      }
      const name = foundry.utils.getProperty(actor.system, `resources.${resource}.label`);
      const max = foundry.utils.getProperty(actor.system, `resources.${resource}.max`);
      const noResource = !name && !(typeof max === 'number' && max > 0);
      lockUnlock(resourceContainer, hideIfUnused, noResource, isSheetEditable);
    }
    if (resourcesContainer && resourcesContainer.classList.contains('attributes')) {
      const resourceContainers = resourcesContainer.children;
      const allHidden = Array.prototype.every.call(resourceContainers, isHideReserveSpace);
      const resourcesContainerAndLockMode = {
        elements: [resourcesContainer],
        lockMode: LockMode.HIDE,
      };
      lockUnlock(resourcesContainerAndLockMode, hideIfUnused, allHidden, isSheetEditable);
    }
  }

  getResourceContainer(sheetElem: HTMLElement, resource: string) {
    const labelInput = sheetElem.querySelector<HTMLElement>(this.getResourceNameSelector(resource));
    let labelContainer = labelInput;
    while (labelContainer && !labelContainer.classList.contains('resource')) {
      labelContainer = labelContainer.parentElement;
    }
    if (labelContainer) {
      return {
        elements: [labelContainer],
        lockMode: LockMode.HIDE_RESERVE_SPACE,
      };
    }
    return null;
  }

  getCurrencyInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('input[name^="system.currency."]'),
        lockMode: LockMode.FORM_DISABLED,
      },
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('.currency-convert'),
        lockMode: LockMode.HIDE,
      },
    ];
  }

  getEquipItemButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.tab.inventory .inventory-list .item-toggle'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }

  getAttunementOverride(sheetElem: HTMLElement) {
    return [
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('.attunement-max-override'),
        lockMode: LockMode.HIDE,
      },
      {
        elements: sheetElem.querySelectorAll<HTMLElement>('input[name="system.attributes.attunement.max"]'),
        lockMode: LockMode.FORM_DISABLED,
      },
    ];
  }

  getPrepareSpellButtons(sheetElem: HTMLElement) {
    return {
      elements: sheetElem.querySelectorAll<HTMLElement>('.tab.spellbook .inventory-list .item-toggle'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }
}
