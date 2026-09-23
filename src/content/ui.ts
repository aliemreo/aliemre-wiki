/* UI chrome strings (labels, notes, terminal copy) and terminal messages.
   `tr` is typed against `en`, so a string added to one language without the
   other is a type error. */
import { CONTENT, TAGS } from './content.ts';
import { SECTIONS } from './sections.ts';
import { SOURCES } from '@/lib/pipes.ts';
import type { Lang } from './types.ts';

const uiEn = {
  barLabel: 'Command bar. Type help for a list of commands.', kbd: '/ focus · ? help · Tab complete', hintEmpty: 'type help, or press ?',
  now: 'Now', about: 'About', experience: 'Experience', education: 'Education', projects: 'Projects', reading: 'Reading', writing: 'Writing', tools: 'Tools', skills: 'Skills', guestbook: 'Guestbook', contact: 'Contact', colophon: 'Colophon',
  skillsNote: 'Click a skill to see projects that use it.', readingNote: 'Papers, books and posts, one sentence each on what I took from them. Newest first.', toolsNote: 'Small utilities I use myself. Each one is a command in the bar; click a usage line to try it.', guestbookNote: 'Leave a line. Entries appear after I read them. Also: echo <message> in the bar.',
  email: 'Email', cvDownload: 'Download CV (PDF)', blurbGithub: 'My code and projects on GitHub', blurbLinkedin: 'My profile on LinkedIn', blurbCv: 'My CV as a PDF', blurbWriting: 'A post I wrote', updated: 'Last updated', light: 'Light', dark: 'Dark', lang: 'Türkçe', clear: 'clear', back: 'back',
  differently: 'What I\'d do differently:', writeup: 'write-up', imageSlot: 'image or diagram slot — optional', noProjects: 'No projects with that tag yet.', noReading: 'Nothing with that tag yet.',
  copied: 'copied', copyFail: 'copy failed, select it manually', copyHint: 'click to copy', all: 'all', indexLabel: 'Sections', terminalLabel: 'Terminal', paletteLabel: 'Palette', intro: 'Intro',
  welcome: 'ali@site — a shell for this page.\nhelp lists commands; pipes work:  projects | stack | uniq -c\nHover anything on the left and press Enter to open it.',
  guestName: 'name', guestMsg: 'message', pending: 'awaiting review', copyEntry: 'copy',
  groupMe: 'Me', groupWork: 'Work', groupShell: 'Shell', groupHello: 'Say hi',
  emptySection: 'Nothing here yet.', showLog: 'Show the terminal log', hideLog: 'Hide the terminal log',
  cmdkLabel: 'Search the site (⌘K)', cmdkPlaceholder: 'Type a section, project or command…', cmdkRun: 'Run in terminal', cmdkHint: '↑↓ move · ↵ run · esc close',
  gSections: 'Sections', gProjects: 'Projects', gCommands: 'Commands', gPlaces: 'Places', gPrefs: 'Preferences',
  askPlaceholder: 'ask me a question', askLabel: 'Ask me a question (⌘⇧K)', searchPlaceholder: 'search the site', searchLabel: 'Search the site (⌘⇧K)', askOpen: 'Ask a question', askFoot: 'esc closes', askStop: 'stop', askStopped: 'stopped', askCopy: 'copy answer', askClear: 'clear', askClose: 'Close the panel', askStarters: 'try asking',
  debateThinking: 'convening the bench', debateVerdict: 'verdict', debateAskThem: 'ask them something else', debateInterrupted: 'interrupted', debateUnverified: 'unverified', debateOpen: 'Debate my fit', debateBench: 'the bench rules', ctaDebate: 'should you hire me?', debateExplain: 'Two characters — a recruiter and a staff engineer — argue it over my files, live, in about a minute. The bench rules; you can interrupt with a question.',
  mailTitle: 'Write to me', mailSentFlap: 'Sent ✓', mailName: 'name', mailEmail: 'your email', mailMessage: 'message', mailSend: 'send', mailSending: 'sending…', mailSent: 'sent — I will reply to your address.', mailCancel: 'cancel', mailWrite: 'write to me from here', mailBadEmail: 'that email address does not look right', mailShort: 'a few more words, please (10 characters at least)', mailCopyInstead: 'copy the address instead', mailReplyNote: 'Replies go to the address you give.',
  ctaTerminal: 'open the terminal', ctaEmail: 'email me', marqueeLabel: 'Where I have worked and studied', fontGeist: 'Geist', fontInter: 'Inter Tight',
  openTerm: 'Open the terminal', foldTerm: 'Fold the terminal', zoomTerm: 'Widen or narrow the terminal', termTab: 'terminal',
  minimizeTerm: 'Minimize to a small window', restoreTerm: 'Restore the window', resizeTerm: 'Drag to resize the terminal (arrow keys, Home resets)', resizeLog: 'Drag to resize the log', termModeNext: { open: 'Widen (wide)', wide: 'Full screen', full: 'Back to normal width', mini: 'Restore the window' } as Record<string, string>,
};
const uiTr: typeof uiEn = {
  barLabel: 'Komut satırı. Komut listesi için yardım yazın.', kbd: '/ odak · ? yardım · Tab tamamla', hintEmpty: 'yardım yazın veya ? basın',
  now: 'Şimdi', about: 'Hakkımda', experience: 'Deneyim', education: 'Eğitim', projects: 'Projeler', reading: 'Okumalar', writing: 'Yazılar', tools: 'Araçlar', skills: 'Yetenekler', guestbook: 'Ziyaretçi defteri', contact: 'İletişim', colophon: 'Kolofon',
  skillsNote: 'Bir yeteneğe tıklayıp onu kullanan projeleri görün.', readingNote: 'Makaleler, kitaplar ve yazılar; her biri için aldığım şey üzerine tek cümle. En yeni önce.', toolsNote: 'Kendim kullandığım küçük yardımcılar. Her biri satırda bir komut; denemek için kullanım satırına tıklayın.', guestbookNote: 'Bir satır bırakın. Girdiler okuduktan sonra görünür. Ayrıca: satırda echo <mesaj>.',
  email: 'E-posta', cvDownload: 'CV indir (PDF)', blurbGithub: 'GitHub’daki kodlarım ve projelerim', blurbLinkedin: 'LinkedIn profilim', blurbCv: 'PDF olarak CV’m', blurbWriting: 'Yazdığım bir yazı', updated: 'Son güncelleme', light: 'Açık', dark: 'Koyu', lang: 'English', clear: 'temizle', back: 'geri',
  differently: 'Farklı yapacağım şey:', writeup: 'yazı', imageSlot: 'görsel veya diyagram alanı — isteğe bağlı', noProjects: 'Bu etiketle henüz proje yok.', noReading: 'Bu etiketle henüz bir şey yok.',
  copied: 'kopyalandı', copyFail: 'kopyalanamadı, elle seçin', copyHint: 'kopyalamak için tıklayın', all: 'hepsi', indexLabel: 'Bölümler', terminalLabel: 'Terminal', paletteLabel: 'Palet', intro: 'Giriş',
  welcome: 'ali@site — bu sayfanın kabuğu.\nyardım komutları listeler; borular çalışır:  projeler | stack | uniq -c\nSoldaki bir şeyin üzerine gelip Enter\'a basın.',
  guestName: 'ad', guestMsg: 'mesaj', pending: 'inceleme bekliyor', copyEntry: 'kopyala',
  groupMe: 'Ben', groupWork: 'İşler', groupShell: 'Kabuk', groupHello: 'Merhaba',
  emptySection: 'Henüz bir şey yok.', showLog: 'Terminal günlüğünü göster', hideLog: 'Terminal günlüğünü gizle',
  cmdkLabel: 'Sitede ara (⌘K)', cmdkPlaceholder: 'Bölüm, proje veya komut yazın…', cmdkRun: 'Terminalde çalıştır', cmdkHint: '↑↓ gez · ↵ çalıştır · esc kapat',
  gSections: 'Bölümler', gProjects: 'Projeler', gCommands: 'Komutlar', gPlaces: 'Yerler', gPrefs: 'Tercihler',
  askPlaceholder: 'bana bir soru sor', askLabel: 'Bana soru sor (⌘⇧K)', searchPlaceholder: 'sitede ara', searchLabel: 'Sitede ara (⌘⇧K)', askOpen: 'Soru sor', askFoot: 'esc kapatır', askStop: 'durdur', askStopped: 'durduruldu', askCopy: 'cevabı kopyala', askClear: 'temizle', askClose: 'Paneli kapat', askStarters: 'şunları deneyin',
  debateThinking: 'kurul toplanıyor', debateVerdict: 'karar', debateAskThem: 'onlara başka bir şey sor', debateInterrupted: 'kesildi', debateUnverified: 'doğrulanmadı', debateOpen: 'Uygunluğumu tartıştır', debateBench: 'kurul karar verir', ctaDebate: 'beni işe almalı mısınız?', debateExplain: 'İki karakter — bir işe alım uzmanı ve bir kıdemli mühendis — bunu dosyalarım üzerinden, canlı, bir dakikada tartışır. Kurul karar verir; araya soruyla girebilirsiniz.',
  mailTitle: 'Bana yazın', mailSentFlap: 'Gönderildi ✓', mailName: 'ad', mailEmail: 'e-posta adresiniz', mailMessage: 'mesaj', mailSend: 'gönder', mailSending: 'gönderiliyor…', mailSent: 'gönderildi — adresinize cevap vereceğim.', mailCancel: 'vazgeç', mailWrite: 'buradan bana yazın', mailBadEmail: 'bu e-posta adresi doğru görünmüyor', mailShort: 'biraz daha yazın lütfen (en az 10 karakter)', mailCopyInstead: 'bunun yerine adresi kopyala', mailReplyNote: 'Cevaplar verdiğiniz adrese gider.',
  ctaTerminal: 'terminali aç', ctaEmail: 'e-posta gönder', marqueeLabel: 'Çalıştığım ve okuduğum yerler', fontGeist: 'Geist', fontInter: 'Inter Tight',
  openTerm: 'Terminali aç', foldTerm: 'Terminali katla', zoomTerm: 'Terminali genişlet veya daralt', termTab: 'terminal',
  minimizeTerm: 'Küçük pencereye indir', restoreTerm: 'Pencereyi geri getir', resizeTerm: 'Terminali boyutlandırmak için sürükle (ok tuşları, Home sıfırlar)', resizeLog: 'Günlüğü boyutlandırmak için sürükle', termModeNext: { open: 'Genişlet (wide)', wide: 'Tam ekran', full: 'Normal genişliğe dön', mini: 'Pencereyi geri getir' },
};
export type UiStrings = typeof uiEn;
export const UI: Record<Lang, UiStrings> = { en: uiEn, tr: uiTr };

