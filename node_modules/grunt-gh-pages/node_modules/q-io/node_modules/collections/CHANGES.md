
## v0.0.5

-   The `observable-array` and `observable-object` modules have been
    moved to the Functional Reactive Bindings (`frb`) package as `array`
    and `object`.
-   `List`, `Set`, and `SortedSet` now support content change
    notifications compatibly with `frb`.
-   The `observable` module provides generics methods for observables.
    New collections need only call the appropriate dispatch functions if
    `isObservable` is true.

