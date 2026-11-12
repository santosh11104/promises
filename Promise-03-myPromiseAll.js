
/*
 * Promise-03-myPromiseAll.js
 *
 * A learning implementation of Promise.all().
 *
 * Features:
 * 1. Supports arrays and synchronous iterables such as Set.
 * 2. Supports Promises, ordinary values and thenables.
 * 3. Preserves original input order.
 * 4. Rejects the aggregate Promise when an input rejects.
 * 5. Handles empty input.
 *
 * Note: This is an educational implementation,
 * not a fully specification-compliant polyfill.
 */

function myPromiseAll(promises) {

    return new Promise((resolve, reject) => {

        // Step 1: Convert iterable into an array.
        // This gives us .length and numeric index access.
        const items = Array.from(promises);

        // Step 2: Handle empty input.
        if (items.length === 0) {
            resolve([]);
            return;
        }

        // Step 3: Create results array.
        const results = [];

        // Step 4: Track completed Promises.
        let completedCount = 0;

        // Step 5: Iterate through all inputs.
        for (let i = 0; i < items.length; i++) {

            // Step 6: Normalize each input using Promise.resolve().
            Promise.resolve(items[i]).then(

                // Fulfilment handler
                value => {

                    // Step 7: Store result at original index.
                    results[i] = value;

                    // Step 8: Increment completion counter.
                    completedCount++;

                    // Step 9: Check whether all inputs fulfilled.
                    if (completedCount === items.length) {
                        resolve(results);
                    }

                },

                // Rejection handler
                error => {

                    // Step 10: Reject aggregate Promise.
                    reject(error);

                }

            );

        }

    });

}


// ==================================================
// TEST 1: Input order vs completion order
// ==================================================

const vehiclePromise = new Promise(resolve => {
    setTimeout(() => resolve("Vehicle"), 3000);
});

const ownerPromise = new Promise(resolve => {
    setTimeout(() => resolve("Owner"), 1000);
});

const insurancePromise = new Promise(resolve => {
    setTimeout(() => resolve("Insurance"), 2000);
});

myPromiseAll([
    vehiclePromise,
    ownerPromise,
    insurancePromise
])
.then(results => {
    console.log("Test 1 - Input order:", results);
})
.catch(error => {
    console.error("Test 1 failed:", error);
});


// Expected output:
// ["Vehicle", "Owner", "Insurance"]
//
// Completion order:
// Owner -> Insurance -> Vehicle
//
// Result order:
// Vehicle -> Owner -> Insurance


// ==================================================
// TEST 2: Ordinary values mixed with Promises
// ==================================================

myPromiseAll([
    Promise.resolve("Vehicle"),
    "Owner",
    100,
    Promise.resolve("Insurance")
])
.then(results => {
    console.log("Test 2 - Ordinary values:", results);
});

// Expected:
// ["Vehicle", "Owner", 100, "Insurance"]


// ==================================================
// TEST 3: Set iterable
// ==================================================

const promiseSet = new Set([
    Promise.resolve("Vehicle"),
    Promise.resolve("Owner"),
    Promise.resolve("Insurance")
]);

myPromiseAll(promiseSet)
.then(results => {
    console.log("Test 3 - Set iterable:", results);
});

// Expected:
// ["Vehicle", "Owner", "Insurance"]


// ==================================================
// TEST 4: Empty input
// ==================================================

myPromiseAll([])
.then(results => {
    console.log("Test 4 - Empty input:", results);
});

// Expected:
// []


// ==================================================
// TEST 5: Rejection / Fail-fast behaviour
// ==================================================

myPromiseAll([
    Promise.resolve("Vehicle"),

    Promise.reject(
        new Error("Owner service failed")
    ),

    new Promise(resolve => {
        setTimeout(() => {
            console.log("Insurance operation still completed");
            resolve("Insurance");
        }, 2000);
    })

])
.then(results => {
    console.log("Test 5 - Success:", results);
})
.catch(error => {
    console.log("Test 5 - Aggregate rejected:", error.message);
});

// Expected:
// Test 5 - Aggregate rejected: Owner service failed
// Insurance operation still completed
//
// Note:
// Aggregate Promise rejects immediately.
// Insurance operation is NOT automatically cancelled.


// ==================================================
// EXPORT (for CommonJS usage)
// ==================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = myPromiseAll;
}
