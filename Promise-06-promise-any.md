# JavaScript Promise.any() — Complete Notes & Interview Preparation

## 1. What is Promise.any()?

`Promise.any()` is a Promise combinator that accepts an iterable of Promises and returns a Promise that fulfils as soon as the **first input Promise fulfils**.

Important characteristics:

- It waits for the first successful Promise.
- Individual rejected Promises are ignored while waiting for a successful result.
- If all input Promises reject, the aggregate Promise rejects with an `AggregateError`.
- It preserves the input order of rejection reasons inside `AggregateError.errors`.

### Syntax

```javascript
Promise.any(iterable)
    .then(result => {
        console.log("Success:", result);
    })
    .catch(error => {
        console.error("Error:", error);
    });
```

---

## 2. Basic Example — First Fulfilled Promise Wins

```javascript
const p1 = new Promise((resolve, reject) => {
    setTimeout(() => reject("Service A failed"), 500);
});

const p2 = new Promise(resolve => {
    setTimeout(() => resolve("Service B succeeded"), 2000);
});

const p3 = new Promise(resolve => {
    setTimeout(() => resolve("Service C succeeded"), 1000);
});

Promise.any([p1, p2, p3])
    .then(result => {
        console.log("Success:", result);
    })
    .catch(error => {
        console.log("Error:", error);
    });
```

### Output

```text
Success: Service C succeeded
```

### Execution timeline

| Promise | Duration | Outcome |
|---|---:|---|
| p1 | 500 ms | Rejected |
| p2 | 2 seconds | Fulfilled |
| p3 | 1 second | Fulfilled |

Explanation:

1. p1 rejects after 500 ms.
2. `Promise.any()` ignores this rejection.
3. p3 fulfils after 1 second.
4. The aggregate Promise fulfils with `"Service C succeeded"`.
5. p2 may still complete after 2 seconds, but cannot change the aggregate result.

**Key rule: First fulfilled Promise wins.**

---

## 3. What Happens When All Promises Reject?

This is one of the most important concepts in `Promise.any()`.

```javascript
Promise.any([
    Promise.reject("Vehicle service failed"),
    Promise.reject("Owner service failed"),
    Promise.reject("Insurance service failed")
])
.then(result => {
    console.log("Success:", result);
})
.catch(error => {
    console.log(error);
});
```

The aggregate Promise rejects because no input Promise fulfilled.

### What is AggregateError?

`AggregateError` is a JavaScript error type used to represent multiple errors together.

When all Promises passed to `Promise.any()` reject, the aggregate Promise rejects with an `AggregateError`.

### Accessing individual rejection reasons

Use the `.errors` property.

```javascript
Promise.any([
    Promise.reject("Vehicle failed"),
    Promise.reject("Owner failed"),
    Promise.reject("Insurance failed")
])
.catch(error => {
    console.log(error instanceof AggregateError);
    console.log(error.name);
    console.log(error.errors);
});
```

Output:

```text
true
AggregateError
[
    'Vehicle failed',
    'Owner failed',
    'Insurance failed'
]
```

Important properties:

| Property | Description |
|---|---|
| `error.name` | AggregateError |
| `error.message` | Aggregate error message |
| `error.errors` | Array containing individual rejection reasons |

The `errors` array follows the original input order, not rejection completion order.

---

## 4. Empty Iterable Behaviour

Consider:

```javascript
Promise.any([])
    .then(result => console.log("Success:", result))
    .catch(error => {
        console.log(error instanceof AggregateError);
        console.log(error.errors);
    });
```

Output:

```text
true
[]
```

### Why does it reject?

There are no input Promises that can fulfil.

Therefore, `Promise.any([])` immediately rejects with an `AggregateError` containing an empty `errors` array.

### Empty iterable comparison

| Combinator | Empty input result |
|---|---|
| `Promise.all([])` | Fulfilled with `[]` |
| `Promise.allSettled([])` | Fulfilled with `[]` |
| `Promise.race([])` | Remains pending |
| `Promise.any([])` | Rejected with `AggregateError` |

Remember these four behaviours for interviews.

---

## 5. Promise.any() Accepts Ordinary Values

