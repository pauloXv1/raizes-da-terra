document.getElementById('toggleBtn').addEventListener('click',()=>{
 const input=document.getElementById('password');input.type=input.type==='password'?'text':'password';
});
document.getElementById('loginForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=document.getElementById('btnLogin');button.disabled=true;App.message('Entrando…');
 try {
 const {error}=await supabaseCliente.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});
 if(error) throw new Error(error.code === 'email_not_confirmed' ? 'Confirme seu e-mail antes de entrar. Confira sua caixa de entrada e o spam.' : 'E-mail ou senha inválidos.');
 await App.getProfile();location.replace('inicio.html');
 }catch(error){App.message(error.message,true);}finally{button.disabled=false;}
});
// Recebe também a sessão criada após a confirmação de e-mail.
(async () => {
 const { data: { session } } = await supabaseCliente.auth.getSession();
 if (session) {
  try { await App.getProfile(); location.replace('inicio.html'); }
  catch (error) { App.message(error.message, true); }
 }
})();
