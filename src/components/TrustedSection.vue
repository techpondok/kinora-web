<template>
  <section style="padding:64px 20px;background:white;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border);">
    <div style="max-width:1000px;margin:0 auto;">
      <p style="text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--color-muted);margin:0 0 40px;">Dirancang untuk semua anggota keluarga</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:40px;">
        <div v-for="role in roles" :key="role.label" class="card" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 16px;text-align:center;">
          <!-- Icon shape -->
          <div style="width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;" :style="`background:${role.bg};`">
            <svg :width="role.sw" :height="role.sh" viewBox="0 0 24 24" fill="none">
              <component :is="'path'" v-if="role.path" :d="role.path" :fill="role.fill" />
              <component :is="'circle'" v-if="role.cx" :cx="role.cx" :cy="role.cy" :r="role.cr" :fill="role.fill" />
            </svg>
            <div v-if="!role.path && !role.cx" :style="`width:${role.iw};height:${role.ih};border-radius:${role.ir};background:${role.ic};`"></div>
          </div>
          <p style="font-weight:600;font-size:13px;color:var(--color-text);margin:0;">{{ role.label }}</p>
          <p style="font-size:11px;color:var(--color-muted);line-height:1.5;margin:0;">{{ role.desc }}</p>
        </div>
      </div>
      <div style="max-width:520px;margin:0 auto;text-align:center;">
        <p style="color:var(--color-muted);line-height:1.75;font-size:0.95rem;margin:0;">
          Kinora membantu keluarga tetap terhubung <strong style="color:var(--color-primary);">tanpa berpindah aplikasi</strong> untuk keuangan, pengingat, parenting, dan aktivitas harian.
        </p>
      </div>
    </div>
  </section>
</template>
<script>
export default {
  name: 'TrustedSection',
  data() {
    return {
      roles: [
        { label:'Orang Tua', desc:'Pantau semua dalam genggaman', bg:'#EBF8FF', ic:'#2B6CB0', iw:'22px', ih:'22px', ir:'50% 50% 6px 6px' },
        { label:'Anak', desc:'Rutinitas sederhana & menyenangkan', bg:'#FFFFF0', ic:'#D69E2E', iw:'18px', ih:'24px', ir:'50% 50% 4px 4px' },
        { label:'Guardian', desc:'Tetap terhubung dari jauh', bg:'#FAF5FF', ic:'#553C9A', iw:'22px', ih:'22px', ir:'4px' },
        { label:'Keluarga Kecil', desc:'Mulai dari hal kecil bersama', bg:'#E6FFFA', ic:'#2C7A7B', iw:'24px', ih:'20px', ir:'6px 6px 10px 10px' },
        { label:'Keluarga Berkembang', desc:'Tumbuh bersama fitur lengkap', bg:'#FFF5F5', ic:'#E53E3E', iw:'20px', ih:'20px', ir:'50%' },
      ]
    }
  }
}
</script>
