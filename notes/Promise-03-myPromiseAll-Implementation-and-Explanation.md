# Promise-03 --- `myPromiseAll()` Polyfill: Code and Explanation

This document accompanies `Promise-03-myPromiseAll.js`.

## 1. Goal

We are recreating the central behaviour of native `Promise.all()` in our
own function:

``` javascript
myPromiseAll([p1, p2, p3])
    .then(results => console.log(results))
    .catch(error => console.error(error));
```

Our function must return a Promise. It must fulfil with an array of
results when every input fulfils, or reject when an input rejects.

## 2. Complete learning implementation

``` javascript
function myPromiseAll(promises) {
    return new Promise((resolve, reject) => {
        // Step 1: Convert the iterable into an array.
        const items = Array.from(promises);

        // Step 2: Handle empty input.
        if (items.length === 0) {
            resolve([]);
            return;
        }

        // Step 3: Prepare storage and a completion counter.
        const results = [];
        let completedCount = 0;

        // Step 4: Process every input using its original index.
        for (let i = 0; i < items.length; i++) {
            Promise.resolve(items[i]).then(
                value => {
                    // Store at the original position.
                    results[i] = value;

                    // Count this fulfilled input.
                    completedCount++;

                    // Fulfil only after all inputs fulfil.
                    if (completedCount === items.length) {
                        resolve(results);
                    }
                },
                error => {
                    // Reject the aggregate Promise.
                    reject(error);
                }
            );
        }
    });
}
```

## 3. Line-by-line explanation

### Step 1 --- Return a new Promise

``` javascript
return new Promise((resolve, reject) => {
```

`myPromiseAll()` must return a Promise so its caller can attach
`.then()` and `.catch()` handlers.

-   `resolve(value)` fulfils the Promise returned by `myPromiseAll()`.
-   `reject(error)` rejects that returned Promise.

This returned Promise represents the combined outcome of all input
operations. It is called the **aggregate Promise**.

### Step 2 --- Convert the iterable into an array

``` javascript
const items = Array.from(promises);
```

Native `Promise.all()` accepts an iterable. Our implementation wants to
use `.length` and numeric indexes, so we convert the iterable into an
array.

Examples of supported synchronous iterables include arrays and Sets:

``` javascript
const values = new Set(["Vehicle", "Owner"]);
const items = Array.from(values);

console.log(items); // ["Vehicle", "Owner"]
```

A Set has `.size`, not `.length`, and it does not support `set[0]`.
After conversion, `items.length` and `items[i]` work.

### Step 3 --- Handle empty input

``` javascript
if (items.length === 0) {
    resolve([]);
    return;
}
```

There are no inputs to wait for, so fulfil the aggregate Promise with an
empty array.

The `return` exits the Promise executor callback so the loop is not
reached.

### Step 4 --- Create the results array

``` javascript
const results = [];
```

This array stores the fulfilled values.

It must preserve the original input order, even if the operations finish
in a different order.

### Step 5 --- Create a completion counter

``` javascript
let completedCount = 0;
```

This counts how many inputs have fulfilled.

We need a separate counter because `results.length` does not reliably
tell us how many inputs have completed. For example, assigning
`results[2]` can make the array length equal to `3` even if indexes `0`
and `1` are still empty.

### Step 6 --- Iterate using the original index

``` javascript
for (let i = 0; i < items.length; i++) {
```

The loop visits each input. The index `i` identifies that input's
original position.

### Step 7 --- Normalise each input with `Promise.resolve()`

``` javascript
Promise.resolve(items[i]).then(
```

This is important because native `Promise.all()` accepts both Promises
and ordinary values.

``` javascript
Promise.resolve("Owner")
```

returns a fulfilled Promise containing `"Owner"`; it does not return the
string directly.

`Promise.resolve()` also adopts the state of Promises and assimilates
thenables (objects with a callable `.then()` method). This lets us
attach `.then()` consistently.

### Step 8 --- Store the value at the original index

``` javascript
value => {
    results[i] = value;
```

