export type Changed<T> = T & { changed: boolean }

export type ChangedContainer<TSource, TTarget> = TSource & {
  [TKey in keyof TSource]: TSource[TKey] extends TTarget ? Changed<TSource[TKey]> : ChangedContainer<TSource[TKey], TTarget>
}
