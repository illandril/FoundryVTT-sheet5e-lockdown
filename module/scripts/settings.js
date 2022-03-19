import { log, KEY as MODULE_KEY } from './module.js';
export const SETTINGS_UPDATED = MODULE_KEY + '.SettingsUpdated';

const SETTINGS_VERSION = 3;
const SETTINGS_VERSION_KEY = 'settingsVersion';
const TIDY5E_WARNING_KEY = 'tidy5eWarning';

const settingsList = [];

const refresh = () => {
  Hooks.callAll(SETTINGS_UPDATED);
};

class Setting {
  constructor(type, key, defaultValue, options = {}) {
    this.type = type;
    this.key = key;
    this.hasHint = !!options.hasHint;
    this.defaultValue = defaultValue;
    this.choices = options.choices || null;
    this.scope = options.scope || 'world';
    settingsList.push(this);
  }

  register() {
    const name = game.i18n.localize(`${MODULE_KEY}.setting.${this.key}.label`);
    const hint = this.hasHint ? game.i18n.localize(`${MODULE_KEY}.setting.${this.key}.hint`) : null;
    game.settings.register(MODULE_KEY, this.key, {
      name,
      hint,
      scope: this.scope,
      config: true,
      default: this.defaultValue,
      type: this.type,
      choices: this.choices,
      onChange: refresh,
    });
  }

  set(value) {
    return game.settings.set(MODULE_KEY, this.key, value);
  }

  get() {
    return game.settings.get(MODULE_KEY, this.key);
  }
}

class ChoiceSetting extends Setting {
  constructor(key, defaultValue, choices, options = {}) {
    super(
      String,
      key,
      defaultValue,
      mergeObject(
        options,
        {
          choices,
        },
        {
          inplace: false,
        }
      )
    );
  }
}

class BooleanSetting extends Setting {
  constructor(key, defaultValue, options = {}) {
    super(Boolean, key, defaultValue, options);
  }
}

const minimumRoleChoices = Object.keys(CONST.USER_ROLES).reduce((choices, roleKey) => {
  if (roleKey !== 'NONE') {
    choices[roleKey] = `USER.Role${roleKey.titleCase()}`;
  }
  return choices;
}, {});

const LockToggleStyles = Object.freeze({
  'full': `${MODULE_KEY}.setting.lockToggleStyle.choice_full`,
  'iconPlusLabel': `${MODULE_KEY}.setting.lockToggleStyle.choice_iconPlusLabel`,
  'labelOnly': `${MODULE_KEY}.setting.lockToggleStyle.choice_labelOnly`,
  'iconOnly': `${MODULE_KEY}.setting.lockToggleStyle.choice_iconOnly`
});

export const HIDE_FROM_EVERYONE_OPTION = 'HIDE_FROM_EVERYONE';

const showRoleChoices = {
  ...minimumRoleChoices,
  [HIDE_FROM_EVERYONE_OPTION]: `${MODULE_KEY}.setting.hideFromEveryone`,
};

const Settings = {
  // Core Settings
  ShowToggleEditRole: new ChoiceSetting('showToggleEditRole', 'GAMEMASTER', minimumRoleChoices, {
    hasHint: true,
  }),

  LockToggleStyle: new ChoiceSetting('lockToggleStyle', 'full', LockToggleStyles, { scope: 'client' }),

  // Basic Details
  LockName: new BooleanSetting('lockName', false),
  LockBasicDetails: new BooleanSetting('lockBasicDetails', true, { hasHint: true }),
  ShowBackgroundRole: new ChoiceSetting('showBackgroundRole', 'PLAYER', showRoleChoices, {
    hasHint: true,
  }),
  ShowAlignmentRole: new ChoiceSetting('showAlignmentRole', 'PLAYER', showRoleChoices, {
    hasHint: true,
  }),
  LockXP: new BooleanSetting('lockXP', true),
  LockRests: new BooleanSetting('lockRests', true),

  // Attributes
  LockAbilityScores: new BooleanSetting('lockAbilityScores', true),
  LockProficiencies: new BooleanSetting('lockProficiencies', true),
  LockResources: new BooleanSetting('lockResources', true, { hasHint: true }),
  LockTraits: new BooleanSetting('lockTraits', true, { hasHint: true }),
  LockLegendaryAndLair: new BooleanSetting('lockLegendaryAndLair', true, { hasHint: true }),
  ShowSpecialTraits: new BooleanSetting('showSpecialTraits', true, { hasHint: true }),

  // Inventory + Features + Spellbook
  HideAddItemButtons: new BooleanSetting('hideAddItemButtons', true, { hasHint: true }),
  HideRemoveItemButtons: new BooleanSetting('hideRemoveItemButtons', true, { hasHint: true }),
  HideEmptySpellbook: new BooleanSetting('hideEmptySpellbook', false, { hasHint: true }),
  HideEditItemButtons: new BooleanSetting('hideEditItemButtons', true, { hasHint: true }),

  // Inventory
  LockCurrency: new BooleanSetting('lockCurrency', true),
  LockEquipItemButtons: new BooleanSetting('lockEquipItemButtons', false),

  // Features
  LockAvailableItemFeatureUses: new BooleanSetting('lockAvailableItemFeatureUses', false),

  // Spellbook
  LockPrepareSpellButtons: new BooleanSetting('lockPrepareSpellButtons', false),
  LockAvailableSpellSlots: new BooleanSetting('lockAvailableSpellSlots', false),
  LockMaxSpellSlotOverride: new BooleanSetting('lockMaxSpellSlotOverride', false),

  // Effects
  LockEffects: new BooleanSetting('lockEffects', false, { hasHint: true }),
  ShowEffectsRole: new ChoiceSetting('showEffectsRole', 'PLAYER', showRoleChoices, {
    hasHint: true,
  }),

  // Biography
  ShowBiographyRole: new ChoiceSetting('showBiographyRole', 'PLAYER', showRoleChoices, {
    hasHint: true,
  }),

  // Unsorted stuff that should be split up
  LockUnsorteds: new BooleanSetting('lockUnsorteds', true, { hasHint: true }),

  // Beta Sheet Disabling
  DisableTidy5eSheet: new BooleanSetting('disableTidy5eSheet', false, { hasHint: true }),
  DisableOtherSheets: new BooleanSetting('disableOtherSheets', true, { hasHint: true }),
};

