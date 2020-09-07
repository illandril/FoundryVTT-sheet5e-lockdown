const CSS_PREFIX = 'illandril-sheet5e-lockdown--';
const CSS_SHEET = CSS_PREFIX + 'sheet';
const CSS_EDIT = CSS_PREFIX + 'edit';
const CSS_LOCK = CSS_PREFIX + 'lock';
const CSS_HIDE = CSS_PREFIX + 'hide';
const CSS_FLEXFIX = CSS_PREFIX + 'flexfix';

export const forAll = (parent, selector, action) => {
  Array.prototype.forEach.call(parent.querySelectorAll(selector), action);
};

const faIcon = (name) => {
  const icon = document.createElement('i');
  icon.classList.add('fas');
  icon.classList.add('fa-' + name);
  return icon;
};

const stopPropagation = (event) => {
  event.stopPropagation();
};

const hideShow = (elem, hide) => {
  if (hide) {
    elem.classList.add(CSS_HIDE);
  } else {
    elem.classList.remove(CSS_HIDE);
  }
};

const hideShowParents = (parent, selector, hide) => {
  forAll(parent, selector, (elem) => {
    hideShow(elem.parentNode, hide);
  });
};

export default class Locker {
  constructor(elementsToDisable, elementsToHideParents, elementsToHideParentsOnLock, conditionals) {
    this._disableSelector = elementsToDisable.join(',');
    this._hideParentsSelector = elementsToHideParents.join(',');
    this._hideParentsOnLockSelector = elementsToHideParentsOnLock.join(',');
    this._conditionals = conditionals;
  }

  lock(sheetElem) {
    this._initialize(sheetElem);
    hideShowParents(sheetElem, this._hideParentsSelector, true /* hide */);

    const isEditable = this._isEditable(sheetElem);
    this._makeEditable(sheetElem, isEditable);
  }

  _initialize(sheetElem) {
    if (sheetElem.classList.contains(CSS_SHEET)) {
      return;
    }
    sheetElem.classList.add(CSS_SHEET);
    if (game.user.isGM) {
      const sheetHeader = sheetElem.querySelector('.window-header');
      const sheetTitle = sheetHeader.querySelector('.window-title');

      const editLink = document.createElement('a');
      editLink.appendChild(faIcon('edit'));
      const toggleString = game.i18n.localize('illandril-sheet5e-lockdown.toggleEditable');
      editLink.appendChild(document.createTextNode(toggleString));
      editLink.addEventListener('click', () => this._toggleEditable(sheetElem), false);
      editLink.addEventListener('dblclick', stopPropagation, false);
      sheetHeader.insertBefore(editLink, sheetTitle.nextSibling);
    }
  }

  _isEditable(sheetElem) {
    return sheetElem.classList.contains(CSS_EDIT);
  }

  _toggleEditable(sheetElem) {
    this._makeEditable(sheetElem, !this._isEditable(sheetElem));
  }

  _makeEditable(sheetElem, editable) {
    if (editable) {
      sheetElem.classList.remove(CSS_LOCK);
      sheetElem.classList.add(CSS_EDIT);
    } else {
      sheetElem.classList.add(CSS_LOCK);
      sheetElem.classList.remove(CSS_EDIT);
    }
    hideShowParents(sheetElem, this._hideParentsOnLockSelector, !editable /* hide */);
    forAll(sheetElem, this._disableSelector, (input) => {
      input.disabled = !editable;
    });
    this._conditionals.forEach((conditional) => {
      hideShow(conditional.elementToHide(sheetElem), conditional.shouldHide(sheetElem, editable));
    });

    forAll(sheetElem, '.item.flexrow', (row) => {
      if(!row.querySelector('.' + CSS_FLEXFIX)) {
        const itemName = row.querySelector('.item-name');
        if(itemName) {
          const flexFix = document.createElement('div');
          flexFix.classList.add(CSS_FLEXFIX);
          row.insertBefore(flexFix, itemName.nextSibling);
        }
      }
    });
  }
}
