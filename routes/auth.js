// ===== перевірка користувача =====
fetch('/me')
  .then(res => res.json())
  .then(user => {
    if (user) {
      const userBlock = document.getElementById('user');
      if (userBlock) {
        userBlock.innerText = "Ти увійшла як: " + user.username;
      }

      const btn = document.querySelector(".login-btn");
      if (btn) {
        btn.innerText = "Мій акаунт";
        btn.href = "/dashboard.html";
      }
    }
  });

// ===== логін =====
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = loginForm.querySelector("input[type='text']").value;
    const password = loginForm.querySelector("input[type='password']").value;

    const res = await fetch("/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      window.location.href = "/dashboard.html";
    } else {
      const err = document.getElementById("error");
      if (err) err.innerText = data.message;
    }
  });
}

// ===== захист dashboard =====
if (window.location.pathname === "/dashboard.html") {
  fetch('/me')
    .then(res => res.json())
    .then(user => {
      if (!user) {
        window.location.href = "/login.html";
      } else {
        const el = document.getElementById("userEmail");
        if (el) el.innerText = user.username;
      }
    });
}

// ===== logout =====
function logout() {
  fetch('/logout').then(() => {
    window.location.href = "/";
  });
}

async function loadAuth() {

    const response =
    await fetch('/me');

    const user =
    await response.json();

    const authArea =
    document.getElementById('auth-area');

    if (user) {

        authArea.innerHTML = `

            <div class="profile-menu">

                <span class="profile-name">
                    👤 ${user.username}
                </span>

                <a href="my-bookings.html">
                    📅 Мої записи
                </a>

                <a href="/logout">
                    🚪 Вийти
                </a>

            </div>

        `;

    } else {

        authArea.innerHTML = `

            <a href="login.html" class="login-btn">
                Увійти
            </a>

        `;
    }
}

loadAuth();

async function loadAuth() {

    const response =
    await fetch('/me', {

        credentials: 'include'
    });

    const user =
    await response.json();

    const authArea =
    document.getElementById('auth-area');

    if (user) {

        authArea.innerHTML = `

            <div class="profile-menu">

                <a href="dashboard.html"
                   class="profile-name">

                    👤 ${user.username}

                </a>

                <a href="my-bookings.html">
                    📅 Мої записи
                </a>

                <a href="/logout">
                    🚪 Вийти
                </a>

            </div>

        `;

    } else {

        authArea.innerHTML = `

            <a href="login.html"
               class="login-btn">

                Увійти

            </a>

        `;
    }
}

loadAuth();

async function checkAuth() {

    const authArea =
    document.getElementById('auth-area');

    try {

        const response =
        await fetch('/me');

        const user =
        await response.json();

        // якщо НЕ увійшов
        if (!user) {

            authArea.innerHTML = `
                <a href="login.html" class="login-btn">
                    Увійти
                </a>
            `;

            return;
        }

        // якщо увійшов
        authArea.innerHTML = `
            <div class="profile-box">

                <a href="dashboard.html" class="profile-btn">
                    👤 ${user.username}
                </a>

                <a href="/logout" class="logout-btn">
                    Вийти
                </a>

            </div>
        `;

    } catch (error) {

        console.log(error);

    }

}

checkAuth();


function getUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function requireAuth() {
  const user = getUser();

  if (!user || !user.username) {
    window.location.href = "login.html";
  }
}

function setUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

function getUser(){
  return JSON.parse(localStorage.getItem("currentUser"));
}

function requireAuth(){
  const user = getUser();

  if(!user || !user.username){
    window.location.href = "login.html";
  }

  return user;
}

function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}


function bookTrainer(name){

  const user = getUser();

  if(!user){
    alert("Увійдіть в акаунт");
    return;
  }

  const key = "bookings_" + user.username;

  let data = JSON.parse(localStorage.getItem(key)) || [];

  data.push({
    trainer: name,
    date: new Date().toLocaleString()
  });

  localStorage.setItem(key, JSON.stringify(data));

  alert("Запис успішний!");
}

function getUser(){
  return JSON.parse(localStorage.getItem("currentUser"));
}

function requireAuth(){
  const user = getUser();

  if(!user || !user.username){
    window.location.href = "login.html";
  }

  return user;
}

function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}


fetch('/me')
    .then(res => res.json())
    .then(user => {

        const authArea = document.getElementById('auth-area');

        if (user) {
            authArea.innerHTML = `
                <div class="cabinet-menu">
                    Кабінет ▾
                    <div class="dropdown">
                        <a href="/trainers.html">🏋️ Тренери</a>
                        <a href="/bookings.html">📅 Мої записи</a>
                        <a href="/subscription.html">💳 Абонемент</a>
                        <a href="/logout">🚪 Вийти</a>
                    </div>
                </div>
            `;
        } else {
            authArea.innerHTML = `
                <a href="/login.html" class="login-btn">Увійти</a>
            `;
        }
    });