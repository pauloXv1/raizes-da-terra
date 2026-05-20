const USUARIOS = [
    { usuario: 'paulo',  senha: 'paulo2025' },
    { usuario: 'renan', senha: 'reann2025' }
];

if (sessionStorage.getItem('logado') === 'true') {
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

        sessionStorage.setItem('logado', 'true');
        sessionStorage.setItem('usuario', usuario);

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