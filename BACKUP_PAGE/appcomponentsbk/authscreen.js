// components/authscreen.js

export default function AuthScreen({ 
  bgImages, t, lang, setLang, accessStep, setAccessStep, 
  vipCode, setVipCode, validarToken, 
  username, setUsername, email, setEmail, password, setPassword, 
  handleRegister, handleLogin 
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-black relative">
      <div className="absolute inset-0 z-0">
        <img src={bgImages.landing} className="w-full h-full object-cover opacity-40 shadow-inner transition-opacity duration-700" alt="bg" />
      </div>
      <div className="relative z-10 bg-black/90 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl w-full max-w-sm">

<div className="flex justify-center gap-8 mb-8">
  {[
    { id: 'es', flag: 'https://purecatamphetamine.github.io/country-flag-icons/3x2/ES.svg' },
    { id: 'ca', flag: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Catalonia.svg' },
    { id: 'en', flag: 'https://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg' }
  ].map((l) => (
    <button 
      key={l.id} 
      onClick={() => setLang(l.id)} 
      className={`flex flex-col items-center gap-2 transition-all duration-300 ${lang === l.id ? 'scale-110 opacity-100' : 'opacity-30 grayscale hover:opacity-60'}`}
    >
      <div className={`relative w-10 h-7 overflow-hidden rounded-sm border ${lang === l.id ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'border-white/20'}`}>
        <img 
          src={l.flag} 
          alt={l.id} 
          className="w-full h-full object-cover block" 
        />
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${lang === l.id ? 'text-yellow-500' : 'text-gray-500'}`}>
        {l.id}
      </span>
    </button>
  ))}
</div>

        <h1 className="text-3xl font-black text-yellow-500 mb-8 italic text-center uppercase">{t.title} 2026</h1>
        <div className="space-y-4">
          {accessStep === 'token' && (
            <>
              <input type="text" placeholder={t.vip} value={vipCode} onChange={(e) => setVipCode(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center text-xl font-black text-yellow-500 uppercase outline-none focus:border-yellow-500" />
              <button onClick={validarToken} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.validate}</button>
              <button onClick={() => setAccessStep('login')} className="w-full text-[10px] text-gray-500 font-bold uppercase">{t.already} {t.loginLink}</button>
            </>
          )}
          {accessStep === 'register' && (
            <>
              <input type="text" placeholder={t.user} value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="password" placeholder={t.pass} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <button onClick={handleRegister} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.signupBtn}</button>
            </>
          )}
          {accessStep === 'login' && (
            <>
              <input type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <input type="password" placeholder={t.pass} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-white outline-none" />
              <button onClick={handleLogin} className="w-full py-4 bg-yellow-500 text-black font-black rounded-xl uppercase text-xs">{t.loginBtn}</button>
              <button onClick={() => setAccessStep('token')} className="w-full text-[10px] text-gray-500 font-bold uppercase">{t.backToken}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}