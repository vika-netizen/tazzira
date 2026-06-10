document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       AUTH CHECK (/me)
    ========================= */

    async function checkAuth() {
        try {
            const res = await fetch('/me');
            const user = await res.json();

            const loginBtn = document.querySelector(".login-btn");

            if (user && loginBtn) {
                loginBtn.innerText = `👤 ${user.username}`;
                loginBtn.href = "/dashboard";
            }
        } catch (err) {
            console.log("Auth error:", err);
        }
    }

    checkAuth();

    /* =========================
       LOGIN FORM
    ========================= */

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = loginForm.querySelector("input[type='text']")?.value;
            const password = loginForm.querySelector("input[type='password']")?.value;

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (data.success) {
                    window.location.href = "/dashboard";
                } else {
                    alert(data.message || "Login error");
                }

            } catch (err) {
                console.log(err);
                alert("Server error");
            }
        });
    }

    /* =========================
       LOGOUT
    ========================= */

    window.logout = async function () {
        await fetch("/logout", { method: "POST" });
        window.location.href = "/";
    };

    /* =========================
       DASHBOARD STATS
    ========================= */

    async function loadDashboardStats() {
        const bookingsEl = document.getElementById('activeBookings');
        const trainingsEl = document.getElementById('totalTrainings');

        if (!bookingsEl || !trainingsEl) return;

        try {
            const res = await fetch('/dashboard-stats');

            if (!res.ok) throw new Error("API error");

            const stats = await res.json();

            bookingsEl.innerText = stats.activeBookings || 0;
            trainingsEl.innerText = stats.totalTrainings || 0;

        } catch (err) {
            console.log(err);

            bookingsEl.innerText = 0;
            trainingsEl.innerText = 0;
        }
    }

    loadDashboardStats();

});


