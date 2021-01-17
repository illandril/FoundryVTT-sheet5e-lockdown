import LockableCharacterSheet from '../lockableCharacterSheet.js';
import { isLockableSheet } from '../lockableSheet.js';
import Settings from '../../settings.js';

class OtherCharacterSheet extends LockableCharacterSheet {
  constructor(sheetName) {
    super(sheetName, Settings.DisableOtherSheets);
  }
}

Hooks.once('ready', () => {
  Object.values(CONFIG.Actor.sheetClasses.character).forEach((sheetClass) => {
    const sheetName = sheetClass.cls.name;
    if (!isLockableSheet(sheetName)) {
      new OtherCharacterSheet(sheetName);
    }
  });
});
