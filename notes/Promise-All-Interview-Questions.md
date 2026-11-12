# Promise.all() — Interview Questions and Notes

**Repository file:** `notes/Promise-All-Interview-Questions.md`  
**Related code:** `Promise-01-Promise-All-Order-Summary.js` and `Promise-02-Promise-All-Optional-Failures.js`

This document consolidates the Promise.all() concepts practised so far. Examples use `.then()` and `.catch()`; async/await is intentionally outside this module.

---

## 1. What is Promise.all()?

`Promise.all(iterable)` accepts an iterable of values and Promises and returns a new aggregate Promise.

- It fulfils when every input fulfils.
- Its fulfilment value is an array of results.
- The result array preserves the input order, not completion order.
- It rejects when an input Promise rejects.

```javascript
Promise.all([
  Promise.resolve("Vehicle"),
  Promise.resolve("Owner"),
  Promise.resolve("Insurance")
])
.then(results => {
  console.log(results);
})
.catch(error => {
  console.error(error);
});
```

Output:

```text
[ 'Vehicle', 'Owner', 'Insurance' ]
```

## 2. Why use Promise.all() instead of sequential .then() calls?

Use it when operations are independent and can be initiated without waiting for one another.

For example, a dashboard may fetch vehicle, owner, and insurance data independently.

```javascript
Promise.all([
  getVehicle(101),
  getOwner(101),
  getInsurance(101)
])
.then(([vehicle, owner, insurance]) => {
  return { vehicle, owner, insurance };
});
```

The three function calls are evaluated while JavaScript builds the array. Their asynchronous operations are initiated without waiting for the previous operation to finish.

By contrast, chaining dependent operations can make them sequential:

```javascript
getVehicle(101)
  .then(vehicle => {
    return getOwner(vehicle.ownerId);
  })
  .then(owner => {
    return getInsurance(owner.id);
  });
```

Use sequential chaining when a later operation needs data from an earlier operation. Use `Promise.all()` when the operations are independent.

**Important:** Concurrent initiation is not the same as CPU parallel execution.

## 3. Does Promise.all() execute the functions itself?

No. JavaScript evaluates the array elements before calling `Promise.all()`.

```javascript
Promise.all([
  getVehicle(101),
  getOwner(101)
]);
```

JavaScript invokes `getVehicle(101)` and `getOwner(101)` while evaluating the array. `Promise.all()` receives their returned values/Promises and observes their outcomes.

This does not start the functions:

```javascript
Promise.all([
  getVehicle,
  getOwner
]);
```

Here, the array contains function references, not the Promises returned by calling those functions. `Promise.all()` does not invoke those functions.

## 4. Does Promise.all() preserve input order?

Yes. The output array follows the order of the input iterable, not the order in which the operations finish.

```javascript
Promise.all([
  getVehicle(),  // completes in 3 seconds
  getOwner(),    // completes in 1 second
  getInsurance() // completes in 2 seconds
])
.then(([vehicle, owner, insurance]) => {
  console.log(vehicle, owner, insurance);
});
```

Even though owner finishes first, its result occupies index 1 because it was the second input.

## 5. What happens if one Promise rejects?

The aggregate Promise rejects as soon as an input rejection is observed. The aggregate fulfilment handler is skipped, and a rejection handler can handle the error.

```javascript
Promise.all([
  Promise.resolve("Vehicle loaded"),
  Promise.reject(new Error("Insurance failed")),
  Promise.resolve("Owner loaded")
])
.then(results => {
  console.log("Dashboard:", results);
})
.catch(error => {
  console.error("Dashboard failed:", error.message);
});
```

Output:

```text
Dashboard failed: Insurance failed
```

This behaviour is commonly described as **fail-fast rejection**.

## 6. Does Promise.all() cancel the other operations after a rejection?

No. Promise.all() rejects its aggregate Promise, but it does not automatically cancel the other underlying operations.

Example:

| Operation | Outcome |
|---|---|
| A | Fulfils after 1 second |
| B | Rejects after 2 seconds |
| C | Fulfils after 4 seconds |

The aggregate Promise rejects when B's rejection is observed. C continues running and can still complete after 4 seconds.

The aggregate Promise is already rejected; C's later fulfilment cannot change its state.

Cancellation must be implemented separately, for example with `AbortController` when the underlying API supports cancellation.

## 7. Why must we return the Promise chain from a function?

Returning the Promise exposes the asynchronous result to the caller. The caller can then attach `.then()` and `.catch()` handlers or compose the function into another Promise chain.

Incorrect:

```javascript
function getOrderSummary(orderId) {
  Promise.all([
    getOrder(orderId),
    getPayment(orderId)
  ])
  .then(([order, payment]) => {
    return { order, payment };
  });
}

const result = getOrderSummary(101);
console.log(result); // undefined
```

The function does not return the Promise chain, so the function itself returns `undefined`.

Correct:

```javascript
function getOrderSummary(orderId) {
  return Promise.all([
    getOrder(orderId),
    getPayment(orderId)
  ])
  .then(([order, payment]) => {
    return { order, payment };
  });
}

getOrderSummary(101)
  .then(summary => {
    console.log(summary);
  })
  .catch(error => {
    console.error(error);
  });
```

