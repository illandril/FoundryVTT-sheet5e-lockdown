import LockableNPCSheet from '../lockableNPCSheet.js';
import { isLockableSheet } from '../lockableSheet.js';
import Settings from '../../settings.js';

class OtherNPCSheet extends LockableNPCSheet {
  constructor(sheetName) {
    super(sheetName, Settings.DisableOtherSheets);
  }
}

Hooks.once('ready', () => {
  Object.values(CONFIG.Actor.sheetClasses.npc).forEach((sheetClass) => {
    const sheetName = sheetClass.cls.name;
    if (!isLockableSheet(sheetName)) {
      new OtherNPCSheet(sheetName);
    }
  });
});
