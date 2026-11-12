# JavaScript Promises --- Polyfills and Iterables Revision Notes

**File:** `Promise-03-Polyfills-and-Iterables-Revision.md`

## 1. What is a polyfill?

A **polyfill** is a custom implementation that recreates the behaviour
of an existing JavaScript feature, often to support an environment where
that feature is unavailable.

We write polyfills to understand JavaScript internals, provide
compatibility, and demonstrate implementation skills in interviews.

### Simple example: a `map()`-style implementation

``` javascript
function myMap(array, callback) {
    const result = [];

    for (let i = 0; i < array.length; i++) {
        result.push(callback(array[i], i));
    }

    return result;
}

console.log(myMap([1, 2, 3], num => num * 2));
// [2, 4, 6]
```

This recreates the central behaviour of `map()`. It is an educational
implementation, not necessarily a complete specification-compliant
polyfill.

A good polyfill workflow: 1. Understand the native feature's behaviour.
2. Identify inputs and expected output. 3. Break the behaviour into
steps. 4. Implement the steps. 5. Test normal cases, errors, and edge
cases.

------------------------------------------------------------------------

## 2. What is an iterable?

An **iterable** is a value that provides an iterator, allowing its
elements to be accessed one at a time.

Common built-in iterables include arrays, strings, Sets, and Maps.

``` javascript
const vehicles = ["Car", "Bike", "Truck"];

for (const vehicle of vehicles) {
    console.log(vehicle);
}
// Car
// Bike
// Truck
```

Strings are iterable too:

``` javascript
for (const character of "NODE") {
    console.log(character);
}
// N
// O
// D
// E
```

An array is one kind of iterable, but not every iterable is an array.

------------------------------------------------------------------------

## 3. What is a Set?

A JavaScript `Set` is a collection that stores **unique values**. Adding
a duplicate value does not create another entry.

``` javascript
const vehicleTypes = new Set([
    "Car", "Bike", "Car", "Truck", "Bike"
]);

console.log(vehicleTypes);
// Set(3) { "Car", "Bike", "Truck" }
```

A Set uses `.size` to report its number of unique entries:

``` javascript
const numbers = new Set([10, 20, 10, 30, 20]);
console.log(numbers.size); // 3
```

### Array versus Set

  Feature                Array                Set
  ---------------------- -------------------- --------------------------
  Duplicate values       Allowed              Only one entry per value
  Numeric index access   Yes, e.g. `arr[1]`   No
  Number of entries      `.length`            `.size`
  Iterable               Yes                  Yes

``` javascript
const arr = ["Car", "Bike", "Truck"];
const set = new Set(["Car", "Bike", "Truck"]);

console.log(arr.length); // 3
console.log(set.size);   // 3
console.log(arr[1]);     // "Bike"
console.log(set[1]);     // undefined
```

A Set is iterable, but it is not an indexed array.

------------------------------------------------------------------------

## 4. Convert an iterable into an array with `Array.from()`

`Array.from()` creates a new array from an iterable (or an array-like
object).

``` javascript
const vehicleSet = new Set(["Car", "Bike", "Truck"]);
const vehicleArray = Array.from(vehicleSet);

console.log(vehicleArray);
// ["Car", "Bike", "Truck"]

console.log(vehicleArray.length); // 3
console.log(vehicleArray[1]);     // "Bike"
```

This is useful when code needs `.length`, numeric indexes, or an
index-based `for` loop.

### Why this matters for our Promise polyfill

The first `myPromiseAll()` version used:

``` javascript
promises.length
promises[i]
```

That works for arrays. It does not work for a Set because a Set uses
`.size` and does not support `set[i]`.

For our learning implementation, convert the iterable first:

``` javascript
const items = Array.from(promises);
```

Then use `items.length` and `items[i]`.

------------------------------------------------------------------------

## 5. What native `Promise.all()` does

`Promise.all(iterable)` returns a new **aggregate Promise**.

It: 1. Accepts an iterable of values and Promises. 2. Fulfils when all
inputs fulfil. 3. Produces a results array in **input order**, not
completion order. 4. Rejects when an input rejects. 5. Does not
automatically cancel other operations after rejection. 6. Fulfils with
an empty array when given an empty iterable.

### Input order is not completion order

``` javascript
const p1 = new Promise(resolve => {
    setTimeout(() => resolve("Vehicle"), 3000);
});
const p2 = new Promise(resolve => {
    setTimeout(() => resolve("Owner"), 1000);
});
const p3 = new Promise(resolve => {
    setTimeout(() => resolve("Insurance"), 2000);
});

Promise.all([p1, p2, p3]).then(console.log);
```

Completion order: Owner, Insurance, Vehicle.

Result order:

