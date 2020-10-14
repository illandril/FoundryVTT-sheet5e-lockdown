export const KEY = 'illandril-sheet5e-lockdown';
export const NAME = "Illandril's Character Sheet Lockdown";
export const CSS_PREFIX = `${KEY}--`;

const _log = (logFN, ...args) => {
  logFN.apply(console, [`%c${NAME} |`, 'color: rgba(0,0,0,0.5);', ...args]);
};

export const log = {
  dir: (label, ...args) => {
    const group = `${NAME} | ${label}`;
    console.group(group);
    console.dir(...args);
    console.groupEnd(group);
  },
  debug: (...args) => {
    _log(console.debug, ...args);
  },
  info: (...args) => {
    _log(console.info, ...args);
  },
  error: (...args) => {
    _log(console.error, ...args);
  },
};
