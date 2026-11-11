/** Shared helpers for the test notebooks. Each notebook runs in its own process. */

/** Python's `assert`. */
export function assert(condition: unknown, message = "assertion failed"): asserts condition {
  if (!condition) throw new Error(`AssertionError: ${message}`);
}
