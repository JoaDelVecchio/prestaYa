export type DiffResult<T extends Record<string, unknown>> = Record<
  keyof T,
  {
    before: unknown;
    after: unknown;
  }
>;

export function diffObjects<T extends Record<string, unknown> | null | undefined>(
  before: T,
  after: T
): DiffResult<Record<string, unknown>> {
  const result: DiffResult<Record<string, unknown>> = {} as DiffResult<Record<string, unknown>>;
  const beforeObj = before ? (before as Record<string, unknown>) : {};
  const afterObj = after ? (after as Record<string, unknown>) : {};
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  keys.forEach((key) => {
    const prev = beforeObj[key];
    const next = afterObj[key];

    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      (result as Record<string, { before: unknown; after: unknown }>)[key] = {
        before: prev,
        after: next
      };
    }
  });

  return result;
}
