const fs = require('fs');

async function verify() {
    const html = fs.readFileSync('patient-profile.html', 'utf8');
    const js = fs.readFileSync('script.js', 'utf8');
    const css = fs.readFileSync('stylesheet.css', 'utf8');

    let errors = [];
    let warnings = [];

    // Part 1: Swipeable Progress Cards Initialization
    if (!js.includes('const initialDataPoint = {')) {
        errors.push("Missing initialDataPoint creation in script.js");
    }
    if (!js.includes('label: "AI Analysis #1"')) {
        errors.push("Missing 'AI Analysis #1' label in initialDataPoint");
    }
    if (!js.includes('score: displayPercent')) {
        errors.push("Missing binding of score to displayPercent");
    }
    if (!html.includes('id="progress-cards-track"')) {
        errors.push("Missing progress-cards-track in HTML");
    }
    if (!js.includes('collection(db, "users", patientId, "progress_history")')) {
        errors.push("Missing progress_history collection reference");
    }
    if (!js.includes('onSnapshot(qHistory')) {
        errors.push("Missing onSnapshot listener for realtime updates");
    }

    // Part 2: The "Record Findings" Input Card
    if (!html.includes('id="consultation-findings-card"')) {
        errors.push("Missing consultation-findings-card in HTML");
    }
    if (!html.includes('id="findings-log"')) {
        errors.push("Missing findings-log input in HTML");
    }
    if (!html.includes('class="consultation-findings-card hidden"')) {
        warnings.push("Card might not be hidden by default (check classes)");
    }

    // Check toggle logic
    if (!js.includes("findingsCard.classList.remove('hidden')")) {
        errors.push("Missing logic to show findings card");
    }
    if (!js.includes("findingsCard.classList.add('hidden')")) {
        errors.push("Missing logic to hide findings card");
    }

    // Check save logic
    if (!js.includes('addDoc(historyRef, {')) {
        errors.push("Missing addDoc call to save findings");
    }
    if (!js.includes('const score = Number.isFinite(latestSeverityScore) ? latestSeverityScore : 0;')) {
        errors.push("Missing automatic severity assignment from latestSeverityScore");
    }
    if (!js.includes('severity: score')) {
        errors.push("Missing severity field in addDoc payload");
    }

    if (errors.length > 0) {
        console.error("Verification FAILED with errors:");
        errors.forEach(e => console.error("- " + e));
        process.exit(1);
    } else {
        console.log("Verification PASSED: Code structure seems to match requirements.");
        if (warnings.length > 0) {
            console.warn("Warnings:");
            warnings.forEach(w => console.warn("- " + w));
        }
    }
}

verify();
