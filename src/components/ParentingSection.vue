<template>
  <section style="padding:80px 20px;background:white;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:56px;justify-content:center;">
        <!-- Phone (first on mobile, right on desktop via order) -->
        <div style="flex-shrink:0;order:2;">
          <div class="phone-mockup" style="width:230px;min-height:490px;">
            <div style="padding:28px 14px 16px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <div>
                  <p style="font-weight:700;font-size:13px;font-family:var(--font-display);color:var(--color-text);margin:0 0 2px;">Rutinitas Dika</p>
                  <p style="font-size:10px;color:var(--color-muted);margin:0;">Kamis, 4 Mei</p>
                </div>
                <div style="text-align:center;">
                  <p style="font-size:18px;font-weight:700;color:var(--color-primary);margin:0;font-family:var(--font-display);">3/5</p>
                  <p style="font-size:9px;color:var(--color-muted);margin:0;">selesai</p>
                </div>
              </div>
              <div style="height:5px;border-radius:100px;background:#E2ECF4;overflow:hidden;margin-bottom:14px;">
                <div style="width:60%;height:100%;border-radius:100px;background:linear-gradient(90deg,#2B6CB0,#2C7A7B);"></div>
              </div>
              <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px;">
                <div v-for="item in routines" :key="item.name" style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:12px;" :style="`background:${item.done?'#F0FFF4':'var(--color-sky)'};`">
                  <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;" :style="`background:${item.done?'#2B6CB0':'#E2ECF4'};`">
                    <div v-if="item.done" style="width:8px;height:5px;border-left:2px solid white;border-bottom:2px solid white;transform:rotate(-45deg);margin-top:-2px;"></div>
                    <div v-else style="border-radius:3px;" :style="`width:${item.iw};height:${item.ih};background:${item.ic};`"></div>
                  </div>
                  <div style="flex:1;">
                    <p style="font-size:11px;font-weight:600;margin:0;" :style="`color:${item.done?'#718096':'var(--color-text)'};text-decoration:${item.done?'line-through':'none'};`">{{ item.name }}</p>
                    <p style="font-size:9px;color:var(--color-muted);margin:0;">{{ item.time }}</p>
                  </div>
                  <span v-if="item.reward" style="font-size:10px;padding:2px 7px;border-radius:100px;font-weight:700;background:#FEFCBF;color:#D69E2E;">+{{ item.reward }}pt</span>
                </div>
              </div>
              <div style="border-radius:14px;padding:12px;text-align:center;background:linear-gradient(135deg,#FFFFF0,#FEFCBF);">
                <p style="font-size:10px;font-weight:600;color:#D69E2E;margin:0 0 4px;">Total Poin Minggu Ini</p>
                <p style="font-size:22px;font-weight:700;font-family:var(--font-display);color:var(--color-text);margin:0;">125 poin</p>
                <p style="font-size:10px;color:var(--color-muted);margin:3px 0 0;">= Rp 12.500 uang saku</p>
              </div>
            </div>
          </div>
        </div>
        <!-- Content -->
        <div style="flex:1;min-width:280px;max-width:460px;order:1;">
          <div class="section-badge" style="margin-bottom:16px;">
            <div style="width:8px;height:10px;border-radius:2px;background:#2C7A7B;"></div>
            Parenting &amp; Routine
          </div>
          <h2 style="font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;line-height:1.2;color:var(--color-text);margin:0 0 16px;">Rutinitas anak jadi<br>lebih teratur</h2>
          <p style="color:var(--color-muted);line-height:1.7;margin:0 0 24px;">Buat jadwal harian, beri reward poin, dan pantau progress anak — semua di satu tempat.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
            <span v-for="tag in tags" :key="tag" style="padding:6px 14px;border-radius:100px;font-size:12px;font-weight:500;background:var(--color-sky);color:var(--color-primary);border:1px solid #BEE3F8;">{{ tag }}</span>
          </div>
          <div class="card" style="padding:16px;display:flex;gap:14px;align-items:flex-start;border-color:#BEE3F8;background:var(--color-sky);">
            <div style="width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,#2B6CB0,#2C7A7B);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <div style="width:16px;height:20px;border-radius:50% 50% 4px 4px;background:rgba(255,255,255,0.9);"></div>
            </div>
            <div>
              <p style="font-weight:600;font-size:13px;color:var(--color-text);margin:0 0 5px;">Child Mode</p>
              <p style="font-size:12px;line-height:1.6;color:var(--color-muted);margin:0;">Tampilan lebih sederhana agar anak fokus pada aktivitas penting, tanpa melihat fitur keuangan lanjutan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  name: 'ParentingSection',
  data() {
    return {
      routines: [
        {name:'Belajar matematika',time:'07:00 - 08:00',done:true,reward:20,iw:'12px',ih:'14px',ic:'#38A169'},
        {name:'Minum vitamin',time:'08:00',done:true,reward:10,iw:'10px',ih:'14px',ic:'#2C7A7B'},
        {name:'Olahraga pagi',time:'09:00',done:true,reward:15,iw:'14px',ih:'10px',ic:'#553C9A'},
        {name:'Tidur siang',time:'13:00',done:false,reward:10,iw:'14px',ih:'8px',ic:'#2B6CB0'},
        {name:'Baca buku',time:'16:00',done:false,reward:20,iw:'12px',ih:'14px',ic:'#D69E2E'},
      ],
      tags:['Checklist','Alarm','Reward','Uang Saku','Progress','Child Mode']
    }
  }
}
</script>
