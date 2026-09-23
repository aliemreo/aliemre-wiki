/* Linkable terms.  Copy refers to them with [[key]] (renders the label) or
   [[key|custom text]]; <Rich> turns a token into a link with a hover preview
   card, the pipes and `search` flatten it with plain().  Adding a term = one row
   here (+ `npm run previews` for its screenshot).  Blurbs state only what the
   owner has said about the place; keep them to one line, both languages.
   Imports types only: this file is loaded by Node scripts. */
import type { Bi } from './types.ts';

export interface LinkDef {
  label: string;
  href?: string;          // omit while unknown: the term still gets its card, just no link
  blurb: Bi;
  preview?: string;       // image src; defaults to ./previews/<key>.webp
  confirm?: boolean;      // URL is a best guess the owner should check
}

export const LINKS: Record<string, LinkDef> = {
  tazi: { label: 'TAZI', href: 'https://tazi.ai', blurb: { en: 'Machine learning platform company in Istanbul; where I work.', tr: 'İstanbul’da makine öğrenmesi platformu şirketi; çalıştığım yer.' } },
  netas: { label: 'NETAŞ', href: 'https://netas.com.tr', blurb: { en: 'Turkish ICT and systems-integration company; my R&D internship, summer 2025.', tr: 'Türk bilişim ve sistem entegrasyonu şirketi; 2025 yazındaki Ar-Ge stajım.' } },
  itu: { label: 'İTÜ', href: 'https://www.itu.edu.tr', blurb: { en: 'Istanbul Technical University, where I study computer engineering.', tr: 'İstanbul Teknik Üniversitesi; bilgisayar mühendisliği okuduğum yer.' } },
  tuni: { label: 'Tampere University', href: 'https://www.tuni.fi/en', blurb: { en: 'Finland; my exchange semester, spring 2026.', tr: 'Finlandiya; 2026 baharındaki değişim dönemim.' } },
  audicamp: { label: 'Audi Development Camp', href: 'https://audicamp.sze.hu/home', blurb: { en: 'Summer engineering programme by Széchenyi István University and Audi Hungaria in Győr.', tr: 'Széchenyi István Üniversitesi ile Audi Hungaria’nın Győr’deki yaz mühendislik programı.' } },
  mat: { label: 'MAT Consultancy', href: 'https://matpack.net', blurb: { en: 'Packaging solutions company in Istanbul; two years of digital transformation work there.', tr: 'İstanbul’da ambalaj çözümleri şirketi; iki yıl dijital dönüşüm çalışması.' } },
  genarion: { label: 'Genarion', href: 'https://genarion.com', confirm: true, blurb: { en: 'GenAI solutions studio in Istanbul; solution architect there in spring 2025.', tr: 'İstanbul’da üretken yapay zekâ çözümleri stüdyosu; 2025 baharında çözüm mimarıydım.' } },
  fll: { label: 'FLL', href: 'https://firstlegoleague.org', blurb: { en: 'FIRST LEGO League, the school robotics competition I captained a team in.', tr: 'FIRST LEGO League; lisede takım kaptanlığı yaptığım robotik yarışması.' } },
};
