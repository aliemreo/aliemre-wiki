/* ============================================================================
   CONTENT — edit this file, never the components.
   Any user-visible string is a plain string or an { en, tr } pair.  Unfinished
   copy starts with "Placeholder:".  Bump meta.updated on every content change;
   scripts/preflight.mjs fails the deploy if you forget.

   This file must stay free of imports other than types: it is also loaded by
   Node (scripts/preflight.mjs) outside the bundler.
   ========================================================================= */
import type { Content, Project } from './types.ts';

export const TAGS = ['ml', 'agents', 'systems', 'web', 'research'] as const;
export const PALETTES = ['aqua', 'amber', 'mint', 'sky', 'rose', 'lime', 'violet', 'paper'] as const;
export const BGS = ['scan', 'flat'] as const;

/* ---------------------------------------------------------------------------
   FOCUS switches the site's framing with one edit:
     'research'  PhD / master's applications: the thesis first, the research question in the hero
     'industry'  job applications: the engineering work first
   Every field that differs is written twice in VARIANTS (both stay checked by
   preflight); everything else in CONTENT is shared.
   ------------------------------------------------------------------------- */
export const FOCUS: 'research' | 'industry' = 'research';
const pick = <T>(v: { research: T; industry: T }): T => v[FOCUS];

const ABOUT_REST = {
  en: [
    'Most recently I led the reinforcement-learning controller of a humanoid throwing project at the [[audicamp]] in Győr; before that I spent two years at [[mat]] building a CRM and an ML-driven specification platform. I spent spring 2026 on exchange at [[tuni]].',
    "Outside class I'm in the ACM student club, and I once captained a high-school [[fll]] robotics team.",
  ],
  tr: [
    'En son Győr’deki [[audicamp]]’te bir insansı robotun atış projesinde pekiştirmeli öğrenme denetleyicisini yönettim; öncesinde iki yıl [[mat]]’de bir CRM ile ML destekli bir spesifikasyon platformu geliştirdim. 2026 baharını [[tuni|Tampere Üniversitesi]]’nde değişim öğrencisi olarak geçirdim.',
    'Ders dışında ACM öğrenci kulübündeyim; lisede bir [[fll]] robotik takımının kaptanlığını yaptım.',
  ],
};

