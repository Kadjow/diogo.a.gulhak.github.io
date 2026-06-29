import { Component, signal } from '@angular/core';
import { SKILL_GROUPS } from '../../../../data/skills';
import { SectionHeading } from '../../../shared/ui/section-heading/section-heading';

/** Pure keyboard-navigation helper for roving tabindex. */
export function nextTabIndex(current: number, key: string, len: number): number {
  switch (key) {
    case 'ArrowRight': return (current + 1) % len;
    case 'ArrowLeft':  return (current - 1 + len) % len;
    case 'Home':       return 0;
    case 'End':        return len - 1;
    default:           return current;
  }
}

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeading],
  template: `
    <section class="skills container" id="skills" aria-labelledby="skills-heading">
      <app-section-heading number="02" title="Skills" i18n-title="@@section.skills" headingId="skills-heading" />

      <div
        class="skills__tabs"
        role="tablist"
        aria-label="Categorias de skills"
        i18n-aria-label="@@skills.tablistLabel"
        (keydown)="onKeydown($event)"
      >
        @for (group of groups; track group.id; let i = $index) {
          <button
            role="tab"
            class="skills__tab"
            [class.skills__tab--active]="activeId() === group.id"
            [attr.aria-selected]="activeId() === group.id"
            [attr.aria-controls]="'panel-' + group.id"
            [attr.id]="'tab-' + group.id"
            [tabindex]="activeId() === group.id ? 0 : -1"
            (click)="selectTab(group.id)"
          >{{ group.label }}</button>
        }
      </div>

      @for (group of groups; track group.id) {
        <div
          role="tabpanel"
          class="skills__panel"
          [class.skills__panel--active]="activeId() === group.id"
          [attr.id]="'panel-' + group.id"
          [attr.aria-labelledby]="'tab-' + group.id"
          [attr.hidden]="activeId() !== group.id ? true : null"
        >
          <ul class="skills__icons">
            @for (icon of group.icons; track icon.cls) {
              <li class="skills__icon-item" [title]="icon.title">
                <i [class]="icon.cls" aria-hidden="true"></i>
                <span class="skills__icon-label">{{ icon.title }}</span>
              </li>
            }
          </ul>
        </div>
      }
    </section>
  `,
  styleUrl: './skills.scss',
})
export class Skills {
  readonly groups = SKILL_GROUPS;
  readonly activeId = signal(SKILL_GROUPS[0].id);

  selectTab(id: string): void {
    this.activeId.set(id);
  }

  onKeydown(event: KeyboardEvent): void {
    const currentIndex = this.groups.findIndex(g => g.id === this.activeId());
    const next = nextTabIndex(currentIndex, event.key, this.groups.length);
    if (next !== currentIndex) {
      event.preventDefault();
      this.selectTab(this.groups[next].id);
      // Move focus to the newly active tab button
      const tabEl = document.getElementById('tab-' + this.groups[next].id);
      tabEl?.focus();
    }
  }
}
