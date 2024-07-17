document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contactForm");
    form.addEventListener("submit", function(event) {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();
        let errors = [];

        if (name === "") {
            errors.push("Name is required.");
        }
        if (email === "" || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push("Valid email is required.");
        }
        if (message === "") {
            errors.push("Message is required.");
        }

        if (errors.length > 0) {
            event.preventDefault();
            alert(errors.join("\n"));
        }
    });
});
