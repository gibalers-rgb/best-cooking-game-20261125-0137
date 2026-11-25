// The Copper Ladle - Sizzle & Serve: shared constants, ingredient and recipe data.
// Everything here is original: names, dishes and numbers invented for this game.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const DAY_SECONDS = 150;
export const MAX_HANDS = 3;
export const MAX_PLATE_ITEMS = 4;
export const MAX_ORDERS = 4;

export const CHEF_SPEED = 260;
export const CHEF_RADIUS = 22;
export const INTERACT_RANGE = 78;

export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 4.5;
export const GRILL_BURN_AFTER = 9;
export const BOIL_SECONDS = 5;
export const BOIL_BURN_AFTER = 10;

export const ORDER_PATIENCE = 48;
export const ORDER_FIRST_AT = 4;
export const ORDER_SPAWN_EARLY = 13;
export const ORDER_SPAWN_LATE = 8;

// Ingredient catalogue. `prep` says what a raw ingredient can become:
//   chop -> chopped form, grill -> grilled form, boil -> boiled form, none -> used as-is.
export const INGREDIENTS = {
  tomato:   { name: 'Tomato',   color: '#e5484d', dark: '#a92c31', prep: 'chop',  raw: 'tomato',   done: 'chopped tomato' },
  lettuce:  { name: 'Lettuce',  color: '#58b368', dark: '#2f7d3e', prep: 'chop',  raw: 'lettuce',  done: 'chopped lettuce' },
  mushroom: { name: 'Mushroom', color: '#d9c1a3', dark: '#8a6f4d', prep: 'chop',  raw: 'mushroom', done: 'chopped mushroom' },
  cheese:   { name: 'Cheese',   color: '#ffc93c', dark: '#d99a06', prep: 'none',  raw: 'cheese',   done: 'cheese' },
  patty:    { name: 'Patty',    color: '#8a5a3b', dark: '#5d3a24', prep: 'grill', raw: 'patty',    done: 'grilled patty' },
  bun:      { name: 'Bun',      color: '#e8b25c', dark: '#b97f2e', prep: 'none',  raw: 'bun',      done: 'bun' },
  pasta:    { name: 'Pasta',    color: '#f2d06b', dark: '#c79a2e', prep: 'boil',  raw: 'pasta',    done: 'boiled pasta' },
  broth:    { name: 'Broth',    color: '#f0a35e', dark: '#b96f2a', prep: 'none',  raw: 'broth',    done: 'broth' },
};

export const INGREDIENT_ORDER = [
  'tomato', 'lettuce', 'mushroom', 'cheese', 'patty', 'bun', 'pasta', 'broth',
];

// A dish is a set of finished "kind:form" items. Order of items on the plate
// does not matter, but the form does: a raw tomato never counts as chopped.
export const RECIPES = [
  {
    id: 'ember-burger',
    name: 'Ember Burger',
    needs: ['bun:ready', 'patty:grilled', 'cheese:ready', 'lettuce:chopped'],
    price: 26,
    color: '#e07840',
  },
  {
    id: 'sunny-pasta',
    name: 'Sunny Pasta',
    needs: ['pasta:boiled', 'tomato:chopped', 'cheese:ready'],
    price: 22,
    color: '#f2c14e',
  },
  {
    id: 'forest-soup',
    name: 'Forest Soup',
    needs: ['broth:ready', 'mushroom:chopped', 'tomato:chopped'],
    price: 20,
    color: '#7fb069',
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    needs: ['lettuce:chopped', 'tomato:chopped', 'cheese:ready'],
    price: 16,
    color: '#58b368',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Pantry bins run along the bottom wall, left to right.
export function pantrySlots() {
  return INGREDIENT_ORDER.map((kind, i) => ({
    kind,
    x: 96 + i * 108,
    y: 636,
    w: 92,
    h: 62,
  }));
}

export const STATION_DEFS = [
  { id: 'board', label: 'Chopping Board', x: 150, y: 250, w: 190, h: 86 },
  { id: 'grill', label: 'Grill', x: 420, y: 250, w: 190, h: 86 },
  { id: 'pot', label: 'Boiling Pot', x: 690, y: 250, w: 190, h: 86 },
  { id: 'plate', label: 'Plating Counter', x: 960, y: 250, w: 190, h: 86 },
  { id: 'serve', label: 'Serve Window', x: 1050, y: 120, w: 180, h: 64 },
  { id: 'trash', label: 'Trash', x: 60, y: 120, w: 110, h: 64 },
];
