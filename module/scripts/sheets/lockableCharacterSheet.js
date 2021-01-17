import Settings from '../settings.js';
import LockableSheet, { LockMode, lockUnlock, isHideReserveSpace } from './lockableSheet.js';

export default class LockableCharacterSheet extends LockableSheet {
  constructor(sheetName, sheetDisabledSetting) {
    super(sheetName, sheetDisabledSetting);
  }

  makeLocked(sheetElem, actor, locked) {
    super.makeLocked(sheetElem, actor, locked);

    // Basic Details section
    lockUnlock(this.getXPInputs(sheetElem), locked, Settings.LockXP);
    lockUnlock(this.getBackgroundForHide(sheetElem), locked, Settings.HideBackground);

    // Attributes
    lockUnlock(this.getResourceNameAndMaxInputs(sheetElem, actor), locked, Settings.LockResources);
    this.hideUnusedResources(sheetElem, actor, locked && Settings.LockResources.get());

    // Inventory
    lockUnlock(this.getCurrencyInputs(sheetElem), locked, Settings.LockCurrency);
    lockUnlock(this.getEquipItemButtons(sheetElem), locked, Settings.LockEquipItemButtons);

    // Spellbook
    lockUnlock(
      this.getPrepareSpellButtons(sheetElem),
      locked,
      Settings.LockPrepareSpellButtons.get()
    );
  }

  getXPInputs(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name="data.details.xp.value"]'),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getBackgroundForHide(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('input[name="data.details.background"]'),
      lockMode: LockMode.HIDE_PARENTS,
      always: true,
    };
  }

  getResources(actor) {
    return Object.keys(actor.data.data.resources);
  }

  getResourceNameAndMaxInputs(sheetElem, actor) {
    const elementSelectors = [];
    this.getResources(actor).forEach((resource) => {
      elementSelectors.push(this.getResourceNameSelector(resource));
      elementSelectors.push('input[name="data.resources.' + resource + '.max"]');
      elementSelectors.push('input[name="data.resources.' + resource + '.sr"]');
      elementSelectors.push('input[name="data.resources.' + resource + '.lr"]');
    });
    return {
      elements: sheetElem.querySelectorAll(elementSelectors.join(',')),
      lockMode: LockMode.FORM_DISABLED,
    };
  }

  getResourceNameSelector(resource) {
    return 'input[name="data.resources.' + resource + '.label"]';
  }

  hideUnusedResources(sheetElem, actor, hideIfUnused) {
    let resourcesContainer = null;
    this.getResources(actor).forEach((resource) => {
      const resourceContainer = this.getResourceContainer(sheetElem, resource);
      if (!resourceContainer) {
        return;
      }
      if (!resourcesContainer) {
        resourcesContainer = resourceContainer.elements[0].parentNode;
      }
      const name = getProperty(actor, 'data.data.resources.' + resource + '.label');
      const max = getProperty(actor, 'data.data.resources.' + resource + '.max');
      const noResource = !name && max < 1;
      lockUnlock(resourceContainer, hideIfUnused, noResource);
    });
    let allHidden = true;
    if (resourcesContainer && resourcesContainer.classList.contains('attributes')) {
      const resourceContainers = resourcesContainer.children;
      const allHidden = Array.prototype.every.call(resourceContainers, isHideReserveSpace);
      const resourcesContainerAndLockMode = {
        elements: [resourcesContainer],
        lockMode: LockMode.HIDE,
      };
      lockUnlock(resourcesContainerAndLockMode, hideIfUnused, allHidden);
    }
  }

  getResourceContainer(sheetElem, resource) {
    const labelInput = document.querySelector(this.getResourceNameSelector(resource));
    let labelContainer = labelInput;
    while (labelContainer && !labelContainer.classList.contains('resource')) {
      labelContainer = labelContainer.parentNode;
    }
    if (labelContainer) {
      return {
        elements: [labelContainer],
        lockMode: LockMode.HIDE_RESERVE_SPACE,
      };
    } else {
      return null;
    }
  }

  getCurrencyInputs(sheetElem) {
    return [
      {
        elements: sheetElem.querySelectorAll('input[name^="data.currency."]'),
        lockMode: LockMode.FORM_DISABLED,
      },
      {
        elements: sheetElem.querySelectorAll('.currency-convert'),
        lockMode: LockMode.HIDE,
        always: true,
      },
    ];
  }

  getEquipItemButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.tab.inventory .inventory-list .item-toggle'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }

  getPrepareSpellButtons(sheetElem) {
    return {
      elements: sheetElem.querySelectorAll('.tab.spellbook .inventory-list .item-toggle'),
      lockMode: LockMode.CSS_POINTER_EVENTS,
    };
  }
}
