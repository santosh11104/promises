# JavaScript Promise.allSettled() — Complete Revision Notes

## 1. What is Promise.allSettled()?

`Promise.allSettled()` is a Promise combinator that accepts an iterable of Promises (or other values) and waits until **every input has settled**.

A Promise is settled when it is either:

- **Fulfilled** — operation completed successfully.
- **Rejected** — operation failed.

Unlike `Promise.all()`, `Promise.allSettled()` does not reject its aggregate Promise merely because one of the input Promises rejects.

It collects the outcome of every operation.

### Syntax

```javascript
Promise.allSettled(iterable)
    .then(results => {
        console.log(results);
    });
```

Each result object has one of two shapes:

**Fulfilled result:**

```javascript
{
    status: "fulfilled",
    value: "Operation successful"
}
```

**Rejected result:**

```javascript
{
    status: "rejected",
    reason: "Something went wrong"
}
```

---

## 2. Basic Example

```javascript
const promises = [
    Promise.resolve("Vehicle loaded"),
    Promise.reject("Owner service failed"),
    Promise.resolve("Insurance loaded")
];

Promise.allSettled(promises)
    .then(results => {
        console.log(results);
    });
```

### Output

```javascript
[
    {
        status: "fulfilled",
        value: "Vehicle loaded"
    },
    {
        status: "rejected",
        reason: "Owner service failed"
    },
    {
        status: "fulfilled",
        value: "Insurance loaded"
    }
]
```

### Important observations

1. Three input Promises produce three result objects.
2. A successful Promise produces `status: "fulfilled"` and a `value`.
3. A failed Promise produces `status: "rejected"` and a `reason`.
4. The aggregate Promise fulfils after all input Promises settle.
5. The result array preserves the original input order, not completion order.

---

## 3. Understanding Execution Timing

Consider three independent service calls:

| Service | Duration | Outcome |
|---|---:|---|
| Vehicle | 1 second | Fulfilled |
| Owner | 2 seconds | Rejected |
| Insurance | 5 seconds | Fulfilled |

```javascript
Promise.allSettled([
    getVehicle(),
    getOwner(),
    getInsurance()
])
.then(results => {
    console.log(results);
});
```

### Execution timeline

- At 1 second: Vehicle fulfils.
- At 2 seconds: Owner rejects.
- At 5 seconds: Insurance fulfils.
- At 5 seconds: All Promises have settled, so the aggregate `.then()` handler executes.

**Key rule:** `Promise.allSettled()` waits for the slowest input Promise to settle.

It does not stop waiting when an input Promise rejects.

---

## 4. Real-World Backend Example — GVR Vehicle Dashboard

Suppose a Government Vehicle Registry dashboard calls four independent services:

- Vehicle service — mandatory.
- Owner service — mandatory.
- Insurance service — optional.
- Service history — optional.

We want to collect every service's outcome so the dashboard can decide what information to display.

```javascript
function getVehicleDashboard(vehicleId) {

    return Promise.allSettled([
        getVehicle(vehicleId),
        getOwner(vehicleId),
        getInsurance(vehicleId),
        getServiceHistory(vehicleId)
    ])
    .then(results => {

        const [vehicle, owner, insurance, history] = results;

        return {
            vehicle,
            owner,
            insurance,
            history
        };
    });
}
```

### Example result

```javascript
{
    vehicle: {
        status: "fulfilled",
        value: { id: 101, registrationNumber: "TS09AB1234" }
    },

    owner: {
        status: "rejected",
        reason: "Owner service unavailable"
    },

    insurance: {
        status: "fulfilled",
        value: { provider: "ABC Insurance", status: "ACTIVE" }
    },

    history: {
        status: "rejected",
        reason: "History service timeout"
    }
}
```

The application can now:

- Display vehicle information.
- Display insurance information.
- Show an error or retry option for owner details.
- Show an unavailable message for service history.

**Important:** `Promise.allSettled()` only collects outcomes. Your application must still decide how to handle mandatory failures, optional failures, retries, and fallback values.

---

## 5. Promise.all() vs Promise.allSettled()

| Behaviour | Promise.all() | Promise.allSettled() |
|---|---|---|
| Waits for all successful inputs | Yes | Yes |
| Behaviour when an input rejects | Aggregate rejects on first observed rejection | Records the rejection and continues waiting |
| Returns successful values | Yes, as an array | Yes, inside result objects |
| Returns rejection reasons | Through aggregate rejection | Inside result objects |
| Preserves input order | Yes | Yes |
| Empty iterable | Fulfils with `[]` | Fulfils with `[]` |
| Cancels remaining operations | No | No |
| Typical use | All operations are required | Need every operation's outcome |

### Promise.all() example

```javascript
Promise.all([
    Promise.resolve("Vehicle"),
    Promise.reject("Owner failed"),
    Promise.resolve("Insurance")
])
.then(results => {
    console.log(results);
})
.catch(error => {
    console.log("Error:", error);
});
```

Output:

```text
Error: Owner failed
```

The aggregate Promise rejects, so its fulfillment handler does not receive the successful values.

