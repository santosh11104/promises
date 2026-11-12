
/*
=========================================================
PROBLEM 01: BUILD ORDER SUMMARY USING PROMISE.ALL()
=========================================================

Difficulty : Beginner - Intermediate
Topic      : JavaScript Promises
Concepts   : Promise.all(), then(), catch(),
             Array Destructuring, Error Propagation
             Concepts learned

1. Concurrent asynchronous operations.
2. Promise.all() and Promise aggregation.
3. Promise result ordering.
4. Array destructuring.
5. Returning values from .then().
6. Error propagation through .catch().
7. Returning Promise chains from functions.

PROBLEM DEFINITION:
-------------------
An Order Management System needs to retrieve information
from three independent services:

1. Order Service
2. Payment Service
3. Shipment Service

Each service returns a Promise.

Implement getOrderSummary(orderId) to retrieve all three
responses concurrently and combine them into one object.

REQUIREMENTS:
-------------
1. Invoke all three asynchronous functions.
2. Use Promise.all() to coordinate them.
3. Extract results using array destructuring.
4. Return a combined order summary.
5. Handle errors using catch().
6. Propagate errors to the caller.
7. Do not use async/await.

EXPECTED PERFORMANCE:
---------------------
Order    : 2 seconds
Payment  : 1 second
Shipment : 3 seconds

Expected total duration: Approximately 3 seconds.

=========================================================
*/

// STEP 1: ORDER SERVICE
function getOrder(orderId) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: orderId,
        amount: 5000
      });
    }, 2000);
  });
}

// STEP 2: PAYMENT SERVICE
function getPayment(orderId) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        paymentId: "PAY101",
        status: "SUCCESS"
      });
    }, 1000);
  });
}

// STEP 3: SHIPMENT SERVICE
function getShipment(orderId) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        trackingId: "TRK101",
        status: "IN_TRANSIT"
      });
    }, 3000);
  });
}

// STEP 4: COMBINE ALL THREE RESPONSES
function getOrderSummary(orderId) {

  return Promise.all([
    getOrder(orderId),
    getPayment(orderId),
    getShipment(orderId)
  ])

    // Process results after all Promises fulfill
    .then(([order, payment, shipment]) => {

      const summary = {
        order,
        payment,
        shipment
      };

      // Return combined object to the next handler
      return summary;
    })

    // Handle and propagate errors
    .catch(error => {
      console.error("Error fetching order summary:", error);
      throw error;
    });
}

// STEP 5: CONSUME THE PROMISE
getOrderSummary(101)
  .then(summary => {
    console.log("Order Summary:");
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch(error => {
    console.error("Order processing failed:", error.message);
  });

/*
=========================================================
SECTION 2: PROMISE.ALL() - CONCEPTS & INTERVIEW NOTES
=========================================================

Q1. Why use Promise.all() instead of sequential .then()
    calls?

ANSWER:

Promise.all() is useful when multiple asynchronous
operations are independent and can be initiated
concurrently.

Sequential execution:

getOrder(101)
  .then(order => getPayment(101))
  .then(payment => getShipment(101));

Concurrent execution:

Promise.all([
  getOrder(101),
  getPayment(101),
  getShipment(101)
]);

The concurrent approach avoids waiting for each
operation before starting the next one.

---------------------------------------------------------

Q2. Does Promise.all() execute the functions itself?

ANSWER:

No. JavaScript invokes the functions while evaluating
the array elements.

Example:

Promise.all([
  getOrder(101),
  getPayment(101),
  getShipment(101)
]);

Each function is invoked and returns a Promise.

Promise.all() receives those Promises and coordinates
their outcomes.

Important distinction:

getOrder(101)  // Function invocation
getOrder       // Function reference

---------------------------------------------------------

Q3. Does Promise.all() preserve input order?

ANSWER:

Yes. Promise.all() preserves the input order of
the results, regardless of completion order.

Example:

Promise.all([
  getOrder(),      // 3 seconds
  getPayment(),    // 1 second
  getShipment()    // 2 seconds
])
.then(results => console.log(results));

Completion order:
1. Payment
2. Shipment
3. Order

Result array order:
1. Order
2. Payment
3. Shipment

---------------------------------------------------------

Q4. What happens if one Promise rejects?

ANSWER:

Promise.all() follows fail-fast rejection behaviour.

If any input Promise rejects:

1. The aggregate Promise rejects.
2. Its fulfillment .then() handler is skipped.
3. Its .catch() handler can handle the rejection.
4. Other asynchronous operations are NOT automatically
   cancelled.

Example:

Promise.all([
  Promise.resolve("Order"),
  Promise.reject(new Error("Payment failed")),
  Promise.resolve("Shipment")
])
.then(results => {
  console.log("Success:", results);
})
.catch(error => {
  console.log("Failure:", error.message);
});

Output:
Failure: Payment failed

---------------------------------------------------------

Q5. Why must we return the Promise chain?

ANSWER:

Returning the Promise chain makes the asynchronous
result available to the calling function.

Incorrect:

function test() {
  Promise.resolve(100)
    .then(value => value + 50);
}

console.log(test());

Output:
undefined

Reason:
The function does not return the Promise.

Correct:

function test() {
  return Promise.resolve(100)
    .then(value => value + 50);
}

test().then(result => console.log(result));

Output:
150

Important:
return Promise.all(...) exposes the Promise to the caller.

---------------------------------------------------------

Q6. What happens if .then() logs the result instead
    of returning it?

ANSWER:

The next .then() receives undefined if the handler
does not explicitly return a value.

Example:

Promise.resolve(100)
  .then(value => {
    console.log(value);
  })
  .then(result => {
    console.log("Next:", result);
  });

Output:
100
Next: undefined

Why?

The first handler implicitly returns undefined.

Correct approach:

Promise.resolve(100)
  .then(value => {
    console.log(value);
    return value;
  })
  .then(result => {
    console.log("Next:", result);
  });

Output:
100
Next: 100

IMPORTANT:
console.log() displays a value.
return passes a value to the next Promise handler.

=========================================================
SECTION 3: IMPORTANT EXECUTION RULES
=========================================================

1. Promise.all() accepts an iterable of values/Promises.

2. It preserves input order.

3. It rejects when an input Promise rejects.

4. It does not automatically cancel other operations.

5. It returns a new aggregate Promise.

6. It does not invoke function references.

7. Returning a Promise chain exposes it to the caller.

8. Returning from .then() controls value propagation.

9. Logging is not equivalent to returning.

10. Independent asynchronous operations can overlap.

=========================================================
END OF NOTES
=========================================================
*/