## 8. What happens if .then() logs a value instead of returning it?

A handler that does not explicitly return a value implicitly returns `undefined`.

```javascript
Promise.resolve(200)
  .then(value => {
    console.log(value * 2); // 400
    // No return statement.
  })
  .then(result => {
    console.log(result); // undefined
  });
```

Logging displays a value; it does not pass that value to the next handler.

To propagate the value:

```javascript
Promise.resolve(200)
  .then(value => {
    const doubled = value * 2;
    console.log(doubled);
    return doubled;
  })
  .then(result => {
    console.log(result); // 400
  });
```

## 9. What is the difference between returning a value and returning a Promise from .then()?

A normal returned value fulfils the next Promise with that value.

```javascript
Promise.resolve(10)
  .then(value => {
    return value + 5;
  })
  .then(result => {
    console.log(result); // 15
  });
```

When a handler returns a Promise, the Promise created by `.then()` adopts that returned Promise's eventual state and value.

```javascript
Promise.resolve("Start")
  .then(() => {
    return Promise.resolve("Next value");
  })
  .then(value => {
    console.log(value); // Next value
  });
```

## 10. How do you handle mandatory and optional dependencies with Promise.all()?

Consider a GVR vehicle dashboard:

| Service | Requirement | Failure policy |
|---|---|---|
| Vehicle | Mandatory | Reject dashboard |
| Owner | Mandatory | Reject dashboard |
| Insurance | Optional | Use `null` fallback |
| Service history | Optional | Use `[]` fallback |

Attach individual `.catch()` handlers to optional dependencies. Their failures are converted into fulfilled Promises with fallback values.

```javascript
function getVehicleDashboard(vehicleId) {
  return Promise.all([
    // Mandatory: rejection propagates to Promise.all().
    getVehicle(vehicleId),

    // Mandatory: rejection propagates to Promise.all().
    getOwner(vehicleId),

    // Optional: recover with null.
    getInsurance(vehicleId)
      .catch(error => {
        console.error("Insurance failed:", error.message);
        return null;
      }),

    // Optional: recover with an empty array.
    getServiceHistory(vehicleId)
      .catch(error => {
        console.error("Service history failed:", error.message);
        return [];
      })
  ])
  .then(([vehicle, owner, insurance, serviceHistory]) => {
    return {
      vehicle,
      owner,
      insurance,
      serviceHistory
    };
  });
}
```

The aggregate Promise can fulfil if the mandatory services succeed and the optional failures are recovered.

If vehicle or owner rejects, the aggregate Promise rejects and the caller's `.catch()` handles it.

## 11. What does an individual .catch() return?

The value returned from a catch handler determines the state/value of the Promise returned by that catch.

| Catch handler | Result |
|---|---|
| `return null` | Fulfilled with `null` |
| `return []` | Fulfilled with an empty array |
| Only `console.log(error)` | Fulfilled with `undefined` |
| `throw error` | Rejected |
| Return a rejected Promise | Rejected |

Example — logging without returning:

```javascript
Promise.reject("Insurance failed")
  .catch(error => {
    console.log(error);
  })
  .then(result => {
    console.log("Result:", result);
  });
```

Output:

```text
Insurance failed
Result: undefined
```

Example — recovering with a fallback:

```javascript
Promise.reject("Insurance failed")
  .catch(error => {
    console.log(error);
    return null;
  })
  .then(result => {
    console.log("Result:", result);
  });
```

Output:

```text
Insurance failed
Result: null
```

## 12. What happens with an empty iterable?

Additional standard JavaScript fact:

```javascript
Promise.all([])
  .then(results => {
    console.log(results);
  });
```

The aggregate Promise fulfils with an empty array: `[]`.

## 13. Interview-ready summary

> I use Promise.all() when multiple asynchronous operations are independent and can be initiated concurrently. It returns an aggregate Promise that fulfils when all inputs fulfil, preserving their input order in the result array. If an input rejects, the aggregate rejects, but Promise.all() does not cancel the other operations.
>
> In an aggregation API, I distinguish mandatory and optional downstream dependencies. Mandatory failures propagate to the aggregate Promise. Optional failures are handled individually with catch handlers and suitable fallback values. I return the aggregate Promise from my service function so the caller can handle the result or failure.

---

## Quick revision checklist

- [ ] Explain what Promise.all() returns.
- [ ] Explain concurrent initiation versus sequential execution.
- [ ] Explain why Promise.all() does not invoke function references.
- [ ] Explain input-order preservation.
- [ ] Explain fail-fast aggregate rejection.
- [ ] Explain why other operations are not automatically cancelled.
- [ ] Explain why returning the Promise chain matters.
- [ ] Explain why logging is different from returning.
- [ ] Implement mandatory and optional dependency handling.
- [ ] Explain how catch recovery changes the resulting Promise.

**Scope note:** `Promise.allSettled()`, `Promise.race()`, `Promise.any()`, and implementing Promise combinator polyfills are separate upcoming topics.
