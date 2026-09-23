/* Kilim motifs: 13x13 pixel grids, painted as a mask over --accent.  Each one
   links to a reference and carries a one-line explanation for its preview card. */
const WIKI = { en: 'https://en.wikipedia.org/wiki/Kilim_motifs', tr: 'https://tr.wikipedia.org/wiki/Kilim' };
export const MOTIFS = {
  goz: { name: 'göz', meaning: { tr: 'nazara karşı koruma', en: 'protection' }, href: WIKI, blurb: { en: 'The eye: a kilim motif that guards against the evil eye.', tr: 'Göz: nazardan koruyan kilim motifi.' }, grid: [
    '......#......', '.....#.#.....', '....#...#....', '...#.....#...', '..#...#...#..', '.#...###...#.', '#...#####...#',
    '.#...###...#.', '..#...#...#..', '...#.....#...', '....#...#....', '.....#.#.....', '......#......'] },
  elibelinde: { name: 'elibelinde', meaning: { tr: 'bereket, annelik', en: 'fertility' }, href: { en: 'https://en.wikipedia.org/wiki/Elibelinde', tr: 'https://tr.wikipedia.org/wiki/Kilim' }, blurb: { en: 'Hands-on-hips figure: motherhood and fertility.', tr: 'Eli belinde figürü: annelik ve bereket.' }, grid: [
    '#....###....#', '##...###...##', '.##..###..##.', '..##.###.##..', '...#######...', '....#####....', '.....###.....',
    '......#......', '.....###.....', '....#####....', '...#######...', '..#########..', '.###########.'] },
  kocboynuzu: { name: 'koçboynuzu', meaning: { tr: 'güç, kahramanlık', en: 'strength' }, href: WIKI, blurb: { en: 'Ram’s horn: strength, heroism, masculinity.', tr: 'Koçboynuzu: güç, kahramanlık, erkeklik.' }, grid: [
    '..###...###..', '.#...#.#...#.', '#..#..#..#..#', '#.##..#..##.#', '#.....#.....#', '.#....#....#.', '......#......',
    '.#....#....#.', '#.....#.....#', '#.##..#..##.#', '#..#..#..#..#', '.#...#.#...#.', '..###...###..'] },
  yildiz: { name: 'yıldız', meaning: { tr: 'mutluluk', en: 'happiness' }, href: WIKI, blurb: { en: 'Star: happiness and good fortune.', tr: 'Yıldız: mutluluk ve uğur.' }, grid: [
    '......#......', '.....###.....', '.#...###...#.', '..#..###..#..', '...#.###.#...', '....#####....', '#############',
    '....#####....', '...#.###.#...', '..#..###..#..', '.#...###...#.', '.....###.....', '......#......'] },
  pitrak: { name: 'pıtrak', meaning: { tr: 'bolluk', en: 'abundance' }, href: WIKI, blurb: { en: 'Burdock: abundance, and a thorn against the evil eye.', tr: 'Pıtrak: bolluk ve nazara karşı diken.' }, grid: [
    '#.....#.....#', '.#....#....#.', '..#..###..#..', '...#.###.#...', '....#####....', '..#..###..#..', '######.######',
    '..#..###..#..', '....#####....', '...#.###.#...', '..#..###..#..', '.#....#....#.', '#.....#.....#'] },
  suyolu: { name: 'su yolu', meaning: { tr: 'hayat, süreklilik', en: 'life, continuity' }, href: WIKI, blurb: { en: 'Running water: life and continuity.', tr: 'Su yolu: hayat ve süreklilik.' }, grid: [
    '.............', '.............', '#.....#.....#', '.#...#.#...#.', '..#.#...#.#..', '...#.....#...', '.............',
    '...#.....#...', '..#.#...#.#..', '.#...#.#...#.', '#.....#.....#', '.............', '.............'] },
} as const;

export type MotifKey = keyof typeof MOTIFS;

export function motifMask(grid: readonly string[]): string {
  let rects = '';
  grid.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '#') rects += "<rect x='" + x + "' y='" + y + "' width='1' height='1'/>"; });
  return 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 13 13' shape-rendering='crispEdges'>" + rects + '</svg>') + '")';
}

export const motifLabel = (key: MotifKey) => {
  const m = MOTIFS[key];
  return `${m.name} — ${m.meaning.tr} / ${m.meaning.en}`;
};
