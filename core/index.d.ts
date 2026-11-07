import { M as MushafLayout, J as Juz, S as Surah, P as Page, W as Word } from '../types-BFR3M7Mn.js';
export { C as CharType, L as Line, a as LineMetadata, b as LineType, c as PageLine, Q as QuranPage, R as Riwaya, T as TranslatedName, d as WordClickedData, e as WordLocation, f as createVerseKey, p as parseVerseKey } from '../types-BFR3M7Mn.js';
export { L as LayoutCalculatorOptions, a as LineLayout, P as PageLayout, b as PageMetrics, W as WordLayout, c as createLayoutCalculator } from '../layout-calculator-8KVbrRcz.js';

declare function loadPages(layout: MushafLayout, pageNumber?: number): Promise<Page | Page[] | null>;
declare function loadPage(layout: MushafLayout, pageNumber: number): Promise<Page | null>;
declare function loadAllPages(layout: MushafLayout): Promise<Page[]>;
declare function loadSurahs(): Promise<Surah[]>;
declare function loadJuzs(): Promise<Juz[]>;
declare function getSurah(id: number): Promise<Surah | null>;
declare function getJuz(id: number): Promise<Juz | null>;
declare function getSurahByPage(pageNumber: number): Promise<Surah | null>;
declare function clearCache(layout?: MushafLayout): void;

declare function surahNumberToFontCode(surahNumber: number): string;
declare function loadSurahNameFont(): Promise<void>;
declare function loadAyatMarkerFont(): Promise<void>;
declare function getFontBuffer(layout: MushafLayout, page: number): Promise<ArrayBuffer>;
declare function getFontUrl(layout: MushafLayout, page: number): string;
declare function loadFont(layout: MushafLayout, page: number): Promise<void>;
declare function loadBismillahFont(layout: MushafLayout): Promise<void>;

declare function getSurahFrameUrl(): string;

type VerseLocation = {
    surah: number;
    verse: number;
    pageNumber: number;
    lineNumber: number;
    wordPosition: number;
};
type NavigationInfo = {
    prevPage: number | null;
    nextPage: number | null;
    currentSurah: Surah | null;
    surahStartPage: number;
    surahEndPage: number;
};
declare function getPageForVerse(verseKey: string, layout?: MushafLayout): Promise<{
    page: Page | null;
    verseLocation: VerseLocation | null;
}>;
declare function getVerseLocation(chapter: number, verse: number, layout?: MushafLayout): Promise<VerseLocation | null>;
declare function getNavigation(pageNumber: number, layout?: MushafLayout): Promise<NavigationInfo>;
declare function getPageRangeForSurah(surahId: number): Promise<[number, number] | null>;
declare function getFirstVerseOfPage(pageNumber: number, layout?: MushafLayout): Promise<VerseLocation | null>;
declare function getLastVerseOfPage(pageNumber: number, layout?: MushafLayout): Promise<VerseLocation | null>;
declare function getWordLocation(word: Word, verseKey?: string): VerseLocation;

declare function getBismillahWords(layout: MushafLayout): Promise<Word[]>;
declare function clearBismillahCache(layout?: MushafLayout): void;

export { Juz, MushafLayout, type NavigationInfo, Page, Surah, type VerseLocation, Word, clearBismillahCache, clearCache, getBismillahWords, getFirstVerseOfPage, getFontBuffer, getFontUrl, getJuz, getLastVerseOfPage, getNavigation, getPageForVerse, getPageRangeForSurah, getSurah, getSurahByPage, getSurahFrameUrl, getVerseLocation, getWordLocation, loadAllPages, loadAyatMarkerFont, loadBismillahFont, loadFont, loadJuzs, loadPage, loadPages, loadSurahNameFont, loadSurahs, surahNumberToFontCode };
