const USUARIOS = [
    { usuario: 'paulo', senha: 'paulo2025' },
    { usuario: 'renan', senha: 'renan2025' }
];

if (!sessionStorage.getItem('sessionViva')) {
    localStorage.removeItem('logado');
    localStorage.removeItem('usuario');
}

sessionStorage.setItem('sessionViva', 'true');

if (localStorage.getItem('logado') === 'true') {
    window.location.href = 'index.html';
}

const form      = document.getElementById('loginForm');
const alertEl   = document.getElementById('alertError');
const toggleBtn = document.getElementById('toggleBtn');
const passInput = document.getElementById('password');
const btnLogin  = document.getElementById('btnLogin');

toggleBtn.addEventListener('click', () => {
    if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const usuario = document.getElementById('username').value.trim();
    const senha   = passInput.value;

    const encontrado = USUARIOS.find(
        u => u.usuario === usuario && u.senha === senha
    );

    if (encontrado) {
        btnLogin.textContent = '✅ Entrando...';
        btnLogin.disabled = true;
        alertEl.classList.remove('show');

        localStorage.setItem('logado', 'true');
        localStorage.setItem('usuario', usuario);

        setTimeout(() => {
            window.location.href = 'registro.html';
        }, 600);
    } else {
        alertEl.classList.remove('show');
        void alertEl.offsetWidth;
        alertEl.classList.add('show');

        passInput.value = '';
        passInput.focus();
    }
});