# JavaScript Promise.race() — Complete Notes

## 1. What is Promise.race()?

`Promise.race()` is a Promise combinator that accepts an iterable of Promises (or other values) and returns a Promise that settles as soon as the **first input Promise settles**.

A Promise can settle in two ways:

- Fulfilled — operation completed successfully.
- Rejected — operation failed.

The important point is that `Promise.race()` does not wait for the first successful Promise. It waits for the first settled Promise, whether fulfilled or rejected.

### Syntax

```javascript
Promise.race(iterable)
    .then(result => {
        console.log(result);
    })
    .catch(error => {
        console.error(error);
    });
```

---

## 2. Basic Example — First Promise to Fulfil

```javascript
const p1 = new Promise(resolve => {
    setTimeout(() => resolve("Service A"), 3000);
});

const p2 = new Promise(resolve => {
    setTimeout(() => resolve("Service B"), 1000);
});

const p3 = new Promise(resolve => {
    setTimeout(() => resolve("Service C"), 2000);
});

Promise.race([p1, p2, p3])
    .then(result => {
        console.log(result);
    });
```

### Output

```text
Service B
```

### Explanation

| Promise | Duration | Outcome |
|---|---:|---|
| p1 | 3 seconds | Fulfilled |
| p2 | 1 second | Fulfilled |
| p3 | 2 seconds | Fulfilled |

Service B fulfils first, so the aggregate Promise fulfils with `"Service B"`.

**Remember:** First settled Promise wins.

---

## 3. First Rejection Wins

An important characteristic of `Promise.race()` is that the first rejection can win even when other Promises eventually fulfil.

```javascript
const p1 = new Promise(resolve => {
    setTimeout(() => resolve("Vehicle loaded"), 1000);
});

const p2 = new Promise((resolve, reject) => {
    setTimeout(() => reject("Owner service failed"), 500);
});

const p3 = new Promise(resolve => {
    setTimeout(() => resolve("Insurance loaded"), 2000);
});

Promise.race([p1, p2, p3])
    .then(result => {
        console.log("Success:", result);
    })
    .catch(error => {
        console.log("Error:", error);
    });
```

### Output

```text
Error: Owner service failed
```

### Explanation

| Promise | Duration | Outcome |
|---|---:|---|
| Vehicle | 1 second | Fulfilled |
| Owner | 500 ms | Rejected |
| Insurance | 2 seconds | Fulfilled |

Owner rejects first, so the aggregate Promise rejects.

Vehicle and Insurance operations continue running. Their results cannot change the already-rejected aggregate Promise.

---

## 4. Promise.race() Preserves First Settlement, Not Input Order

Consider:

```javascript
const p1 = new Promise(resolve => {
    setTimeout(() => resolve("A"), 3000);
});

const p2 = new Promise(resolve => {
    setTimeout(() => resolve("B"), 1000);
});

const p3 = new Promise(resolve => {
    setTimeout(() => resolve("C"), 2000);
});

Promise.race([p1, p2, p3])
    .then(console.log);
```

Output:

```text
B
```

Unlike `Promise.all()` and `Promise.allSettled()`, `Promise.race()` does not return an array of all results.

It returns only the result or rejection reason of the first settled input.

### What if all Promises are already fulfilled?

```javascript
Promise.race([
    Promise.resolve("A"),
    Promise.resolve("B"),
    Promise.resolve("C")
])
.then(console.log);
```

Output:

```text
A
```

When these already-settled inputs are processed in iterable order, A's reaction settles the aggregate first.

---

## 5. What Happens to Other Promises?

`Promise.race()` does not cancel the Promises that lose the race.

Example:

```javascript
const p1 = new Promise(resolve => {
    setTimeout(() => {
        resolve("Fast operation");
    }, 1000);
});

const p2 = new Promise(resolve => {
    setTimeout(() => {
        resolve("Slow operation");
    }, 5000);
});

Promise.race([p1, p2])
    .then(console.log);
```

Output after approximately 1 second:

```text
Fast operation
```

