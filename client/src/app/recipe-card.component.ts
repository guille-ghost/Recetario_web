import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentItem } from './portal-data.service';

@Component({
  standalone: true,
  selector: 'app-recipe-card',
  imports: [RouterLink],
  template: `
    <article class="overflow-hidden rounded-xl border border-ember/20 bg-smoke/90 transition hover:-translate-y-1 hover:border-ember hover:shadow-lava-glow">
      @if (collection) {
        <div class="block"><img [src]="item.imagen || ''" [alt]="title" class="h-48 w-full object-cover"><div class="p-5"><span class="rounded-full bg-ember/20 px-2 py-1 text-[11px] uppercase text-ember">{{ item.tipo || item.carne || '' }}</span><h3 class="mt-3 font-display text-lg">{{ title }}</h3><p class="mt-2 line-clamp-3 text-sm text-ash">{{ item.descripcion }}</p></div></div>
      } @else {
        <a [routerLink]="['/receta']" [queryParams]="{ slug: item.slug }" class="group block"><img [src]="item.imagen || ''" [alt]="title" class="h-48 w-full object-cover transition duration-500 group-hover:scale-105"><div class="p-5"><span class="rounded-full bg-ember/20 px-2 py-1 text-[11px] uppercase text-ember">{{ item.carne || item.tipo || '' }}</span><h3 class="mt-3 font-display text-lg group-hover:text-ember">{{ title }}</h3><p class="mt-2 line-clamp-3 text-sm text-ash">{{ item.descripcion }}</p></div></a>
      }
    </article>
  `,
})
export class RecipeCardComponent {
  @Input({ required: true }) item!: ContentItem;
  @Input() collection = false;
  get title(): string { return this.item.titulo || this.item.nombre || ''; }
}
