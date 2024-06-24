import module from '../../module';
import * as Settings from '../../settings';
import { qs, qsa } from '../../utils/html';
import isSpellbookEmpty from '../../utils/isSpellbookEmpty';
import SheetLocker from '../SheetLocker';
import lockUnlock, { type ElementCollection, LockMode } from '../lockUnlock';

class ActorSheet5eCharacter2Locker extends SheetLocker<dnd5e.applications.actor.ActorSheet5eCharacter2> {
  constructor() {
    super('ActorSheet5eCharacter2', false, dnd5e.applications.actor.ActorSheet5eCharacter2);
  }

  onInitialize() {
    // Nothing to initialize (at least not yet), except for what is initialized in SheetLocker
  }

  onUpdate(sheet: dnd5e.applications.actor.ActorSheet5eCharacter2, sheetElem: HTMLElement) {
    this.setIsLocked(sheet, sheet._mode === dnd5e.applications.actor.ActorSheet5eCharacter2.MODES.PLAY);
    const locked = this.isLocked(sheet);

    this.hideShow(sheet, '.mode-slider', Settings.ShowToggleEditRole, true);

    this.hideShow(sheet, ['button.short-rest', 'button.long-rest'], Settings.LockRests);

    this.hideShow(sheet, '.config-button[data-action="flags"]', Settings.ShowSpecialTraitsButtonRole, true);

    this.lockUnlock(
      sheet,
      {
        elements: this.qsa(sheet, '[data-action="toggleInspiration"]'),
        lockMode: LockMode.PointerEvents,
      },
      Settings.LockInspiration,
    );

    this.hideShow(
      sheet,
      ['[data-action="findItem"][data-item-type="background"]', '.pill-lg.background'],
      Settings.ShowBackgroundRole,
      true,
    );
    this.hideShow(sheet, '.tabs [data-tab="biography"]', Settings.ShowBiographyRole, true);

    this.hideShow(sheet, this.getEmptyBiographyEntries(sheetElem), true);

    const hideEmptySpellbook = locked && Settings.HideEmptySpellbook.get();
    const isSpellbookEmptyAndHidden = hideEmptySpellbook && isSpellbookEmpty(sheet.actor);
    lockUnlock(
      {
        elements: qsa(sheetElem, '.tabs [data-tab="spells"]'),
        lockMode: LockMode.Hide,
      },
      hideEmptySpellbook,
      isSpellbookEmptyAndHidden,
      sheet.isEditable,
    );

    this.lockUnlock(sheet, this.getEffectElementsToLock(sheetElem), Settings.LockEffects);
    this.hideShow(sheet, '.tabs [data-tab="effects"]', Settings.ShowEffectsRole);
  }

  getEffectElementsToLock(sheetElem: HTMLElement): ElementCollection {
    return [
      {
        elements: qsa(sheetElem, [
          '.tab.effects .effect-control[data-action="toggle"]',
          '.tab.effects [data-action="toggleCondition"]',
        ]),
        lockMode: LockMode.PointerEvents,
      },
      {
        elements: qsa(sheetElem, ['.tab.effects .effect-control[data-context-menu]']),
        lockMode: LockMode.Hide,
      },
      {
        elements: qsa(sheetElem, ['.tab.effects .effect[data-effect-id]']),
        lockMode: LockMode.DisableContextMenu,
      },
    ];
  }

  getEmptyBiographyEntries(sheetElem: HTMLElement) {
    const biographyTab = qs(sheetElem, '.tab.biography');
    if (!biographyTab) {
      module.logger.debug('Could not find biography tab');
      return [];
    }

    const elements: HTMLElement[] = [];

    for (const value of qsa(biographyTab, '.characteristics .value:empty')) {
      const li = value.parentElement?.parentElement;
      if (li?.tagName !== 'LI') {
        module.logger.debug('.parent.parent of an empty value was not an LI as expected', value);
      } else {
        elements.push(li);
      }
    }

    for (const halfTextbox of qsa(biographyTab, '.textbox-half')) {
      const paragraphs = qsa(halfTextbox, '& > p');
      if (paragraphs.length !== 1) {
        module.logger.debug('Could not find expected only p element of textbox-half', halfTextbox);
      } else if (!paragraphs[0].textContent) {
        elements.push(halfTextbox);
      }
    }

    return elements;
  }
}
new ActorSheet5eCharacter2Locker();