The second operation continues running and can complete after 5 seconds.

**Important distinction:**

- `Promise.race()` settles the aggregate Promise.
- It does not automatically cancel the underlying asynchronous operations.

---

## 6. Empty Iterable — Important Interview Edge Case

What happens when we pass an empty array?

```javascript
Promise.race([])
    .then(result => console.log("Success:", result))
    .catch(error => console.log("Error:", error));

console.log("End");
```

Output:

```text
End
```

Neither `.then()` nor `.catch()` executes.

### Why?

```javascript
Promise.race([])
```

returns a Promise that remains **pending forever**.

There are no input Promises to fulfil or reject the race.

### Comparison of empty iterable behaviour

| Combinator | Result |
|---|---|
| `Promise.all([])` | Fulfilled with `[]` |
| `Promise.allSettled([])` | Fulfilled with `[]` |
| `Promise.race([])` | Remains pending |
| `Promise.any([])` | Rejected with `AggregateError` |

---

## 7. Promise.race() Accepts Ordinary Values

`Promise.race()` accepts Promises, ordinary values, and other iterable inputs.

```javascript
Promise.race([
    100,
    Promise.resolve(200),
    Promise.resolve(300)
])
.then(console.log);
```

Output:

```text
100
```

An ordinary value is treated like an already-fulfilled Promise.

Because the values are processed in iterable order, the first value wins in this example.

---

## 8. Practical Backend Use Case — API Timeout

One of the most useful applications of `Promise.race()` is implementing request timeouts.

### Business scenario

Suppose an external API normally responds within 2 seconds but sometimes takes 10 seconds.

Our application should stop waiting after 3 seconds.

We need two competing Promises:

1. API request Promise — fulfils or rejects based on the API operation.
2. Timeout Promise — rejects after 3 seconds.

```javascript
Promise.race([
    apiRequest(),
    timeoutPromise
]);
```

Whichever Promise settles first determines the aggregate result.

### Step 1 — Create the API request

```javascript
function apiRequest() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("API response received");
        }, 2000);
    });
}
```

### Step 2 — Create the timeout Promise

```javascript
const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject(new Error("Request timed out"));
    }, 3000);
});
```

### Step 3 — Combine using Promise.race()

```javascript
Promise.race([
    apiRequest(),
    timeoutPromise
])
.then(response => {
    console.log(response);
})
.catch(error => {
    console.error(error.message);
});
```

Output:

```text
API response received
```

The API responds in 2 seconds, before the 3-second timeout.

### Scenario 2 — API takes 5 seconds

Change the API duration:

```javascript
function apiRequest() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("API response received");
        }, 5000);
    });
}
```

Keep the timeout at 3 seconds.

Output after approximately 3 seconds:

```text
Request timed out
```

The aggregate Promise rejects after 3 seconds.

The API operation still continues and fulfils after 5 seconds.

**Important:** This basic timeout pattern limits how long the caller waits. It does not automatically cancel the API operation.

---

## 9. AbortController — Actually Cancelling Supported Operations

To cancel a supported operation such as `fetch()`, we can use `AbortController`.

### Create an AbortController

```javascript
const controller = new AbortController();
```

### Pass its signal to fetch()

```javascript
fetch(url, {
    signal: controller.signal
});
```

### Request cancellation

```javascript
controller.abort();
```

This signals cancellation to the fetch operation.

### Difference between Promise.race() and AbortController

| Promise.race() | AbortController |
|---|---|
| Determines which Promise settles the aggregate first | Signals cancellation to an operation |
| Does not cancel the losing Promise | Can cancel supported ongoing operations |
| Promise orchestration | Cancellation mechanism |

### Complete timeout implementation using fetch()

```javascript
function fetchWithTimeout(url, timeout) {

    const controller = new AbortController();

    let timeoutId;

    const timeoutPromise = new Promise((resolve, reject) => {

        timeoutId = setTimeout(() => {

            reject(new Error("Request timed out"));

            controller.abort();

        }, timeout);

    });

    return Promise.race([
        fetch(url, {
            signal: controller.signal
        }),
        timeoutPromise
    ])
    .finally(() => {
        clearTimeout(timeoutId);
    });
}
```