Object.freeze(Settings);
export default Settings;

Hooks.once('init', () => {
  settingsList.forEach((setting) => {
    setting.register();
  });
  game.settings.register(MODULE_KEY, SETTINGS_VERSION_KEY, {
    scope: 'world',
    config: false,
    type: Number,
    default: 0,
  });
  game.settings.register(MODULE_KEY, TIDY5E_WARNING_KEY, {
    scope: 'world',
    config: false,
    type: Boolean,
    default: false,
  });
});

Hooks.once('ready', () => {
  const previousVersion = game.settings.get(MODULE_KEY, SETTINGS_VERSION_KEY);
  if (previousVersion < SETTINGS_VERSION) {
    if (previousVersion < 1) {
      const hideCheckboxToShowRoles = [
        {
          oldHideSetting: 'hideBackground',
          newShowSetting: Settings.ShowBackgroundRole.key,
        },
        {
          oldHideSetting: 'hideAlignment',
          newShowSetting: Settings.ShowAlignmentRole.key,
        },
        {
          oldHideSetting: 'hideEffects',
          newShowSetting: Settings.ShowEffectsRole.key,
        },
        {
          oldHideSetting: 'hideBiography',
          newShowSetting: Settings.ShowBiographyRole.key,
        },
      ];
      for (const { oldHideSetting, newShowSetting } of hideCheckboxToShowRoles) {
        game.settings.register(MODULE_KEY, oldHideSetting, {
          scope: 'world',
          config: false,
          type: Boolean,
          default: false,
        });
        if (game.settings.get(MODULE_KEY, oldHideSetting)) {
          log.info(
            `Migrating ${oldHideSetting} setting to ${newShowSetting} - setting to hide from everyone`
          );
          game.settings.set(MODULE_KEY, newShowSetting, HIDE_FROM_EVERYONE_OPTION);
        }
      }
    }
    if (previousVersion < 2) {
      game.settings.register(MODULE_KEY, 'hideAddRemoveItemButtons', {
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
      });
      const previousHideAddRemoveValue = game.settings.get(MODULE_KEY, 'hideAddRemoveItemButtons');
      log.info(
        `Migrating hideAddRemoveItemButtons setting to hideAddItemButtons and hideRemoveItemButtons - setting to ${previousHideAddRemoveValue}`
      );
      game.settings.set(MODULE_KEY, 'hideAddItemButtons', previousHideAddRemoveValue);
      game.settings.set(MODULE_KEY, 'hideRemoveItemButtons', previousHideAddRemoveValue);
    }
    if (previousVersion < 3) {
      const lockBasicDetails = Settings.LockBasicDetails.get();
      log.info(`Migrating lockBasicDetails setting to lockName - setting to ${lockBasicDetails}`);
      Settings.LockName.set(lockBasicDetails);
    }
    game.settings.set(MODULE_KEY, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
    log.info(`Settings Initialized - upgraded from v${previousVersion} to v${SETTINGS_VERSION}`);
  } else {
    log.info(`Settings Initialized - already on ${SETTINGS_VERSION}`);
  }

  const tidy5eWarningShown = game.settings.get(MODULE_KEY, TIDY5E_WARNING_KEY);
  if (!tidy5eWarningShown && game.modules.has('tidy5e-sheet') && game.user.isGM) {
    ui.notifications.warn(game.i18n.localize(`${MODULE_KEY}.warning.tidy5eSheetSupport`));
    game.settings.set(MODULE_KEY, TIDY5E_WARNING_KEY, true);
  }
});