Do not use `results.push(value)`. `push()` would store values in
completion order.

For example, if the second input finishes first, it must still be stored
at index `1`:

``` javascript
results[1] = "Owner";
```

This is how the result array preserves input order.

### Step 9 --- Increment the completion counter

``` javascript
completedCount++;
```

Each fulfilled input increments the count exactly once.

### Step 10 --- Fulfil after all inputs fulfil

``` javascript
if (completedCount === items.length) {
    resolve(results);
}
```

Only when the number of fulfilled inputs equals the total number of
inputs do we fulfil the aggregate Promise with the results array.

### Step 11 --- Reject when an input rejects

``` javascript
error => {
    reject(error);
}
```

The rejection handler rejects the aggregate Promise with the original
error.

This is the fail-fast aggregate behaviour of `Promise.all()`.

## 4. Why input order is preserved

Suppose the inputs are:

  Input         Original index   Completion time
  ----------- ---------------- -----------------
  Vehicle                    0         3 seconds
  Owner                      1          1 second
  Insurance                  2         2 seconds

Completion order is Owner, Insurance, Vehicle.

Our code stores values like this:

``` javascript
results[1] = "Owner";
results[2] = "Insurance";
results[0] = "Vehicle";
```

Final result:

``` javascript
["Vehicle", "Owner", "Insurance"]
```

The original index, not completion time, determines the result position.

## 5. Aggregate rejection does not cancel other inputs

Consider:

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

Expected output:

``` text
Aggregate failed: Owner failed
Insurance operation completed
```

The aggregate Promise rejects when the rejection handler calls
`reject(error)`. The Insurance operation is independent and is not
automatically cancelled.

If its fulfilment handler later runs, it may still update the local
`results` array and increment the counter. A later call to
`resolve(results)` cannot change the aggregate Promise because a Promise
can settle only once.

**Important distinction:** fail-fast aggregation is not cancellation.
Cancellation must be designed separately, for example with an
`AbortController` when the underlying APIs support abort signals.

## 6. Runnable tests

The companion file `Promise-03-myPromiseAll.js` includes these tests:

1.  **Different completion times:** proves input order is preserved.
2.  **Ordinary values mixed with Promises:** proves `Promise.resolve()`
    normalisation works.
3.  **Set input:** proves the iterable is converted to an array.
4.  **Empty input:** expects `[]`.
5.  **Rejection:** proves the aggregate rejects and another operation
    can still complete.

Run it with Node.js:

``` bash
node Promise-03-myPromiseAll.js
```

The timer-based tests may print their messages in an order different
from the order in which the tests appear in the file.

## 7. Current limitations

This is a **learning implementation**, not a fully
specification-compliant native `Promise.all()` polyfill.

It demonstrates the core algorithm and supports ordinary arrays, other
synchronous iterables such as Sets, ordinary values, Promises, and
thenables.

Advanced specification details still to study include:

-   Iterator closing and abrupt iterator errors.
-   Exact behaviour when obtaining or advancing an iterator throws.
-   Sparse-array details and how array iteration treats holes.
-   Constructor/generic behaviour of the native static method.
-   Edge cases involving hostile or unusual thenables.

We should not claim complete native-spec compatibility until these are
implemented and tested.

## 8. Revision checklist

Before moving on, make sure you can explain these without looking at the
code:

-   Why does `myPromiseAll()` return a new Promise?
-   Why do we use `Array.from()`?
-   Why do we use `Promise.resolve(items[i])`?
-   Why is `results[i] = value` necessary?
-   Why do we need `completedCount`?
-   Why does the aggregate Promise reject when one input rejects?
-   Why do other input operations continue after aggregate rejection?
-   Why can the aggregate Promise not change from rejected to fulfilled?

## 9. Resume point

Next exercise: rewrite the iterable-supporting implementation from
memory, then test it with an array, a Set, ordinary values, an empty
iterable, and a rejected input.

After this, continue with `Promise.allSettled()`, `Promise.race()`, and
`Promise.any()` before moving to async/await.