### How it works

1. Create an `AbortController`.
2. Pass its signal to `fetch()`.
3. Create a timeout Promise.
4. If the timeout occurs, reject the timeout Promise and call `controller.abort()`.
5. `Promise.race()` rejects with the timeout error.
6. The fetch operation receives the abort signal.
7. `finally()` clears the timer when the aggregate Promise settles.

Note: This implementation returns the fetch Response when successful. The caller must still check `response.ok` and process the response body. Cancellation is cooperative: it applies to operations that support the supplied signal.

---

## 10. Promise.race() vs Promise.all() vs Promise.allSettled()

| Behaviour | Promise.all() | Promise.allSettled() | Promise.race() |
|---|---|---|---|
| Waits for all inputs to settle | No, rejects on first observed rejection | Yes | No |
| First fulfilment | Continues waiting for remaining inputs | Continues waiting | Settles aggregate |
| First rejection | Rejects aggregate | Records rejection | Rejects aggregate |
| Returns all outcomes | No, only if all fulfil | Yes | No |
| Preserves input order | Yes | Yes | Not applicable |
| Empty iterable | Fulfilled with `[]` | Fulfilled with `[]` | Pending forever |
| Cancels remaining operations | No | No | No |

### When should we use each?

**Promise.all()**

Use when all operations must fulfil to produce a successful aggregate result.

Example: Fetch mandatory order, payment, and shipment information.

**Promise.allSettled()**

Use when you need to collect the outcome of every independent operation, including failures.

Example: A dashboard with optional services.

**Promise.race()**

Use when the first settled result determines the outcome.

Example: API timeout, competing requests, or first-response scenarios.

---

## 11. Common Interview Questions

### Q1. What is Promise.race()?

`Promise.race()` accepts an iterable of Promises and settles its aggregate Promise with the outcome of the first input Promise to settle, whether fulfilled or rejected.

### Q2. Does Promise.race() wait for the first successful Promise?

No. It waits for the first settled Promise. A rejection can win the race.

### Q3. Does Promise.race() cancel other Promises?

No. Other operations continue unless explicitly cancelled using a supported cancellation mechanism such as AbortController.

### Q4. What happens when Promise.race() receives an empty array?

It returns a Promise that remains pending forever.

### Q5. What happens if all input Promises are already fulfilled?

The first input's reaction is processed first when the already-settled inputs are supplied in iterable order, so the first input wins.

### Q6. Can Promise.race() be used for API timeouts?

Yes. Race the API request against a timeout Promise. If the timeout rejects first, the aggregate Promise rejects with the timeout error.

### Q7. Is Promise.race() sufficient to cancel an API request?

No. It only settles the aggregate Promise. Use AbortController with APIs such as fetch that support AbortSignal.

### Q8. What happens if the first settled Promise rejects and the second fulfils later?

The aggregate Promise remains rejected. Its state cannot change after settlement.

---

## 12. Quick Revision — Remember These Rules

1. `Promise.race()` returns a Promise.
2. The first settled input wins.
3. First settled means fulfilled OR rejected.
4. It does not wait for all inputs.
5. It does not automatically cancel other operations.
6. It preserves neither a result array nor all input outcomes; it returns one winning outcome.
7. Empty iterable means pending forever.
8. Ordinary values are accepted.
9. It is useful for implementing API timeouts.
10. Use AbortController when you need to cancel supported ongoing operations.

## 13. Interview-Ready Summary

"`Promise.race()` is a Promise combinator that settles as soon as the first input Promise settles, regardless of whether it fulfils or rejects. It is useful for implementing timeout mechanisms and competing asynchronous operations. However, it does not automatically cancel the remaining operations. For actual cancellation of supported requests, such as fetch, I would combine it with AbortController. In Node.js backend systems, this is useful for controlling how long we wait for external services and preventing unnecessary work where cancellation is supported."