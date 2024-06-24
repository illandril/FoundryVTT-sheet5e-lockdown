import * as Settings from '../../settings';
import { qs, qsa } from '../../utils/html';
import LegacySheetLocker from '../LegacySheetLocker';
import lockUnlock, { LockMode, isHideReserveSpace } from '../lockUnlock';

class ActorSheet5eCharacterLocker extends LegacySheetLocker {
  constructor() {
    super('ActorSheet5eCharacter', true);
  }

  makeLocked(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e, locked: boolean, isSheetEditable: boolean) {
    super.makeLocked(sheetElem, actor, locked, isSheetEditable);

    this.makeLockedBasicDetails(sheetElem, actor, locked, isSheetEditable);
    this.makeLockedAttributes(sheetElem, actor, locked, isSheetEditable);
    this.makeLockedInventory(sheetElem, actor, locked, isSheetEditable);
    this.makeLockedSpellbook(sheetElem, actor, locked, isSheetEditable);
  }

  private makeLockedBasicDetails(
    sheetElem: HTMLElement,
    _actor: dnd5e.documents.Actor5e,
    locked: boolean,
    isSheetEditable: boolean,
  ) {
    lockUnlock(this.getXPInputs(sheetElem), locked, Settings.LockXP, isSheetEditable);
    lockUnlock(this.getBackgroundForHide(sheetElem), locked, Settings.ShowBackgroundRole, isSheetEditable);
    lockUnlock(this.getRestButtons(sheetElem), locked, Settings.LockRests, isSheetEditable);
  }

  private makeLockedAttributes(
    sheetElem: HTMLElement,
    actor: dnd5e.documents.Actor5e,
    locked: boolean,
    isSheetEditable: boolean,
  ) {
    lockUnlock(this.getResourceNameAndMaxInputs(sheetElem, actor), locked, Settings.LockResources, isSheetEditable);
    this.hideUnusedResources(sheetElem, actor, locked && Settings.LockResources.get(), isSheetEditable);

    lockUnlock(this.getResourceForHide(sheetElem, 'primary'), locked, Settings.ShowResource1Role, isSheetEditable);
    lockUnlock(this.getResourceForHide(sheetElem, 'secondary'), locked, Settings.ShowResource2Role, isSheetEditable);
    lockUnlock(this.getResourceForHide(sheetElem, 'tertiary'), locked, Settings.ShowResource3Role, isSheetEditable);

    lockUnlock(this.getDeathSaveInputs(sheetElem), locked, Settings.LockDeathSaves, isSheetEditable);
    lockUnlock(this.getExhaustionInputs(sheetElem), locked, Settings.LockExhaustion, isSheetEditable);
    lockUnlock(this.getInspirationInputs(sheetElem), locked, Settings.LockInspiration, isSheetEditable);
  }

  private makeLockedInventory(
    sheetElem: HTMLElement,
    _actor: dnd5e.documents.Actor5e,
    locked: boolean,
    isSheetEditable: boolean,
  ) {
    lockUnlock(this.getCurrencyInputs(sheetElem), locked, Settings.LockCurrency, isSheetEditable);
    lockUnlock(this.getEquipItemButtons(sheetElem), locked, Settings.LockEquipItemButtons, isSheetEditable);
    lockUnlock(this.getAttunementOverride(sheetElem), locked, Settings.LockAttunementOverride, isSheetEditable);
    lockUnlock(this.getInventoryQuantityInputs(sheetElem), locked, Settings.LockInventoryQuantity, isSheetEditable);
  }

  private makeLockedSpellbook(
    sheetElem: HTMLElement,
    _actor: dnd5e.documents.Actor5e,
    locked: boolean,
    isSheetEditable: boolean,
  ) {
    lockUnlock(this.getPrepareSpellButtons(sheetElem), locked, Settings.LockPrepareSpellButtons.get(), isSheetEditable);
  }

  getXPInputs(sheetElem: HTMLElement) {
    return {
      elements: qsa(sheetElem, ['input[name="system.details.xp.value"]', 'select.level-selector']),
      lockMode: LockMode.FormDisabled,
    };
  }

  getRestButtons(sheetElem: HTMLElement) {
    return {
      elements: qsa(sheetElem, 'a.rest'),
      lockMode: LockMode.Hide,
    };
  }

  getBackgroundForHide(sheetElem: HTMLElement) {
    return {
      elements: qsa(sheetElem, 'input[name="system.details.background"]'),
      lockMode: LockMode.HideParent,
      always: true,
    };
  }

  getResources(actor: dnd5e.documents.Actor5e) {
    return 'resources' in actor.system && actor.system.resources ? Object.keys(actor.system.resources) : [];
  }

