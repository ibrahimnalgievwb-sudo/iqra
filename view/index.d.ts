import React from 'react';
import { M as MushafLayout, d as WordClickedData, e as WordLocation } from '../types-BFR3M7Mn.js';
import { P as PageLayout } from '../layout-calculator-8KVbrRcz.js';

declare const CENTERED_PAGES_VERTICAL: readonly [1, 2];
declare const CENTERED_PAGES_HORIZONTAL: readonly [1, 2, 602, 603, 604];

type OpenQuranViewProps = {
    page?: number;
    width?: number;
    height?: number;
    theme?: "light" | "dark";
    mushafLayout?: MushafLayout;
    onPageChange?: (page: number) => void;
    onLoad?: (layout: PageLayout) => void;
    onWordClick?: (word: WordClickedData) => void;
    className?: string;
    fullscreen?: boolean;
    onFullscreenToggle?: (isFullscreen: boolean) => void;
    highlightedWords?: WordLocation[];
    highlightedVerse?: {
        surah: number;
        verse: number;
    } | null;
    wordHighlightColor?: string;
    verseHighlightColor?: string;
    navigationControls?: boolean;
    ratio?: boolean | number;
    fit?: "width" | "height";
};
declare const OpenQuranView: React.FC<OpenQuranViewProps>;

export { CENTERED_PAGES_HORIZONTAL, CENTERED_PAGES_VERTICAL, MushafLayout, OpenQuranView, type OpenQuranViewProps, PageLayout, WordClickedData, WordLocation, OpenQuranView as default };