export const VARIANTS = {
  role: {
    research: { en: 'computer engineering student · machine learning engineer at TAZI (part-time) · applying to PhD and MSc programs for Fall 2027', tr: 'bilgisayar mühendisliği öğrencisi · TAZI’de yarı zamanlı makine öğrenmesi mühendisi · 2027 güzü için doktora ve yüksek lisans başvurusunda' },
    industry: { en: 'computer engineering student · machine learning engineer at TAZI (part-time)', tr: 'bilgisayar mühendisliği öğrencisi · TAZI’de yarı zamanlı makine öğrenmesi mühendisi' },
  },
  firstStarter: {
    research: { en: 'What is your thesis about?', tr: 'Bitirme tezin ne hakkında?' },
    industry: { en: 'What are you working on right now?', tr: 'Şu anda ne üzerinde çalışıyorsun?' },
  },
  hero: {
    research: {
      headline: {
        before: { en: 'I study', tr: '' },
        rotating: { en: ['when learned systems fail', 'agents that fail silently', 'failure detection under drift', 'RL for robotics'], tr: ['öğrenen sistemlerin ne zaman bozulduğu', 'sessizce bozulan ajanlar', 'kayma altında hata tespiti', 'robotik için pekiştirmeli öğrenme'] },
        after: { en: '', tr: 'üzerine çalışıyorum' },
      },
      line1: { en: "I'm a final-year computer engineering student at [[itu|İTÜ]] and a part-time machine learning engineer at [[tazi]]. My senior thesis asks whether a monitor that flags failed LLM-agent runs still works when the models and the environment drift.", tr: '[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisi ve [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisiyim. Bitirme tezimde, başarısız LLM ajanı koşularını işaretleyen bir izleyicinin modeller ve ortam kaydığında da çalışıp çalışmadığını soruyorum.' },
      line2: { en: 'The question underneath my work: how can a learned system tell that it has failed, or is about to? LLM agents under workload drift, RL policies off their training distribution.', tr: 'İşimin altındaki soru: öğrenen bir sistem bozulduğunu, ya da bozulmak üzere olduğunu nasıl anlar? İş yükü kayan LLM ajanları, eğitim dağılımının dışına çıkan RL politikaları.' },
      avail: { en: "Applying to PhD and master's programs for Fall 2027.", tr: '2027 güzü için doktora ve yüksek lisans programlarına başvuruyorum.' },
    },
    industry: {
      headline: {
        before: { en: 'I build', tr: '' },
        rotating: { en: ['ML models', 'agent systems', 'RL controllers', 'things that ship'], tr: ['ML modelleri', 'ajan sistemleri', 'RL denetleyicileri', 'işe yarayan şeyler'] },
        after: { en: '', tr: 'geliştiriyorum' },
      },
      line1: { en: "I'm a final-year computer engineering student at [[itu|İTÜ]] and a part-time machine learning engineer at [[tazi]], where I build ML models and tool-using agent systems.", tr: '[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisiyim. [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisi olarak ML modelleri ve araç kullanan ajan sistemleri geliştiriyorum.' },
      line2: { en: "I'm interested in applied machine learning and systems engineering: generative AI, agentic systems and reinforcement learning for robotics.", tr: 'İlgi alanım uygulamalı makine öğrenmesi ve sistem mühendisliği: üretken yapay zekâ, ajan sistemleri ve robotik için pekiştirmeli öğrenme.' },
      avail: { en: 'Placeholder: Open to full-time roles from mid-2027', tr: 'Placeholder: 2027 ortasından itibaren tam zamanlı rollere açığım' },
    },
  },
  about: {
    research: {
      en: [
        "I'm a final-year computer engineering student at [[itu|İTÜ]] (GPA 3.94/4.00). My senior thesis, advised by Prof. Gülşen Cebiroğlu Eryiğit, learns what normal tool-calling runs of LLM agents look like and flags runs that deviate, then measures what happens to that monitor when the model or the environment drifts. I'm applying to PhD and master's programs for Fall 2027 to keep working on how learned systems can tell that they have failed.",
        "I'm also a part-time machine learning engineer at [[tazi]], where I started as an intern in the summer of 2026. Building agents and ML pipelines for enterprise customers is where I see these systems break in practice.",
        ...ABOUT_REST.en,
      ],
      tr: [
        '[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisiyim (not ortalaması 3,94/4,00). Prof. Dr. Gülşen Cebiroğlu Eryiğit danışmanlığındaki bitirme tezimde LLM ajanlarının normal araç çağrısı koşularının neye benzediğini öğrenip bundan sapan koşuları işaretliyor, sonra model ya da ortam kaydığında bu izleyiciye ne olduğunu ölçüyorum. Öğrenen sistemlerin bozulduklarını nasıl anlayabileceği üzerine çalışmaya devam etmek için 2027 güzü için doktora ve yüksek lisans programlarına başvuruyorum.',
        '2026 yazında stajyer olarak başladığım [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisi olarak da çalışıyorum. Kurumsal müşteriler için ajanlar ve ML hatları kurmak, bu sistemlerin pratikte nerede bozulduğunu gördüğüm yer.',
        ...ABOUT_REST.tr,
      ],
    },
    industry: {
      en: ["I'm a final-year computer engineering student at [[itu|İTÜ]] (GPA 3.94/4.00) and a part-time machine learning engineer at [[tazi]], where I started as an intern in the summer of 2026.", ...ABOUT_REST.en],
      tr: ['[[itu|İTÜ]] Bilgisayar Mühendisliği son sınıf öğrencisiyim (not ortalaması 3,94/4,00) ve 2026 yazında stajyer olarak başladığım [[tazi]]’de yarı zamanlı makine öğrenmesi mühendisi olarak çalışıyorum.', ...ABOUT_REST.tr],
    },
  },
  projects: {   // which slug is featured, then the order of the list
    research: { featured: 'thesis', order: ['thesis', 'throwing', 'feedback', 'agents', 'specs', 'crm', 'site', 'nanosoap'] },
    industry: { featured: 'throwing', order: ['throwing', 'thesis', 'crm', 'specs', 'feedback', 'agents', 'site', 'nanosoap'] },
  },
};

