import module from '../module';
import * as Settings from '../settings';
import { addRemoveClass, qs, qsa } from '../utils/html';
import lockUnlock, { type ElementCollection, LockMode, type LockSetting } from './lockUnlock';

const CSS_SHEET = module.cssPrefix.child('sheet');
const CSS_LOCK = module.cssPrefix.child('lock');
const CSS_EDIT = module.cssPrefix.child('edit');

const SHOWN_SHEETS = new Set<ActorSheet>();
const refreshShownSheets = () => {
  for (const sheet of SHOWN_SHEETS) {
    if (sheet.rendered) {
      sheet.render();
    }
  }
};
Hooks.on(Settings.SETTINGS_UPDATED, () => {
  refreshShownSheets();
});

setInterval(() => {
  // Avoid excess memory overhead by clearing out the shown sheets list periodically
  for (const sheet of SHOWN_SHEETS) {
    if (!sheet.rendered) {
      SHOWN_SHEETS.delete(sheet);
    }
  }
}, 10000);

const isActor5eSheet = <T extends dnd5e.applications.actor.ActorSheet5e>(
  application: Application,
  cls: { new (): T },
): application is T => {
  return application instanceof cls;
};

export default abstract class SheetLocker<T extends dnd5e.applications.actor.ActorSheet5e> {
  constructor(
    public readonly sheetName: string,
    public readonly isLegacySheet: boolean,
    cls: { new (): T },
  ) {
    const onRenderHook = (sheet: Application) => {
      if (sheet.constructor.name !== sheetName) {
        // It's a custom sheet that extends some other sheet, and we're in the parent
        // class's hook - skip it to avoid inappropriate locking.
        module.logger.debug(
          'Skipping render - constructor name does not match (likely a sheet that extends another sheet type)',
          sheetName,
          sheet.constructor.name,
        );
        return;
      }
      if (!isActor5eSheet(sheet, cls)) {
        module.logger.error(
          'Non-actor5e sheet rendered (maybe somebody calling the wrong hook accidentally?)',
          sheetName,
          sheet,
        );
        return;
      }
      const sheetElem = this.element(sheet);
      if (!sheetElem) {
        module.logger.error('Sheet rendered, but no element could be found for the sheet', sheet);
        return;
      }
      module.logger.debug(`render${sheetName}`, sheet);

      SHOWN_SHEETS.add(sheet);

      if (!sheetElem.classList.contains(CSS_SHEET)) {
        this.hideShow(sheet, '.configure-sheet', Settings.HideSheetConfigurationRole, true);
        this.setIsLocked(sheet, true);
        this.onInitialize(sheet, sheetElem);
        sheetElem.classList.add(CSS_SHEET);
      }

      this.onUpdate(sheet, sheetElem);
    };

    module.logger.info(`Sheet Registered: ${sheetName}`);
    Hooks.on(`render${sheetName}`, onRenderHook);
  }

  element(sheet: T) {
    const sheetElem = sheet.element[0];
    if (!sheetElem) {
      module.logger.error('Sheet element could not be found', sheet);
      throw new Error('Sheet element could not be found');
    }
    return sheetElem;
  }

  isLocked(sheet: T) {
    const sheetElem = this.element(sheet);
    return !sheet.isEditable || sheetElem.classList.contains(CSS_LOCK);
  }

  setIsLocked(sheet: T, locked: boolean) {
    const sheetElem = this.element(sheet);
    addRemoveClass(sheetElem, CSS_LOCK, locked);
    addRemoveClass(sheetElem, CSS_EDIT, !locked);
  }

  qs(sheet: T, selectors: string | string[]) {
    return qs(this.element(sheet), selectors);
  }

  qsa(sheet: T, selectors: string | string[]) {
    return qsa(this.element(sheet), selectors);
  }

  hideShow(
    sheet: T,
    selectorsOrElements: string | string[] | HTMLElement | HTMLElement[],
    setting: LockSetting,
    always = false,
  ) {
    let elements: HTMLElement[];
    if (selectorsOrElements instanceof HTMLElement) {
      elements = [selectorsOrElements];
    } else if (typeof selectorsOrElements === 'string') {
      elements = this.qsa(sheet, selectorsOrElements);
    } else if (Array.isArray(selectorsOrElements)) {
      if (selectorsOrElements.length === 0) {
        elements = [];
      } else if (selectorsOrElements.every((e): e is string => typeof e === 'string')) {
        elements = this.qsa(sheet, selectorsOrElements);
      } else {
        elements = selectorsOrElements;
      }
    } else {
      elements = selectorsOrElements;
    }
    this.lockUnlock(
      sheet,
      {
        elements,
        lockMode: LockMode.Hide,
        always,
      },
      setting,
    );
  }

  lockUnlock(sheet: T, elements: ElementCollection, setting: LockSetting) {
    lockUnlock(elements, this.isLocked(sheet), setting, sheet.isEditable);
  }

  abstract onInitialize(sheet: T, sheetElem: HTMLElement): void;
  abstract onUpdate(sheet: T, sheetElem: HTMLElement): void;
}
