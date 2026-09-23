/* ============================================================================
   CONTENT — edit this file, never the components.
   Any user-visible string is a plain string or an { en, tr } pair.  Unfinished
   copy starts with "Placeholder:".  Bump meta.updated on every content change;
   scripts/preflight.mjs fails the deploy if you forget.

   This file must stay free of imports other than types: it is also loaded by
   Node (scripts/preflight.mjs) outside the bundler.
   ========================================================================= */
import type { Content } from './types.ts';

export const TAGS = ['ml', 'agents', 'systems', 'web', 'research'] as const;
export const PALETTES = ['aqua', 'amber', 'mint', 'sky', 'rose', 'lime', 'violet', 'paper'] as const;
export const BGS = ['scan', 'flat'] as const;

export const CONTENT: Content = {
  meta: {
    name: 'Ali Emre Özcan',
    role: { en: 'computer engineering student · machine learning engineer at TAZI (part-time)', tr: 'bilgisayar mühendisliği öğrencisi · TAZI’de yarı zamanlı makine öğrenmesi mühendisi' },
    email: 'hi@aliemreozcan.com',
    github: 'https://github.com/aliemreo', githubLabel: 'github.com/aliemreo',
    linkedin: 'https://www.linkedin.com/in/placeholder', linkedinLabel: 'linkedin.com/in/placeholder',
    cv: '#',
    ask: 'Placeholder: https://aliemre-ask.<account>.workers.dev',   // see ask/README.md
    mail: 'https://aliemre-ask.aliemreo.workers.dev/mail',   // see ask/README.md, Mail
    askStarters: [
      { en: 'What are you working on right now?', tr: 'Şu anda ne üzerinde çalışıyorsun?' },
      { en: 'Which projects use reinforcement learning?', tr: 'Hangi projelerde pekiştirmeli öğrenme var?' },
      { en: 'How can I reach you?', tr: 'Sana nasıl ulaşabilirim?' },
      { en: 'Ask Defne and Tolga: would you hire him?', tr: 'Defne ile Tolga\'ya sor: onu işe alır mıydınız?' },   // starts the debate (§5.14); rename with ask/characters.json
    ],
    debateStarter: { en: 'Ask Defne and Tolga: would you hire him for an ML engineering role?', tr: 'Defne ile Tolga\'ya sor: onu bir makine öğrenmesi mühendisi rolü için işe alır mıydınız?' },   // the ⌘K "Debate my fit" row asks this
    updated: '2026-09-23',   // bump on every content change
  },
  hero: {
    headline: {
      before: { en: 'I build', tr: '' },
      rotating: { en: ['ML models', 'agent systems', 'RL controllers', 'things that ship'], tr: ['ML modelleri', 'ajan sistemleri', 'RL denetleyicileri', 'işe yarayan şeyler'] },
      after: { en: '', tr: 'geliştiriyorum' },
    },
    line1: { en: "I'm a final-year computer engineering student at [[itu|İTÜ]] and a part-time machine learning engineer at [[tazi]], where I build ML models and tool-using agent systems.", tr: '[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisiyim. [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisi olarak ML modelleri ve araç kullanan ajan sistemleri geliştiriyorum.' },
    line2: { en: "I'm interested in applied machine learning and systems engineering: generative AI, agentic systems and reinforcement learning for robotics.", tr: 'İlgi alanım uygulamalı makine öğrenmesi ve sistem mühendisliği: üretken yapay zekâ, ajan sistemleri ve robotik için pekiştirmeli öğrenme.' },
    avail: { en: 'Placeholder: Open to full-time roles from mid-2027', tr: 'Placeholder: 2027 ortasından itibaren tam zamanlı rollere açığım' },
  },
  now: {
    date: { en: 'September 2026', tr: 'Eylül 2026' },
    text: { en: 'Placeholder: This month at TAZI I am working on … (the specific model or agent component). I am learning … (a paper, a tool, a course). Outside work I am … (thesis progress or a side project). Update this paragraph monthly and change the date.', tr: "Placeholder: Bu ay TAZI'de … üzerinde çalışıyorum (belirli model veya ajan bileşeni). … öğreniyorum (bir makale, araç veya ders). İş dışında … (tez ilerlemesi veya yan proje). Bu paragrafı her ay güncelleyip tarihi değiştir." },
  },
  about: {
    en: [
      "I'm a final-year computer engineering student at [[itu|İTÜ]] (GPA 3.94/4.00) and a part-time machine learning engineer at [[tazi]], where I started as an intern in the summer of 2026.",
      'Most recently I led the reinforcement-learning controller of a humanoid throwing project at the [[audicamp]] in Győr; before that I spent two years at [[mat]] building a CRM and an ML-driven specification platform. I spent spring 2026 on exchange at [[tuni]].',
      "Outside class I'm in the ACM student club, and I once captained a high-school [[fll]] robotics team.",
    ],
    tr: [
      '[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisiyim (not ortalaması 3,94/4,00) ve 2026 yazında stajyer olarak başladığım [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisi olarak çalışıyorum.',
      'En son Győr’deki [[audicamp]]’te bir insansı robotun atış projesinde pekiştirmeli öğrenme denetleyicisini yönettim; öncesinde iki yıl [[mat]]’de bir CRM ile ML destekli bir spesifikasyon platformu geliştirdim. 2026 baharını [[tuni|Tampere Üniversitesi]]’nde değişim öğrencisi olarak geçirdim.',
      'Ders dışında ACM öğrenci kulübündeyim; lisede bir [[fll]] robotik takımının kaptanlığını yaptım.',
    ],
  },
  experience: [
    { dates: { en: 'Sep 2026 – present', tr: 'Eyl 2026 – devam' }, board: '2026', status: { en: 'now', tr: 'devam' }, title: { en: 'Machine learning engineer (part-time)', tr: 'Makine öğrenmesi mühendisi (yarı zamanlı)' }, org: '[[tazi|TAZI Bilişim Teknolojileri]], Istanbul',
      bullets: { en: ['Placeholder: the model or agent component you own at TAZI now, with one number.', 'Placeholder: something you took from data to deployment.'], tr: ['Placeholder: TAZI’de şu an sahiplendiğin model veya ajan bileşeni, bir sayıyla.', 'Placeholder: veriden dağıtıma taşıdığın bir iş.'] } },
    { dates: { en: 'Jun 2026 – Sep 2026', tr: 'Haz 2026 – Eyl 2026' }, board: '2026', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'Machine learning intern', tr: 'Makine öğrenmesi stajyeri' }, org: '[[tazi|TAZI Bilişim Teknolojileri]], Istanbul',
      bullets: { en: ['Placeholder: what the internship produced, one concrete result.'], tr: ['Placeholder: stajın ürettiği somut bir sonuç.'] } },
    { dates: { en: 'Jul 2026', tr: 'Tem 2026' }, board: '2026', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'Robotics project manager', tr: 'Robotik proje yöneticisi' }, org: '[[audicamp]], Győr',
      bullets: { en: [
        'Led a six-person, five-country team; owned the RL controller for a Unitree G1 humanoid that throws at targets while walking (MuJoCo).',
        'Final TD3 policy: 0.177 m mean miss, 100% of targets within 0.5 m, no falls.',
        'Staged curriculum with potential-based reward shaping; TD3 over PPO for sample efficiency.',
      ], tr: [
        'Beş ülkeden altı kişilik ekibi yönettim; yürürken hedefe atış yapan Unitree G1 insansının RL denetleyicisi bendeydi (MuJoCo).',
        'Son TD3 politikası: 0,177 m ortalama sapma, hedeflerin %100’ü 0,5 m içinde, düşme yok.',
        'Potansiyel tabanlı ödül şekillendirmeyle aşamalı müfredat; örnek verimliliği için PPO yerine TD3.',
      ] } },
    { dates: { en: 'Mar 2024 – Jan 2026', tr: 'Mar 2024 – Oca 2026' }, board: '2024', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'Digital transformation specialist', tr: 'Dijital dönüşüm uzmanı' }, org: '[[mat]], Istanbul',
      bullets: { en: [
        'Built the company’s integrated CRM and project management platform.',
        'Mapped operations onto a digital architecture for workflows and business goals.',
        'Built an ML-driven specification platform for packaging processes.',
      ], tr: [
        'Şirketin bütünleşik CRM ve proje yönetimi platformunu geliştirdim.',
        'Operasyonları iş akışları ve hedefler için bir dijital mimariye taşıdım.',
        'Ambalaj süreçleri için ML destekli bir spesifikasyon platformu geliştirdim.',
      ] } },
    { dates: { en: 'Jun 2025 – Aug 2025', tr: 'Haz 2025 – Ağu 2025' }, board: '2025', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'R&D intern', tr: 'Ar-Ge stajyeri' }, org: '[[netas]], Istanbul',
      bullets: { en: ['Feedback intelligence pipeline for the Presidency of Religious Affairs: NLP over automatically collected reactions to weekly articles.'], tr: ['Diyanet İşleri Başkanlığı için geri bildirim zekâsı hattı: haftalık yazılara otomatik toplanan tepkiler üzerinde NLP.'] } },
    { dates: { en: 'Feb 2025 – Apr 2025', tr: 'Şub 2025 – Nis 2025' }, board: '2025', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'GenAI solution architect', tr: 'Üretken yapay zekâ çözüm mimarı' }, org: '[[genarion]], Istanbul',
      bullets: { en: ['AI agents and end-to-end GenAI solutions for real-world problems.'], tr: ['Gerçek dünya problemleri için yapay zekâ ajanları ve uçtan uca üretken yapay zekâ çözümleri.'] } },
  ],
  education: [
    { dates: { en: '2022 – 2027', tr: '2022 – 2027' }, board: '2022', status: { en: 'until 2027', tr: '2027’ye dek' }, title: { en: 'B.Sc. Computer Engineering', tr: 'Bilgisayar Mühendisliği, Lisans' }, org: { en: '[[itu|Istanbul Technical University]]', tr: '[[itu|İstanbul Teknik Üniversitesi]]' },
      bullets: { en: ['GPA 3.94/4.00, top-ranking; Dean’s List (Feb 2025).', 'ACM Student Club; KKB Agentic Solutions Hackathon (Dec 2025).', 'Coursework: Real-Time Systems Software, Learning From Data.'], tr: ['Not ortalaması 3,94/4,00, en üst sıralarda; Dekan Onur Listesi (Şub 2025).', 'ACM Öğrenci Kulübü; KKB Agentic Solutions Hackathon (Ara 2025).', 'Dersler: Gerçek Zamanlı Sistem Yazılımı, Veriden Öğrenme.'] } },
    { dates: { en: 'Spring 2026', tr: 'Bahar 2026' }, board: '2026', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'Exchange student, Computer Engineering', tr: 'Değişim öğrencisi, Bilgisayar Mühendisliği' }, org: { en: '[[tuni]], Finland', tr: '[[tuni|Tampere Üniversitesi]], Finlandiya' },
      bullets: { en: ['Coursework: Internet of Things, Fine-Tuning Large Language Models.'], tr: ['Dersler: Nesnelerin İnterneti, Büyük Dil Modellerinin İnce Ayarı.'] } },
  ],
  projects: [
    { slug: 'throwing', featured: true, name: { en: 'Target-Aware Whole-Body Throwing', tr: 'Target-Aware Whole-Body Throwing' }, tags: ['ml', 'research'], stack: ['Python', 'MuJoCo', 'TD3', 'PPO', 'Unitree G1'],
      problem: { en: 'Teach a Unitree G1 humanoid to hit targets at varying distances while walking, in simulation, without falling.', tr: 'Bir Unitree G1 insansıya simülasyonda yürürken, düşmeden, değişen mesafedeki hedefleri vurmayı öğretmek.' },
      outcome: { en: 'The final TD3 policy landed 0.177 m from the target on average, hit 100% of targets within 0.5 m and never fell across a held-out target sweep.', tr: 'Son TD3 politikası ayrılmış hedef taramasında hedeften ortalama 0,177 m sapmayla indi, hedeflerin %100’ünü 0,5 m içinde vurdu ve hiç düşmedi.' },
      links: [{ label: { en: 'code', tr: 'kod' }, href: '#' }],
      writeup: { en: [
        'Built in July 2026 at the [[audicamp]] in Győr by a six-person, five-country team selected for the programme run by Széchenyi István University with Audi Hungaria. I was project manager and integration lead, and owned the reinforcement-learning controller.',
        'The task is staged curriculum learning: a fixed throw first, then throwing while walking, then a target that changes. Potential-based reward shaping kept each stage learnable.',
        'We benchmarked PPO against TD3 and adopted TD3 for its off-policy sample efficiency.',
      ], tr: [
        'Temmuz 2026’da Győr’deki [[audicamp]]’te, Széchenyi István Üniversitesi’nin Audi Hungaria ile yürüttüğü programa seçilen beş ülkeden altı kişilik bir ekiple yapıldı. Proje yöneticisi ve entegrasyon lideriydim; pekiştirmeli öğrenme denetleyicisi bendeydi.',
        'Görev aşamalı müfredat öğrenmesi: önce sabit atış, sonra yürürken atış, sonra değişen hedef. Potansiyel tabanlı ödül şekillendirme her aşamayı öğrenilebilir tuttu.',
        'PPO ile TD3’ü karşılaştırdık; örnek verimliliği için TD3’ü seçtik.',
      ] },
      differently: { en: 'Placeholder: one honest sentence about what you would change.', tr: 'Placeholder: neyi değiştireceğin üzerine dürüst tek cümle.' } },
    { slug: 'crm', name: { en: 'CRM and project management platform', tr: 'CRM ve proje yönetimi platformu' }, tags: ['web', 'systems'], stack: [],
      problem: { en: '[[mat]] needed one place for customer relationships and project tracking that matched how the company works.', tr: '[[mat]]’nin müşteri ilişkileri ve proje takibi için şirketin çalışma biçimine uyan tek bir yere ihtiyacı vardı.' },
      outcome: { en: 'An integrated CRM and project management platform, and a digital architecture that maps the company’s operations onto workflows and business objectives (Mar 2024 – Jan 2026).', tr: 'Bütünleşik bir CRM ve proje yönetimi platformu ile şirket operasyonlarını iş akışlarına ve hedeflere bağlayan bir dijital mimari (Mar 2024 – Oca 2026).' },
      links: [],
      writeup: { en: ['Placeholder: Two to four paragraphs — the stack, the hardest integration, what changed for the team.'], tr: ['Placeholder: İki ila dört paragraf — teknoloji yığını, en zor entegrasyon, ekip için ne değişti.'] }, differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
    { slug: 'specs', name: { en: 'ML-driven specification management for packaging', tr: 'Ambalaj için ML destekli spesifikasyon yönetimi' }, tags: ['ml', 'systems'], stack: [],
      problem: { en: 'Packaging processes at [[mat]] needed a faster, data-driven way to manage specifications.', tr: '[[mat]]’de ambalaj süreçlerinin spesifikasyonları daha hızlı ve veri odaklı yönetecek bir yola ihtiyacı vardı.' },
      outcome: { en: 'An ML-driven specification management platform that optimises packaging processes.', tr: 'Ambalaj süreçlerini eniyileyen ML destekli bir spesifikasyon yönetimi platformu.' },
      links: [],
      writeup: { en: ['Placeholder: what the model predicts, the data it learned from, and the number that mattered.'], tr: ['Placeholder: modelin neyi tahmin ettiği, hangi veriden öğrendiği ve önemli olan sayı.'] }, differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
    { slug: 'feedback', name: { en: 'Feedback intelligence pipeline', tr: 'Geri bildirim zekâsı hattı' }, tags: ['ml'], stack: ['NLP', 'web data collection'],
      problem: { en: 'How does the public react to the Presidency of Religious Affairs’ weekly articles, at scale?', tr: 'Diyanet İşleri Başkanlığı’nın haftalık yazılarına kamuoyu geniş ölçekte nasıl tepki veriyor?' },
      outcome: { en: 'A data-driven pipeline that collects reactions from the web automatically and analyses them with NLP, built during an R&D internship at [[netas]] (summer 2025).', tr: '[[netas]]’taki Ar-Ge stajında (2025 yazı) kurulan, tepkileri webden otomatik toplayıp NLP ile analiz eden veri odaklı bir hat.' },
      links: [],
      writeup: { en: ['Placeholder: the sources collected, the NLP steps, and one finding the pipeline surfaced.'], tr: ['Placeholder: toplanan kaynaklar, NLP adımları ve hattın ortaya çıkardığı bir bulgu.'] }, differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
    { slug: 'agents', name: { en: 'AI agents for real-world problems', tr: 'Gerçek dünya problemleri için yapay zekâ ajanları' }, tags: ['agents'], stack: [],
      problem: { en: 'Placeholder: the problem one of the Genarion agents solved, in one sentence.', tr: 'Placeholder: Genarion ajanlarından birinin çözdüğü problem, tek cümlede.' },
      outcome: { en: 'AI agents and end-to-end solutions built at [[genarion]] (Feb – Apr 2025) as a GenAI solution architect, with a range of tools and technologies.', tr: '[[genarion]]’da (Şub – Nis 2025) üretken yapay zekâ çözüm mimarı olarak çeşitli araç ve teknolojilerle geliştirilen ajanlar ve uçtan uca çözümler.' },
      links: [],
      writeup: { en: ['Placeholder: Two to four paragraphs.'], tr: ['Placeholder: İki ila dört paragraf.'] }, differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
    { slug: 'site', name: { en: 'This site', tr: 'Bu site' }, tags: ['web'], stack: ['React', 'TypeScript', 'Vite', 'Tailwind'],
      problem: { en: 'A portfolio a recruiter can skim in 30 seconds and an engineer can drive from a shell prompt.', tr: 'Bir işe alımcının 30 saniyede tarayabildiği, bir mühendisin komut satırından kullanabildiği bir portfolyo.' },
      outcome: { en: 'Prerendered to static HTML, English and Turkish, every command works with the keyboard.', tr: 'Statik HTML olarak önceden derlenir, İngilizce ve Türkçe, her komut klavyeyle çalışır.' },
      links: [{ label: { en: 'code', tr: 'kod' }, href: 'https://github.com/aliemreo/aliemre-wiki' }],
      writeup: { en: ['The command bar is the only unusual thing on the page. Everything it does is also reachable by scrolling and clicking, so nobody is locked out.', 'All copy lives in one content file. Updating the site means editing that file; the build renders it to static HTML so the page reads without JavaScript too.'], tr: ['Komut satırı sayfadaki tek sıra dışı şey. Yaptığı her şeye kaydırarak ve tıklayarak da ulaşılır, kimse dışarıda kalmaz.', 'Tüm metin tek bir içerik dosyasında. Siteyi güncellemek o dosyayı düzenlemek demek; derleme onu statik HTML’e çevirir, böylece sayfa JavaScript olmadan da okunur.'] },
      differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
    { slug: 'nanosoap', name: { en: 'Antibacterial soap with silver nanoparticles', tr: 'Gümüş nanoparçacıklı antibakteriyel sabun' }, tags: ['research'], stack: [],
      problem: { en: 'Can silver nanoparticles replace triclocarban, a harmful antibacterial agent, in soap?', tr: 'Gümüş nanoparçacıklar sabunda zararlı bir antibakteriyel olan triklokarbanın yerini alabilir mi?' },
      outcome: { en: 'Nanotechnology research presented at the 4th National Science Congress, METU, Ankara (June 2021).', tr: 'ODTÜ, Ankara’daki 4. Ulusal Bilim Kongresi’nde sunulan nanoteknoloji araştırması (Haziran 2021).' },
      links: [{ label: { en: 'paper', tr: 'bildiri' }, href: '#' }],
      writeup: { en: ['Placeholder: the method, the comparison against triclocarban, and what the results showed.'], tr: ['Placeholder: yöntem, triklokarbanla karşılaştırma ve sonuçların gösterdiği.'] }, differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
  ],
  reading: [   // newest first
    { date: '2026-09', kind: 'paper', title: { en: 'Placeholder: Toolformer: Language Models Can Teach Themselves to Use Tools', tr: 'Placeholder: Toolformer: Language Models Can Teach Themselves to Use Tools' }, authors: 'Schick et al.', tags: ['agents', 'ml'], href: '#', note: { en: 'Placeholder: one sentence on what you took from it and how it changed what you built.', tr: 'Placeholder: ondan ne aldığın ve yaptığın şeyi nasıl değiştirdiği üzerine tek cümle.' } },
    { date: '2026-08', kind: 'book', title: { en: 'Placeholder: Designing Data-Intensive Applications', tr: 'Placeholder: Designing Data-Intensive Applications' }, authors: 'Kleppmann', tags: ['systems'], href: '#', note: { en: 'Placeholder: the chapter that mattered and why.', tr: 'Placeholder: önemli olan bölüm ve nedeni.' } },
    { date: '2026-07', kind: 'paper', title: { en: 'Placeholder: A Unified Approach to Interpreting Model Predictions', tr: 'Placeholder: A Unified Approach to Interpreting Model Predictions' }, authors: 'Lundberg & Lee', tags: ['ml', 'research'], href: '#', note: { en: 'Placeholder: what SHAP did and did not solve in a project of yours.', tr: 'Placeholder: SHAP\'ın bir projende neyi çözdüğü ve çözmediği.' } },
    { date: '2026-06', kind: 'post', title: { en: 'Placeholder: a blog post you keep sending people', tr: 'Placeholder: insanlara göndermeye devam ettiğin bir yazı' }, authors: 'Placeholder', tags: ['web'], href: '#', note: { en: 'Placeholder: why you keep sending it.', tr: 'Placeholder: neden göndermeye devam ettiğin.' } },
  ],
  writing: [
    { date: '2026-08', title: { en: 'Placeholder: A note on evaluating agents that call tools', tr: 'Placeholder: Araç çağıran ajanları değerlendirme üzerine not' }, href: '#' },
    { date: '2026-05', title: { en: 'Placeholder: What I learned shipping my first model to production', tr: 'Placeholder: İlk modelimi üretime alırken öğrendiklerim' }, href: '#' },
  ],
  skills: [
    { group: { en: 'Programming', tr: 'Programlama' }, items: [{ label: 'C', tag: 'systems' }, { label: 'C++', tag: 'systems' }, { label: 'Python', tag: 'ml' }, { label: 'SQL', tag: 'ml' }, { label: { en: 'Web platform programming', tr: 'Web platformu programlama' }, tag: 'web' }] },
    { group: { en: 'Machine learning', tr: 'Makine öğrenmesi' }, items: [{ label: 'LLMs', tag: 'ml' }, { label: { en: 'Fine-tuning', tr: 'İnce ayar' }, tag: 'ml' }, { label: { en: 'Agentic solutions', tr: 'Ajan çözümleri' }, tag: 'agents' }, { label: { en: 'Reinforcement learning (PPO, TD3)', tr: 'Pekiştirmeli öğrenme (PPO, TD3)' }, tag: 'research' }, { label: 'MuJoCo', tag: 'research' }] },
    { group: { en: 'Business', tr: 'İş' }, items: [{ label: 'CRM' }, { label: { en: 'Project management', tr: 'Proje yönetimi' } }, { label: { en: 'Business analysis', tr: 'İş analizi' } }] },
    { group: { en: 'Human languages', tr: 'Konuşulan diller' }, items: [{ label: { en: 'Turkish, native', tr: 'Türkçe, anadil' } }, { label: { en: 'English, fluent', tr: 'İngilizce, akıcı' } }] },
  ],
  guestbook: {
    repo: 'placeholder/guestbook',   // GitHub repo whose issues collect entries; approved ones are copied into entries below
    entries: [
      { name: 'Placeholder: a colleague', date: '2026-09-02', message: { en: 'Placeholder: approved entries are copied here from the guestbook repo issues.', tr: 'Placeholder: onaylanan girdiler guestbook deposundaki issue\'lardan buraya kopyalanır.' } },
      { name: 'Placeholder: a classmate', date: '2026-08-21', message: { en: 'Placeholder: keep entries to one or two lines.', tr: 'Placeholder: girdileri bir iki satırda tut.' } },
    ],
  },
  contact: { note: { en: 'Placeholder: Email is the best way to reach me; I reply within two days. LinkedIn messages take longer.', tr: 'Placeholder: Bana en iyi e-postayla ulaşılır; iki gün içinde yanıtlarım. LinkedIn mesajları daha uzun sürer.' } },
  colophon: {
    en: ['Built with React and TypeScript, prerendered to static HTML so it reads without JavaScript.', 'Set in IBM Plex Sans and IBM Plex Mono.', 'The command bar exists because I spend my day in one, and because it lets the page be driven without a mouse.', 'The small marks next to section titles are Anatolian kilim motifs (su yolu, elibelinde, koçboynuzu, yıldız, pıtrak, göz), drawn on the same pixel grid as the terminal banner.'],
    tr: ['React ve TypeScript ile yapıldı; JavaScript olmadan da okunsun diye statik HTML’e önceden derlendi.', 'IBM Plex Sans ve IBM Plex Mono ile dizildi.', 'Komut satırı var çünkü günümü bir tanesinde geçiriyorum ve sayfanın fare olmadan kullanılmasını sağlıyor.', 'Bölüm başlıklarının yanındaki küçük işaretler Anadolu kilim motifleri (su yolu, elibelinde, koçboynuzu, yıldız, pıtrak, göz); terminal banner\'ıyla aynı piksel ızgarasında çizildi.'],
  },
};
