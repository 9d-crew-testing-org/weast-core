const getCurrentConditions = require("./cc_workplease");

async function runTest() {
    try {
        /**
         * Example city format used by your system:
         * <locType>_<country>_<locationId>
         *
         * Example:
         * 1_US_USMN0503  (Minneapolis area example)
         *
         * Replace with ANY valid location your system supports.
         */
        const testCities = [
            "1_US_USMN0503"
        ];

        console.log("Requesting Current Observations...\n");

        const result = await getCurrentConditions(testCities);

        console.log("===== OUTPUT XML =====\n");
        console.log(result);
        console.log("\n===== END OUTPUT =====");

    } catch (err) {
        console.error("Test failed:");
        console.error(err);
    }
}

runTest();