const PROJECTS: Project[] = [   // order and featured come from VARIANTS.projects
  { slug: 'thesis', name: { en: 'Monitoring LLM agents under drift', tr: 'Kayma altında LLM ajanlarını izlemek' }, tags: ['ml', 'agents', 'research'], stack: ['Python', 'PyTorch Geometric', 'scikit-learn', 'vLLM', 'MCPMark'],
    problem: { en: 'An LLM agent can fail a task while its run looks ordinary. Can a monitor that learns only from successful tool-calling runs flag the failed ones, and does it keep working, without a flood of false alarms, when the model or the environment changes?', tr: 'Bir LLM ajanı, koşusu sıradan görünürken bir görevde başarısız olabilir. Yalnızca başarılı araç çağrısı koşularından öğrenen bir izleyici başarısız olanları işaretleyebilir mi; model ya da ortam değiştiğinde yanlış alarm yağmuruna tutulmadan çalışmaya devam eder mi?' },
    outcome: { en: 'My senior thesis at [[itu|İTÜ]], advised by Prof. Gülşen Cebiroğlu Eryiğit. Results so far are preliminary; the work is being prepared for a 2027 ML workshop, with a preprint and public code planned after that.', tr: '[[itu|İTÜ]]’deki bitirme tezim, danışmanım Prof. Dr. Gülşen Cebiroğlu Eryiğit. Şimdiye kadarki sonuçlar ön sonuç; çalışma 2027’deki bir ML çalıştayı için hazırlanıyor, ardından bir ön baskı ve açık kod planlanıyor.' },
    links: [],
    writeup: { en: [
      'An agent run is a sequence of tool calls. The monitor learns what normal, passing runs look like and flags runs that deviate; failed runs are used only to score it, never to train it. The data is 10,298 public MCPMark runs (5 MCP services, 127 tasks, 22 model configurations) and about 2,800 runs of my own with Qwen3-8B and gpt-oss-20b on İTÜ’s HPC.',
      'I compared a ladder of encodings: run length, counts, action n-grams, graphs of tool calls (sequence, data-flow and repeat edges), and text. A pre-registered result, negative twice: graph edges add no detection gain. A logistic regression over text and action types is the strongest detector so far.',
      'Drift comes in two ways: a new model family, or distractor files added to the environment that leave every correct answer unchanged. Training on several model families keeps false alarms near 5% when the model changes. Distractors push up to 57% of correct runs over a 5% threshold, and recalibrating on about 50 new normal runs brings it back down.',
      'The open problem is telling a shift that hurts the agent from one it merely meets: so far every drop in pass rate comes from tasks built so the agent runs into the distractors.',
    ], tr: [
      'Bir ajan koşusu, araç çağrılarından oluşan bir dizidir. İzleyici normal, başarılı koşuların neye benzediğini öğrenir ve bundan sapanları işaretler; başarısız koşular yalnızca onu puanlamak için kullanılır, eğitmek için asla. Veri 10.298 açık MCPMark koşusu (5 MCP servisi, 127 görev, 22 model yapılandırması) ve İTÜ’nün HPC’sinde Qwen3-8B ve gpt-oss-20b ile yaptığım yaklaşık 2.800 koşu.',
      'Bir kodlama merdivenini karşılaştırdım: koşu uzunluğu, sayımlar, eylem n-gramları, araç çağrısı grafları (sıra, veri akışı ve tekrar kenarları) ve metin. Önceden kaydedilmiş, iki kez olumsuz çıkan bir sonuç: graf kenarları tespite bir şey katmıyor. Şimdiye kadarki en güçlü dedektör metin ve eylem türleri üzerinde bir lojistik regresyon.',
      'Kayma iki yoldan geliyor: yeni bir model ailesi ya da ortama eklenen, hiçbir doğru yanıtı değiştirmeyen dikkat dağıtıcı dosyalar. Birkaç model ailesiyle eğitmek, model değiştiğinde yanlış alarmları %5 civarında tutuyor. Dikkat dağıtıcılar doğru koşuların %57’sine kadarını %5’lik eşiğin üstüne itiyor; yaklaşık 50 yeni normal koşuyla yeniden kalibrasyon bunu geri indiriyor.',
      'Açık problem, ajana zarar veren bir kaymayı onun yalnızca karşılaştığı bir kaymadan ayırmak: şimdiye kadar başarı oranındaki her düşüş, ajanın dikkat dağıtıcılarla karşılaşacağı biçimde kurulmuş görevlerden geliyor.',
    ] },
    differently: { en: 'Placeholder.', tr: 'Placeholder.' } },
  { slug: 'throwing', name: { en: 'Target-Aware Whole-Body Throwing', tr: 'Target-Aware Whole-Body Throwing' }, tags: ['ml', 'research'], stack: ['Python', 'MuJoCo', 'TD3', 'PPO', 'Unitree G1'],
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
];
const SHOWN = pick(VARIANTS.projects);

export const CONTENT: Content = {
  meta: {
    name: 'Ali Emre Özcan',
    role: pick(VARIANTS.role),
    email: 'hi@aliemreozcan.com',
    github: 'https://github.com/aliemreo', githubLabel: 'github.com/aliemreo',
    linkedin: 'https://www.linkedin.com/in/placeholder', linkedinLabel: 'linkedin.com/in/placeholder',
    cv: '#',
    ask: 'https://aliemre-ask.aliemreo.workers.dev',   // see ask/README.md
    mail: 'https://aliemre-ask.aliemreo.workers.dev/mail',   // see ask/README.md, Mail
    askStarters: [
      pick(VARIANTS.firstStarter),
      { en: 'Which projects use reinforcement learning?', tr: 'Hangi projelerde pekiştirmeli öğrenme var?' },
      { en: 'How can I reach you?', tr: 'Sana nasıl ulaşabilirim?' },
      { en: 'Ask Defne and Tolga: would you hire him?', tr: 'Defne ile Tolga\'ya sor: onu işe alır mıydınız?' },   // starts the debate (§5.14); rename with ask/characters.json
    ],
    debateStarter: { en: 'Ask Defne and Tolga: would you hire him for an ML engineering role?', tr: 'Defne ile Tolga\'ya sor: onu bir makine öğrenmesi mühendisi rolü için işe alır mıydınız?' },   // the ⌘K "Debate my fit" row asks this
    updated: '2026-11-15',   // bump on every content change
  },
  hero: pick(VARIANTS.hero),
  now: {
    date: { en: 'November 2026', tr: 'Kasım 2026' },
    text: { en: "I'm writing up my senior thesis on monitoring LLM agents under drift for a 2027 ML workshop, and applying to PhD and master's programs for Fall 2027. At [[tazi]] I'm building on-premise churn pipelines for a brokerage and a customer-success agent with long-term memory.", tr: 'Kayma altında LLM ajanlarını izleme üzerine bitirme tezimi 2027’deki bir ML çalıştayı için yazıyorum ve 2027 güzü için doktora ve yüksek lisans programlarına başvuruyorum. [[tazi]]’de bir aracı kurum için kurum içinde çalışan kayıp tahmini hatları ve uzun süreli belleği olan bir müşteri başarısı ajanı geliştiriyorum.' },
  },
  about: pick(VARIANTS.about),
  experience: [
    { dates: { en: 'Sep 2026 – present', tr: 'Eyl 2026 – devam' }, board: '2026', status: { en: 'now', tr: 'devam' }, title: { en: 'Machine learning engineer (part-time)', tr: 'Makine öğrenmesi mühendisi (yarı zamanlı)' }, org: '[[tazi|TAZI Bilişim Teknolojileri]], Istanbul',
      bullets: { en: [
        'On-premise ML pipelines around churn models for a customer-churn proof of value with a major Turkish brokerage, running inside the client’s environment with no LLM access.',
        'A customer-success agent with long-term memory, whose retrieval is filtered by sensitivity labels so it never surfaces confidential documents.',
      ], tr: [
        'Türkiye’nin büyük aracı kurumlarından biriyle yürütülen müşteri kaybı değer kanıtı (PoV) için, müşterinin kendi ortamında LLM erişimi olmadan çalışan kurum içi ML hatları.',
        'Erişimi gizlilik etiketleriyle süzülen, böylece gizli belgeleri asla öne çıkarmayan, uzun süreli belleğe sahip bir müşteri başarısı ajanı.',
      ] } },
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
      bullets: { en: ['Senior thesis: monitoring LLM agents under drift, anomaly detection over tool-calling runs (advisor: Prof. Gülşen Cebiroğlu Eryiğit).', 'GPA 3.94/4.00, top-ranking; Dean’s List (Feb 2025).', 'ACM Student Club; KKB Agentic Solutions Hackathon (Dec 2025).', 'Coursework: Real-Time Systems Software, Learning From Data.'], tr: ['Bitirme tezi: kayma altında LLM ajanlarını izlemek, araç çağrısı koşuları üzerinde anomali tespiti (danışman: Prof. Dr. Gülşen Cebiroğlu Eryiğit).', 'Not ortalaması 3,94/4,00, en üst sıralarda; Dekan Onur Listesi (Şub 2025).', 'ACM Öğrenci Kulübü; KKB Agentic Solutions Hackathon (Ara 2025).', 'Dersler: Gerçek Zamanlı Sistem Yazılımı, Veriden Öğrenme.'] } },
    { dates: { en: 'Spring 2026', tr: 'Bahar 2026' }, board: '2026', status: { en: 'past', tr: 'geçmiş' }, title: { en: 'Exchange student, Computer Engineering', tr: 'Değişim öğrencisi, Bilgisayar Mühendisliği' }, org: { en: '[[tuni]], Finland', tr: '[[tuni|Tampere Üniversitesi]], Finlandiya' },
      bullets: { en: ['Coursework: Internet of Things, Fine-Tuning Large Language Models.'], tr: ['Dersler: Nesnelerin İnterneti, Büyük Dil Modellerinin İnce Ayarı.'] } },
  ],
  projects: SHOWN.order.flatMap(slug => PROJECTS.filter(p => p.slug === slug).map(p => ({ ...p, featured: slug === SHOWN.featured }))),
  reading: [   // newest first
    { date: '2026-10', kind: 'paper', title: { en: 'GRADE: Graph Representation of LLM Agent Dependency and Execution', tr: 'GRADE: Graph Representation of LLM Agent Dependency and Execution' }, authors: 'Zhao', tags: ['agents', 'research'], href: 'https://arxiv.org/abs/2606.22741', note: { en: 'One typed graph per agent run, execution and dependency together: the closest prior work to the trace graphs I tested in my thesis.', tr: 'Her ajan koşusu için yürütme ve bağımlılığı birlikte tutan tek bir tipli graf: tezimde sınadığım iz graflarına en yakın önceki çalışma.' } },
    { date: '2026-09', kind: 'paper', title: { en: 'WebGuard: Building a Generalizable Guardrail for Web Agents', tr: 'WebGuard: Building a Generalizable Guardrail for Web Agents' }, authors: 'Zheng et al.', tags: ['agents', 'research'], href: 'https://arxiv.org/abs/2507.14293', note: { en: 'Judges whether a web agent’s next action is risky before it runs; my thesis asks whether a run went wrong after the fact, from its trace.', tr: 'Bir web ajanının bir sonraki eyleminin riskli olup olmadığını o eylem çalışmadan değerlendiriyor; tezim ise koşunun ters gidip gitmediğini sonradan, izinden soruyor.' } },
    { date: '2026-08', kind: 'paper', title: { en: 'Toolformer: Language Models Can Teach Themselves to Use Tools', tr: 'Toolformer: Language Models Can Teach Themselves to Use Tools' }, authors: 'Schick et al.', tags: ['agents', 'ml'], href: 'https://arxiv.org/abs/2302.04761', note: { en: 'Teaching a model when to call a tool. My thesis starts from the runs where that call goes wrong.', tr: 'Bir modele ne zaman araç çağıracağını öğretmek. Tezim o çağrının ters gittiği koşulardan başlıyor.' } },
    { date: '2026-07', kind: 'paper', title: { en: 'ToolRL: Reward is All Tool Learning Needs', tr: 'ToolRL: Reward is All Tool Learning Needs' }, authors: 'Qian et al.', tags: ['agents', 'ml'], href: 'https://arxiv.org/abs/2504.13958', note: { en: 'Rewards built around correct tool calls, and a useful map of the ways a tool call can go wrong.', tr: 'Doğru araç çağrıları etrafında kurulan ödüller; bir araç çağrısının ters gidebileceği yolların kullanışlı bir haritası.' } },
    { date: '2026-06', kind: 'paper', title: { en: 'Addressing Function Approximation Error in Actor-Critic Methods', tr: 'Addressing Function Approximation Error in Actor-Critic Methods' }, authors: 'Fujimoto, van Hoof & Meger', tags: ['research', 'ml'], href: 'https://arxiv.org/abs/1802.09477', note: { en: 'TD3. Why we picked it over PPO for the sample efficiency of the G1 throwing controller.', tr: 'TD3. G1 atış denetleyicisinde örnek verimliliği için onu PPO’ya neden tercih ettiğimiz.' } },
    { date: '2026-05', kind: 'paper', title: { en: 'Policy Invariance Under Reward Transformations: Theory and Application to Reward Shaping', tr: 'Policy Invariance Under Reward Transformations: Theory and Application to Reward Shaping' }, authors: 'Ng, Harada & Russell', tags: ['research'], href: 'https://people.eecs.berkeley.edu/~pabbeel/cs287-fa09/readings/NgHaradaRussell-shaping-ICML1999.pdf', note: { en: 'Potential-based shaping: how our staged curriculum could shape rewards without changing the optimal policy.', tr: 'Potansiyel tabanlı şekillendirme: aşamalı müfredatımızın en iyi politikayı değiştirmeden ödülleri nasıl şekillendirebildiği.' } },
    { date: '2026-04', kind: 'paper', title: { en: 'BLoB: Bayesian Low-Rank Adaptation by Backpropagation for Large Language Models', tr: 'BLoB: Bayesian Low-Rank Adaptation by Backpropagation for Large Language Models' }, authors: 'Wang et al.', tags: ['ml', 'research'], href: 'https://arxiv.org/abs/2406.11675', note: { en: 'Calibrated uncertainty for fine-tuned LLMs: the direction I want to bring into keeping a failure detector honest under drift.', tr: 'İnce ayarlı LLM’ler için kalibre belirsizlik: kayma altında bir hata dedektörünü dürüst tutmak için getirmek istediğim yön.' } },
    { date: '2026-03', kind: 'paper', title: { en: 'ReAct: Synergizing Reasoning and Acting in Language Models', tr: 'ReAct: Synergizing Reasoning and Acting in Language Models' }, authors: 'Yao et al.', tags: ['agents', 'ml'], href: 'https://arxiv.org/abs/2210.03629', note: { en: 'The reason, act, observe loop that produces the traces my thesis monitors.', tr: 'Tezimin izlediği izleri üreten akıl yür, eyle, gözlemle döngüsü.' } },
    { date: '2026-02', kind: 'paper', title: { en: 'Can You Trust Your Model\'s Uncertainty? Evaluating Predictive Uncertainty Under Dataset Shift', tr: 'Can You Trust Your Model\'s Uncertainty? Evaluating Predictive Uncertainty Under Dataset Shift' }, authors: 'Ovadia et al.', tags: ['ml', 'research'], href: 'https://arxiv.org/abs/1906.02530', note: { en: 'Uncertainty degrades under dataset shift while the model stays confident: the failure mode I test my detector against.', tr: 'Veri kayması altında model kendinden emin kalırken belirsizlik kestirimi bozuluyor: dedektörümü sınadığım hata biçimi.' } },
    { date: '2025-12', kind: 'paper', title: { en: 'A Baseline for Detecting Misclassified and Out-of-Distribution Examples in Neural Networks', tr: 'A Baseline for Detecting Misclassified and Out-of-Distribution Examples in Neural Networks' }, authors: 'Hendrycks & Gimpel', tags: ['ml', 'research'], href: 'https://arxiv.org/abs/1610.02136', note: { en: 'The baseline for flagging inputs a model has not seen before; my thesis applies the same idea to agent runs.', tr: 'Bir modelin daha önce görmediği girdileri işaretlemenin temel çizgisi; tezim aynı fikri ajan koşularına uyguluyor.' } },
    { date: '2025-10', kind: 'paper', title: { en: 'Semi-Supervised Classification with Graph Convolutional Networks', tr: 'Semi-Supervised Classification with Graph Convolutional Networks' }, authors: 'Kipf & Welling', tags: ['ml', 'research'], href: 'https://arxiv.org/abs/1609.02907', note: { en: 'Where graph encoders start. My thesis tested whether graph structure helps on agent traces; so far it does not.', tr: 'Graf kodlayıcıların başlangıç noktası. Tezim graf yapısının ajan izlerinde işe yarayıp yaramadığını sınadı; şimdilik yaramıyor.' } },
  ],
  writing: [
    { date: '2026-08', title: { en: 'Placeholder: A note on evaluating agents that call tools', tr: 'Placeholder: Araç çağıran ajanları değerlendirme üzerine not' }, href: '#' },
    { date: '2026-05', title: { en: 'Placeholder: What I learned shipping my first model to production', tr: 'Placeholder: İlk modelimi üretime alırken öğrendiklerim' }, href: '#' },
  ],
  skills: [
    { group: { en: 'Programming', tr: 'Programlama' }, items: [{ label: 'C', tag: 'systems' }, { label: 'C++', tag: 'systems' }, { label: 'Python', tag: 'ml' }, { label: 'SQL', tag: 'ml' }, { label: { en: 'Web platform programming', tr: 'Web platformu programlama' }, tag: 'web' }] },
    { group: { en: 'Machine learning', tr: 'Makine öğrenmesi' }, items: [{ label: 'LLMs', tag: 'ml' }, { label: { en: 'Fine-tuning', tr: 'İnce ayar' }, tag: 'ml' }, { label: { en: 'Agentic solutions', tr: 'Ajan çözümleri' }, tag: 'agents' }, { label: { en: 'Reinforcement learning (PPO, TD3)', tr: 'Pekiştirmeli öğrenme (PPO, TD3)' }, tag: 'research' }, { label: 'MuJoCo', tag: 'research' }, { label: { en: 'Graph neural networks', tr: 'Graf sinir ağları' }, tag: 'research' }, { label: { en: 'Anomaly detection', tr: 'Anomali tespiti' }, tag: 'research' }] },
    { group: { en: 'Business', tr: 'İş' }, items: [{ label: 'CRM' }, { label: { en: 'Project management', tr: 'Proje yönetimi' } }, { label: { en: 'Business analysis', tr: 'İş analizi' } }] },
    { group: { en: 'Human languages', tr: 'Konuşulan diller' }, items: [{ label: { en: 'Turkish, native', tr: 'Türkçe, anadil' } }, { label: { en: 'English, fluent', tr: 'İngilizce, akıcı' } }] },
  ],
  guestbook: {
    endpoint: 'https://aliemre-ask.aliemreo.workers.dev/guestbook',   // see ask/README.md, Guestbook; entries live in guestbook.json
  },

  contact: { note: { en: 'Placeholder: Email is the best way to reach me; I reply within two days. LinkedIn messages take longer.', tr: 'Placeholder: Bana en iyi e-postayla ulaşılır; iki gün içinde yanıtlarım. LinkedIn mesajları daha uzun sürer.' } },
  colophon: {
    en: [
      'React 19 and TypeScript on Vite, prerendered to static HTML: it reads without JavaScript, then hydrates into a working shell.',
      'Under 170 KB gzipped with no third-party requests: self-hosted fonts, a native <dialog> instead of a modal library, and CI that blocks the deploy if a placeholder slips through.',
      'Mail goes through a Cloudflare Worker to Resend, with an origin check, a rate limit and a honeypot; the keys never reach the browser.',
    ],
    tr: [
      'Vite üzerinde React 19 ve TypeScript; statik HTML’e önceden derlenir: JavaScript olmadan okunur, sonra çalışan bir kabuğa dönüşür.',
      'Gzip’li 170 KB’ın altında ve üçüncü taraf isteği yok: kendi sunduğum yazı tipleri, modal kütüphanesi yerine yerel <dialog>, bir yer tutucu kaçarsa yayını durduran CI.',
      'E-posta bir Cloudflare Worker üzerinden Resend’e gider; köken kontrolü, hız sınırı ve bal küpü alanıyla. Anahtarlar tarayıcıya hiç ulaşmaz.',
    ],
  },

};
