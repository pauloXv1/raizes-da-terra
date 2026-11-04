const signupForm = document.getElementById('signupForm');
const password = document.getElementById('password');
const confirmation = document.getElementById('confirmPassword');
function validateConfirmation() {
    confirmation.setCustomValidity(password.value === confirmation.value ? '' : 'As senhas precisam ser iguais.');
}
password.addEventListener('input', validateConfirmation);
confirmation.addEventListener('input', validateConfirmation);
signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    validateConfirmation();
    if (!signupForm.reportValidity()) return;
    const button = document.getElementById('btnSignup');
    button.disabled = true;
    App.message('Enviando seu cadastro…');
    try {
        const { data, error } = await supabaseCliente.auth.signUp({
            email: document.getElementById('email').value.trim(),
            password: password.value,
            options: { emailRedirectTo: new URL('index.html', location.href).href }
        });
        if (error) {
            const messages = {
                signup_disabled: 'O cadastro ainda não foi habilitado. Fale com um administrador.',
                over_email_send_rate_limit: 'Aguarde alguns minutos antes de solicitar outro cadastro.',
                email_address_invalid: 'Informe um e-mail válido.',
                weak_password: 'Escolha uma senha mais forte, com pelo menos 8 caracteres.',
                user_already_exists: 'Este e-mail já possui cadastro. Volte para entrar.'
            };
            throw new Error(messages[error.code] || 'Não foi possível concluir o cadastro. Tente novamente ou fale com um administrador.');
        }
        signupForm.reset();
        if (data.session) { location.replace('inicio.html'); return; }
        App.message('Solicitação recebida. Se este e-mail ainda não possui cadastro, confira sua caixa de entrada e o spam para confirmá-lo. Depois, entre no sistema e aguarde a aprovação de um administrador.');
    } catch (error) { App.message(error.message, true); }
    finally { button.disabled = false; }
});
