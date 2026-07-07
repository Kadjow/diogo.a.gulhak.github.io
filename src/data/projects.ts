export type ProjectTech = 'flutter' | 'react-native' | 'web';

export interface Project {
  slug: string;
  name: string;
  description: string;
  techs: ProjectTech[];
  badge: string;
  githubUrl: string;
  readmeUrl: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'rick-and-morty-api',
    name: $localize`:@@proj.rickAndMorty.name:Rick and Morty - API`,
    description: $localize`:@@proj.rickAndMorty.desc:Camadas Domain/Data/UI, paginação + busca, tratamento de estados e layout responsivo.`,
    techs: ['flutter'],
    badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/Rick-and-Morty-Project-with-API-',
    readmeUrl: 'https://github.com/Kadjow/Rick-and-Morty-Project-with-API-#readme',
  },
  {
    slug: 'sobcontrole-app',
    name: $localize`:@@proj.sobControle.name:SobControle - App`,
    description: $localize`:@@proj.sobControle.desc:Auth com refresh token, Context/Reducer, consumo REST tipado e organização por módulos.`,
    techs: ['react-native'],
    badge: 'React Native',
    githubUrl: 'https://github.com/Kadjow/sobcontrole-app',
    readmeUrl: 'https://github.com/Kadjow/sobcontrole-app#readme',
  },
  {
    slug: 'seu-clima-hoje',
    name: $localize`:@@proj.climaHoje.name:Seu Clima Hoje`,
    description: $localize`:@@proj.climaHoje.desc:Geolocalização com fallback, consumo de API com retries e UX focada em carregamento rápido.`,
    techs: ['web'],
    badge: 'Web',
    githubUrl: 'https://github.com/Kadjow/Seu-Clima-Hoje',
    readmeUrl: 'https://github.com/Kadjow/Seu-Clima-Hoje#readme',
  },
  {
    slug: 'sistema-vendas',
    name: $localize`:@@proj.sistemaVendas.name:Sistema Vendas - CRM`,
    description: $localize`:@@proj.sistemaVendas.desc:App de vendas em Flutter integrado a dashboard em C# e middleware em Python, usando Supabase e suporte offline.`,
    techs: ['flutter'],
    badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/Sistema_Vendas',
    readmeUrl: 'https://github.com/Kadjow/Sistema_Vendas#readme',
  },
  {
    slug: 'expenses-app',
    name: $localize`:@@proj.expenses.name:Expenses - Controle de Despesas`,
    description: $localize`:@@proj.expenses.desc:Gerenciador de despesas em Flutter com modelo de transações, formulário reativo, lista dinâmica e modal para novas entradas.`,
    techs: ['flutter'],
    badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/Expenses',
    readmeUrl: 'https://github.com/Kadjow/Expenses#readme',
  },
  {
    slug: 'memorandum-notes-app',
    name: $localize`:@@proj.memorandum.name:Memorandum - Notes App`,
    description: $localize`:@@proj.memorandum.desc:App de notas e tarefas em Flutter (multi-plataforma), focado em organização diária de atividades e lembretes.`,
    techs: ['flutter'],
    badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/memorandum-notes_app',
    readmeUrl: 'https://github.com/Kadjow/memorandum-notes_app#readme',
  },
  {
    slug: 'curse-css-lab',
    name: $localize`:@@proj.lab.name:Lab HTML/CSS/JS`,
    description: $localize`:@@proj.lab.desc:Laboratório de HTML, CSS e JavaScript com pequenos projetos de interface, efeitos visuais e manipulação de DOM.`,
    techs: ['web'],
    badge: 'Web',
    githubUrl: 'https://github.com/Kadjow/curse_css',
    readmeUrl: 'https://github.com/Kadjow/curse_css#readme',
  },
  {
    slug: 'lp-gocoffee-cascavel',
    name: $localize`:@@proj.gocoffeeCascavel.name:GoCoffee Cascavel - Landing Page`,
    description: $localize`:@@proj.gocoffeeCascavel.desc:Landing page em Angular com foco em UI/UX, componentizacao, layout responsivo e apresentacao de marca.`,
    techs: ['web'],
    badge: 'Web',
    githubUrl: 'https://github.com/Kadjow/LP_gocoffeeCascavel',
    readmeUrl: 'https://github.com/Kadjow/LP_gocoffeeCascavel#readme',
  },
  {
    slug: 'form-api',
    name: $localize`:@@proj.formApi.name:FormAPI`,
    description: $localize`:@@proj.formApi.desc:App Flutter com consumo de API (GET/POST), formulario com validacao, MVVM com Riverpod, paginacao, cache local e testes.`,
    techs: ['flutter'],
    badge: 'Flutter',
    githubUrl: 'https://github.com/Kadjow/formAPI',
    readmeUrl: 'https://github.com/Kadjow/formAPI#readme',
  },
  {
    slug: 'post-ia',
    name: $localize`:@@proj.postIa.name:Post.IA`,
    description: $localize`:@@proj.postIa.desc:Projeto web com Next.js para transformar briefing em posts estrategicos com apoio de IA.`,
    techs: ['web'],
    badge: 'Web',
    githubUrl: 'https://github.com/Kadjow/Post.IA',
    readmeUrl: 'https://github.com/Kadjow/Post.IA#readme',
  },
];
