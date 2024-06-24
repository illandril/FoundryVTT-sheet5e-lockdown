import module from '../module';
import type * as Settings from '../settings';
import { addRemoveClass } from '../utils/html';

const CSS_HIDE = module.cssPrefix.child('hide');
const CSS_HIDE_RESERVE_SPACE = module.cssPrefix.child('hideReserveSpace');

const CSS_NO_POINTER_EVENTS = module.cssPrefix.child('noPointerEvents');

export enum LockMode {
  PointerEvents = 'CSS_POINTER_EVENTS',
  FormDisabled = 'FORM_DISABLED',
  Hide = 'HIDE',
  HideReserveSpace = 'HIDE_RESERVE_SPACE',
  HideParent = 'HIDE_PARENTS',
  DisableContextMenu = 'DISABLE_CONTEXT_MENU',
}

type ElementGroup = {
  elements: HTMLElement[];
  lockMode: LockMode;
  always?: boolean;
};

export type ElementCollection = ElementGroup | (ElementGroup | ElementCollection)[];

export type LockSetting =
  | boolean
  | typeof Settings.LockAbilityScores
  | typeof Settings.ShowAlignmentRole
  | typeof Settings.ShowToggleEditRole;

const checkIsLocked = (lockSetting: LockSetting) => {
  if (typeof lockSetting === 'boolean') {
    return lockSetting;
  }
  const value = lockSetting.get();
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'HIDE_FROM_EVERYONE') {
    return true;
  }
  return !game.user?.hasRole(value);
};

const disableContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

const addRemoveClassToAll = (
  elements: HTMLElement[],
  cssClass: string,
  isAdd: boolean,
  lookupRelativeElement?: (element: HTMLElement) => HTMLElement | null,
) => {
  for (const element of elements) {
    let elementToToggle = element;
    if (lookupRelativeElement) {
      const relativeElement = lookupRelativeElement(element);
      if (relativeElement) {
        elementToToggle = relativeElement;
      } else {
        module.logger.error('Could not find relative element when toggling css class', cssClass, element);
        continue;
      }
    }
    addRemoveClass(elementToToggle, cssClass, isAdd);
  }
};

const setLocked = (elements: HTMLElement[], lockMode: LockMode, lock: boolean) => {
  switch (lockMode) {
    case LockMode.PointerEvents:
      addRemoveClassToAll(elements, CSS_NO_POINTER_EVENTS, lock);
      break;
    case LockMode.FormDisabled:
      for (const element of elements) {
        (element as HTMLInputElement).disabled = lock;
      }
      break;
    case LockMode.Hide:
      addRemoveClassToAll(elements, CSS_HIDE, lock);
      break;
    case LockMode.HideReserveSpace:
      addRemoveClassToAll(elements, CSS_HIDE_RESERVE_SPACE, lock);
      break;
    case LockMode.HideParent:
      addRemoveClassToAll(elements, CSS_HIDE, lock, (element) => element.parentElement);
      break;
    case LockMode.DisableContextMenu:
      for (const element of elements) {
        if (lock) {
          element.addEventListener('contextmenu', disableContextMenu, { capture: true });
        } else {
          element.removeEventListener('contextmenu', disableContextMenu, { capture: true });
        }
      }
      break;
    default:
      module.logger.error(`Unexpected lockMode: ${lockMode}`);
  }
};

const lockUnlock = (
  elementGroups: null | ElementCollection,
  sheetLocked: boolean,
  lockSettingInput: LockSetting,
  isSheetEditable: boolean,
) => {
  module.logger.warn('lockUnlock', elementGroups, sheetLocked, lockSettingInput, isSheetEditable);
  if (!elementGroups) {
    return;
  }
  const isLocked = checkIsLocked(lockSettingInput);
  if (Array.isArray(elementGroups)) {
    for (const elementGroup of elementGroups) {
      lockUnlock(elementGroup, sheetLocked, isLocked, isSheetEditable);
    }
  } else {
    const { elements, lockMode, always } = elementGroups;
    const lock = (always ? true : sheetLocked) && isLocked;

    if (isSheetEditable || lock) {
      setLocked(elements, lockMode, lock);
    }
  }
};

export default lockUnlock;

export const isHideReserveSpace = (element: HTMLElement) => element.classList.contains(CSS_HIDE_RESERVE_SPACE);
