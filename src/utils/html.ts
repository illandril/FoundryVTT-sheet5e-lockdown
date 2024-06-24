export const faIcon = (name: string) => {
  const icon = document.createElement('i');
  icon.classList.add('fas');
  icon.classList.add(`fa-${name}`);
  return icon;
};

export const stopPropagation = (event: Event) => {
  event.stopPropagation();
};

export const addRemoveClass = (element: HTMLElement, cssClass: string, isAdd: boolean) => {
  if (!element) {
    return;
  }
  if (isAdd) {
    element.classList.add(cssClass);
  } else {
    element.classList.remove(cssClass);
  }
};

const normalizeSelectors = (selectors: string | string[]) => {
  return Array.isArray(selectors) ? selectors.join(',') : selectors;
};

export const qs = <T extends HTMLElement = HTMLElement>(element: HTMLElement, selectors: string | string[]) => {
  return element.querySelector<T>(normalizeSelectors(selectors));
};

export const qsa = <T extends HTMLElement = HTMLElement>(element: HTMLElement, selectors: string | string[]) => {
  return [...element.querySelectorAll<T>(normalizeSelectors(selectors))];
};
