export const getFontUrl = (path) => {
  return new URL(`../../fonts/${path}`, import.meta.url).href;
};
