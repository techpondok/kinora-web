<template>
  <section style="position:relative;overflow:hidden;padding:64px 20px 80px;">
    <div style="position:absolute;inset:0;pointer-events:none;overflow:hidden;">
      <div style="position:absolute;top:-128px;right:-128px;width:384px;height:384px;border-radius:50%;opacity:0.18;background:radial-gradient(circle,#BEE3F8,transparent 70%);"></div>
      <div style="position:absolute;bottom:-80px;left:-80px;width:320px;height:320px;border-radius:50%;opacity:0.13;background:radial-gradient(circle,#B2F5EA,transparent 70%);"></div>
    </div>
    <div style="max-width:1100px;margin:0 auto;position:relative;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:64px;justify-content:center;">
        <!-- Left -->
        <div style="flex:1;min-width:280px;max-width:520px;text-align:left;">
          <div class="section-badge animate-fadeInUp" style="margin-bottom:20px;opacity:0;">
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#2B6CB0"/></svg>
            Family OS
          </div>
          <h1 class="animate-fadeInUp delay-100" style="font-size:clamp(2rem,5vw,3.2rem);line-height:1.12;font-weight:700;color:var(--color-text);margin:0 0 20px;opacity:0;">
            Satu aplikasi<br>
            <span style="background:linear-gradient(135deg,#2B6CB0,#2C7A7B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">untuk keluarga</span>
          </h1>
          <p class="animate-fadeInUp delay-200" style="font-size:1.05rem;color:var(--color-muted);line-height:1.7;margin:0 0 32px;max-width:460px;opacity:0;">
            Kelola keluarga, atur rutinitas anak, simpan kenangan, pantau keuangan rumah, hingga mengelola kebutuhan harian dalam satu tempat yang sederhana.
          </p>
          <div class="animate-fadeInUp delay-300" style="display:flex;flex-wrap:wrap;gap:12px;opacity:0;">
            <button class="btn-primary" style="font-size:1rem;padding:14px 28px;">Mulai Gratis 30 Hari</button>
            <button class="btn-outline" style="font-size:1rem;padding:13px 28px;">Lihat Fitur</button>
          </div>
          <!-- Social proof -->
          <div class="animate-fadeInUp delay-400" style="margin-top:28px;display:flex;align-items:center;gap:14px;opacity:0;">
            <div style="display:flex;">
              <div v-for="(c,i) in avatarColors" :key="i" style="width:32px;height:32px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;margin-left:-6px;" :style="`background:${c};margin-left:${i===0?'0':'-6px'};`">{{ avatarLetters[i] }}</div>
            </div>
            <div>
              <div style="display:flex;gap:2px;">
                <svg v-for="n in 5" :key="n" width="14" height="14" viewBox="0 0 14 14"><polygon points="7,1 8.8,5.4 13.5,5.9 10,9 11.2,13.5 7,11 2.8,13.5 4,9 0.5,5.9 5.2,5.4" fill="#F6AD55"/></svg>
              </div>
              <p style="font-size:11px;color:var(--color-muted);margin:3px 0 0;">10.000+ keluarga sudah bergabung</p>
            </div>
          </div>
        </div>

        <!-- Right: phone -->
        <div class="animate-scaleIn delay-300" style="flex-shrink:0;opacity:0;">
          <div style="position:relative;">
            <div class="phone-mockup animate-float" style="width:240px;min-height:490px;">
              <div style="padding:28px 12px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0 4px;margin-bottom:16px;">
                  <span style="font-size:11px;font-weight:700;color:var(--color-text);">9:41</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <div style="width:16px;height:7px;border-radius:2px;background:#BEE3F8;"></div>
                    <div style="width:12px;height:7px;border-radius:2px;background:#BEE3F8;"></div>
                    <div style="width:18px;height:7px;border-radius:2px;background:#2B6CB0;"></div>
                  </div>
                </div>
                <div style="margin-bottom:14px;padding:0 4px;">
                  <p style="font-size:11px;color:var(--color-muted);margin:0 0 2px;">Selamat pagi,</p>
                  <p style="font-size:13px;font-weight:700;font-family:var(--font-display);color:var(--color-text);margin:0;">Keluarga Santoso</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                  <div style="border-radius:12px;padding:10px;background:linear-gradient(135deg,#EBF8FF,#E6FFFA);">
                    <p style="font-size:10px;font-weight:600;color:var(--color-primary);margin:0 0 2px;">Saldo</p>
                    <p style="font-size:13px;font-weight:700;color:var(--color-text);margin:0;">Rp 4.2jt</p>
                  </div>
                  <div style="border-radius:12px;padding:10px;background:linear-gradient(135deg,#FFF5F5,#FFF0F6);">
                    <p style="font-size:10px;font-weight:600;color:#C53030;margin:0 0 2px;">Kesehatan</p>
                    <p style="font-size:13px;font-weight:700;color:var(--color-text);margin:0;">3 reminder</p>
                  </div>
                </div>
                <!-- Menu grid -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
                  <div v-for="menu in menuItems" :key="menu.label" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                    <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;" :style="`background:${menu.bg};`">
                      <div style="border-radius:4px;" :style="`width:${menu.iw};height:${menu.ih};background:${menu.ic};`"></div>
                    </div>
                    <span style="font-size:9px;color:var(--color-muted);text-align:center;line-height:1.2;">{{ menu.label }}</span>
                  </div>
                </div>
                <!-- Today -->
                <div style="background:var(--color-sky);border:1px solid #BEE3F8;border-radius:12px;padding:10px;">
                  <p style="font-size:10px;font-weight:600;color:var(--color-primary);margin:0 0 8px;">Aktivitas Hari Ini</p>
                  <div v-for="act in activities" :key="act.name" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <div style="width:14px;height:14px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;" :style="`background:${act.done?'#2B6CB0':'#E2ECF4'};`">
                      <div v-if="act.done" style="width:6px;height:4px;border-left:1.5px solid white;border-bottom:1.5px solid white;transform:rotate(-45deg);margin-top:-1px;"></div>
                    </div>
                    <span style="font-size:10px;flex:1;" :style="`color:${act.done?'#718096':'var(--color-text)'};text-decoration:${act.done?'line-through':'none'};`">{{ act.name }}</span>
                    <span style="font-size:9px;color:var(--color-muted);">{{ act.time }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Floating cards -->
            <div class="card" style="position:absolute;right:-48px;top:40px;padding:10px 14px;font-size:11px;min-width:110px;animation:floatY 3.5s ease-in-out infinite;animation-delay:1s;">
              <p style="font-weight:600;color:var(--color-text);margin:0 0 2px;">Tabungan</p>
              <p style="color:var(--color-teal);font-weight:700;margin:0;">+Rp 250.000</p>
            </div>
            <div class="card" style="position:absolute;left:-56px;bottom:80px;padding:10px 12px;font-size:11px;min-width:100px;animation:floatY 4s ease-in-out infinite;animation-delay:2s;">
              <p style="font-weight:600;color:var(--color-text);margin:0 0 2px;">Status</p>
              <p style="color:#38A169;font-weight:700;margin:0;">Semua aman</p>
            </div>
            <div class="card" style="position:absolute;right:-40px;bottom:36px;padding:10px 12px;font-size:11px;min-width:95px;animation:floatY 3.8s ease-in-out infinite;animation-delay:0.5s;">
              <p style="font-weight:600;color:var(--color-text);margin:0 0 2px;">Rutinitas</p>
              <p style="color:var(--color-primary);font-weight:700;margin:0;">3/5 selesai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  name: 'HeroSection',
  data() {
    return {
      avatarColors: ['#2B6CB0','#2C7A7B','#D69E2E','#C53030','#553C9A'],
      avatarLetters: ['B','S','A','R','M'],
      menuItems: [
        {label:'Dashboard',bg:'#EBF8FF',ic:'#2B6CB0',iw:'16px',ih:'16px'},
        {label:'Shopping',bg:'#FFFFF0',ic:'#D69E2E',iw:'14px',ih:'16px'},
        {label:'Finance',bg:'#E6FFFA',ic:'#2C7A7B',iw:'16px',ih:'14px'},
        {label:'Journey',bg:'#FAF5FF',ic:'#553C9A',iw:'14px',ih:'14px'},
        {label:'Memory',bg:'#FFF5F5',ic:'#E53E3E',iw:'16px',ih:'12px'},
        {label:'Routine',bg:'#F0FFF4',ic:'#38A169',iw:'12px',ih:'16px'},
        {label:'Health',bg:'#FFF5F5',ic:'#E53E3E',iw:'14px',ih:'14px'},
        {label:'Safety',bg:'#EBF8FF',ic:'#2B6CB0',iw:'16px',ih:'16px'},
      ],
      activities: [
        {name:'Belajar matematika',time:'07:00',done:true},
        {name:'Minum vitamin',time:'08:00',done:true},
        {name:'Olahraga pagi',time:'09:00',done:false},
        {name:'Tidur siang',time:'13:00',done:false},
      ]
    }
  }
}
</script>
