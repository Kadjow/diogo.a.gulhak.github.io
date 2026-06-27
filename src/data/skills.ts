export interface SkillGroup {
  id: string;
  label: string;
  icons: { cls: string; title: string }[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'mobile',
    label: $localize`:@@skills.mobile.label:Mobile`,
    icons: [
      { cls: 'devicon-flutter-plain colored', title: 'Flutter' },
      { cls: 'devicon-dart-plain colored', title: 'Dart' },
      { cls: 'devicon-react-plain colored', title: 'React Native' },
      { cls: 'devicon-kotlin-plain colored', title: 'Kotlin' },
      { cls: 'devicon-swift-plain colored', title: 'Swift' },
    ],
  },
  {
    id: 'web',
    label: $localize`:@@skills.web.label:Web`,
    icons: [
      { cls: 'devicon-angular-plain', title: 'Angular' },
      { cls: 'devicon-react-plain colored', title: 'React' },
      { cls: 'devicon-typescript-plain colored', title: 'TypeScript' },
      { cls: 'devicon-javascript-plain colored', title: 'JavaScript' },
      { cls: 'devicon-html5-plain colored', title: 'HTML5' },
      { cls: 'devicon-css3-plain colored', title: 'CSS3' },
    ],
  },
  {
    id: 'backend',
    label: $localize`:@@skills.backend.label:Back-end & DB`,
    icons: [
      { cls: 'devicon-nestjs-plain colored', title: 'NestJS' },
      { cls: 'devicon-nodejs-plain colored', title: 'Node.js' },
      { cls: 'devicon-python-plain colored', title: 'Python' },
      { cls: 'devicon-postgresql-plain colored', title: 'PostgreSQL' },
      { cls: 'devicon-mysql-plain colored', title: 'MySQL' },
      { cls: 'devicon-sqlite-plain colored', title: 'SQLite' },
    ],
  },
  {
    id: 'devops',
    label: $localize`:@@skills.devops.label:DevOps`,
    icons: [
      { cls: 'devicon-docker-plain colored', title: 'Docker' },
      { cls: 'devicon-github-original', title: 'GitHub' },
      { cls: 'devicon-git-plain colored', title: 'Git' },
      { cls: 'devicon-linux-plain', title: 'Linux' },
      { cls: 'devicon-nginx-original colored', title: 'Nginx' },
    ],
  },
];
