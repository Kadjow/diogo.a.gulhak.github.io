import { PROJECTS } from '../../../../data/projects';
import { filterProjects, pageSlice, wrapPage } from './projects';

describe('projects logic', () => {
  it('filters by tech', () => {
    const web = filterProjects(PROJECTS, 'web');
    expect(web.every(p => p.techs.includes('web'))).toBe(true);
  });
  it('all returns full list', () => {
    expect(filterProjects(PROJECTS, 'all').length).toBe(PROJECTS.length);
  });
  it('pageSlice returns at most 3', () => {
    expect(pageSlice(PROJECTS, 0, 3).length).toBe(3);
  });
  it('wrapPage is circular', () => {
    expect(wrapPage(-1, 3)).toBe(2);
    expect(wrapPage(3, 3)).toBe(0);
  });
});