``` javascript
["Vehicle", "Owner", "Insurance"]
```

### Ordinary values are accepted

``` javascript
Promise.all([
    Promise.resolve("Vehicle"),
    "Owner",
    100,
    Promise.resolve("Insurance")
]).then(console.log);

// ["Vehicle", "Owner", 100, "Insurance"]
```

### Empty iterable

``` javascript
Promise.all([]).then(console.log);
// []
```

The `.then()` reaction still runs asynchronously as a microtask.

------------------------------------------------------------------------

## 6. `Promise.resolve()` and ordinary values

`Promise.resolve(value)` returns a Promise that adopts the supplied
value's state.

For an ordinary value:

``` javascript
const promise = Promise.resolve("Vehicle");
```

`promise` is a fulfilled Promise containing `"Vehicle"`; it is not the
string itself.

``` javascript
Promise.resolve("Vehicle").then(value => {
    console.log(value);
});
// Vehicle
```

It adopts the state of a Promise:

``` javascript
const original = Promise.resolve(100);
const adopted = Promise.resolve(original);

adopted.then(console.log); // 100
```

It also assimilates thenables: objects with a callable `.then()` method.

This is why our implementation uses:

``` javascript
Promise.resolve(items[i]).then(
    value => {
        // Fulfilment handler
    },
    error => {
        // Rejection handler
    }
);
```

This supports ordinary values, Promises, and thenables.

------------------------------------------------------------------------

## 7. Building `myPromiseAll()` --- the logic

The implementation steps:

1.  Return a new Promise from `myPromiseAll()`.
2.  Handle empty input by fulfilling with `[]`.
3.  Create a results array.
4.  Create a completion counter starting at zero.
5.  Visit each input.
6.  Use `Promise.resolve()` to normalise each input.
7.  Store each fulfilment at its original index.
8.  Increment the completion counter.
9.  Fulfil the aggregate Promise when the counter reaches the input
    count.
10. Reject the aggregate Promise when an input rejects.

### Why store by index?

Use `results[i] = value`.

If the second input completes first, its value still belongs at index
`1`. This preserves input order.

### Why a completion counter?

``` javascript
let completedCount = 0;
```

Increment it when an input fulfils:

``` javascript
completedCount++;
```

Then check:

``` javascript
if (completedCount === items.length) {
    resolve(results);
}
```

The counter tracks how many inputs actually fulfilled. Do not use
`results.length` as a substitute: assigning a value at a later index can
increase an array's length even while earlier positions are empty.

------------------------------------------------------------------------

## 8. First array-based implementation

``` javascript
function myPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        if (promises.length === 0) {
            resolve([]);
            return;
        }

        const results = [];
        let completedCount = 0;

        for (let i = 0; i < promises.length; i++) {
            promises[i].then(
                result => {
                    results[i] = result;
                    completedCount++;

                    if (completedCount === promises.length) {
                        resolve(results);
                    }
                },
                error => {
                    reject(error);
                }
            );
        }
    });
}
```

**Limitation:** This assumes every input has a `.then()` method. It
fails for ordinary values such as strings and numbers. It also assumes
array input.

### Improved array-based version

``` javascript
function myPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        if (promises.length === 0) {
            resolve([]);
            return;
        }

        const results = [];
        let completedCount = 0;

        for (let i = 0; i < promises.length; i++) {
            Promise.resolve(promises[i]).then(
                result => {
                    results[i] = result;
                    completedCount++;

                    if (completedCount === promises.length) {
                        resolve(results);
                    }
                },
                error => {
                    reject(error);
                }
            );
        }
    });
}
```

------------------------------------------------------------------------

## 9. Iterable-supporting learning implementation

Convert the input iterable into an array first:

``` javascript
function myPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        const items = Array.from(promises);

        if (items.length === 0) {
            resolve([]);
            return;
        }

        const results = [];
        let completedCount = 0;

        for (let i = 0; i < items.length; i++) {
            Promise.resolve(items[i]).then(
                result => {
                    results[i] = result;
                    completedCount++;

                    if (completedCount === items.length) {
                        resolve(results);
                    }
                },
                error => {
                    reject(error);
                }
            );
        }
    });
}
```

Test with an array:

``` javascript
myPromiseAll([
    Promise.resolve("Vehicle"),
    "Owner",
    100
]).then(console.log);

// ["Vehicle", "Owner", 100]
```

Test with a Set:

``` javascript
const promiseSet = new Set([
    Promise.resolve("Vehicle"),
    Promise.resolve("Owner"),
    Promise.resolve("Insurance")
]);

myPromiseAll(promiseSet).then(console.log);
// ["Vehicle", "Owner", "Insurance"]
```

