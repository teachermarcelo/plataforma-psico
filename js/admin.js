import { supabase } from "./supabase.js";

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loading = document.getElementById("loading");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");


// --------------------------------------------------
// INTERFACE
// --------------------------------------------------

function showLogin() {

    loading.style.display = "none";
    adminSection.style.display = "none";
    loginSection.style.display = "block";

}

function showAdmin(session, displayName) {

    loading.style.display = "none";
    loginSection.style.display = "none";
    adminSection.style.display = "block";

    userEmail.textContent =
        displayName || session.user.email;

}


// --------------------------------------------------
// VERIFICAR ADMIN
// --------------------------------------------------

async function checkAdmin(session) {

    if (!session) {

        showLogin();
        return;

    }

    const { data, error } = await supabase
        .from("psico_admins")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();


    if (error) {

        console.error(error);

        await supabase.auth.signOut();

        showLogin();

        loginError.textContent =
            "Não foi possível verificar o acesso administrativo.";

        loginError.style.display = "block";

        return;
    }


    if (!data) {

        await supabase.auth.signOut();

        showLogin();

        loginError.textContent =
            "Este usuário não possui permissão de administrador.";

        loginError.style.display = "block";

        return;
    }


    showAdmin(session, data.display_name);

}


// --------------------------------------------------
// LOGIN
// --------------------------------------------------

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    loginError.style.display = "none";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    const { data, error } =
        await supabase.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(error);

        loginError.textContent =
            "E-mail ou senha incorretos.";

        loginError.style.display = "block";

        return;
    }


    await checkAdmin(data.session);

});


// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

logoutBtn.addEventListener("click", async () => {

    await supabase.auth.signOut();

    window.location.reload();

});


// --------------------------------------------------
// INICIALIZAÇÃO
// --------------------------------------------------

async function init() {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    await checkAdmin(session);

}


init();


// --------------------------------------------------
// MONITORAR SESSÃO
// --------------------------------------------------

supabase.auth.onAuthStateChange(async (_event, session) => {

    if (session) {

        await checkAdmin(session);

    } else {

        showLogin();

    }

});
