/* ==========================================================
   Ratanang Community Center - app.js
   JavaScript for the donation business process.
   Written in simple ES5 so it runs in any browser.
   ========================================================== */

// Cost of one "unit" of help per project (used for the impact calculator)
var PROJECT_INFO = {
    donation:    { name: "Donation (General Fund)", unit: "care packs",       cost: 100 },
    aftercare:   { name: "Aftercare",               unit: "afternoons of care", cost: 30  },
    counselling: { name: "Counselling",             unit: "counselling sessions", cost: 200 },
    agriculture: { name: "Agriculture",             unit: "seed packs",       cost: 80  },
    feeding:     { name: "Feeding Scheme",          unit: "meals",            cost: 25  }
};
var totalRaised = 0;     // running total of donations captured this session

/* FUNCTION 1 - INPUT VALIDATION
   Params: value (text typed in), rule (which rule to test)
   Returns: "" when valid, otherwise an error message */
function validateField(value, rule) {
    value = value.trim();                       // remove spaces at start/end
    if (value === "") { return "This field is required."; }
    if (rule === "name") {
        if (value.length < 3) { return "Enter your full name (at least 3 letters)."; }
    } else if (rule === "email") {
        // simple pattern: something@something.something
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) { return "Enter a valid email address."; }
    } else if (rule === "phone") {
        // South African cell number: 10 digits starting with 0
        if (!/^0[0-9]{9}$/.test(value)) { return "Cell number must be 10 digits, e.g. 0821234567."; }
    } else if (rule === "amount") {
        if (isNaN(value) || parseFloat(value) < 10) { return "Minimum donation is R10."; }
    }
    return "";                                  // no problem found
}

/* FUNCTION 2 - CALCULATE TOTAL DONATED (arithmetic + iteration)
   Params: amount (Rand), frequency ("once"/"monthly"/"yearly"), years
   Returns: total Rand given over the chosen number of years */
function calculateTotal(amount, frequency, years) {
    var total = 0;                              // local variable
    var paymentsPerYear = 1;
    if (frequency === "monthly") { paymentsPerYear = 12; }
    if (frequency === "once") { return amount; }   // one payment only
    for (var y = 1; y <= years; y++) {          // add up each year
        total = total + amount * paymentsPerYear;
    }
    return total;
}

/* FUNCTION 3 - WORK OUT THE DONOR TIER (conditional structure)
   Param: total (Rand)   Returns: tier name */
function getDonorTier(total) {
    if (total >= 5000) { return "Gold Guardian"; }
    else if (total >= 1000) { return "Silver Supporter"; }
    else if (total >= 250) { return "Bronze Friend"; }
    return "Community Helper";
}

/* FUNCTION 4 - ALERT / MESSAGE BOX
   Params: name, total, tier */
function showThankYou(name, total, tier) {
    alert("Thank you, " + name + "!\nYour donation of R" + total.toFixed(2) +
          " makes you a " + tier + ".");
}

/* FUNCTION 5 - RADIO BUTTON READER (iteration)
   Param: groupName  Returns: value of the ticked radio button */
function getSelectedRadio(groupName) {
    var radios = document.getElementsByName(groupName);
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) { return radios[i].value; }
    }
    return "once";
}

/* FUNCTION 6 - LIVE IMPACT PREVIEW (runs on change events)
   Reads the form and shows what the donation will achieve */
function updatePreview() {
    var box = document.getElementById("preview");
    var amount = parseFloat(document.getElementById("amount").value);   // text -> number
    if (isNaN(amount) || amount < 10) { box.innerHTML = "Enter an amount of R10 or more to see your impact."; return; }
    var info = PROJECT_INFO[document.getElementById("project").value];
    var years = parseInt(document.getElementById("years").value, 10);
    var total = calculateTotal(amount, getSelectedRadio("frequency"), years);
    var units = Math.floor(total / info.cost);                          // whole units funded
    box.innerHTML = "Total over the period: <strong>R" + total.toFixed(2) + "</strong><br>That funds about <strong>" +
                    units + " " + info.unit + "</strong> for <em>" + info.name + "</em>. Tier: <strong>" + getDonorTier(total) + "</strong>";
}

/* FUNCTION 7 - ADD TO THE DONATION LOG (output to the page)
   Params: name, total, projectName, tier */
function logDonation(name, total, projectName, tier) {
    var li = document.createElement("li");
    li.innerHTML = "<strong>" + name + "</strong> - R" + total.toFixed(2) + " to " + projectName + " (" + tier + ")";
    document.getElementById("log").appendChild(li);
    totalRaised = totalRaised + total;
    document.getElementById("raised").innerHTML = "R" + totalRaised.toFixed(2);
}

/* FUNCTION 8 - MAIN HANDLER for the Donate button
   Validates every field, then calculates, alerts and logs */
function handleDonate() {
    var fields = [ ["name", "name"], ["email", "email"], ["phone", "phone"], ["amount", "amount"] ];
    var allValid = true;
    for (var i = 0; i < fields.length; i++) {              // validate each text field
        var msg = validateField(document.getElementById(fields[i][0]).value, fields[i][1]);
        document.getElementById("err-" + fields[i][0]).innerHTML = msg;
        if (msg !== "") { allValid = false; }
    }
    if (!allValid) { alert("Please fix the errors shown in red."); return; }

    var anonymous = document.getElementById("anon").checked;
    var name = anonymous ? "Anonymous donor" : document.getElementById("name").value.trim();
    var amount = parseFloat(document.getElementById("amount").value);
    var years = parseInt(document.getElementById("years").value, 10);
    var total = calculateTotal(amount, getSelectedRadio("frequency"), years);
    var tier = getDonorTier(total);
    var projectName = PROJECT_INFO[document.getElementById("project").value].name;

    logDonation(name, total, projectName, tier);
    if (document.getElementById("cert").checked) {
        document.getElementById("certnote").innerHTML = "A Section 18A tax certificate will be emailed to " + document.getElementById("email").value.trim() + ".";
    }
    document.getElementById("jingle").play();               // thank-you sound
    showThankYou(name, total, tier);
}

/* FUNCTION 9 - CLEAR THE FORM */
function resetForm() {
    document.getElementById("donateForm").reset();
    var errs = document.getElementsByClassName("error");
    for (var i = 0; i < errs.length; i++) { errs[i].innerHTML = ""; }
    updatePreview();
}

/* FUNCTION 10 - FILTER THE PROJECTS TABLE (projects page)
   Param: category ("all" or a project category) */
function filterProjects(category) {
    var rows = document.getElementById("projTable").getElementsByTagName("tr");
    for (var i = 1; i < rows.length; i++) {                 // skip header row
        var show = (category === "all" || rows[i].getAttribute("data-cat") === category);
        rows[i].style.display = show ? "" : "none";
    }
}
