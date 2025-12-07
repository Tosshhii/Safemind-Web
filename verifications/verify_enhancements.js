const fs = require('fs');

async function verify() {
    const js = fs.readFileSync('script.js', 'utf8');

    let errors = [];

    // Verify Loading State
    if (!js.includes('Loading progress history...')) {
        errors.push("Missing loading state text in script.js");
    }

    // Verify Animation Fix
    if (!js.includes('setTimeout(() => {')) {
        errors.push("Missing setTimeout for animation");
    }
    if (js.includes('requestAnimationFrame(() => {')) {
        errors.push("Old requestAnimationFrame still present (should have been replaced)");
    }

    if (errors.length > 0) {
        console.error("Verification FAILED with errors:");
        errors.forEach(e => console.error("- " + e));
        process.exit(1);
    } else {
        console.log("Verification PASSED: Enhancements applied correctly.");
    }
}

verify();