`Promise.any()` accepts Promises, ordinary values, and other iterables.

```javascript
Promise.any([
    Promise.reject("Failed"),
    100,
    Promise.resolve(200)
])
.then(result => {
    console.log(result);
});
```

Output:

```text
100
```

An ordinary value is treated as an already-fulfilled input.

Since the first input rejects, the second input fulfils and wins.

---

# 6. Promise.race() vs Promise.any()

This is a frequently asked JavaScript interview question.

| Behaviour | Promise.race() | Promise.any() |
|---|---|---|
| First rejection | Aggregate rejects | Ignores rejection |
| First fulfilment | Aggregate fulfils | Aggregate fulfils |
| All inputs reject | Rejects with first observed rejection | Rejects with AggregateError |
| Empty iterable | Pending forever | Rejects with AggregateError |
| Main purpose | First settled outcome | First successful outcome |

### Example: Promise.race()

```javascript
Promise.race([
    Promise.reject("Server A failed"),
    Promise.resolve("Server B succeeded")
])
.then(console.log)
.catch(console.error);
```

If Server A's rejection is processed first, the aggregate Promise rejects.

### Example: Promise.any()

```javascript
Promise.any([
    Promise.reject("Server A failed"),
    Promise.resolve("Server B succeeded")
])
.then(console.log)
.catch(console.error);
```

Output:

```text
Server B succeeded
```

The rejection from Server A does not prevent Server B from winning.

### Remember this interview statement

- `Promise.race()` — First to settle wins.
- `Promise.any()` — First to fulfil wins.

---

# 7. Backend Scenario 1 — Multiple Read Replicas

### Business requirement

Suppose we have a Government Vehicle Registry application.

Vehicle information is available from three read replicas.

We want to return the first successful response to the client.

| Replica | Response time | Outcome |
|---|---:|---|
| Replica A | 500 ms | Rejected — connection timeout |
| Replica B | 1 second | Fulfilled — vehicle data |
| Replica C | 2 seconds | Fulfilled — vehicle data |

### Implementation

```javascript
function getVehicleFromReplicas(vehicleId) {

    return Promise.any([
        fetchFromReplicaA(vehicleId),
        fetchFromReplicaB(vehicleId),
        fetchFromReplicaC(vehicleId)
    ]);
}

getVehicleFromReplicas(101)
    .then(vehicle => {
        console.log("Vehicle:", vehicle);
    })
    .catch(error => {
        console.error("All replicas failed:", error.errors);
    });
```

### Execution

1. All three replica requests are initiated.
2. Replica A rejects after 500 ms.
3. `Promise.any()` ignores the rejection.
4. Replica B fulfils after 1 second.
5. The aggregate Promise fulfils with Replica B's result.
6. Replica C may continue executing.

### Why use Promise.any()?

Because our requirement is to get the first successful response.

A failed replica should not prevent another healthy replica from returning data.

### Why not Promise.race()?

Because Replica A rejects first.

`Promise.race()` would reject the aggregate Promise after 500 ms, even though Replica B could successfully respond after 1 second.

### Interview-ready answer

"I would use Promise.any() when calling multiple read replicas because I need the first successful response. Individual replica failures should not prevent another replica from returning the requested data. Promise.race() would be inappropriate if an early rejection could occur before a successful response."

---

# 8. Backend Scenario 2 — Payment Gateway Failover

### Business requirement

Suppose an application integrates with two payment gateways.

| Gateway | Response time | Outcome |
|---|---:|---|
| Gateway A | 500 ms | Rejected — connection timeout |
| Gateway B | 2 seconds | Fulfilled — payment authorized |

A developer proposes:

```javascript
function authorizePayment(paymentRequest) {

    return Promise.any([
        paymentGatewayA(paymentRequest),
        paymentGatewayB(paymentRequest)
    ]);
}
```

### Is Promise.any() technically suitable?

It can return the first fulfilled gateway result.

However, blindly using this approach for payment processing is dangerous.

### The problem: Unknown payment outcome

Consider:

1. Gateway A receives the payment request.
2. Gateway A successfully charges the customer.
3. Gateway A's response gets lost or times out.
4. Our application receives a rejected Promise.
5. Gateway B receives the same payment request.
6. Gateway B also charges the customer.

The customer may be charged twice.

**Important:** A Promise rejection does not prove that the external business operation failed.

A timeout only tells us that the caller did not receive a successful response within the expected time.

### Recommended architecture

Use a central Payment Orchestrator.

Responsibilities:

1. Generate a unique internal payment transaction ID.
2. Persist the payment state before initiating gateway calls.
3. Track gateway attempts and their outcomes.
4. On timeout, reconcile the payment with the original gateway.
5. Avoid switching gateways while the original payment outcome is unknown.
6. Use gateway-specific idempotency keys.
7. Apply appropriate retry and compensation policies.

### Payment state example

```text
INITIATED
    |
    v
PROCESSING
    |
    +----> SUCCESS
    |
    +----> FAILED
    |
    +----> UNKNOWN
                |
                v
          RECONCILIATION
```

`UNKNOWN` is especially important.

A timeout does not establish whether a payment succeeded or failed.

### Interview-ready answer

"I would not blindly use Promise.any() for payment gateway failover. Payment operations have external side effects. If one gateway processes a payment but its response times out, another gateway could process the same payment again. I would introduce a payment orchestrator, idempotency controls, payment-state tracking and reconciliation before attempting failover."

---

# 9. Idempotency Keys in Payment Processing

### What is an idempotency key?

An idempotency key is a unique identifier assigned to a logical business operation.

It helps a payment gateway recognise repeated requests for the same operation.

### Example

```javascript
const paymentRequest = {
    orderId: "ORD101",
    amount: 5000,
    idempotencyKey: "PAY-ORD101-001"
};
```

For retries of the same logical payment, reuse the same key.

```javascript
// First attempt
paymentGatewayA(paymentRequest);

// Retry of the same logical operation
paymentGatewayB(paymentRequest);
```

### Important limitation

If Gateway A and Gateway B maintain separate idempotency databases, using the same key at both gateways does not guarantee global duplicate prevention.

Each gateway may consider the request new.

Therefore, a central payment orchestrator must track the logical transaction and reconcile uncertain outcomes.

### Interview points

- Same logical payment retry → reuse the same idempotency key.
- New logical payment → generate a new key.
- A gateway must persist and enforce idempotency.
- Cross-gateway idempotency requires additional orchestration.

---

# 10. Backend Scenario 3 — Cancellation of Losing Requests

Suppose we call three read replicas using `Promise.any()`.

| Replica | Duration | Outcome |
|---|---:|---|
| A | 500 ms | Rejected |
| B | 1 second | Fulfilled |
| C | 2 seconds | Fulfilled |

When Replica B fulfils, the aggregate Promise fulfils.

Does Replica C stop executing?

**No.**

`Promise.any()` does not automatically cancel the other input operations.

### Using AbortController

For supported operations such as `fetch()`, we can use AbortController.

```javascript
const controller = new AbortController();

const requests = [
    fetch(urlA, { signal: controller.signal }),
    fetch(urlB, { signal: controller.signal }),
    fetch(urlC, { signal: controller.signal })
];

Promise.any(requests)
    .then(result => {
        controller.abort();

        console.log("First successful response:", result);
    })
    .catch(error => {
        console.error("All requests failed:", error.errors);
    });
```

This is a simplified illustration of cancelling outstanding requests after a successful response.

### Important architectural distinction

| Operation | Typical approach |
|---|---|
| Read request | Cancel unnecessary outstanding requests when safe |
| Database write | Do not blindly cancel; consider transaction and side-effect semantics |
| Payment processing | Use idempotency and reconciliation |
| Email notification | May continue independently |
| Analytics event | Often handled asynchronously |

**Remember:** Cancellation must be considered in the context of the operation's business semantics.

---

# 11. Backend Scenario 4 — Retry Failed Replicas

Suppose all three read replicas are initially unavailable.

| Replica | First attempt | Retry |
|---|---|---|
| A | Rejected | Still failing |
| B | Rejected | Fulfilled |
| C | Rejected | Not retried |

A sensible retry strategy is:

1. Retry only failed replicas.
2. Set a maximum retry count.
3. Use exponential backoff.
4. Add jitter to avoid synchronized retry spikes.
5. Apply an overall request deadline.
6. Stop retrying once a successful response is obtained.

### Why retry only failed replicas?

- Avoid unnecessary requests to healthy replicas.
- Reduce infrastructure load.
- Give temporarily unavailable replicas a chance to recover.
- Improve resource utilisation.

### Important distinction

`Promise.any()` does not implement retries automatically.

Retry orchestration must be implemented by application logic.

---

# 12. Common Interview Questions

### Q1. What is Promise.any()?

It accepts an iterable of Promises and fulfils as soon as the first input Promise fulfils. If every input rejects, the aggregate Promise rejects with AggregateError.

### Q2. Does Promise.any() reject immediately when the first input rejects?

No. It ignores individual rejections while waiting for the first fulfilment.

### Q3. What happens when all input Promises reject?

The aggregate Promise rejects with an AggregateError containing all rejection reasons in its `errors` property.

### Q4. What happens with an empty array?

It immediately rejects with AggregateError, and `error.errors` is an empty array.

### Q5. Does Promise.any() cancel other Promises?

No. Other operations continue unless explicitly cancelled through a supported cancellation mechanism.

### Q6. What is the difference between Promise.any() and Promise.race()?

Promise.race() settles with the first input to settle, regardless of success or failure. Promise.any() waits for the first fulfilled input.

### Q7. Is Promise.any() useful for replica reads?

Yes. It can return the first successful replica response while ignoring individual replica failures.

### Q8. Should Promise.any() be used blindly for payment gateway failover?

No. Payment operations have side effects. A timeout does not guarantee that the payment failed. Duplicate processing is possible without idempotency and reconciliation.

### Q9. How do you access all errors from Promise.any()?

Use:

```javascript
error.errors
```

### Q10. Does Promise.any() preserve the order of results?

It returns only one successful value, not an array of all results. If all inputs reject, the `AggregateError.errors` array preserves the original input order.

---

# 13. Four Promise Combinators — Final Comparison

| Feature | Promise.all() | Promise.allSettled() | Promise.race() | Promise.any() |
|---|---|---|---|---|
| Primary purpose | All must fulfil | Collect all outcomes | First settled | First fulfilled |
| First rejection | Rejects aggregate | Records rejection | Rejects aggregate | Ignores it |
| All reject | Rejects on first observed rejection | Returns all outcomes | Rejects on first observed rejection | AggregateError |
| Empty input | Fulfils `[]` | Fulfils `[]` | Pending forever | AggregateError |
| Returns | Array of values | Array of outcome objects | One winning outcome | One winning value |
| Typical use | Required parallel operations | Partial-success dashboards | Timeouts | First successful replica |

---

# 14. Quick Revision — Remember These Rules

1. `Promise.any()` returns a Promise.
2. The first fulfilled Promise wins.
3. Individual rejections are ignored while waiting for success.
4. If all inputs reject, the aggregate rejects with AggregateError.
5. Use `error.errors` to access all rejection reasons.
6. Empty input immediately rejects with AggregateError.
7. Input order is preserved in `AggregateError.errors`.
8. It accepts Promises, ordinary values and iterables.
9. It does not automatically cancel losing operations.
10. It is useful for read-replica failover and first-successful-response patterns.
11. Use caution with payment gateways and other operations with side effects.
12. Retry logic, cancellation, idempotency and reconciliation must be implemented separately.

---

# 15. Interview-Ready Summary

"`Promise.any()` is a Promise combinator that fulfils as soon as the first input Promise fulfils. It ignores individual rejections while waiting for a successful result. If all input Promises reject, it rejects with an AggregateError containing all rejection reasons.

In backend systems, I would use it for scenarios such as querying multiple read replicas and returning the first successful response. However, I would be careful about using it for payment processing because a timeout does not guarantee that the transaction failed. I would use payment orchestration, idempotency and reconciliation to prevent duplicate transactions.

Unlike Promise.race(), which settles on the first fulfilled or rejected input, Promise.any() specifically waits for the first successful result."