The individual Vehicle and Insurance operations can still complete successfully.

### Promise.allSettled() example

```javascript
Promise.allSettled([
    Promise.resolve("Vehicle"),
    Promise.reject("Owner failed"),
    Promise.resolve("Insurance")
])
.then(results => {
    console.log(results);
});
```

Output:

```javascript
[
    { status: "fulfilled", value: "Vehicle" },
    { status: "rejected", reason: "Owner failed" },
    { status: "fulfilled", value: "Insurance" }
]
```

All outcomes are available together.

---

## 6. Processing Promise.allSettled() Results

You can filter successful and failed operations.

```javascript
Promise.allSettled([
    getVehicle(),
    getOwner(),
    getInsurance()
])
.then(results => {

    const successful = results.filter(
        result => result.status === "fulfilled"
    );

    const failed = results.filter(
        result => result.status === "rejected"
    );

    console.log("Successful:", successful);
    console.log("Failed:", failed);
});
```

### Extract only successful values

```javascript
const successfulValues = results
    .filter(result => result.status === "fulfilled")
    .map(result => result.value);
```

### Extract only rejection reasons

```javascript
const errors = results
    .filter(result => result.status === "rejected")
    .map(result => result.reason);
```

---

## 7. Handling Empty Input

```javascript
Promise.allSettled([])
    .then(results => {
        console.log(results);
    });
```

Output:

```javascript
[]
```

The returned Promise fulfils with an empty array.

This is an important edge case when implementing a polyfill.

---

## 8. Important Internal Behaviour

### A. Input order is preserved

Even if the Promises finish in a different order, the results array follows the original input order.

### B. Rejection does not reject the aggregate

An input rejection becomes a result object:

```javascript
{
    status: "rejected",
    reason: error
}
```

### C. No automatic cancellation

`Promise.allSettled()` does not cancel ongoing operations.

### D. Accepts ordinary values

```javascript
Promise.allSettled([
    100,
    Promise.resolve(200),
    Promise.reject("Failed")
])
.then(console.log);
```

The ordinary value `100` is treated as a fulfilled input.

### E. Accepts iterables

It accepts iterables such as Arrays and Sets.

```javascript
const values = new Set([
    Promise.resolve("A"),
    Promise.resolve("B")
]);

Promise.allSettled(values).then(console.log);
```

---

## 9. Implementing a Custom Polyfill — myPromiseAllSettled()

A learning implementation can be built using:

- `Array.from()` to convert the iterable into an array.
- `Promise.resolve()` to normalise each input.
- `results[]` to preserve input order.
- `completedCount` to track settled inputs.
- `resolve()` when every input has settled.

### Implementation

```javascript
function myPromiseAllSettled(promises) {

    return new Promise((resolve, reject) => {

        const items = Array.from(promises);

        if (items.length === 0) {
            resolve([]);
            return;
        }

        const results = [];
        let completedCount = 0;

        for (let i = 0; i < items.length; i++) {

            Promise.resolve(items[i])
                .then(
                    value => {
                        results[i] = {
                            status: "fulfilled",
                            value
                        };
                    },
                    reason => {
                        results[i] = {
                            status: "rejected",
                            reason
                        };
                    }
                )
                .then(() => {

                    completedCount++;

                    if (completedCount === items.length) {
                        resolve(results);
                    }

                });
        }
    });
}
```

### Test the polyfill

```javascript
myPromiseAllSettled([
    Promise.resolve("Vehicle"),
    Promise.reject("Owner failed"),
    Promise.resolve("Insurance")
])
.then(results => {
    console.log(results);
});
```

Expected result:

```javascript
[
    { status: "fulfilled", value: "Vehicle" },
    { status: "rejected", reason: "Owner failed" },
    { status: "fulfilled", value: "Insurance" }
]
```

### How the polyfill works

**Step 1 — Convert the iterable**

```javascript
const items = Array.from(promises);
```

This allows us to use array indexing and `.length`.

**Step 2 — Handle empty input**

```javascript
if (items.length === 0) {
    resolve([]);
    return;
}
```

No inputs means there is nothing to wait for.

**Step 3 — Initialise tracking variables**

```javascript
const results = [];
let completedCount = 0;
```

`results` stores each outcome at its original index.

`completedCount` tracks how many inputs have settled.

**Step 4 — Normalise each input**

```javascript
Promise.resolve(items[i])
```

This handles ordinary values, native Promises, and thenables.

**Step 5 — Record fulfilment or rejection**

```javascript
value => {
    results[i] = {
        status: "fulfilled",
        value
    };
}
```

```javascript
reason => {
    results[i] = {
        status: "rejected",
        reason
    };
}
```

Both handlers convert the outcome into a fulfilled result object.

**Step 6 — Increment the count**

```javascript
completedCount++;
```

Both success and failure count as settled.

**Step 7 — Resolve after every input settles**

```javascript
if (completedCount === items.length) {
    resolve(results);
}
```

The aggregate Promise fulfils with the complete result array.

