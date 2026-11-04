document.getElementById('toggleBtn').addEventListener('click',()=>{
 const input=document.getElementById('password');input.type=input.type==='password'?'text':'password';
});
document.getElementById('loginForm').addEventListener('submit',async event=>{
 event.preventDefault();const button=document.getElementById('btnLogin');button.disabled=true;App.message('Entrando…');
 try {
 const {error}=await supabaseCliente.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});
 if(error) throw new Error('E-mail ou senha inválidos.');
 await App.requireAccess();location.replace('precos.html');
 }catch(error){App.message(error.message,true);}finally{button.disabled=false;}
});
