<template>
  <section style="padding:80px 20px;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;pointer-events:none;"><div style="position:absolute;top:0;right:0;width:384px;height:384px;border-radius:50%;opacity:0.1;background:radial-gradient(circle,#BEE3F8,transparent 70%);"></div></div>
    <div style="max-width:1100px;margin:0 auto;position:relative;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:56px;justify-content:center;">
        <!-- Left -->
        <div style="flex:1;min-width:280px;max-width:480px;">
          <div class="section-badge" style="margin-bottom:16px;">
            <div style="width:8px;height:8px;border-radius:2px;background:#2B6CB0;"></div>
            Family OS
          </div>
          <h2 style="font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;line-height:1.2;color:var(--color-text);margin:0 0 16px;">Semua anggota keluarga<br>dalam satu ruang</h2>
          <p style="color:var(--color-muted);line-height:1.7;margin:0 0 28px;max-width:400px;">Profil keluarga dengan multi-role. Setiap anggota punya pengalaman yang disesuaikan.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
            <div v-for="f in features" :key="f.name" class="card" style="padding:16px;display:flex;align-items:flex-start;gap:12px;">
              <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="`background:${f.bg};`">
                <div :style="`width:${f.iw};height:${f.ih};border-radius:${f.ir};background:${f.ic};`"></div>
              </div>
              <div>
                <p style="font-weight:600;font-size:12px;color:var(--color-text);margin:0 0 3px;">{{ f.name }}</p>
                <p style="font-size:11px;color:var(--color-muted);line-height:1.4;margin:0;">{{ f.desc }}</p>
              </div>
            </div>
          </div>
          <button class="btn-primary">Lihat Family Experience</button>
        </div>
        <!-- Right phone -->
        <div style="flex-shrink:0;">
          <div class="phone-mockup" style="width:230px;min-height:460px;">
            <div style="padding:28px 16px 16px;">
              <div style="text-align:center;margin-bottom:20px;">
                <div style="width:56px;height:56px;border-radius:20px;background:linear-gradient(135deg,#EBF8FF,#E6FFFA);margin:0 auto 10px;display:flex;align-items:center;justify-content:center;">
                  <div style="width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,#2B6CB0,#2C7A7B);"></div>
                </div>
                <p style="font-weight:700;font-size:13px;font-family:var(--font-display);color:var(--color-text);margin:0 0 3px;">Keluarga Santoso</p>
                <p style="font-size:11px;color:var(--color-muted);margin:0;">4 anggota aktif</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
                <div v-for="member in members" :key="member.name" style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;" :style="`background:${member.bg};`">
                  <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;flex-shrink:0;" :style="`background:${member.color};`">{{ member.initial }}</div>
                  <div style="flex:1;">
                    <p style="font-size:11px;font-weight:600;color:var(--color-text);margin:0;">{{ member.name }}</p>
                    <p style="font-size:10px;color:var(--color-muted);margin:0;">{{ member.role }}</p>
                  </div>
                  <span style="font-size:10px;padding:2px 8px;border-radius:100px;font-weight:600;" :style="`background:${member.color}20;color:${member.color};`">{{ member.tag }}</span>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
                <div v-for="chip in chips" :key="chip" style="text-align:center;padding:7px 4px;border-radius:10px;font-size:9px;font-weight:600;background:var(--color-sky);color:var(--color-primary);">{{ chip }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  name: 'FamilyOSSection',
  data() {
    return {
      features: [
        {name:'Family Profile',desc:'Satu akun untuk semua anggota',bg:'#EBF8FF',ic:'#2B6CB0',iw:'16px',ih:'16px',ir:'50%'},
        {name:'Multi Role',desc:'Parent, Child, Guardian mode',bg:'#FAF5FF',ic:'#553C9A',iw:'18px',ih:'14px',ir:'4px'},
        {name:'Reward & Uang Saku',desc:'Apresiasi anak dengan poin',bg:'#FFFFF0',ic:'#D69E2E',iw:'16px',ih:'16px',ir:'50%'},
        {name:'Shared Goal',desc:'Target bersama keluarga',bg:'#F0FFF4',ic:'#38A169',iw:'16px',ih:'16px',ir:'3px'},
        {name:'Shopping List',desc:'Daftar belanja bersama',bg:'#FFF5F5',ic:'#E53E3E',iw:'14px',ih:'18px',ir:'2px'},
        {name:'Memory Timeline',desc:'Kenangan terkumpul otomatis',bg:'#FEFCBF',ic:'#D69E2E',iw:'18px',ih:'12px',ir:'2px'},
      ],
      members: [
        {name:'Ayah Budi',initial:'B',color:'#2B6CB0',role:'Parent',bg:'#EBF8FF',tag:'Admin'},
        {name:'Ibu Sari',initial:'S',color:'#2C7A7B',role:'Parent',bg:'#E6FFFA',tag:'Admin'},
        {name:'Dika (12)',initial:'D',color:'#D69E2E',role:'Child',bg:'#FFFFF0',tag:'Child'},
        {name:'Nenek',initial:'N',color:'#553C9A',role:'Guardian',bg:'#FAF5FF',tag:'View'},
      ],
      chips:['Routine','Reward','Safe Check','Allowance','Journey','Memory']
    }
  }
}
</script>