**Note:** This is a learning polyfill, not a complete ECMAScript specification implementation. Native implementations also handle more advanced iterator, constructor, and error edge cases.

---

## 10. Common Interview Questions

**Q1. What is Promise.allSettled()?**

It accepts an iterable of Promises and waits for every input to settle. It returns an array containing the status and value or rejection reason for each input.

**Q2. Does Promise.allSettled() reject if one Promise rejects?**

No. An individual rejection is represented as a result object with `status: "rejected"` and a `reason` property.

**Q3. Does Promise.allSettled() preserve input order?**

Yes. Results are stored in the same order as the original inputs, regardless of completion order.

**Q4. When does its `.then()` execute?**

After all input Promises have settled.

**Q5. Does it cancel other Promises when one rejects?**

No. It waits for every input to settle and does not automatically cancel operations.

**Q6. When would you use Promise.allSettled() instead of Promise.all()?**

Use `Promise.all()` when all operations are required for the aggregate result. Use `Promise.allSettled()` when you need to inspect every operation's outcome, even when some fail.

**Q7. What happens with an empty array?**

It returns a fulfilled Promise containing an empty array.

**Q8. What is the difference between a fulfilled result and a rejected result?**

A fulfilled result contains `status` and `value`; a rejected result contains `status` and `reason`.

---

## 11. Quick Revision — Remember These Rules

1. `Promise.allSettled()` waits for every input to settle.
2. Fulfilled and rejected inputs are both included in the result.
3. It does not reject just because an input rejects.
4. It preserves input order.
5. It returns `{ status, value }` or `{ status, reason }`.
6. It accepts Promises, ordinary values, and iterables.
7. Empty input produces `[]`.
8. It does not cancel underlying operations.
9. Use it when you need the outcome of every independent operation.
10. Your application is responsible for deciding how to handle failed services.

**Interview summary:** `Promise.allSettled()` is useful for independent operations where partial success is acceptable and the application needs visibility into every operation's outcome.


# Promise.allSettled() — Failure Handling & Interview Scenarios

## 1. Failure Handling in Order Processing

Consider an order-processing system with four independent operations:

| Service | Requirement | Failure handling |
|---|---|---|
| Order validation | Mandatory | Order cannot proceed |
| Payment authorization | Mandatory | Order cannot proceed |
| Email notification | Optional | Order can proceed |
| Analytics event | Optional | Order can proceed |

### Why use Promise.allSettled()?

We want to capture the outcome of every operation, including failures of optional services.

```javascript
Promise.allSettled([
    validateOrder(),
    authorizePayment(),
    sendEmail(),
    publishAnalytics()
])
.then(results => {

    const [validation, payment, email, analytics] = results;

    if (
        validation.status === "rejected" ||
        payment.status === "rejected"
    ) {
        throw new Error("Order processing failed");
    }

    console.log("Order can proceed");

    if (email.status === "rejected") {
        console.log("Email notification failed; retry later");
    }

    if (analytics.status === "rejected") {
        console.log("Analytics failed; retry later");
    }
});
```

### Important points

- Mandatory service failure must prevent the business workflow from proceeding.
- Optional service failure should not necessarily fail the order.
- `Promise.allSettled()` collects outcomes; it does not make business decisions.
- Application logic must inspect each result and decide what happens next.

---

## 2. Interview Challenge — Payment Processing

Consider three independent services:

1. Payment gateway
2. Fraud detection
3. Notification service

### Scenario

- Payment succeeds.
- Fraud detection fails due to timeout.
- Notification succeeds.

### Should the order be marked successful and shipped?

**No.** Fraud detection is a mandatory business control in this scenario.

A timeout does not mean the transaction is safe or approved.

### Recommended handling

| Component | Action |
|---|---|
| Order status | `PENDING_FRAUD_VERIFICATION` |
| Payment | Record authorization state accurately |
| Shipment | Block shipment |
| Fraud detection | Retry or route for manual review |
| Notification | Record success independently |

Depending on the payment workflow, payment may be authorized first and captured only after fraud verification. Do not automatically refund or capture without applying the appropriate business rules.

### Why use Promise.allSettled()?

It provides visibility into all three service outcomes:

- Payment succeeded.
- Fraud detection failed.
- Notification succeeded.

The application can then apply the appropriate business rules.

---

## 3. Key Architectural Principle

| Component | Responsibility |
|---|---|
| `Promise.all()` | Aggregate success/failure of concurrent operations |
| `Promise.allSettled()` | Collect the outcome of every concurrent operation |
| Business workflow | Decide whether the order can proceed |

**Remember:** Promise combinators manage asynchronous execution. They do not enforce business consistency.

### Interview-ready answer

"I would use Promise.allSettled() when I need visibility into the outcome of multiple independent operations, including partial failures. However, I would not blindly proceed based on the aggregate result. I would inspect each service outcome and apply business rules. For example, if payment succeeds but fraud detection times out, I would keep the order pending fraud verification and prevent shipment until the fraud check is completed. Optional failures, such as notification failures, can be handled through retries without blocking the order."