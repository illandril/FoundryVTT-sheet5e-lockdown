import { LockMode } from '../lockableSheet.js';
import { CSS_PREFIX } from '../../module.js';

const CSS_SPECIAL_TRAITS = `${CSS_PREFIX}special-traits`;

export const getAlignmentForHide = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.origin-summary [data-target$="-alignment"]'),
    lockMode: LockMode.HIDE,
    always: true,
  };
};

export const getSpeedConfigureIcon = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.header-attribute.movement .config-button'),
    lockMode: LockMode.HIDE,
  };
};

export const getSensesInput = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.traits .senses [data-target$="-senses"]'),
    lockMode: LockMode.CONTENT_EDITABLE,
  };
};

export const getRemoveItemButtons = (superButtons, sheetElem) => {
  return [
    superButtons,
    {
      elements: sheetElem.querySelectorAll('.tidy5e-delete-lock'),
      lockMode: LockMode.HIDE,
    },
  ];
};

export const getAvailableItemFeatureUses = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.item-detail input[data-path="system.uses.value"],.item-detail input[data-path="system.uses.max"]'),
    lockMode: LockMode.FORM_DISABLED,
  };
};

export const getSpecialTraitsRow = (sheetElem) => {
  const hasRow = sheetElem.querySelector(`.traits .${CSS_SPECIAL_TRAITS}`) !== null;
  if (hasRow) {
    return null;
  }
  const toggleTraits = sheetElem.querySelector('.traits .toggle-traits');

  const specialTraitsRow = document.createElement('div');
  specialTraitsRow.classList.add('form-group', CSS_SPECIAL_TRAITS);
  const lastFormGroup = toggleTraits.previousElementSibling;
  toggleTraits.parentNode.insertBefore(specialTraitsRow, toggleTraits);

  const article = document.createElement('article');
  specialTraitsRow.appendChild(article);
  const label = document.createElement('label');
  article.appendChild(label);
  label.appendChild(document.createTextNode(game.i18n.localize('DND5E.SpecialTraits')));
  label.appendChild(document.createTextNode(':'));
  return {
    row: specialTraitsRow,
    traitListContainer: article,
  };
};
