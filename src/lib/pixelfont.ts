/* 5-wide pixel glyphs.  Row 0 carries an accent above, row 7 a cedilla below;
   both are dropped when the text has none.  Used by the h1 hover, the terminal
   banner and the og.png generator. */
const PX: Record<string, string[]> = {
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #'], L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#####'], I: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '#####'],
  E: ['#####', '#    ', '#### ', '#    ', '#    ', '#####'], M: ['#   #', '## ##', '# # #', '#   #', '#   #', '#   #'], R: ['#### ', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', ' ### '], Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#####'], C: [' ####', '#    ', '#    ', '#    ', '#    ', ' ####'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #', '#   #'], S: [' ####', '#    ', ' ### ', '    #', '    #', '#### '], T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  '@': [' ### ', '#   #', '# ###', '# # #', '# ###', ' ### '], ' ': ['     ', '     ', '     ', '     ', '     ', '     '],
};
const PX_ACCENT: Record<string, [string, string, string]> = { 'Ö': ['O', ' # # ', ''], 'İ': ['I', '  #  ', ''], 'Ç': ['C', '', '   # '], 'Ü': ['U', ' # # ', ''], 'Ş': ['S', '', '   # '] };

export function pixelRows(text: string): string[] {
  const rows: string[] = Array.from({ length: 8 }, () => '');
  for (const ch of text.toUpperCase()) {
    const acc = PX_ACCENT[ch]; const base = acc ? acc[0] : ch; const g = PX[base] || PX[' '];
    rows[0] += (acc && acc[1] ? acc[1] : '     ') + ' ';
    g.forEach((r, i) => { rows[i + 1] += r + ' '; });
    rows[7] += (acc && acc[2] ? acc[2] : '     ') + ' ';
  }
  const rmTop = !rows[0].trim(), rmBot = !rows[7].trim();
  return rows.slice(rmTop ? 1 : 0, rmBot ? 7 : 8).map(r => r.replace(/#/g, '█').trimEnd());
}
