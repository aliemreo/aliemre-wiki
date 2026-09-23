/* The command table.  English name first, Turkish alias second; both always
   work regardless of the interface language.  Adding a command = one row. */
import { BGS, CONTENT, PALETTES, TAGS } from '@/content/content.ts';
import { TOOLS } from '@/content/tools.ts';
import type { Bi } from '@/content/types.ts';
import type { Engine } from '@/store/engine.ts';
import { FONTS } from '@/lib/prefs.ts';

export interface Command {
  names: string[];
  args?: readonly string[];       // Tab-completion candidates for the first argument
  desc?: Bi;
  hidden?: boolean;               // runs, but is not listed by help
  run: (arg: string, line: string) => void;
}

export function cmds(e: Engine): Command[] {
  const m = e.msg(), meta = CONTENT.meta;
  const slugs = CONTENT.projects.map(p => p.slug);
  const rest = (line: string) => line.replace(/^\S+\s*/, '');
  const list = (a: string, all: () => void, one: (t: string) => void, goto: () => void) =>
    a ? (a === 'all' || a === 'hepsi' ? all() : one(a)) : goto();
  return [
    { names: ['help', 'yardım', '?'], desc: { en: '[command]  this list, or one command in detail', tr: '[komut]  bu liste veya bir komutun ayrıntısı' }, run: a => e.out(a ? e.helpOne(a) : e.helpText()) },
    { names: ['projects', 'projeler'], args: ['all', ...TAGS], desc: { en: '[tag]  list or filter projects', tr: '[etiket]  projeleri listele veya filtrele' }, run: a => list(a, () => e.clearFilter(), t => e.filterTo(t), () => e.goto('projects')) },
    { names: ['project', 'proje'], args: slugs, desc: { en: '<slug>  open a project', tr: '<slug>  bir projeyi aç' }, run: a => (a ? e.openProject(a) : e.out(m.projectList(slugs.join(', ')))) },
    { names: ['now', 'şimdi'], desc: { en: 'what I am doing this month', tr: 'bu ay ne yapıyorum' }, run: () => e.goto('now') },
    { names: ['about', 'hakkında', 'hakkımda'], desc: { en: 'who I am', tr: 'kimim' }, run: () => e.goto('about') },
    { names: ['experience', 'deneyim'], desc: { en: 'where I have worked', tr: 'nerelerde çalıştım' }, run: () => e.goto('experience') },
    { names: ['education', 'eğitim'], desc: { en: 'school', tr: 'okul' }, run: () => e.goto('education') },
    { names: ['reading', 'okuma', 'papers'], args: ['all', ...TAGS], desc: { en: '[tag]  papers, books, posts', tr: '[etiket]  makaleler, kitaplar, yazılar' }, run: a => list(a, () => e.clearReadingFilter(), t => e.readingTo(t), () => e.goto('reading')) },
    { names: ['writing', 'yazılar'], desc: { en: 'posts and notes', tr: 'yazılar ve notlar' }, run: () => e.goto('writing') },
    { names: ['pipes', 'borular'], desc: { en: 'query the content like a dataset', tr: 'içeriği veri seti gibi sorgula' }, run: () => e.out(m.pipesHelp) },
    { names: ['tools', 'araçlar'], desc: { en: 'small utilities that run here', tr: 'burada çalışan küçük yardımcılar' }, run: () => e.out([m.toolsHead, ...TOOLS.map(t => `  ${t.usage.padEnd(14)} ${e.L(t.desc)}`)].join('\n')) },
    { names: ['echo', 'guestbook', 'defter'], desc: { en: '<message>  sign the guestbook', tr: '<mesaj>  ziyaretçi defterini imzala' }, run: (a, line) => (a ? e.echoLine(rest(line)) : e.goto('guestbook')) },
    ...TOOLS.map<Command>(t => ({ names: t.names, hidden: true, run: (_a, line) => e.out(t.run(rest(line), { lang: e.doc.lang, pipesHelp: m.pipesHelp })) })),
    { names: ['skills', 'yetenekler'], desc: { en: 'what I work with', tr: 'neyle çalışıyorum' }, run: () => e.goto('skills') },
    { names: ['contact', 'iletişim'], args: ['email', 'github', 'linkedin', 'cv'], desc: { en: '[email|github|linkedin|cv]', tr: '[email|github|linkedin|cv]' }, run: a => {
      if (!a) return e.goto('contact');
      if (a === 'email' || a === 'eposta' || a === 'e-posta') return e.copyEmail();
      if (a === 'github') return e.openLink(meta.github, 'GitHub');
      if (a === 'linkedin') return e.openLink(meta.linkedin, 'LinkedIn');
      if (a === 'cv') return e.openLink(meta.cv, 'CV');
      e.goto('contact');
    } },
    { names: ['mail', 'posta'], desc: { en: '[message]  write to me from here', tr: '[mesaj]  buradan bana yazın' }, run: (_a, line) => e.openMail(rest(line)) },
    { names: ['cv'], desc: { en: 'download the CV', tr: 'CV indir' }, run: () => e.openLink(meta.cv, 'CV') },
    { names: ['theme', 'tema'], args: ['light', 'dark'], desc: { en: '[light|dark]', tr: '[açık|koyu]' }, run: a => e.setTheme(a) },
    { names: ['palette', 'color', 'renk'], args: PALETTES, desc: { en: '[name]  accent colour: ' + PALETTES.join(' '), tr: '[ad]  vurgu rengi: ' + PALETTES.join(' ') }, run: a => (a ? e.setPalette(a) : e.cyclePalette()) },
    { names: ['lang', 'dil'], args: ['en', 'tr'], desc: { en: '[en|tr]', tr: '[en|tr]' }, run: a => e.setLang(a) },
    { names: ['term', 'terminal'], args: ['open', 'wide', 'full', 'mini', 'fold'], desc: { en: '[open|wide|full|mini|fold|<px>]  size this window', tr: '[open|wide|full|mini|fold|<px>]  bu pencereyi boyutlandır' }, run: a => e.termCmd(a) },
    { names: ['font', 'yazı'], args: FONTS, desc: { en: '[geist|inter]  typeface set', tr: '[geist|inter]  yazı tipi' }, run: a => e.setFont(a) },
    { names: ['search', 'ara'], desc: { en: '<text>  find it anywhere on this page', tr: '<metin>  sayfanın her yerinde ara' }, run: (_a, line) => e.search(rest(line)) },
    { names: ['ask', 'sor'], desc: { en: '<question>  ask me about anything on this page', tr: '<soru>  bu sayfadaki her şeyi bana sor' }, run: (_a, line) => { e.ask(rest(line)); } },
    { names: ['debate', 'tartış'], desc: { en: '<question>  should you hire me? two characters argue it out', tr: '<soru>  beni işe almalı mısınız? iki karakter tartışır' }, run: (_a, line) => { e.debate(rest(line)); } },
    { names: ['share', 'paylaş'], desc: { en: 'copy a link to this exact view', tr: 'bu görünümün bağlantısını kopyala' }, run: () => e.shareLink() },
    { names: ['print', 'yazdır'], desc: { en: 'print or save the page as a PDF', tr: 'sayfayı yazdır veya PDF olarak kaydet' }, run: () => e.print() },
    { names: ['bg'], args: BGS, desc: { en: '[scan|flat]  page texture', tr: '[scan|flat]  sayfa dokusu' }, run: a => e.setBg(a) },
    { names: ['back', 'geri'], desc: { en: 'close the open project', tr: 'açık projeyi kapat' }, run: () => e.closeProject() },
    { names: ['top', 'başa'], desc: { en: 'scroll to the top', tr: 'başa dön' }, run: () => e.goto('top') },
    { names: ['colophon', 'kolofon'], desc: { en: 'how this site is made', tr: 'bu site nasıl yapıldı' }, run: () => e.goto('colophon') },
    { names: ['history', 'geçmiş'], desc: { en: 'what you typed this session', tr: 'bu oturumda yazdıklarınız' }, run: () => { const h = e.history(); e.out(h.length ? h.map((x, i) => `${String(i + 1).padStart(3)}  ${x}`).join('\n') : m.noHistory); } },
    { names: ['clear', 'temizle'], desc: { en: 'clear the terminal', tr: 'terminali temizle' }, run: () => e.clearLog() },
    { names: ['ls'], hidden: true, run: () => e.out(m.ls) },
    { names: ['whoami'], hidden: true, run: () => e.out(m.whoami) },
    { names: ['sudo'], hidden: true, run: () => e.out(m.sudo) },
    { names: ['rm'], hidden: true, run: () => e.out(m.rm) },
    { names: ['exit', 'quit', 'çıkış'], hidden: true, run: () => e.out(m.exit) },
    { names: ['vim', 'vi', 'nano', 'emacs'], hidden: true, run: () => e.out(m.vim) },
  ];
}
