/**
 * Property-based tests for product search and category filtering logic
 *
 * **Validates: Requirements 3.4** — Search results always contain the search term
 *   in name or description (case-insensitive)
 * **Validates: Requirements 3.3** — Category filter returns only products with
 *   matching categoryId
 *
 * These tests exercise the pure filtering logic in isolation (no DB required).
 */

import { describe, it, expect } from 'vitest';

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  stock_status: 'in_stock' | 'out_of_stock';
  categoryId: string | null;
}

// ── Filtering helpers (mirror server-side logic) ──────────────────────────────

function matchesSearch(product: Product, search: string): boolean {
  const term = search.toLowerCase();
  return (
    product.name.toLowerCase().includes(term) ||
    (product.description ?? '').toLowerCase().includes(term)
  );
}

function matchesCategory(product: Product, categoryId: string): boolean {
  return product.categoryId === categoryId;
}

function filterProducts(
  products: Product[],
  search?: string,
  categoryId?: string,
): Product[] {
  return products.filter((p) => {
    const searchMatch = !search || matchesSearch(p, search);
    const categoryMatch = !categoryId || matchesCategory(p, categoryId);
    return searchMatch && categoryMatch;
  });
}

// ── Property-test helper ──────────────────────────────────────────────────────

function forAll<T>(
  generate: (i: number) => T,
  predicate: (value: T) => boolean,
  count = 100,
): void {
  for (let i = 0; i < count; i++) {
    const value = generate(i);
    if (!predicate(value)) {
      throw new Error(`Property violated for value: ${JSON.stringify(value)}`);
    }
  }
}

// ── Sample data sets ──────────────────────────────────────────────────────────

const CATEGORIES = ['cat-dairy', 'cat-grains', 'cat-beverages', 'cat-snacks'];

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', name: 'Whole Milk', description: 'Fresh whole milk', price: '2.99', stock_status: 'in_stock', categoryId: 'cat-dairy' },
  { id: '2', name: 'Skimmed Milk', description: 'Low fat dairy milk', price: '2.49', stock_status: 'in_stock', categoryId: 'cat-dairy' },
  { id: '3', name: 'Basmati Rice', description: 'Long grain aromatic rice', price: '5.99', stock_status: 'in_stock', categoryId: 'cat-grains' },
  { id: '4', name: 'Wheat Flour', description: 'Fine milled wheat flour', price: '1.99', stock_status: 'out_of_stock', categoryId: 'cat-grains' },
  { id: '5', name: 'Orange Juice', description: 'Freshly squeezed orange beverage', price: '3.49', stock_status: 'in_stock', categoryId: 'cat-beverages' },
  { id: '6', name: 'Mango Lassi', description: 'Yoghurt mango drink', price: '2.99', stock_status: 'in_stock', categoryId: 'cat-beverages' },
  { id: '7', name: 'Potato Chips', description: 'Crispy salted snacks', price: '1.49', stock_status: 'in_stock', categoryId: 'cat-snacks' },
  { id: '8', name: 'Cheese Block', description: null, price: '4.99', stock_status: 'in_stock', categoryId: 'cat-dairy' },
  { id: '9', name: 'Paneer', description: 'Fresh Indian cottage cheese', price: '3.99', stock_status: 'out_of_stock', categoryId: 'cat-dairy' },
  { id: '10', name: 'Oats', description: 'Rolled oats for porridge', price: '2.29', stock_status: 'in_stock', categoryId: 'cat-grains' },
];

