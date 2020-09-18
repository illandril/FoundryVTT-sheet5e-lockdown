const PREFIX = "Illandril's Character Sheet Lockdown | ";

export default {
  debug: (message) => {
    console.debug(PREFIX + message);
  },
  info: (message) => {
    console.info(PREFIX + message);
  },
  error: (message) => {
    console.error(PREFIX + message);
  },
};
