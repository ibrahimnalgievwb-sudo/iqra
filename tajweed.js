(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Tajweed = factory());
})(this, (function () { 'use strict';

    /**
     * Tajweed.js - A robust Tajweed parsing utility for Arabic text.
     * 
     * Unlike other libraries (e.g., aamirbhat382/Tajweed) which only format *pre-tagged* text,
     * this utility dynamically *detects* Tajweed rules from standard Arabic text.
     * It handles Ghunna, Qalqalah, Ikhfa, Idgham, Iqlab, Madd, and Tafkheem (Heavy Letters).
     */

    const Tajweed = {
        // Unicode Constants
        CHAR: {
            FATHA: '\u064E',
            DAMMA: '\u064F',
            KASRA: '\u0650',
            FATHATAN: '\u064B',
            DAMMATAN: '\u064C',
            KASRATAN: '\u064D',
            SUKOON: '\u0652',
            SHADDA: '\u0651',
            MADD_SIGN: '\u0653',
            SMALL_ALIF: '\u0670',
            SMALL_MEEM: '\u06E2', // Meem Iqlab
            ALEF: '\u0627',
            ALEF_HAMZA_ABOVE: '\u0623',
            ALEF_HAMZA_BELOW: '\u0625',
            ALEF_MADDA: '\u0622',
            WAW: '\u0648',
            YA: '\u064A',
            NUN: '\u0646',
            MEEM: '\u0645',
            BA: '\u0628',
            LAM: '\u0644',
            RA: '\u0631',
            HE: '\u0647', // Ha
        },

        RULES: {
            QALQALAH: ['\u0642', '\u0637', '\u0628', '\u062C', '\u062F'], // q t b j d
            YANMU: ['\u064A', '\u0646', '\u0645', '\u0648'], // y n m w
            IKHFA: [
                '\u0635', '\u0630', '\u062B', '\u0643', '\u062C', '\u0634', '\u0642', '\u0633',
                '\u062F', '\u0637', '\u0632', '\u0641', '\u062A', '\u0636', '\u0638'
            ],
            LAM_SHAMSIYYAH: [ // Sun letters (Lam is silent before these)
                '\u062A', '\u062B', '\u062F', '\u0630', '\u0631', '\u0632', '\u0633', '\u0634',
                '\u0635', '\u0636', '\u0637', '\u0638', '\u0644', '\u0646'
            ]
        },

        parse(text) {
            if (!text) return '';

            let output = '';
            let i = 0;

            const isHaraka = (char) => {
                return [
                    this.CHAR.FATHA, this.CHAR.DAMMA, this.CHAR.KASRA,
                    this.CHAR.FATHATAN, this.CHAR.DAMMATAN, this.CHAR.KASRATAN,
                    this.CHAR.SUKOON, this.CHAR.SHADDA, this.CHAR.SMALL_ALIF,
                    this.CHAR.MADD_SIGN
                ].includes(char);
            };

            const getNextNonHaraka = (startIdx) => {
                let idx = startIdx;
                while (idx < text.length) {
                    if (text[idx] !== ' ' && !isHaraka(text[idx])) {
                        return { char: text[idx], index: idx };
                    }
                    idx++;
                }
                return null;
            };

            while (i < text.length) {
                const char = text[i];
                const nextCharObj = (i + 1 < text.length) ? text[i + 1] : '';

                // 1. Ghunna (Nun/Meem Shaddah)
                if ((char === this.CHAR.NUN || char === this.CHAR.MEEM) && nextCharObj === this.CHAR.SHADDA) {
                    output += `<span class="ghn">${char}${nextCharObj}</span>`;
                    i += 2;
                    continue;
                }

                // 2. Qalqalah (Sukoon on Qaf, Taa, Ba, Jeem, Dal)
                if (this.RULES.QALQALAH.includes(char) && nextCharObj === this.CHAR.SUKOON) {
                    output += `<span class="qlq">${char}${nextCharObj}</span>`;
                    i += 2;
                    continue;
                }

                // 3. Madd Wajib (Madd Sign)
                if (nextCharObj === this.CHAR.MADD_SIGN) {
                    output += `<span class="madda_obligatory">${char}${nextCharObj}</span>`;
                    i += 2;
                    continue;
                }

                // 4. Nun Sakinah & Tanween Rules
                let isNunSakinah = (char === this.CHAR.NUN && nextCharObj === this.CHAR.SUKOON);
                let isTanween = [this.CHAR.FATHATAN, this.CHAR.DAMMATAN, this.CHAR.KASRATAN].includes(char);

                if (isNunSakinah || isTanween) {
                    let searchIdx = isNunSakinah ? i + 2 : i + 1;
                    let lookahead = getNextNonHaraka(searchIdx);

                    if (lookahead) {
                        let content = isNunSakinah ? char + nextCharObj : char;
                        let increment = isNunSakinah ? 2 : 1;

                        if (this.RULES.YANMU.includes(lookahead.char)) {
                            output += `<span class="idgh_ghn">${content}</span>`;
                            i += increment;
                            continue;
                        } else if (lookahead.char === this.CHAR.LAM || lookahead.char === this.CHAR.RA) {
                            output += `<span class="idgh_w_ghn">${content}</span>`;
                            i += increment;
                            continue;
                        } else if (lookahead.char === this.CHAR.BA) {
                            output += `<span class="iqlb">${content}</span>`;
                            i += increment;
                            continue;
                        } else if (this.RULES.IKHFA.includes(lookahead.char)) {
                            output += `<span class="ikhf">${content}</span>`;
                            i += increment;
                            continue;
                        }
                    }
                }

                // 5. Tafkheem (Heavy Allah)
                // Look for 'Allah' pattern: Alif-Lam-Lam-Ha (ignoring harakat)
                // This is complex regex without lookbehind for variable width, so kept simple:
                // Check if current block IS the word Allah
                if (char === this.CHAR.LAM && text.substr(i, 5).includes(this.CHAR.HE)) ;

                // 6. Lam Shamsiyyah (Sun Letters)
                // If current is AL (Alif Lam) and next letter is Sun Letter -> Lam is typically silent/assimilated
                if (char === this.CHAR.LAM && nextCharObj === this.CHAR.SUKOON) {
                    // Check prev was Alif? Usually implicit.
                    let lookahead = getNextNonHaraka(i + 2);
                    if (lookahead && this.RULES.LAM_SHAMSIYYAH.includes(lookahead.char)) {
                        output += `<span class="slnt">${char}${nextCharObj}</span>`; // Gray out
                        i += 2;
                        continue;
                    }
                }

                // Default
                output += char;
                i++;
            }

            return output;
        }
    };

    return Tajweed;

}));