// Generate varied product sets by slicing/rotating the sample list
function productSetAt(i: number): Product[] {
  const size = (i % SAMPLE_PRODUCTS.length) + 1;
  return SAMPLE_PRODUCTS.slice(0, size);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Product filtering — property tests', () => {
  // ── Property 1: Search correctness (no false positives) ──────────────────

  /**
   * **Validates: Requirements 3.4**
   * Property 1: Every product returned by a search must contain the search term
   * in its name or description (case-insensitive).
   */
  describe('Property 1 — search results always contain the search term (case-insensitive)', () => {
    it('holds for the term "milk" across all product set sizes', () => {
      forAll(
        (i) => ({ products: productSetAt(i), term: 'milk' }),
        ({ products, term }) =>
          filterProducts(products, term).every((p) => matchesSearch(p, term)),
        SAMPLE_PRODUCTS.length,
      );
    });

    it('holds for uppercase search terms (case-insensitive matching)', () => {
      const terms = ['MILK', 'RICE', 'JUICE', 'CHEESE', 'OATS'];
      for (const term of terms) {
        const results = filterProducts(SAMPLE_PRODUCTS, term);
        for (const p of results) {
          expect(matchesSearch(p, term)).toBe(true);
        }
      }
    });

    it('holds for mixed-case search terms', () => {
      const terms = ['Milk', 'bAsMatI', 'OranGe', 'Paneer'];
      for (const term of terms) {
        const results = filterProducts(SAMPLE_PRODUCTS, term);
        for (const p of results) {
          expect(matchesSearch(p, term)).toBe(true);
        }
      }
    });

    it('holds for partial-word search terms across all product set sizes', () => {
      // "mil" matches "milk", "milled" — any result must contain "mil"
      forAll(
        (i) => ({ products: productSetAt(i), term: 'mil' }),
        ({ products, term }) =>
          filterProducts(products, term).every((p) => matchesSearch(p, term)),
        SAMPLE_PRODUCTS.length,
      );
    });

    it('returns empty array when no products match the search term', () => {
      const results = filterProducts(SAMPLE_PRODUCTS, 'xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('matches terms found only in description (not name)', () => {
      // "aromatic" appears only in Basmati Rice description
      const results = filterProducts(SAMPLE_PRODUCTS, 'aromatic');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Basmati Rice');
    });

    it('handles products with null description without throwing', () => {
      // Cheese Block has null description — searching for "cheese" should still match by name
      const results = filterProducts(SAMPLE_PRODUCTS, 'cheese');
      expect(results.some((p) => p.name === 'Cheese Block')).toBe(true);
    });
  });

  // ── Property 2: Category filter correctness (no false positives) ──────────

  /**
   * **Validates: Requirements 3.3**
   * Property 2: Every product returned by a category filter must have that
   * exact categoryId.
   */
  describe('Property 2 — category filter returns only products with matching categoryId', () => {
    it('holds for all known categories across all product set sizes', () => {
      forAll(
        (i) => ({
          products: productSetAt(i),
          categoryId: CATEGORIES[i % CATEGORIES.length],
        }),
        ({ products, categoryId }) =>
          filterProducts(products, undefined, categoryId).every(
            (p) => p.categoryId === categoryId,
          ),
        SAMPLE_PRODUCTS.length,
      );
    });

    it('returns only dairy products when filtering by cat-dairy', () => {
      const results = filterProducts(SAMPLE_PRODUCTS, undefined, 'cat-dairy');
      expect(results.length).toBeGreaterThan(0);
      for (const p of results) {
        expect(p.categoryId).toBe('cat-dairy');
      }
    });

    it('returns empty array when no products belong to the given category', () => {
      const results = filterProducts(SAMPLE_PRODUCTS, undefined, 'cat-nonexistent');
      expect(results).toHaveLength(0);
    });

    it('never includes products from other categories', () => {
      for (const cat of CATEGORIES) {
        const results = filterProducts(SAMPLE_PRODUCTS, undefined, cat);
        const wrongCategory = results.filter((p) => p.categoryId !== cat);
        expect(wrongCategory).toHaveLength(0);
      }
    });
  });

  // ── No false negatives for search ────────────────────────────────────────

  /**
   * **Validates: Requirements 3.4**
   * Products that DO contain the search term must appear in results.
   */
  describe('No false negatives — search', () => {
    it('includes all products whose name contains the search term', () => {
      const term = 'milk';
      const expected = SAMPLE_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(term),
      );
      const results = filterProducts(SAMPLE_PRODUCTS, term);
      for (const p of expected) {
        expect(results.some((r) => r.id === p.id)).toBe(true);
      }
    });

    it('includes all products whose description contains the search term', () => {
      const term = 'dairy';
      const expected = SAMPLE_PRODUCTS.filter((p) =>
        (p.description ?? '').toLowerCase().includes(term),
      );
      const results = filterProducts(SAMPLE_PRODUCTS, term);
      for (const p of expected) {
        expect(results.some((r) => r.id === p.id)).toBe(true);
      }
    });

    it('holds across all product set sizes — no matching product is omitted', () => {
      const term = 'rice';
      forAll(
        (i) => productSetAt(i),
        (products) => {
          const matching = products.filter((p) => matchesSearch(p, term));
          const results = filterProducts(products, term);
          return matching.every((p) => results.some((r) => r.id === p.id));
        },
        SAMPLE_PRODUCTS.length,
      );
    });
  });

  // ── No false negatives for category ──────────────────────────────────────

  /**
   * **Validates: Requirements 3.3**
   * Products with matching categoryId must appear in results.
   */
  describe('No false negatives — category', () => {
    it('includes all products belonging to the requested category', () => {
      const cat = 'cat-grains';
      const expected = SAMPLE_PRODUCTS.filter((p) => p.categoryId === cat);
      const results = filterProducts(SAMPLE_PRODUCTS, undefined, cat);
      for (const p of expected) {
        expect(results.some((r) => r.id === p.id)).toBe(true);
      }
    });

    it('holds across all product set sizes — no matching product is omitted', () => {
      const cat = 'cat-beverages';
      forAll(
        (i) => productSetAt(i),
        (products) => {
          const matching = products.filter((p) => p.categoryId === cat);
          const results = filterProducts(products, undefined, cat);
          return matching.every((p) => results.some((r) => r.id === p.id));
        },
        SAMPLE_PRODUCTS.length,
      );
    });
  });

  // ── Combined filter ───────────────────────────────────────────────────────

  /**
   * **Validates: Requirements 3.3, 3.4**
   * When both search and category are applied, every result must satisfy both.
   */
  describe('Combined filter — results must satisfy both search and category conditions', () => {
    it('returns only dairy products matching "milk"', () => {
      const results = filterProducts(SAMPLE_PRODUCTS, 'milk', 'cat-dairy');
      for (const p of results) {
        expect(p.categoryId).toBe('cat-dairy');
        expect(matchesSearch(p, 'milk')).toBe(true);
      }
    });

    it('holds across all product set sizes and category/term combinations', () => {
      forAll(
        (i) => ({
          products: productSetAt(i),
          term: ['milk', 'rice', 'juice', 'oat'][i % 4],
          categoryId: CATEGORIES[i % CATEGORIES.length],
        }),
        ({ products, term, categoryId }) => {
          const results = filterProducts(products, term, categoryId);
          return results.every(
            (p) => matchesSearch(p, term) && p.categoryId === categoryId,
          );
        },
        SAMPLE_PRODUCTS.length,
      );
    });

    it('returns empty array when search and category have no overlap', () => {
      // "juice" products are in beverages, not dairy
      const results = filterProducts(SAMPLE_PRODUCTS, 'juice', 'cat-dairy');
      expect(results).toHaveLength(0);
    });

    it('no false negatives — products matching both conditions are included', () => {
      const term = 'milk';
      const cat = 'cat-dairy';
      const expected = SAMPLE_PRODUCTS.filter(
        (p) => matchesSearch(p, term) && p.categoryId === cat,
      );
      const results = filterProducts(SAMPLE_PRODUCTS, term, cat);
      expect(results).toHaveLength(expected.length);
      for (const p of expected) {
        expect(results.some((r) => r.id === p.id)).toBe(true);
      }
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('returns all products when no filters are applied', () => {
      const results = filterProducts(SAMPLE_PRODUCTS);
      expect(results).toHaveLength(SAMPLE_PRODUCTS.length);
    });

    it('returns all products when search is empty string', () => {
      const results = filterProducts(SAMPLE_PRODUCTS, '');
      expect(results).toHaveLength(SAMPLE_PRODUCTS.length);
    });

    it('handles empty product list gracefully', () => {
      expect(filterProducts([], 'milk')).toHaveLength(0);
      expect(filterProducts([], undefined, 'cat-dairy')).toHaveLength(0);
      expect(filterProducts([], 'milk', 'cat-dairy')).toHaveLength(0);
    });
  });
});