  getResourceNameAndMaxInputs(sheetElem: HTMLElement, actor: dnd5e.documents.Actor5e) {
    const elementSelectors: string[] = [];
    for (const resource of this.getResources(actor)) {
      elementSelectors.push(this.getResourceNameSelector(resource));
      elementSelectors.push(`input[name="system.resources.${resource}.max"]`);
      elementSelectors.push(`input[name="system.resources.${resource}.sr"]`);
      elementSelectors.push(`input[name="system.resources.${resource}.lr"]`);
    }
    return {
      elements: qsa(sheetElem, elementSelectors),
      lockMode: LockMode.FormDisabled,
    };
  }

  getResourceNameSelector(resource: string) {
    return `input[name="system.resources.${resource}.label"]`;
  }

  hideUnusedResources(
    sheetElem: HTMLElement,
    actor: dnd5e.documents.Actor5e,
    hideIfUnused: boolean,
    isSheetEditable: boolean,
  ) {
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
    if (resourcesContainer?.classList.contains('attributes')) {
      const resourceContainers = resourcesContainer.children;
      const allHidden = Array.prototype.every.call(resourceContainers, isHideReserveSpace);
      const resourcesContainerAndLockMode = {
        elements: [resourcesContainer],
        lockMode: LockMode.Hide,
      };
      lockUnlock(resourcesContainerAndLockMode, hideIfUnused, allHidden, isSheetEditable);
    }
  }

  getResourceForHide(sheetElem: HTMLElement, resource: string) {
    const container = this.getResourceContainer(sheetElem, resource);
    if (container) {
      return {
        ...container,
        lockMode: LockMode.Hide,
        always: true,
      };
    }
    return null;
  }

  getResourceContainer(sheetElem: HTMLElement, resource: string) {
    const labelInput = qs(sheetElem, this.getResourceNameSelector(resource));
    let labelContainer = labelInput;
    while (labelContainer && !labelContainer.classList.contains('resource')) {
      labelContainer = labelContainer.parentElement;
    }
    if (labelContainer) {
      return {
        elements: [labelContainer],
        lockMode: LockMode.HideReserveSpace,
      };
    }
    return null;
  }

  getCurrencyInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, 'input[name^="system.currency."]'),
        lockMode: LockMode.FormDisabled,
      },
      {
        // Pre-3.0.0 Convert Button
        elements: qsa(sheetElem, '.currency-convert'),
        lockMode: LockMode.Hide,
      },
      {
        // 3.0.0 Legacy Sheet Convert Button
        elements: qsa(sheetElem, '.item-action[data-action="currency"]'),
        lockMode: LockMode.Hide,
      },
    ];
  }

  getInventoryQuantityInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, '.item-detail.item-quantity input'),
        lockMode: LockMode.FormDisabled,
      },
    ];
  }

  getEquipItemButtons(sheetElem: HTMLElement) {
    return [
      {
        // Pre-3.0.0
        elements: qsa(sheetElem, '.tab.inventory .inventory-list .item-toggle'),
        lockMode: LockMode.PointerEvents,
      },
      {
        // 3.0.0 Legacy Sheet
        elements: qsa(sheetElem, '.inventory-list .item-action[data-action="equip"]'),
        lockMode: LockMode.PointerEvents,
      },
    ];
  }

  getAttunementOverride(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, '.attunement-max-override'),
        lockMode: LockMode.Hide,
      },
      {
        elements: qsa(sheetElem, 'input[name="system.attributes.attunement.max"]'),
        lockMode: LockMode.FormDisabled,
      },
    ];
  }

  getDeathSaveInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, 'input[name^="system.attributes.death."]'),
        lockMode: LockMode.FormDisabled,
      },
    ];
  }

  getExhaustionInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, 'input[name="system.attributes.exhaustion"]'),
        lockMode: LockMode.FormDisabled,
      },
    ];
  }

  getInspirationInputs(sheetElem: HTMLElement) {
    return [
      {
        elements: qsa(sheetElem, 'input[name="system.attributes.inspiration"]'),
        lockMode: LockMode.FormDisabled,
      },
    ];
  }

  getPrepareSpellButtons(sheetElem: HTMLElement) {
    return [
      {
        // Pre-3.0.0
        elements: qsa(sheetElem, '.tab.spellbook .inventory-list .item-toggle'),
        lockMode: LockMode.PointerEvents,
      },
      {
        // 3.0.0 Legacy Sheet
        elements: qsa(sheetElem, '.inventory-list .item-action[data-action="prepare"]'),
        lockMode: LockMode.PointerEvents,
      },
    ];
  }
}
new ActorSheet5eCharacterLocker();
