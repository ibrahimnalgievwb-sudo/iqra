export const getDataUrl = (path) => {
  return new URL(`../../data/${path}`, import.meta.url).href;
};
