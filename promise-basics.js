
/*
============================================================
 JAVASCRIPT PROMISES - BASICS
============================================================

Topics:
1. What is a Promise?
2. Promise states
3. Promise constructor
4. resolve() and reject()
5. then() chaining
6. Promise value propagation
7. Returning Promises
8. Error propagation
9. catch() and error recovery
10. finally()
11. Practice exercises

Run:
node Promise-Basics.js

NOTE:
We are learning using .then() and .catch().
async/await will be covered later.
*/


// ============================================================
// 1. WHAT IS A PROMISE?
// ============================================================

/*
A Promise is a JavaScript object representing the eventual
completion or failure of an asynchronous operation.

A Promise has three states:

1. PENDING
   Initial state. Operation is not completed.

2. FULFILLED
   Operation completed successfully.

3. REJECTED
   Operation failed.

Once fulfilled or rejected, a Promise is SETTLED.
A settled Promise cannot change its state.
*/


// ============================================================
// 2. CREATING A PROMISE
// ============================================================

const myPromise = new Promise((resolve, reject) => {

    // This executor function runs synchronously.

    const success = true;

    if (success) {
        resolve("Operation successful");
    } else {
        reject(new Error("Operation failed"));
    }

});

myPromise
    .then(result => {
        console.log("Success:", result);
    })
    .catch(error => {
        console.log("Error:", error.message);
    });

/*
IMPORTANT:

new Promise() accepts an executor function.

The executor receives two arguments:

resolve(value):
    Fulfils the Promise.

reject(error):
    Rejects the Promise.

The executor runs immediately and synchronously.

The .then() and .catch() handlers execute asynchronously
as microtasks.
*/


// ============================================================
// 3. REAL-WORLD EXAMPLE: GET USER
// ============================================================

function getUser(userId) {

    return new Promise((resolve, reject) => {

        setTimeout(() => {

            if (!userId) {

                reject(new Error("User ID is required"));

                return;
            }

            const user = {
                id: userId,
                name: "Ramesh",
                email: "ramesh@example.com"
            };

            resolve(user);

        }, 1000);

    });

}

getUser(101)
    .then(user => {
        console.log("User details:", user);
    })
    .catch(error => {
        console.log("User error:", error.message);
    });


// ============================================================
// 4. PROMISE CHAINING
// ============================================================

/*
Every .then() returns a NEW Promise.

The value returned from one .then() handler becomes
the input for the next .then() handler.
*/

Promise.resolve(10)

    .then(value => {

        console.log("First then:", value);

        return value + 5;

    })

    .then(value => {

        console.log("Second then:", value);

        return value * 2;

    })

    .then(value => {

        console.log("Third then:", value);

    });

/*
Expected output:

First then: 10
Second then: 15
Third then: 30
*/


// ============================================================
// 5. VALUE PROPAGATION
// ============================================================

/*
When a .then() handler returns a normal value,
the next .then() receives that value.
*/

Promise.resolve(100)

    .then(value => {

        return value + 50;

    })

    .then(result => {

        console.log("Result:", result);

    });

/*
Output:
Result: 150
*/


// ============================================================
// 6. WHAT HAPPENS WHEN WE DON'T RETURN?
// ============================================================

Promise.resolve(200)

    .then(value => {

        console.log("Doubled:", value * 2);

        // No return statement!

    })

    .then(result => {

        console.log("Next result:", result);

    });

/*
Output:

Doubled: 400
Next result: undefined

WHY?

A function without an explicit return statement
implicitly returns undefined.

Therefore, the next .then() receives undefined.
*/


// ============================================================
// 7. RETURNING A PROMISE
// ============================================================

Promise.resolve("Start")

    .then(value => {

        console.log(value);

        return Promise.resolve("Next asynchronous value");

    })

    .then(value => {

        console.log(value);

    });

/*
The Promise returned from the first .then() is adopted
by the Promise chain.

The next .then() receives its fulfilled value.
*/


// ============================================================
// 8. PROMISE CREATED BUT NOT RETURNED
// ============================================================

function disconnectedExample() {

    Promise.resolve(10)

        .then(value => {

            return value + 5;

        });

    // The Promise chain is not returned.

}

console.log(disconnectedExample());

/*
Output:

undefined

The function does not expose its Promise chain to the caller.
*/


// CORRECT IMPLEMENTATION

function connectedExample() {

    return Promise.resolve(10)

        .then(value => {

            return value + 5;

        });

}

connectedExample()
    .then(result => {
        console.log("Connected result:", result);
    });

/*
Output:
Connected result: 15
*/


