import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentItem, PortalDataService, Recipe } from './portal-data.service';
import { RecipeCardComponent } from './recipe-card.component';

const EQUIPMENT: Array<[string, string]> = [
  ['caja-china', 'Caja China'], ['cilindro', 'Cilindro'], ['parrilla', 'Parrilla'],
  ['horno-barro', 'Horno de Barro'], ['cocina-convencional', 'Cocina Convencional'], ['airfryer', 'Airfryer'],
];
const PROTEINS: Array<[string, string]> = [
  ['res', 'Res'], ['cerdo', 'Cerdo'], ['pollo', 'Pollo'], ['cordero', 'Cordero'], ['pescado', 'Pescado'],
];

@Component({
  standalone: true,
  imports: [RouterLink, RecipeCardComponent],
  template: `
    <main>
      <section class="relative overflow-hidden">
        <div class="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p class="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">Caja China · Cilindro · Parrilla · Horno de Barro</p>
            <h1 class="mb-6 font-display text-4xl leading-tight sm:text-6xl">El fuego cuenta<br>su propia receta.</h1>
            <p class="mb-8 max-w-md text-lg text-ash">Un recetario al fuego: elige tu equipo, tu carne y encuentra la técnica para tu plato ideal.</p>
            <a routerLink="/recetario" class="rounded-lg bg-gradient-to-r from-ember to-lava px-6 py-3 font-semibold">Explorar recetario</a>
          </div>
          <img class="h-80 w-full rounded-2xl object-cover shadow-lava-glow" src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop" alt="Asado a la parrilla">
        </div>
      </section>
      <section class="mx-auto max-w-6xl px-5 py-12">
        <h2 class="mb-2 font-display text-3xl">Empieza por tu equipo</h2>
        <p class="mb-7 text-ash">Cada técnica tiene sus propios tiempos y secretos.</p>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          @for (equipment of equipmentOptions; track equipment[0]) {
            <a [routerLink]="'/recetario'" [queryParams]="{ equipo: equipment[0] }" class="rounded-xl border border-ember/20 bg-smoke p-4 text-center font-display transition hover:border-ember hover:shadow-ember-glow">{{ equipment[1] }}</a>
          }
        </div>
      </section>
      <section class="mx-auto max-w-6xl border-t border-ash/20 px-5 py-12">
        <div class="mb-7 flex items-end justify-between"><div><h2 class="font-display text-3xl">Recetas destacadas</h2><p class="mt-2 text-ash">Las últimas incorporaciones al recetario.</p></div><a routerLink="/recetario" class="text-sm text-ember">Ver todas →</a></div>
        @if (loading()) { <p class="text-ash">Cargando recetas…</p> }
        @else if (error()) { <p class="text-ash">{{ error() }}</p> }
        @else {
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @for (recipe of recipes().slice(0, 3); track recipe.slug) { <app-recipe-card [item]="recipe" /> }
          </div>
        }
      </section>
      <section class="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:grid-cols-2">
        <a routerLink="/catalogo" class="rounded-xl border border-ember/20 bg-smoke p-8 transition hover:border-ember"><h2 class="mb-2 font-display text-2xl">Salsas y Acompañamientos</h2><p class="text-sm text-ash">Chimichurris, cremas y guarniciones para el maridaje.</p></a>
        <a routerLink="/bar" class="rounded-xl border border-ember/20 bg-smoke p-8 transition hover:border-ember"><h2 class="mb-2 font-display text-2xl">Bar y Coctelería</h2><p class="text-sm text-ash">Bebidas con y sin alcohol para acompañar la brasa.</p></a>
      </section>
    </main>
  `,
})
export class HomePage implements OnInit {
  private readonly data = inject(PortalDataService);
  readonly equipmentOptions = EQUIPMENT;
  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try { this.recipes.set(await this.data.recipes()); }
    catch { this.error.set('No fue posible cargar las recetas. Revisa la conexión con Supabase.'); }
    finally { this.loading.set(false); }
  }
}

