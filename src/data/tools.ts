export type ToolGroup = 'dev' | 'media' | 'text';
export type ToolStatus = 'live' | 'soon';

export interface ToolMeta {
  slug: string;
  name: string;
  description: string;
  group: ToolGroup;
  icon: string;
  status: ToolStatus;
}

const GROUP_ORDER: ToolGroup[] = ['dev', 'media', 'text'];

export const TOOLS: readonly ToolMeta[] = [
  {
    slug: 'playground',
    name: $localize`:@@tools.playground.name:Playground HTML/CSS/JS`,
    description: $localize`:@@tools.playground.desc:Editor ao vivo de HTML, CSS e JS com preview e console.`,
    group: 'dev', icon: '</>', status: 'live',
  },
  {
    slug: 'markdown-preview',
    name: $localize`:@@tools.markdown-preview.name:Markdown Preview`,
    description: $localize`:@@tools.markdown-preview.desc:Escreva Markdown e veja o preview ao vivo.`,
    group: 'dev', icon: '📝', status: 'live',
  },
  {
    slug: 'json-tools',
    name: $localize`:@@tools.json-tools.name:Editor JSON`,
    description: $localize`:@@tools.json-tools.desc:Editor de dois painéis com formatar, ordenar, reparar, validar e transformar.`,
    group: 'dev', icon: '{ }', status: 'live',
  },
  {
    slug: 'hash',
    name: $localize`:@@tools.hash.name:Gerador de Hash`,
    description: $localize`:@@tools.hash.desc:SHA-1, SHA-256, SHA-384 e SHA-512 de um texto.`,
    group: 'dev', icon: '#', status: 'live',
  },
  {
    slug: 'image-converter',
    name: $localize`:@@tools.image-converter.name:Conversor de Imagem`,
    description: $localize`:@@tools.image-converter.desc:Converte para AVIF, WebP, PNG e JPG no navegador.`,
    group: 'media', icon: '🖼️', status: 'soon',
  },
  {
    slug: 'color-tools',
    name: $localize`:@@tools.color-tools.name:Ferramentas de Cor`,
    description: $localize`:@@tools.color-tools.desc:Contraste WCAG, paletas e conversão de formatos.`,
    group: 'media', icon: '🎨', status: 'soon',
  },
];

export function toolsByGroup(
  tools: readonly ToolMeta[],
): { group: ToolGroup; items: ToolMeta[] }[] {
  return GROUP_ORDER
    .map(group => ({ group, items: tools.filter(t => t.group === group) }))
    .filter(g => g.items.length > 0);
}
