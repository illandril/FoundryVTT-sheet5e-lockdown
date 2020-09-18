import { LockMode } from '../lockableSheet.js';

export const getAlignmentForHide = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.origin-summary [data-target$="-alignment"]'),
    lockMode: LockMode.HIDE,
    always: true,
  };
};

export const getSensesInput = (sheetElem) => {
  return {
    elements: sheetElem.querySelectorAll('.traits .senses [data-target$="-senses"]'),
    lockMode: LockMode.CONTENT_EDITABLE,
  };
};

export const getAddRemoveItemButtons = (superButtons, sheetElem) => {
  return [
    superButtons,
    {
      elements: sheetElem.querySelectorAll('.tidy5e-delete-lock'),
      lockMode: LockMode.HIDE,
    },
  ];
};
