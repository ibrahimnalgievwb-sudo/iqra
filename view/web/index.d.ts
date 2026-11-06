import { M as MushafLayout, e as WordLocation } from '../../types-BFR3M7Mn.js';

interface OpenQuranViewProps {
    page?: string;
    mushafLayout?: MushafLayout;
    width?: string;
    height?: string;
    theme?: "light" | "dark";
}
declare class OpenQuranView extends HTMLElement {
    private layout;
    private calculator;
    private currentPage;
    private totalPages;
    private container;
    private content;
    private loading;
    private nav;
    private pageInput;
    private pageDisplay;
    private prevBtn;
    private nextBtn;
    private fontLoaded;
    private fontFaceSheet;
    private showingInput;
    private bismillahWords;
    private highlightedWords;
    private highlightedVerse;
    private wordHighlightColor;
    private verseHighlightColor;
    private showNavigation;
    static get observedAttributes(): string[];
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    private bindEvents;
    private initialize;
    private loadFont;
    private updateTheme;
    private updatePageDisplay;
    private renderPage;
    private renderLayout;
    private applyHighlights;
    private showLoading;
    goToPage(page: number): void;
    get page(): number;
    set page(value: number);
    get mushafLayoutAttr(): MushafLayout;
    set mushafLayoutAttr(value: MushafLayout);
    get wordsHighlight(): WordLocation[];
    set wordsHighlight(value: WordLocation[]);
    get verseHighlight(): {
        surah: number;
        verse: number;
    } | null;
    set verseHighlight(value: {
        surah: number;
        verse: number;
    } | null);
    get wordHighlightColorOverride(): string;
    set wordHighlightColorOverride(value: string);
    get verseHighlightColorOverride(): string;
    set verseHighlightColorOverride(value: string);
}
declare function registerOpenQuranView(): void;

export { OpenQuranView, type OpenQuranViewProps, OpenQuranView as default, registerOpenQuranView };