// ============================================================
// 9. ERROR PROPAGATION
// ============================================================

Promise.resolve("Start")

    .then(value => {

        console.log(value);

        throw new Error("Something went wrong");

    })

    .then(value => {

        // This handler will be skipped.

        console.log("This will not execute");

    })

    .catch(error => {

        console.log("Caught error:", error.message);

    });

/*
IMPORTANT:

An exception thrown inside .then()
rejects the Promise returned by that .then().

The next fulfillment handler is skipped.

Execution continues at the next rejection handler.
*/


// ============================================================
// 10. CATCH AND ERROR RECOVERY
// ============================================================

Promise.reject(new Error("Database unavailable"))

    .catch(error => {

        console.log("Caught:", error.message);

        return "DEFAULT VALUE";

    })

    .then(result => {

        console.log("Recovered result:", result);

    });

/*
Output:

Caught: Database unavailable
Recovered result: DEFAULT VALUE

WHY?

Returning a normal value from catch()
recovers the rejected Promise.

The next .then() executes.
*/


// ============================================================
// 11. THROWING INSIDE CATCH
// ============================================================

Promise.reject(new Error("Payment failed"))

    .catch(error => {

        console.log("First catch:", error.message);

        throw new Error("Payment recovery failed");

    })

    .then(result => {

        // Skipped because catch threw a new error.

        console.log(result);

    })

    .catch(error => {

        console.log("Second catch:", error.message);

    });

/*
Output:

First catch: Payment failed
Second catch: Payment recovery failed
*/


// ============================================================
// 12. LOGGING IS NOT RETURNING
// ============================================================

Promise.reject("Insurance failed")

    .catch(error => {

        console.log(error);

        // console.log() does not return the error.
        // This handler implicitly returns undefined.

    })

    .then(result => {

        console.log("Result:", result);

    });

/*
Output:

Insurance failed
Result: undefined
*/


// ============================================================
// 13. DIFFERENT CATCH RETURN BEHAVIOURS
// ============================================================

/*
Case 1: Return null

.catch(error => {
    return null;
});

Result: Fulfilled with null.


Case 2: Return empty array

.catch(error => {
    return [];
});

Result: Fulfilled with [].


Case 3: No return

.catch(error => {
    console.log(error);
});

Result: Fulfilled with undefined.


Case 4: Throw error

.catch(error => {
    throw error;
});

Result: Rejected.
*/


// ============================================================
// 14. FINALLY()
// ============================================================

/*
finally() executes whether a Promise fulfils or rejects.

It is useful for cleanup operations.

A normal return value from finally() does not replace
the original fulfilled value or rejection reason.
*/

Promise.resolve("Order created")

    .finally(() => {

        console.log("Finally executed");

    })

    .then(result => {

        console.log("Result:", result);

    });

/*
Output:

Finally executed
Result: Order created
*/


// Rejected Promise example

Promise.reject(new Error("Order failed"))

    .finally(() => {

        console.log("Cleanup after failure");

    })

    .catch(error => {

        console.log("Error:", error.message);

    });


// ============================================================
// 15. RETURNING A PROMISE FROM A FUNCTION
// ============================================================

function fetchOrder(orderId) {

    return new Promise((resolve, reject) => {

        setTimeout(() => {

            if (!orderId) {

                reject(new Error("Order ID is required"));

                return;
            }

            resolve({
                orderId: orderId,
                amount: 5000,
                status: "CREATED"
            });

        }, 1000);

    });

}

fetchOrder(501)

    .then(order => {

        console.log("Order:", order);

        return order;

    })

    .catch(error => {

        console.log("Order error:", error.message);

    });


// ============================================================
// 16. PRACTICE EXERCISES
// ============================================================

/*
EXERCISE 1:

Write getProduct(productId).

Requirements:
- Return a Promise.
- Resolve after 1 second.
- Return { productId, name: "Laptop" }.
- Reject if productId is missing.


EXERCISE 2:

Start with:

Promise.resolve(100)

Write two .then() handlers:

- First handler adds 100.
- Second handler multiplies the result by 2.

Predict the final output.


EXERCISE 3:

Create a rejected Promise.

Handle it using catch().

Return "DEFAULT_VALUE".

Print the returned value in the next then().


EXERCISE 4:

Create a .then() handler.

Log the received value but do not return anything.

What will the next .then() receive?


EXERCISE 5:

Throw an Error inside a .then() handler.

Catch it in a subsequent catch().


EXERCISE 6:

Use finally() with both a fulfilled and rejected Promise.

Observe when finally() executes.

*/


// ============================================================
// END OF PROMISE BASICS
// ============================================================