const stagesLine = 'grep [-v] <re> · where <field><op><val> · sort [field] [-r] · uniq [-c] · head n · tail n · count · tags · stack · fields a,b · json · shuf';
const msgEn = {
  goto: (s: string) => `→ ${s}`, filtered: (n: number, t: string) => `${n} project${n === 1 ? '' : 's'} tagged ${t}`, allProjects: 'showing all projects',
  noTag: (t: string) => `no tag called ${t} — tags: ${TAGS.join(', ')}`, noProject: (s: string) => `no project called ${s} — try: projects`, projectList: (l: string) => `projects: ${l}`,
  opened: (s: string) => `→ project ${s}`, closed: 'closed', nothingOpen: 'nothing to go back from',
  notFound: (c: string, s: string | null) => `command not found: ${c}` + (s ? ` — did you mean ${s}?` : ' — try help'),
  theme: (t: string) => `theme: ${t}`, palette: (p: string) => `palette: ${p}`, noPalette: (p: string, l: string) => `no palette called ${p} — try: ${l}`,
  bg: (b: string) => `background: ${b}`, noBg: (b: string, l: string) => `no background called ${b} — try: ${l}`, lang: 'language: English',
  font: (f: string) => `font: ${f}`, noFont: (f: string, l: string) => `no font set called ${f} — try: ${l}`,
  termState: (mode: string, w: number) => `terminal: ${mode}${w ? `, ${w}px wide` : ''} — try: term wide | full | mini | fold | <px>`, termMode: (mode: string) => `terminal: ${mode}`, termWidth: (w: number) => `terminal: ${w}px wide`, noTermMode: (a: string) => `no terminal mode called ${a} — try: open, wide, full, mini, fold, or a width in px`,
  copied: 'email copied to clipboard', copyFail: (e: string) => `could not copy — the address is ${e}`, opening: (s: string) => `opening ${s}`, noHistory: 'no commands yet',
  whoami: `${CONTENT.meta.name} — ${CONTENT.meta.role.en}`, ls: SECTIONS.join('  '),
  sudo: 'you already have every permission this page offers.', rm: 'nothing to remove. the content lives in one file, and it is staying there.', exit: 'this is a web page. the tab close button is up there.', vim: ':q!  you are free.',
  help: 'commands (arguments in brackets):', helpUsage: 'usage:', helpExample: 'example:', helpArgs: 'arguments:', helpTail: 'pipes work too:  projects | grep agents | stack | uniq -c   (type pipes)\ncommands also work in Turkish: projeler, hakkında, iletişim, tema, dil …',
  noSource: (s: string, l: string) => `${s} cannot be piped — sources: ${l}`, noStage: (s: string, l: string) => `unknown stage: ${s} — stages: ${l}`, noRows: '(no results)',
  crashed: (c: string) => `${c} broke — that is a bug on my side, not yours`, printing: 'opening the print dialogue — terminal, forms and tools are left out',
  copiedLink: 'copied — the link to this exact view is on your clipboard', copyLinkFail: (u: string) => `could not copy — the link is ${u}`,
  searchUsage: 'usage: search <text>', askUsage: 'usage: ask <question>', debateUsage: 'usage: debate <question>', askUnset: 'no answering endpoint is configured yet — try: search <text>', askError: (e: string) => `could not get an answer (${e}) — try: search <text>`, noMatch: (q: string) => `no match for ${q}`, notAPage: (p: string) => `no page at ${p} — showing the top`,
  searchIn: { projects: 'projects', reading: 'reading', writing: 'writing', skills: 'skills', experience: 'experience', education: 'education', tools: 'tools', text: 'page text' } as Record<string, string>,
  pipesHelp: ['the content is a dataset. sources produce rows, stages transform them:', '  sources   ' + SOURCES.join(' '), '  stages    ' + stagesLine, '', '  projects | grep agents', '  projects | stack | uniq -c', '  reading | where year>=2026 | sort date -r | fields date,title', '  skills | where tag=ml | count', '  history | tail 3'].join('\n'),
  readFiltered: (n: number, t: string) => `${n} reading entr${n === 1 ? 'y' : 'ies'} tagged ${t}`, allReading: 'showing all reading', toolsHead: 'tools:',
  mailOpen: 'opening the mail dialog', mailSent: '→ mail sent — the reply goes to the address you gave', mailError: (e: string) => `could not send (${e}) — try: contact email`, mailUnset: 'no mail endpoint yet — the address is copied instead',
  echoUsage: 'usage: echo <message>  (add your name with  echo name: message)', echoed: 'posted — it appears after review. thanks.', echoOpen: 'opening a prefilled GitHub issue to post it',
};
const msgTr: typeof msgEn = {
  goto: s => `→ ${s}`, filtered: (n, t) => `${t} etiketli ${n} proje`, allProjects: 'tüm projeler gösteriliyor',
  noTag: t => `${t} diye bir etiket yok — etiketler: ${TAGS.join(', ')}`, noProject: s => `${s} diye bir proje yok — deneyin: projeler`, projectList: l => `projeler: ${l}`,
  opened: s => `→ proje ${s}`, closed: 'kapatıldı', nothingOpen: 'geri dönülecek bir şey yok',
  notFound: (c, s) => `komut bulunamadı: ${c}` + (s ? ` — ${s} mi demek istediniz?` : ' — yardım yazmayı deneyin'),
  theme: t => `tema: ${t === 'dark' ? 'koyu' : 'açık'}`, palette: p => `palet: ${p}`, noPalette: (p, l) => `${p} diye bir palet yok — deneyin: ${l}`,
  bg: b => `arka plan: ${b}`, noBg: (b, l) => `${b} diye bir arka plan yok — deneyin: ${l}`, lang: 'dil: Türkçe',
  font: f => `yazı tipi: ${f}`, noFont: (f, l) => `${f} diye bir yazı tipi yok — deneyin: ${l}`,
  termState: (mode, w) => `terminal: ${mode}${w ? `, ${w}px geniş` : ''} — deneyin: term wide | full | mini | fold | <px>`, termMode: mode => `terminal: ${mode}`, termWidth: w => `terminal: ${w}px geniş`, noTermMode: a => `${a} diye bir terminal modu yok — deneyin: open, wide, full, mini, fold veya px genişlik`,
  copied: 'e-posta panoya kopyalandı', copyFail: e => `kopyalanamadı — adres: ${e}`, opening: s => `${s} açılıyor`, noHistory: 'henüz komut yok',
  whoami: `${CONTENT.meta.name} — ${CONTENT.meta.role.tr}`, ls: SECTIONS.join('  '),
  sudo: 'bu sayfanın sunduğu tüm izinlere zaten sahipsiniz.', rm: 'silinecek bir şey yok. içerik tek bir dosyada ve orada kalıyor.', exit: 'bu bir web sayfası. sekmeyi kapatma düğmesi yukarıda.', vim: ':q!  özgürsünüz.',
  help: 'komutlar (parametreler köşeli parantezde):', helpUsage: 'kullanım:', helpExample: 'örnek:', helpArgs: 'parametreler:', helpTail: 'borular da çalışır:  projeler | grep agents | stack | uniq -c   (borular yazın)\nkomutlar İngilizce de çalışır: projects, about, contact, theme, lang …',
  noSource: (s, l) => `${s} boruya verilemez — kaynaklar: ${l}`, noStage: (s, l) => `bilinmeyen aşama: ${s} — aşamalar: ${l}`, noRows: '(sonuç yok)',
  crashed: c => `${c} çalışmadı — bu bendeki bir hata`, printing: 'yazdırma penceresi açılıyor — terminal, formlar ve araçlar dışarıda kalır',
  copiedLink: 'kopyalandı — bu görünümün bağlantısı panoda', copyLinkFail: u => `kopyalanamadı — bağlantı: ${u}`,
  searchUsage: 'kullanım: ara <metin>', askUsage: 'kullanım: sor <soru>', debateUsage: 'kullanım: tartış <soru>', askUnset: 'henüz cevap veren bir uç nokta yok — deneyin: ara <metin>', askError: e => `cevap alınamadı (${e}) — deneyin: ara <metin>`, noMatch: q => `${q} diye bir şey yok`, notAPage: p => `${p} diye bir sayfa yok — başa dönüldü`,
  searchIn: { projects: 'projeler', reading: 'okumalar', writing: 'yazılar', skills: 'yetenekler', experience: 'deneyim', education: 'eğitim', tools: 'araçlar', text: 'sayfa metni' },
  pipesHelp: ['içerik bir veri seti. kaynaklar satır üretir, aşamalar dönüştürür:', '  kaynaklar ' + SOURCES.join(' '), '  aşamalar  ' + stagesLine, '', '  projeler | grep agents', '  projeler | stack | uniq -c', '  okuma | where year>=2026 | sort date -r | fields date,title', '  yetenekler | where tag=ml | count', '  geçmiş | tail 3'].join('\n'),
  readFiltered: (n, t) => `${t} etiketli ${n} okuma`, allReading: 'tüm okumalar gösteriliyor', toolsHead: 'araçlar:',
  mailOpen: 'e-posta penceresi açılıyor', mailSent: '→ gönderildi — cevap verdiğiniz adrese gelecek', mailError: e => `gönderilemedi (${e}) — deneyin: iletişim email`, mailUnset: 'henüz e-posta uç noktası yok — bunun yerine adres kopyalanıyor',
  echoUsage: 'kullanım: echo <mesaj>  (adınızı eklemek için  echo ad: mesaj)', echoed: 'gönderildi — incelemeden sonra görünür. teşekkürler.', echoOpen: 'göndermek için önceden doldurulmuş bir GitHub issue açılıyor',
};
export type Msg = typeof msgEn;
export const MSG: Record<Lang, Msg> = { en: msgEn, tr: msgTr };
