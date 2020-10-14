import { KEY as MODULE_KEY } from './module.js';
export const SETTINGS_UPDATED = MODULE_KEY + '.SettingsUpdated';

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

const Settings = {
  // Core Settings
  ShowToggleEditRole: new ChoiceSetting('showToggleEditRole', 'GAMEMASTER', minimumRoleChoices, {
    hasHint: true,
  }),

  // Basic Details
  LockBasicDetails: new BooleanSetting('lockBasicDetails', true, { hasHint: true }),
  HideBackground: new BooleanSetting('hideBackground', false),
  HideAlignment: new BooleanSetting('hideAlignment', false),
  LockXP: new BooleanSetting('lockXP', true),

  // Attributes
  LockAbilityScores: new BooleanSetting('lockAbilityScores', true),
  LockProficiencies: new BooleanSetting('lockProficiencies', true),
  LockResources: new BooleanSetting('lockResources', true, { hasHint: true }),
  LockTraits: new BooleanSetting('lockTraits', true, { hasHint: true }),
  LockLegendaryAndLair: new BooleanSetting('lockLegendaryAndLair', true, { hasHint: true }),

  // Inventory + Features + Spellbook
  HideAddRemoveItemButtons: new BooleanSetting('hideAddRemoveItemButtons', true, { hasHint: true }),
  HideEditItemButtons: new BooleanSetting('hideEditItemButtons', true, { hasHint: true }),

  // Inventory
  LockCurrency: new BooleanSetting('lockCurrency', true),
  LockEquipItemButtons: new BooleanSetting('lockEquipItemButtons', false),

  // Features -- nothing special here

  // Spellbook
  LockPrepareSpellButtons: new BooleanSetting('lockPrepareSpellButtons', false),
  LockMaxSpellSlotOverride: new BooleanSetting('lockMaxSpellSlotOverride', false),

  // Biography
  HideBiography: new BooleanSetting('hideBiography', false),

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
});
