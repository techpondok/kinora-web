<template>
  <section style="padding:80px 20px;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;pointer-events:none;"><div style="position:absolute;bottom:0;left:0;width:320px;height:320px;border-radius:50%;opacity:0.1;background:radial-gradient(circle,#B2F5EA,transparent 70%);"></div></div>
    <div style="max-width:1100px;margin:0 auto;position:relative;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:56px;justify-content:center;">
        <!-- Left content -->
        <div style="flex:1;min-width:280px;max-width:460px;">
          <div class="section-badge" style="margin-bottom:16px;">
            <div style="width:10px;height:10px;border-radius:2px;background:#2C7A7B;"></div>
            Finance &amp; Household
          </div>
          <h2 style="font-size:clamp(1.6rem,4vw,2.4rem);font-weight:700;line-height:1.2;color:var(--color-text);margin:0 0 16px;">Keuangan keluarga<br>tanpa rumit</h2>
          <p style="color:var(--color-muted);line-height:1.7;margin:0 0 28px;">Dari dompet digital hingga dana darurat — semua terkelola dalam satu dasbor yang mudah dipahami.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div v-for="f in features" :key="f.name" class="card" style="padding:16px;">
              <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px;" :style="`background:${f.bg};`">
                <div :style="`width:${f.iw};height:${f.ih};border-radius:${f.ir};background:${f.ic};`"></div>
              </div>
              <p style="font-weight:600;font-size:12px;color:var(--color-text);margin:0 0 4px;">{{ f.name }}</p>
              <p style="font-size:11px;color:var(--color-muted);line-height:1.4;margin:0;">{{ f.desc }}</p>
            </div>
          </div>
        </div>
        <!-- Right phone -->
        <div style="flex-shrink:0;">
          <div class="phone-mockup" style="width:230px;min-height:500px;">
            <div style="padding:28px 14px 16px;">
              <!-- Balance card -->
              <div style="border-radius:18px;padding:16px;margin-bottom:14px;color:white;background:linear-gradient(135deg,#2B6CB0,#2C7A7B);">
                <p style="font-size:10px;opacity:0.8;margin:0 0 4px;">Total Saldo Keluarga</p>
                <p style="font-size:22px;font-weight:700;font-family:var(--font-display);margin:0 0 10px;">Rp 12.450.000</p>
                <div style="display:flex;gap:14px;font-size:10px;opacity:0.8;">
                  <span>Masuk: Rp 8.2jt</span>
                  <span>Keluar: Rp 3.4jt</span>
                </div>
              </div>
              <!-- Summary -->
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px;">
                <div v-for="s in summary" :key="s.label" style="border-radius:10px;padding:8px;text-align:center;" :style="`background:${s.bg};`">
                  <p style="font-size:11px;font-weight:700;margin:0 0 2px;" :style="`color:${s.color};`">{{ s.value }}</p>
                  <p style="font-size:9px;color:var(--color-muted);margin:0;">{{ s.label }}</p>
                </div>
              </div>
              <p style="font-size:11px;font-weight:600;color:var(--color-text);margin:0 0 8px;">Transaksi Terbaru</p>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <div v-for="tx in transactions" :key="tx.name" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--color-sky);">
                  <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:white;">
                    <div style="border-radius:3px;" :style="`width:${tx.iw};height:${tx.ih};background:${tx.ic};`"></div>
                  </div>
                  <div style="flex:1;">
                    <p style="font-size:11px;font-weight:500;color:var(--color-text);margin:0;">{{ tx.name }}</p>
                    <p style="font-size:9px;color:var(--color-muted);margin:0;">{{ tx.date }}</p>
                  </div>
                  <p style="font-size:11px;font-weight:700;margin:0;" :style="`color:${tx.out?'#E53E3E':'#38A169'};`">{{ tx.amount }}</p>
                </div>
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
  name: 'FinanceSection',
  data() {
    return {
      features: [
        {name:'Multi Wallet',desc:'Beberapa dompet dalam satu akun',bg:'#E6FFFA',ic:'#2C7A7B',iw:'16px',ih:'12px',ir:'2px'},
        {name:'Savings Goal',desc:'Nabung bareng untuk target',bg:'#EBF8FF',ic:'#2B6CB0',iw:'16px',ih:'16px',ir:'50%'},
        {name:'OCR Struk',desc:'Scan struk belanja otomatis',bg:'#FAF5FF',ic:'#553C9A',iw:'12px',ih:'16px',ir:'2px'},
        {name:'Emergency Fund',desc:'Dana darurat terpantau',bg:'#FFF5F5',ic:'#E53E3E',iw:'16px',ih:'16px',ir:'4px'},
        {name:'Shopping List',desc:'Daftar belanja bersama',bg:'#FFFFF0',ic:'#D69E2E',iw:'14px',ih:'18px',ir:'2px'},
        {name:'Expense Tracking',desc:'Analisis pengeluaran bulanan',bg:'#F0FFF4',ic:'#38A169',iw:'18px',ih:'12px',ir:'2px'},
      ],
      summary: [
        {label:'Tabungan',value:'Rp4.5jt',bg:'#E6FFFA',color:'#2C7A7B'},
        {label:'Goal',value:'72%',bg:'#EBF8FF',color:'#2B6CB0'},
        {label:'Darurat',value:'Rp2jt',bg:'#FFF5F5',color:'#C53030'},
      ],
      transactions: [
        {name:'Belanja Indomaret',date:'Hari ini 10:20',amount:'-Rp 125k',out:true,iw:'12px',ih:'12px',ic:'#D69E2E'},
        {name:'Transfer masuk',date:'Kemarin 14:00',amount:'+Rp 500k',out:false,iw:'14px',ih:'10px',ic:'#2B6CB0'},
        {name:'Tagihan Listrik',date:'2 hari lalu',amount:'-Rp 350k',out:true,iw:'10px',ih:'14px',ic:'#E53E3E'},
        {name:'Tabungan Goal',date:'3 hari lalu',amount:'+Rp 250k',out:false,iw:'12px',ih:'12px',ic:'#2C7A7B'},
      ]
    }
  }
}
</script>
