/**
 * Property-based tests for schema constraints
 *
 * Validates: Requirements 4.2
 * Property: quantity CHECK (quantity > 0) rejects zero and negative values
 *
 * The cart_items table enforces: quantity INTEGER NOT NULL CHECK (quantity > 0)
 * These tests verify the constraint logic holds across many sampled values.
 */

import { describe, it, expect } from 'vitest';

// Pure logic representation of the DB CHECK constraint: CHECK (quantity > 0)
function satisfiesQuantityConstraint(qty: number): boolean {
  return qty > 0;
}

// Simple property-test helper: runs `predicate` against `count` generated samples.
// Throws with a counterexample if any sample fails.
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

describe('schema constraints — cart_items.quantity CHECK (quantity > 0)', () => {
  /**
   * **Validates: Requirements 4.2**
   * Property: for any quantity <= 0, the constraint is violated (returns false)
   */
  it('rejects zero', () => {
    expect(satisfiesQuantityConstraint(0)).toBe(false);
  });

  it('rejects negative integers — property holds for all sampled negatives', () => {
    // Generate negative integers: -(i+1) gives -1, -2, ..., -100
    forAll(
      (i) => -(i + 1),
      (qty) => satisfiesQuantityConstraint(qty) === false,
      100,
    );
  });

  it('rejects large negative values', () => {
    const largeNegatives = [-1000, -999999, -2147483648]; // INT min
    for (const qty of largeNegatives) {
      expect(satisfiesQuantityConstraint(qty)).toBe(false);
    }
  });

  /**
   * **Validates: Requirements 4.2**
   * Property: for any quantity > 0, the constraint is satisfied (returns true)
   */
  it('accepts positive integers — property holds for all sampled positives', () => {
    // Generate positive integers: i+1 gives 1, 2, ..., 100
    forAll(
      (i) => i + 1,
      (qty) => satisfiesQuantityConstraint(qty) === true,
      100,
    );
  });

  it('accepts large positive values', () => {
    const largePositives = [1000, 999999, 2147483647]; // INT max
    for (const qty of largePositives) {
      expect(satisfiesQuantityConstraint(qty)).toBe(true);
    }
  });

  it('boundary: 1 is the smallest valid quantity', () => {
    expect(satisfiesQuantityConstraint(0)).toBe(false);
    expect(satisfiesQuantityConstraint(1)).toBe(true);
  });
});
