import module from './module';

export const SETTINGS_UPDATED = `${module.id}.SettingsUpdated` as const;

declare global {
  interface HookCallbacks {
    [SETTINGS_UPDATED]: () => void;
  }
}

const onChange = () => {
  Hooks.callAll(SETTINGS_UPDATED);
};
export const Notice = module.settings.register('notice', Boolean, false, { hasHint: true });

type RoleKey = keyof typeof foundry.CONST.USER_ROLES;
const minimumRoleChoices = (Object.keys(foundry.CONST.USER_ROLES) as RoleKey[]).reduce(
  (choices, roleKey) => {
    if (roleKey !== 'NONE') {
      choices[roleKey] = `USER.Role${roleKey.titleCase()}`;
    }
    return choices;
  },
  {} as Record<RoleKey, string>,
);

export const HIDE_FROM_EVERYONE_OPTION = 'HIDE_FROM_EVERYONE';

type ShowRoleKey = RoleKey | 'HIDE_FROM_EVERYONE';
const showRoleChoices: Record<ShowRoleKey, string> = {
  ...minimumRoleChoices,
  [HIDE_FROM_EVERYONE_OPTION]: `${module.id}.setting.hideFromEveryone`,
} as const;

export const ShowToggleEditRole = module.settings.register<RoleKey>('showToggleEditRole', String, 'GAMEMASTER', {
  hasHint: true,
  choices: minimumRoleChoices,
  onChange,
});

export const LockToggleStyle = module.settings.register('lockToggleStyle', String, 'full', {
  scope: 'client',
  choices: ['full', 'iconPlusLabel', 'labelOnly', 'iconOnly'],
  onChange,
});

// Basic Details
export const LockName = module.settings.register('lockName', Boolean, false, { onChange });
export const LockBasicDetails = module.settings.register('lockBasicDetails', Boolean, true, {
  hasHint: true,
  onChange,
});
export const ShowBackgroundRole = module.settings.register<ShowRoleKey>('showBackgroundRole', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});
export const ShowAlignmentRole = module.settings.register<ShowRoleKey>('showAlignmentRole', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});
export const LockXP = module.settings.register('lockXP', Boolean, true, { onChange });
export const LockRests = module.settings.register('lockRests', Boolean, true, { onChange });

// Attributes
export const LockAbilityScores = module.settings.register('lockAbilityScores', Boolean, true, { onChange });
export const LockProficiencies = module.settings.register('lockProficiencies', Boolean, true, { onChange });
export const LockResources = module.settings.register('lockResources', Boolean, true, { hasHint: true, onChange });

export const ShowResource1Role = module.settings.register<ShowRoleKey>('showResource1Role', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});
export const ShowResource2Role = module.settings.register<ShowRoleKey>('showResource2Role', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});
export const ShowResource3Role = module.settings.register<ShowRoleKey>('showResource3Role', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});
export const LockDeathSaves = module.settings.register('lockDeathSaves', Boolean, false, { onChange });
export const LockExhaustion = module.settings.register('lockExhaustion', Boolean, false, { onChange });
export const LockInspiration = module.settings.register('lockInspiration', Boolean, false, { onChange });
export const LockTraits = module.settings.register('lockTraits', Boolean, true, { hasHint: true, onChange });
export const ShowSpecialTraitsButtonRole = module.settings.register<ShowRoleKey>(
  'showSpecialTraitsButtonRole',
  String,
  'PLAYER',
  {
    hasHint: true,
    choices: showRoleChoices,
    onChange,
  },
);
export const ShowSpecialTraits = module.settings.register('showSpecialTraits', Boolean, true, {
  hasHint: true,
  onChange,
});
export const LockLegendaryAndLair = module.settings.register('lockLegendaryAndLair', Boolean, true, {
  hasHint: true,
  onChange,
});

// Inventory + Features + Spellbook
export const HideAddItemButtons = module.settings.register('hideAddItemButtons', Boolean, true, {
  hasHint: true,
  onChange,
});
export const HideRemoveItemButtons = module.settings.register('hideRemoveItemButtons', Boolean, true, {
  hasHint: true,
  onChange,
});
export const HideEmptySpellbook = module.settings.register('hideEmptySpellbook', Boolean, false, {
  hasHint: true,
  onChange,
});
export const HideEditItemButtons = module.settings.register('hideEditItemButtons', Boolean, true, {
  hasHint: true,
  onChange,
});
export const DisableItemContextMenu = module.settings.register('disableItemContextMenu', Boolean, true, {
  hasHint: true,
  onChange,
});

// Inventory
export const LockCurrency = module.settings.register('lockCurrency', Boolean, true, { onChange });
export const LockEquipItemButtons = module.settings.register('lockEquipItemButtons', Boolean, false, {
  hasHint: true,
  onChange,
});
export const LockAttunementOverride = module.settings.register('lockAttunementOverride', Boolean, true, { onChange });
export const LockInventoryQuantity = module.settings.register('lockInventoryQuantity', Boolean, true, { onChange });

// Features
export const LockAvailableItemFeatureUses = module.settings.register('lockAvailableItemFeatureUses', Boolean, false, {
  onChange,
});

// Spellbook
export const LockPrepareSpellButtons = module.settings.register('lockPrepareSpellButtons', Boolean, false, {
  onChange,
});
export const LockAvailableSpellSlots = module.settings.register('lockAvailableSpellSlots', Boolean, false, {
  onChange,
});
export const LockMaxSpellSlotOverride = module.settings.register('lockMaxSpellSlotOverride', Boolean, false, {
  onChange,
});

// Effects
export const LockEffects = module.settings.register('lockEffects', Boolean, false, { hasHint: true });
export const ShowEffectsRole = module.settings.register<ShowRoleKey>('showEffectsRole', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});

// Biography
export const ShowBiographyRole = module.settings.register<ShowRoleKey>('showBiographyRole', String, 'PLAYER', {
  hasHint: true,
  choices: showRoleChoices,
  onChange,
});

// Unsorted stuff that should be split up
export const LockUnsorteds = module.settings.register('lockUnsorteds', Boolean, true, { hasHint: true, onChange });

export const HideSheetConfigurationRole = module.settings.register<ShowRoleKey>(
  'hideSheetConfigurationRole',
  String,
  'ASSISTANT',
  {
    hasHint: true,
    choices: showRoleChoices,
    onChange,
  },
);
