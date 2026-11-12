
/*
 * Promise-02-Promise-All-Optional-Failures.js
 *
 * TOPIC:
 * Promise.all() with mandatory and optional services.
 *
 * BUSINESS SCENARIO:
 * GVR Vehicle Dashboard
 *
 * 1. Vehicle details       - Mandatory
 * 2. Owner details         - Mandatory
 * 3. Insurance details     - Optional (fallback: null)
 * 4. Service history       - Optional (fallback: [])
 *
 * Run:
 * node Promise-02-Promise-All-Optional-Failures.js
 *
 * This exercise uses .then() and .catch().
 * No async/await.
 */

// ============================================================
// 1. MOCK DOWNSTREAM SERVICES
// ============================================================

function getVehicle(vehicleId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vehicleId,
        registrationNumber: "TS09AB1234"
      });
    }, 1000);
  });
}

function getOwner(vehicleId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vehicleId,
        ownerId: 101,
        name: "Ramesh"
      });
    }, 2000);
  });
}

function getInsurance(vehicleId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("Insurance service unavailable"));

      // To simulate success instead:
      // resolve({
      //   policyNumber: "POL101",
      //   status: "ACTIVE"
      // });
    }, 1500);
  });
}

function getServiceHistory(vehicleId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          serviceId: "SRV001",
          description: "Annual maintenance"
        },
        {
          serviceId: "SRV002",
          description: "Brake inspection"
        }
      ]);
    }, 1200);
  });
}


// ============================================================
// 2. VEHICLE DASHBOARD USING PROMISE.ALL()
// ============================================================

function getVehicleDashboard(vehicleId) {

  return Promise.all([

    // Mandatory service 1
    // If this rejects, Promise.all() rejects.
    getVehicle(vehicleId),

    // Mandatory service 2
    // If this rejects, Promise.all() rejects.
    getOwner(vehicleId),

    // Optional service 1
    // If insurance fails, recover with null.
    getInsurance(vehicleId)
      .catch(error => {
        console.error(
          "[Optional dependency] Insurance failed:",
          error.message
        );

        return null;
      }),

    // Optional service 2
    // If service history fails, recover with [].
    getServiceHistory(vehicleId)
      .catch(error => {
        console.error(
          "[Optional dependency] Service history failed:",
          error.message
        );

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


// ============================================================
// 3. CALL THE DASHBOARD FUNCTION
// ============================================================

getVehicleDashboard(101)

  .then(dashboard => {

    console.log("\nVehicle dashboard loaded:");

    console.dir(dashboard, { depth: null });

  })

  .catch(error => {

    console.error(
      "\nDashboard failed:",
      error.message
    );

  });


// ============================================================
// 4. IMPORTANT CONCEPTS
// ============================================================

/*
 * A. MANDATORY SERVICE FAILURE
 *
 * If getVehicle() or getOwner() rejects:
 *
 * - There is no individual catch handler.
 * - The rejection propagates to Promise.all().
 * - Promise.all() rejects.
 * - The caller-level catch executes.
 *
 *
 * B. OPTIONAL SERVICE FAILURE
 *
 * If getInsurance() rejects:
 *
 * - Its individual catch executes.
 * - The catch returns null.
 * - The rejected Promise is recovered.
 * - The resulting Promise fulfills with null.
 *
 * Same logic applies to service history,
 * but its fallback value is [].
 *
 *
 * C. WHY PROMISE.ALL() CAN FULFILL
 *
 * Promise.all() fulfills only when every input Promise
 * fulfills.
 *
 * Optional failures are converted into fulfilled Promises
 * through their individual catch handlers.
 *
 *
 * D. WHY RETURN PROMISE.ALL()?
 *
 * Returning the aggregate Promise exposes the asynchronous
 * result to the caller.
 *
 * The caller can attach .then() and .catch().
 *
 *
 * E. LOGGING IS NOT RETURNING
 *
 * This:
 *
 * .catch(error => {
 *   console.error(error);
 * })
 *
 * implicitly returns undefined.
 *
 * This:
 *
 * .catch(error => {
 *   console.error(error);
 *   return null;
 * })
 *
 * fulfills the recovered Promise with null.
 *
 *
 * F. PROMISE.ALL() DOES NOT CANCEL OPERATIONS
 *
 * If one mandatory Promise rejects:
 *
 * - Aggregate Promise rejects immediately.
 * - Other already-started operations continue.
 * - Their results cannot change the aggregate Promise.
 *
 * Cancellation must be implemented separately,
 * for example using AbortController when supported.
 */


// ============================================================
// 5. EXPECTED OUTPUT
// ============================================================

/*
 *
 * [Optional dependency] Insurance failed:
 * Insurance service unavailable
 *
 * Vehicle dashboard loaded:
 *
 * {
 *   vehicle: {
 *     vehicleId: 101,
 *     registrationNumber: 'TS09AB1234'
 *   },
 *
 *   owner: {
 *     vehicleId: 101,
 *     ownerId: 101,
 *     name: 'Ramesh'
 *   },
 *
 *   insurance: null,
 *
 *   serviceHistory: [
 *     {
 *       serviceId: 'SRV001',
 *       description: 'Annual maintenance'
 *     },
 *     {
 *       serviceId: 'SRV002',
 *       description: 'Brake inspection'
 *     }
 *   ]
 * }
 *
 */


// ============================================================
// 6. INTERVIEW QUESTIONS AND ANSWERS
// ============================================================

/*
 *
 * Q1. Why use Promise.all() here?
 *
 * Answer:
 * All four service calls are independent.
 * We can initiate them concurrently.
 * Promise.all() collects their results in input order.
 *
 *
 * Q2. Does Promise.all() know which dependencies are optional?
 *
 * Answer:
 * No.
 * We implement optional failure handling ourselves
 * using individual catch handlers and fallback values.
 *
 *
 * Q3. What happens if an optional service rejects?
 *
 * Answer:
 * Its individual catch handles the rejection
 * and returns a fallback value.
 *
 * The Promise passed to Promise.all() is then fulfilled.
 *
 *
 * Q4. What happens if a mandatory service rejects?
 *
 * Answer:
 * Its rejection propagates to Promise.all().
 * The aggregate Promise rejects.
 * The caller-level catch handles the failure.
 *
 *
 * Q5. What is the difference between return null
 * and only logging inside catch?
 *
 * Answer:
 * return null:
 * Promise fulfills with null.
 *
 * Only console.log():
 * Promise fulfills with undefined.
 *
 *
 * Q6. Does Promise.all() preserve input order?
 *
 * Answer:
 * Yes.
 * The result array follows input order,
 * not completion order.
 *
 *
 * Q7. Does Promise.all() cancel other operations?
 *
 * Answer:
 * No.
 * Other already-started operations continue.
 *
 *
 * Q8. Why return Promise.all() from the function?
 *
 * Answer:
 * So the caller receives the Promise and can
 * compose further .then() and .catch() handlers.
 *
 */


// ============================================================
// 7. KNOWLEDGE CHECK
// ============================================================

/*
 *
 * 1. If getOwner() rejects, will the dashboard fulfill or reject?
 *
 * 2. If getInsurance() rejects and its catch returns null,
 *    what value appears in the insurance property?
 *
 * 3. If an optional catch only logs and has no return statement,
 *    what value does its recovered Promise fulfill with?
 *
 * 4. Does Promise.all() return results in completion order
 *    or input order?
 *
 * 5. Does aggregate rejection cancel other operations?
 *
 */