**Scope note:** This is a learning implementation, not a fully
specification-compliant native `Promise.all()` polyfill. Advanced
details such as iterator-closing behaviour, abrupt iteration errors,
sparse arrays, and exact constructor/generic behaviour remain to be
studied.

------------------------------------------------------------------------

## 10. Aggregate Promise versus individual Promises

When we call:

``` javascript
const aggregatePromise = myPromiseAll([p1, p2, p3]);
```

There are four Promises: - `p1`: first individual operation - `p2`:
second individual operation - `p3`: third individual operation -
`aggregatePromise`: the Promise returned by `myPromiseAll()`

If `p2` rejects, the aggregate Promise rejects. But `p3` is not
automatically cancelled.

``` javascript
const p1 = Promise.resolve("Vehicle");
const p2 = Promise.reject(new Error("Owner failed"));

const p3 = new Promise(resolve => {
    setTimeout(() => {
        console.log("Insurance operation completed");
        resolve("Insurance");
    }, 2000);
});

myPromiseAll([p1, p2, p3])
    .catch(error => {
        console.log("Aggregate failed:", error.message);
    });
```

Output:

``` text
Aggregate failed: Owner failed
Insurance operation completed
```

The aggregate Promise remains rejected even after Insurance fulfils.

**A Promise settles only once.** A later call to its `resolve()` or
`reject()` cannot change its settled state.

This is fail-fast aggregation, not cancellation.

------------------------------------------------------------------------

## 11. `.then()` callbacks and microtasks

Even when a Promise is already fulfilled, its `.then()` callback runs
asynchronously as a microtask.

``` javascript
console.log("1");

Promise.resolve(100).then(value => {
    console.log("2:", value);
});

console.log("3");
```

Output:

``` text
1
3
2: 100
```

Synchronous statements execute first. Promise reaction callbacks run
after the current synchronous JavaScript stack completes, during
microtask processing.

------------------------------------------------------------------------

## 12. Common mistakes

  -----------------------------------------------------------------------
  Mistake                             Correct understanding
  ----------------------------------- -----------------------------------
  Returning an array from             Return a Promise so callers can use
  `myPromiseAll()`                    `.then()` and `.catch()`

  Storing values in completion order  Store with `results[i]` to preserve
                                      input order

  Using `results.length` to count     Use a separate completion counter
  completed Promises                  

  Calling `.then()` directly on every Use `Promise.resolve(input)` to
  input                               support ordinary values and
                                      thenables

  Assuming rejection cancels other    `Promise.all()` does not
  operations                          automatically cancel inputs

  Assuming a rejected aggregate can   A settled Promise cannot change
  later fulfil                        state

  Using `.length` on a Set            Use `.size`, or convert it to an
                                      array

  Assuming a Set supports `[0]`       A Set is iterable but not
  indexing                            index-based
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 13. Self-test

Try these questions before looking at the answers.

### Questions

1.  What is a polyfill?
2.  What makes an object iterable?
3.  What is the main difference between an Array and a Set?
4.  What does `Array.from()` do?
5.  Why does `myPromiseAll()` use `Promise.resolve(items[i])`?
6.  Why do we store a result using `results[i]`?
7.  Why is a separate `completedCount` needed?
8.  What does native `Promise.all([])` fulfil with?
9.  Does a rejected aggregate Promise cancel the other input operations?
10. Can an already-rejected aggregate Promise become fulfilled later?

### Answers

1.  A custom implementation that recreates the behaviour of an existing
    JavaScript feature.
2.  It provides an iterator so its values can be consumed one at a time.
3.  Arrays allow duplicates and indexed access; Sets store unique values
    and do not provide numeric index access.
4.  It creates an array from an iterable or array-like object.
5.  It normalises ordinary values, Promises, and thenables so a
    `.then()` handler can be attached.
6.  To preserve the original input order regardless of completion order.
7.  It tracks how many input Promises have fulfilled; array length does
    not reliably count fulfilled entries.
8.  An empty array, `[]`.
9.  No. Other operations continue unless cancellation is separately
    implemented.
10. No. A Promise's settled state is permanent.

------------------------------------------------------------------------

## 14. Resume point for the next study session

**Task:** Write the iterable-supporting `myPromiseAll()` implementation
yourself.

Requirements: - Convert the input iterable with `Array.from()`. - Handle
empty input. - Create a results array. - Track fulfilled inputs with
`completedCount`. - Use `Promise.resolve(items[i])`. - Preserve original
input order. - Reject the aggregate Promise when an input rejects.

After that, test edge cases, improve the implementation, and study the
remaining Promise combinators: `Promise.allSettled()`, `Promise.race()`,
and `Promise.any()`.

**Do not move to async/await yet.** First master Promise combinators and
their polyfills.