@Component({
  standalone: true,
  imports: [RouterLink, RecipeCardComponent],
  template: `
    <main class="mx-auto max-w-6xl px-5 py-12">
      <p class="mb-2 text-xs uppercase tracking-widest text-ember">Recetario parrillero</p>
      <h1 class="mb-3 font-display text-4xl sm:text-5xl">Encuentra tu receta ideal</h1>
      <p class="mb-10 max-w-2xl text-ash">Elige primero tu equipo de cocción y luego la proteína.</p>
      <section class="mb-8"><h2 class="mb-4 font-display text-xl">Paso 1 · ¿Con qué equipo vas a cocinar?</h2><div class="flex flex-wrap gap-2">
        <button (click)="equipment.set('')" [class.chip-activo]="!equipment()" class="filter-chip">Todos</button>
        @for (option of equipmentOptions; track option[0]) { <button (click)="equipment.set(option[0])" [class.chip-activo]="equipment() === option[0]" class="filter-chip">{{ option[1] }}</button> }
      </div></section>
      <section class="mb-10"><h2 class="mb-4 font-display text-xl">Paso 2 · ¿Qué proteína quieres preparar?</h2><div class="flex flex-wrap gap-2">
        <button (click)="protein.set('')" [class.chip-activo]="!protein()" class="filter-chip">Todas</button>
        @for (option of proteinOptions; track option[0]) { <button (click)="protein.set(option[0])" [class.chip-activo]="protein() === option[0]" class="filter-chip">{{ option[1] }}</button> }
      </div></section>
      <div class="mb-4 flex justify-between"><h2 class="font-display text-2xl">Resultados</h2><span class="text-sm text-ash">{{ filtered().length }} recetas</span></div>
      @if (loading()) { <p class="text-ash">Cargando recetas…</p> }
      @else if (error()) { <p class="text-ash">{{ error() }}</p> }
      @else if (filtered().length) { <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">@for (item of filtered(); track item.slug) { <app-recipe-card [item]="item" /> }</div> }
      @else { <p class="py-16 text-center text-ash">No hay recetas para esta combinación todavía.</p> }
    </main>
  `,
  styles: [`.filter-chip{border:1px solid rgba(160,152,142,.3);border-radius:9999px;padding:.5rem 1rem;font-size:.875rem;color:#A0988E;transition:.2s}.filter-chip:hover,.filter-chip.chip-activo{border-color:#FF6A00;color:#FF6A00}.filter-chip.chip-activo{background:rgba(255,106,0,.12)}`],
})
export class RecipeListPage implements OnInit {
  private readonly data = inject(PortalDataService);
  private readonly route = inject(ActivatedRoute);
  readonly equipmentOptions = EQUIPMENT;
  readonly proteinOptions = PROTEINS;
  readonly equipment = signal('');
  readonly protein = signal('');
  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly filtered = computed(() => this.recipes().filter(item =>
    (!this.equipment() || item.equipo === this.equipment()) && (!this.protein() || item.carne === this.protein()),
  ));

  async ngOnInit(): Promise<void> {
    this.equipment.set(this.route.snapshot.queryParamMap.get('equipo') || '');
    this.protein.set(this.route.snapshot.queryParamMap.get('carne') || '');
    try { this.recipes.set(await this.data.recipes()); }
    catch { this.error.set('No fue posible cargar las recetas. Revisa la conexión con Supabase.'); }
    finally { this.loading.set(false); }
  }
}

@Component({
  standalone: true,
  imports: [RecipeCardComponent],
  template: `
    @if (loading()) { <p class="p-10 text-center text-ash">Cargando receta…</p> }
    @else if (!recipe()) { <main class="py-24 text-center"><h1 class="mb-3 font-display text-3xl text-ember">Receta no encontrada</h1><a routerLink="/recetario" class="text-ember">Volver al recetario</a></main> }
    @else {
      <main class="mx-auto max-w-5xl px-5 py-10">
        <img class="mb-8 h-72 w-full rounded-2xl object-cover sm:h-96" [src]="recipe()!.imagen" [alt]="recipe()!.titulo">
        <p class="text-xs uppercase tracking-widest text-ember">{{ data.manager.LABELS_CARNE[recipe()!.carne] }} · {{ data.manager.LABELS_EQUIPO[recipe()!.equipo] }}</p>
        <h1 class="my-3 font-display text-4xl sm:text-5xl">{{ recipe()!.titulo }}</h1><p class="mb-8 max-w-3xl text-ash">{{ recipe()!.descripcion }}</p>
        <div class="mb-9 flex flex-wrap gap-6 text-sm text-ash"><span>Preparación: {{ recipe()!.tiempoPrep }}</span><span>Cocción: {{ recipe()!.tiempoCoccion }}</span><span>Porciones: {{ recipe()!.porciones }}</span></div>
        <div class="mb-10 grid gap-10 sm:grid-cols-2">
          <section><h2 class="mb-4 font-display text-2xl text-ember">Ingredientes</h2><ul class="space-y-3">@for (item of recipe()!.ingredientes; track $index) { <li><label class="flex gap-3"><input type="checkbox" [checked]="checks().has('i' + $index)" (change)="toggle('i' + $index)"><span [class.line-through]="checks().has('i' + $index)" [class.text-ash]="checks().has('i' + $index)">{{ item }}</span></label></li> }</ul></section>
          <section><h2 class="mb-4 font-display text-2xl text-ember">Preparación</h2><ol class="space-y-4">@for (step of recipe()!.pasos; track $index) { <li><label class="flex gap-3"><input type="checkbox" [checked]="checks().has('p' + $index)" (change)="toggle('p' + $index)"><span [class.line-through]="checks().has('p' + $index)" [class.text-ash]="checks().has('p' + $index)">{{ step }}</span></label></li> }</ol></section>
        </div>
        @if (related().length) { <section><h2 class="mb-5 font-display text-2xl">Maridaje recomendado</h2><div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">@for (item of related(); track item.slug) { <app-recipe-card [item]="item" [collection]="true" /> }</div></section> }
      </main>
    }
  `,
})
export class RecipeDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly portalData = inject(PortalDataService);
  readonly data = this.portalData;
  readonly recipe = signal<Recipe | null>(null);
  readonly catalog = signal<ContentItem[]>([]);
  readonly drinks = signal<ContentItem[]>([]);
  readonly loading = signal(true);
  readonly checks = signal(new Set<string>());
  readonly related = computed(() => {
    const recipe = this.recipe();
    if (!recipe) return [];
    const relatedSlugs = new Set([...recipe.maridajeSalsas, ...recipe.maridajeEnsaladas, ...recipe.maridajeBebidas]);
    return [...this.catalog(), ...this.drinks()].filter(item => relatedSlugs.has(item.slug));
  });

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.queryParamMap.get('slug') || '';
    try { this.checks.set(new Set(JSON.parse(localStorage.getItem(`portal_gastronomico_progreso_${slug}`) || '[]'))); } catch { /* Ignore invalid local progress. */ }
    const cached = await this.portalData.recipes().catch(() => []);
    this.recipe.set(cached.find(item => item.slug === slug) || null);
    const [catalog, drinks] = await Promise.all([this.portalData.catalog(), this.portalData.bar()]).catch(() => [[], []] as [ContentItem[], ContentItem[]]);
    this.catalog.set(catalog);
    this.drinks.set(drinks);
    this.loading.set(false);
  }

  toggle(key: string): void {
    const next = new Set(this.checks());
    next.has(key) ? next.delete(key) : next.add(key);
    this.checks.set(next);
    const slug = this.route.snapshot.queryParamMap.get('slug') || '';
    localStorage.setItem(`portal_gastronomico_progreso_${slug}`, JSON.stringify([...next]));
  }
}

@Component({
  standalone: true,
  imports: [RecipeCardComponent],
  template: `
    <main class="mx-auto max-w-6xl px-5 py-12">
      <p class="mb-2 text-xs uppercase tracking-widest text-ember">{{ isBar ? 'Brindis de brasas' : 'Catálogo' }}</p>
      <h1 class="mb-3 font-display text-4xl sm:text-5xl">{{ isBar ? 'Bar y Coctelería' : 'Salsas y Acompañamientos' }}</h1>
      <p class="mb-10 max-w-2xl text-ash">{{ isBar ? 'Bebidas para acompañar carnes a la brasa.' : 'Salsas y acompañamientos para el maridaje de cada receta.' }}</p>
      @if (loading()) { <p class="text-ash">Cargando…</p> }
      @else if (error()) { <p class="text-ash">{{ error() }}</p> }
      @else { <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">@for (item of items(); track item.slug) { <button type="button" class="text-left" (click)="selected.set(item)"><app-recipe-card [item]="item" [collection]="true" /></button> }</div> }
      @if (selected(); as item) { <div class="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/80 p-0 sm:items-center sm:p-6" (click)="selected.set(null)"><section class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-ash/20 bg-charcoal p-6 sm:rounded-2xl" (click)="$event.stopPropagation()"><div class="mb-5 flex justify-between"><div><p class="text-xs uppercase text-ember">{{ item.tipo || 'Preparación' }}</p><h2 class="font-display text-2xl">{{ item.nombre || item.titulo }}</h2></div><button type="button" aria-label="Cerrar" class="text-2xl text-ash" (click)="selected.set(null)">×</button></div><p class="mb-5 text-sm text-ash">{{ item.descripcion }}</p><p class="mb-5 text-xs text-ash">Prep: {{ item.tiempoPrep || '—' }} · Rinde: {{ item.porciones || '—' }}</p><h3 class="mb-2 font-display text-lg text-ember">Ingredientes</h3><ul class="mb-6 list-inside list-disc space-y-1 text-sm">@for (ingredient of item.ingredientes; track $index) { <li>{{ ingredient }}</li> }</ul><h3 class="mb-2 font-display text-lg text-ember">Preparación</h3><ol class="list-inside list-decimal space-y-3 text-sm">@for (step of item.pasos; track $index) { <li>{{ step }}</li> }</ol></section></div> }
    </main>
  `,
})
export class CollectionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(PortalDataService);
  readonly isBar = this.route.snapshot.data['kind'] === 'bar';
  readonly items = signal<ContentItem[]>([]);
  readonly selected = signal<ContentItem | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try { this.items.set(this.isBar ? await this.data.bar() : await this.data.catalog()); }
    catch { this.error.set('No fue posible cargar el contenido. Revisa la conexión con Supabase.'); }
    finally { this.loading.set(false); }
  }
}

