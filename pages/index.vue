<script setup>
import { ref, computed, reactive } from 'vue'

const page = ref('dash')
const sidebarOpen = ref(false)
const searchQuery = ref('')
const formSaved = ref(false)
const formError = ref('')
const selectedId = ref(null)

const form = reactive({
  alamat: '',
  nama_pemilik: '',
  kontak: '',
  status_hunian: '',
})

const { data: residentsRaw, refresh } = await useFetch('/api/penghuni')
const residents = computed(() => residentsRaw.value || [])

const todayDate = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

function statusLabel(s) {
  return { tempat_tinggal:'Tempat Tinggal', kontrak:'Kontrak', kost:'Kost', kosong:'Kosong' }[s] || s
}

function badge(status) {
  const map = {
    tempat_tinggal: { bg: '#d1fae5', color: '#065f46' },
    kontrak:        { bg: '#dbeafe', color: '#1e40af' },
    kost:           { bg: '#fef3c7', color: '#92400e' },
    kosong:         { bg: '#fee2e2', color: '#991b1b' },
  }
  return map[status] || { bg: '#f3f4f6', color: '#6b7280' }
}

function navBg(id)  { return page.value === id ? '#f0fdf4' : 'transparent' }
function navCol(id) { return page.value === id ? '#065f46' : '#6b7280' }
function navW(id)   { return page.value === id ? '600' : '400' }

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

const filtered = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return residents.value
  return residents.value.filter(r =>
    r.nama_pemilik.toLowerCase().includes(q) ||
    r.alamat.toLowerCase().includes(q)
  )
})

const selected = computed(() =>
  residents.value.find(r => r.id === selectedId.value) || residents.value[0]
)

const counts = computed(() => {
  const c = { tinggal: 0, kontrak: 0, kost: 0, kosong: 0 }
  residents.value.forEach(r => {
    if (r.status_hunian === 'tempat_tinggal') c.tinggal++
    else if (r.status_hunian === 'kontrak') c.kontrak++
    else if (r.status_hunian === 'kost') c.kost++
    else if (r.status_hunian === 'kosong') c.kosong++
  })
  return c
})

const total = computed(() => residents.value.length)
const pct = (n) => total.value ? Math.round(n / total.value * 100) : 0

const recentRows = computed(() =>
  residents.value.slice(0, 5).map(r => {
    const b = badge(r.status_hunian)
    return { ...r, no: r.id, badgeBg: b.bg, badgeColor: b.color }
  })
)

const filteredRows = computed(() =>
  filtered.value.map(r => {
    const b = badge(r.status_hunian)
    return { ...r, no: r.id, badgeBg: b.bg, badgeColor: b.color }
  })
)

function goDash()  { page.value = 'dash';  formSaved.value = false }
function goTabel() { page.value = 'tabel'; formSaved.value = false }
function goForm()  {
  page.value = 'form'; formSaved.value = false; formError.value = ''
  Object.assign(form, { alamat:'', nama_pemilik:'', kontak:'', status_hunian:'' })
}

function goDetail(id)      { page.value = 'detail';      selectedId.value = id }
function goMarketplace()  { page.value = 'marketplace'; formSaved.value = false }
function goPlugins()      { page.value = 'plugins';     formSaved.value = false }

const installedPlugins = ref([
  { id: 1, name: 'Laporan PDF',   desc: 'Export data warga ke PDF',            active: true,  icon: '📄' },
  { id: 2, name: 'Notifikasi WA', desc: 'Kirim notifikasi via WhatsApp',        active: false, icon: '💬' },
])

const marketplacePlugins = ref([
  { id: 10, name: 'Kartu Keluarga', desc: 'Manajemen data kartu keluarga warga',   installed: false, icon: '👨‍👩‍👧' },
  { id: 11, name: 'Iuran RT',       desc: 'Pencatatan dan tagihan iuran bulanan',  installed: false, icon: '💰' },
  { id: 12, name: 'Surat Menyurat', desc: 'Template surat keterangan domisili',    installed: true,  icon: '✉️'  },
  { id: 13, name: 'Keamanan RT',    desc: 'Jadwal piket dan laporan keamanan',     installed: false, icon: '🔒' },
  { id: 14, name: 'Pengaduan',      desc: 'Form pengaduan dan aspirasi warga',     installed: false, icon: '📢' },
  { id: 15, name: 'Data Aset',      desc: 'Inventarisasi aset milik RT',           installed: false, icon: '🏠' },
])

function togglePlugin(p)    { p.active = !p.active }
function installPlugin(p)   { p.installed = true }
function uninstallPlugin(p) { p.installed = false }

async function doSave() {
  if (!form.alamat.trim() || !form.nama_pemilik.trim()) {
    formError.value = 'Alamat dan nama pemilik wajib diisi!'
    return
  }
  if (!form.status_hunian) {
    formError.value = 'Status hunian wajib dipilih!'
    return
  }
  try {
    await $fetch('/api/penghuni', { method: 'POST', body: { ...form } })
    await refresh()
    page.value = 'tabel'; formSaved.value = true; formError.value = ''
  } catch (e) {
    formError.value = e?.data?.message || 'Gagal menyimpan data'
  }
}

async function doDelete(id) {
  if (!confirm('Hapus data ini?')) return
  await $fetch(`/api/penghuni/${id}`, { method: 'DELETE' })
  await refresh()
  if (page.value === 'detail') page.value = 'tabel'
}
</script>

<template>
  <div style="display:flex; min-height:100vh;">

    <!-- TOGGLE BUTTON -->
    <button @click="sidebarOpen = !sidebarOpen" :style="`position:fixed; top:14px; left:${sidebarOpen ? '210px' : '12px'}; z-index:102; width:36px; height:36px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; background:${sidebarOpen ? '#f0fdf4' : '#0d3d36'}; box-shadow:0 2px 8px rgba(0,0,0,.15); transition:left .25s ease, background .2s;`">
      <svg v-if="!sidebarOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065f46" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <!-- OVERLAY (mobile) -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" style="position:fixed; inset:0; background:rgba(0,0,0,.3); z-index:99;"></div>

    <!-- SIDEBAR TRIGGER STRIP (desktop hover) -->
    <div @mouseenter="sidebarOpen = true" style="position:fixed; top:0; left:0; width:8px; height:100vh; z-index:101;"></div>

    <!-- SIDEBAR -->
    <aside @mouseenter="sidebarOpen = true" @mouseleave="sidebarOpen = false" :style="`width:248px; min-width:248px; background:white; display:flex; flex-direction:column; min-height:100vh; position:fixed; top:0; left:0; bottom:0; z-index:100; border-right:1px solid #f0f0f0; transform:${sidebarOpen ? 'translateX(0)' : 'translateX(-248px)'}; transition:transform .25s ease; box-shadow:${sidebarOpen ? '4px 0 20px rgba(0,0,0,.08)' : 'none'};`">

      <!-- Logo -->
      <div style="padding:24px 20px 20px; border-bottom:1px solid #f5f5f5;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; background:#0d3d36; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z" fill="#22c55e"/></svg>
          </div>
          <div>
            <div style="font-size:15px; font-weight:700; color:#0d3d36; letter-spacing:-.3px;">WARGA</div>
            <div style="font-size:11px; color:#9ca3af;">RT 02 / RW 02</div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav style="flex:1; padding:16px 12px; display:flex; flex-direction:column; gap:1px;">
        <div style="padding:6px 10px 8px; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:1.2px; text-transform:uppercase;">UMUM</div>

        <button @click="goDash" :style="`display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:${navW('dash')}; text-align:left; width:100%; background:${navBg('dash')}; color:${navCol('dash')}; transition:all .15s;`">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          Dashboard
        </button>

        <button @click="goTabel" :style="`display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:${navW('tabel')}; text-align:left; width:100%; background:${navBg('tabel')}; color:${navCol('tabel')}; transition:all .15s;`">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Data Warga
        </button>

        <button @click="goForm" :style="`display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:${navW('form')}; text-align:left; width:100%; background:${navBg('form')}; color:${navCol('form')}; transition:all .15s;`">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Tambah Data
        </button>

        <div style="padding:14px 10px 8px; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:1.2px; text-transform:uppercase; margin-top:4px;">PLUGIN</div>

        <button @click="goMarketplace" :style="`display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:${navW('marketplace')}; text-align:left; width:100%; background:${navBg('marketplace')}; color:${navCol('marketplace')}; transition:all .15s;`">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Marketplace
        </button>

        <button @click="goPlugins" :style="`display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:${navW('plugins')}; text-align:left; width:100%; background:${navBg('plugins')}; color:${navCol('plugins')}; transition:all .15s;`">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
          Kelola Plugin
        </button>

        <div style="padding:14px 10px 8px; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:1.2px; text-transform:uppercase; margin-top:4px;">SISTEM</div>

        <button style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:400; background:transparent; color:#6b7280; text-align:left; width:100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93a10 10 0 0 0 14.14 14.14"/></svg>
          Pengaturan
        </button>

        <button style="display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; border:none; cursor:pointer; font-size:13px; font-weight:400; background:transparent; color:#6b7280; text-align:left; width:100%;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Bantuan
        </button>
      </nav>

      <!-- User -->
      <div style="padding:14px 16px 20px; border-top:1px solid #f5f5f5;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; background:#0d3d36; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <span style="font-size:13px; font-weight:600; color:white;">A</span>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:13px; font-weight:600; color:#111827;">Admin RT 02</div>
            <div style="font-size:11px; color:#9ca3af;">admin@rt02.id</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <main :style="`flex:1; margin-left:${sidebarOpen ? '248px' : '0'}; min-height:100vh; display:flex; flex-direction:column; transition:margin-left .25s ease;`">

      <!-- TOP BAR -->
      <header style="background:white; border-bottom:1px solid #f0f0f0; padding:0 28px; height:58px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50;">
        <div :style="`position:relative; flex:1; max-width:320px; transition:margin-left .25s ease; margin-left:${sidebarOpen ? '0' : '44px'};`">
          <svg style="position:absolute;left:11px;top:50%;transform:translateY(-50%);" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Cari nama atau alamat…" v-model="searchQuery" style="width:100%; padding:7px 12px 7px 32px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:13px; color:#111827; outline:none; background:#fafafa;">
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex; align-items:center; gap:6px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:6px 12px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style="font-size:12px; color:#6b7280; font-weight:500;">{{ todayDate }}</span>
          </div>
        </div>
      </header>

      <!-- DASHBOARD -->
      <div v-if="page === 'dash'" style="padding:24px 28px; animation:fadeUp .35s ease;">

        <!-- Hero Card -->
        <div style="background:#0d3d36; border-radius:16px; padding:28px 32px; margin-bottom:20px; position:relative; overflow:hidden;">
          <div style="position:absolute;right:-40px;top:-60px;width:220px;height:220px;border-radius:50%;border:40px solid rgba(255,255,255,.04);pointer-events:none;"></div>
          <div style="position:absolute;right:60px;top:-100px;width:280px;height:280px;border-radius:50%;border:40px solid rgba(255,255,255,.03);pointer-events:none;"></div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="font-size:12px; font-weight:500; color:rgba(255,255,255,.55); letter-spacing:.5px; text-transform:uppercase; margin-bottom:10px;">TOTAL DATA TERDAFTAR</div>
              <div style="display:flex; align-items:baseline; gap:14px;">
                <span style="font-size:48px; font-weight:800; color:white; letter-spacing:-2px; line-height:1;">{{ total }}</span>
                <span style="font-size:14px; font-weight:600; color:#22c55e; display:flex; align-items:center; gap:4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                  Aktif
                </span>
              </div>
              <div style="font-size:13px; color:rgba(255,255,255,.45); margin-top:8px;">RT 02 RW 02 — Data per {{ todayDate }}</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button @click="goForm" style="display:flex; align-items:center; gap:6px; background:#22c55e; color:white; border:none; border-radius:8px; padding:9px 16px; font-size:13px; font-weight:600; cursor:pointer;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Tambah
              </button>
              <button @click="goTabel" style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); color:white; border:1px solid rgba(255,255,255,.15); border-radius:8px; padding:9px 16px; font-size:13px; font-weight:500; cursor:pointer;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Lihat Data
              </button>
            </div>
          </div>
        </div>

        <!-- 4 Stat Cards -->
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px;">
          <div style="background:white; border-radius:12px; padding:20px; border:1px solid #f0f0f0;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:12px; font-weight:500; color:#6b7280;">Tempat Tinggal</span>
              <div style="width:32px; height:32px; background:#0d3d36; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
            </div>
            <div style="font-size:30px; font-weight:800; color:#0d3d36; letter-spacing:-1px;">{{ counts.tinggal }}</div>
            <div style="font-size:12px; color:#22c55e; margin-top:6px; font-weight:500;">{{ pct(counts.tinggal) }}% dari total</div>
          </div>
          <div style="background:white; border-radius:12px; padding:20px; border:1px solid #f0f0f0;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:12px; font-weight:500; color:#6b7280;">Kontrak</span>
              <div style="width:32px; height:32px; background:#ecfdf5; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
            </div>
            <div style="font-size:30px; font-weight:800; color:#111827; letter-spacing:-1px;">{{ counts.kontrak }}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:6px; font-weight:500;">{{ pct(counts.kontrak) }}% dari total</div>
          </div>
          <div style="background:white; border-radius:12px; padding:20px; border:1px solid #f0f0f0;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:12px; font-weight:500; color:#6b7280;">Kost</span>
              <div style="width:32px; height:32px; background:#fffbeb; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M1 3h15v13H1z"/><path d="M16 8l6-2v13l-6-2V8z"/></svg>
              </div>
            </div>
            <div style="font-size:30px; font-weight:800; color:#111827; letter-spacing:-1px;">{{ counts.kost }}</div>
            <div style="font-size:12px; color:#6b7280; margin-top:6px; font-weight:500;">{{ pct(counts.kost) }}% dari total</div>
          </div>
          <div style="background:white; border-radius:12px; padding:20px; border:1px solid #f0f0f0;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-size:12px; font-weight:500; color:#6b7280;">Kosong</span>
              <div style="width:32px; height:32px; background:#fef2f2; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
            </div>
            <div style="font-size:30px; font-weight:800; color:#111827; letter-spacing:-1px;">{{ counts.kosong }}</div>
            <div style="font-size:12px; color:#dc2626; margin-top:6px; font-weight:500;">{{ pct(counts.kosong) }}% dari total</div>
          </div>
        </div>

        <!-- Bottom Row -->
        <div style="display:grid; grid-template-columns:1fr 300px; gap:16px;">

          <!-- Recent Activity -->
          <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; overflow:hidden;">
            <div style="padding:18px 20px 14px; display:flex; align-items:center; justify-content:space-between;">
              <div style="display:flex; align-items:center; gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style="font-size:14px; font-weight:600; color:#111827;">Data Terbaru</span>
              </div>
              <button @click="goTabel" style="font-size:12px; color:#22c55e; background:none; border:none; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:4px;">
                Lihat semua
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="border-top:1px solid #f5f5f5;">
                  <th style="padding:9px 20px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase; background:#fafafa;">NO</th>
                  <th style="padding:9px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase; background:#fafafa;">PEMILIK</th>
                  <th style="padding:9px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase; background:#fafafa;">STATUS</th>
                  <th style="padding:9px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase; background:#fafafa;">DIPERBARUI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in recentRows" :key="row.id" style="border-top:1px solid #f9f9f9;" class="hover-row">
                  <td style="padding:13px 20px; font-size:13px; font-weight:600; color:#9ca3af; text-align:center;">{{ row.no }}</td>
                  <td style="padding:13px 16px; font-size:13px; color:#374151;">{{ row.nama_pemilik }}</td>
                  <td style="padding:13px 16px;">
                    <span :style="`font-size:11px; font-weight:600; padding:3px 9px; border-radius:99px; background:${row.badgeBg}; color:${row.badgeColor};`">{{ statusLabel(row.status_hunian) }}</span>
                  </td>
                  <td style="padding:13px 16px; font-size:12px; color:#9ca3af;">{{ formatDate(row.updated_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Distribusi Card -->
          <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; padding:20px; display:flex; flex-direction:column; gap:14px;">
            <div style="font-size:14px; font-weight:600; color:#111827;">Distribusi Hunian</div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
                <span style="font-size:12px; color:#6b7280;">Tempat Tinggal</span>
                <span style="font-size:12px; font-weight:700; color:#0d3d36;">{{ counts.tinggal }}</span>
              </div>
              <div style="background:#f3f4f6; border-radius:99px; height:6px; overflow:hidden;">
                <div :style="`background:#0d3d36; height:6px; border-radius:99px; width:${pct(counts.tinggal)}%;`"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
                <span style="font-size:12px; color:#6b7280;">Kontrak</span>
                <span style="font-size:12px; font-weight:700; color:#111827;">{{ counts.kontrak }}</span>
              </div>
              <div style="background:#f3f4f6; border-radius:99px; height:6px; overflow:hidden;">
                <div :style="`background:#22c55e; height:6px; border-radius:99px; width:${pct(counts.kontrak)}%;`"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
                <span style="font-size:12px; color:#6b7280;">Kost</span>
                <span style="font-size:12px; font-weight:700; color:#111827;">{{ counts.kost }}</span>
              </div>
              <div style="background:#f3f4f6; border-radius:99px; height:6px; overflow:hidden;">
                <div :style="`background:#d97706; height:6px; border-radius:99px; width:${pct(counts.kost)}%;`"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; margin-bottom:7px;">
                <span style="font-size:12px; color:#6b7280;">Kosong</span>
                <span style="font-size:12px; font-weight:700; color:#111827;">{{ counts.kosong }}</span>
              </div>
              <div style="background:#f3f4f6; border-radius:99px; height:6px; overflow:hidden;">
                <div :style="`background:#ef4444; height:6px; border-radius:99px; width:${pct(counts.kosong)}%;`"></div>
              </div>
            </div>
            <div style="margin-top:auto; padding-top:12px; border-top:1px solid #f5f5f5;">
              <p style="font-size:11px; color:#9ca3af;">Data diperbarui: {{ todayDate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- TABEL DATA WARGA -->
      <div v-if="page === 'tabel'" style="padding:24px 28px; animation:fadeUp .35s ease;">
        <div v-if="formSaved" style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:13px 20px; margin-bottom:18px; display:flex; align-items:center; gap:10px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span style="font-size:13px; font-weight:600; color:#065f46;">Data berhasil disimpan!</span>
        </div>
        <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; overflow:hidden;">
          <div style="padding:18px 20px; border-bottom:1px solid #f5f5f5; display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div>
              <span style="font-size:14px; font-weight:600; color:#111827;">Daftar Data Warga</span>
              <span style="font-size:12px; color:#9ca3af; margin-left:8px; background:#f3f4f6; padding:2px 8px; border-radius:99px;">{{ filtered.length }} data</span>
            </div>
            <button @click="goForm" style="background:#0d3d36; color:white; border:none; border-radius:8px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah Data
            </button>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; min-width:600px;">
              <thead>
                <tr style="background:#fafafa; border-bottom:1px solid #f0f0f0;">
                  <th style="padding:10px 20px; text-align:center; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase; width:50px;">NO</th>
                  <th style="padding:10px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase;">PEMILIK</th>
                  <th style="padding:10px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase;">KONTAK</th>
                  <th style="padding:10px 16px; text-align:left; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase;">STATUS HUNIAN</th>
                  <th style="padding:10px 16px; text-align:center; font-size:10px; font-weight:600; color:#9ca3af; letter-spacing:.8px; text-transform:uppercase;">AKSI</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="res in filteredRows" :key="res.id" style="border-bottom:1px solid #f9f9f9; cursor:pointer;" class="hover-row" @click="goDetail(res.id)">
                  <td style="padding:13px 20px; font-size:13px; font-weight:600; color:#9ca3af; text-align:center;">{{ res.no }}</td>
                  <td style="padding:13px 16px;">
                    <div style="font-size:13px; font-weight:600; color:#111827;">{{ res.nama_pemilik }}</div>
                    <div style="font-size:11px; color:#9ca3af; margin-top:1px;">{{ res.alamat }}</div>
                  </td>
                  <td style="padding:13px 16px; font-size:13px; color:#6b7280;">{{ res.kontak || '—' }}</td>
                  <td style="padding:13px 16px;">
                    <span :style="`font-size:11px; font-weight:600; padding:4px 10px; border-radius:99px; background:${res.badgeBg}; color:${res.badgeColor};`">{{ statusLabel(res.status_hunian) }}</span>
                  </td>
                  <td style="padding:13px 16px; text-align:center;" @click.stop>
                    <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
                      <button @click="goDetail(res.id)" style="background:#ecfdf5; color:#059669; border:none; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:600; cursor:pointer;">Detail</button>
                      <button @click="doDelete(res.id)" style="background:#fef2f2; color:#dc2626; border:none; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:600; cursor:pointer;">Hapus</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="filtered.length === 0" style="padding:56px 20px; text-align:center; color:#9ca3af;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" style="margin:0 auto 12px; display:block;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p style="font-size:14px; font-weight:500; color:#6b7280;">Tidak ada data ditemukan</p>
            <p style="font-size:13px; margin-top:4px;">Coba ubah kata kunci pencarian</p>
          </div>
        </div>
      </div>

      <!-- FORM INPUT -->
      <div v-if="page === 'form'" style="padding:24px 28px; max-width:860px; animation:fadeUp .35s ease;">
        <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; overflow:hidden;">
          <div style="padding:20px 24px; border-bottom:1px solid #f5f5f5;">
            <h2 style="font-size:15px; font-weight:700; color:#111827;">Form Pemutakhiran Data Kependudukan</h2>
            <p style="font-size:12px; color:#9ca3af; margin-top:3px;">RT 02 / RW 02 — Lengkapi semua kolom yang tersedia</p>
          </div>

          <div style="padding:24px; display:flex; flex-direction:column; gap:24px;">

            <!-- 1. Identitas -->
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                <div style="width:22px; height:22px; background:#0d3d36; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span style="font-size:10px; font-weight:700; color:white;">1</span>
                </div>
                <span style="font-size:13px; font-weight:600; color:#111827;">Identitas</span>
              </div>
              <div>
                <label style="display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px;">Alamat Lengkap</label>
                <input type="text" placeholder="Cth: Jl. Mawar No. 5, RT 02 RW 02" v-model="form.alamat" style="width:100%; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 12px; font-size:14px; color:#111827; outline:none;">
              </div>
            </div>

            <!-- 2. Data Pemilik -->
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                <div style="width:22px; height:22px; background:#0d3d36; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span style="font-size:10px; font-weight:700; color:white;">2</span>
                </div>
                <span style="font-size:13px; font-weight:600; color:#111827;">Data Pemilik</span>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div>
                  <label style="display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px;">Nama Pemilik</label>
                  <input type="text" placeholder="Nama lengkap pemilik" v-model="form.nama_pemilik" style="width:100%; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 12px; font-size:14px; color:#111827; outline:none;">
                </div>
                <div>
                  <label style="display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px;">No. Kontak / WA</label>
                  <input type="text" placeholder="08xxxxxxxxxx" v-model="form.kontak" style="width:100%; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 12px; font-size:14px; color:#111827; outline:none;">
                </div>
              </div>
            </div>

            <!-- 3. Status Hunian -->
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                <div style="width:22px; height:22px; background:#0d3d36; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <span style="font-size:10px; font-weight:700; color:white;">3</span>
                </div>
                <span style="font-size:13px; font-weight:600; color:#111827;">Status Hunian</span>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div>
                  <label style="display:block; font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px;">Status Hunian</label>
                  <select v-model="form.status_hunian" style="width:100%; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 12px; font-size:14px; color:#111827; outline:none; background:white;">
                    <option value="">-- Pilih status --</option>
                    <option value="tempat_tinggal">Tempat Tinggal</option>
                    <option value="kontrak">Kontrak</option>
                    <option value="kost">Kost</option>
                    <option value="kosong">Kosong</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex; align-items:center; gap:10px; padding-top:8px; border-top:1px solid #f5f5f5;">
              <button @click="doSave" style="background:#0d3d36; color:white; border:none; border-radius:8px; padding:10px 24px; font-size:14px; font-weight:600; cursor:pointer;">Simpan Data</button>
              <button @click="goTabel" style="background:#f3f4f6; color:#6b7280; border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:500; cursor:pointer;">Batal</button>
              <span v-if="formError" style="font-size:12px; color:#ef4444; font-weight:500;">{{ formError }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- DETAIL DATA -->
      <div v-if="page === 'detail' && selected" style="padding:24px 28px; max-width:860px; animation:fadeUp .35s ease;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
          <button @click="goTabel" style="display:flex; align-items:center; gap:6px; background:white; color:#6b7280; border:1px solid #e5e7eb; border-radius:8px; padding:7px 12px; font-size:13px; font-weight:500; cursor:pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Kembali
          </button>
        </div>

        <div style="background:#0d3d36; border-radius:12px; padding:24px 28px; margin-bottom:16px; position:relative; overflow:hidden;">
          <div style="position:absolute;right:-20px;top:-40px;width:160px;height:160px;border-radius:50%;border:30px solid rgba(255,255,255,.04);pointer-events:none;"></div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:48px; height:48px; background:rgba(255,255,255,.12); border-radius:10px; display:flex; align-items:center; justify-content:center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div>
                <div style="color:white; font-size:20px; font-weight:800; letter-spacing:-.5px;">{{ selected.nama_pemilik }}</div>
                <div style="color:rgba(255,255,255,.55); font-size:13px; margin-top:2px;">{{ selected.alamat }}</div>
              </div>
            </div>
            <span :style="`font-size:12px; font-weight:600; padding:5px 14px; border-radius:99px; background:${badge(selected.status_hunian).bg}; color:${badge(selected.status_hunian).color};`">{{ statusLabel(selected.status_hunian) }}</span>
          </div>
        </div>

        <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; padding:24px; margin-bottom:14px;">
          <div style="font-size:13px; font-weight:600; color:#111827; margin-bottom:18px;">Informasi Detail</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div>
              <div style="font-size:10px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px;">Pemilik</div>
              <div style="font-size:14px; font-weight:600; color:#111827;">{{ selected.nama_pemilik }}</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px;">Kontak</div>
              <div style="font-size:14px; color:#374151;">{{ selected.kontak || '—' }}</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px;">RT / RW</div>
              <div style="font-size:14px; color:#374151;">RT {{ selected.rt }} / RW {{ selected.rw }}</div>
            </div>
            <div>
              <div style="font-size:10px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px;">Diperbarui</div>
              <div style="font-size:14px; color:#374151;">{{ formatDate(selected.updated_at) }}</div>
            </div>
          </div>
        </div>

        <div style="display:flex; gap:10px;">
          <button @click="doDelete(selected.id)" style="background:#fef2f2; color:#dc2626; border:none; border-radius:8px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer;">Hapus Data</button>
        </div>
      </div>

      <!-- MARKETPLACE -->
      <div v-if="page === 'marketplace'" style="padding:24px 28px; animation:fadeUp .35s ease;">
        <div style="margin-bottom:20px;">
          <h2 style="font-size:18px; font-weight:700; color:#111827; margin-bottom:4px;">Marketplace Plugin</h2>
          <p style="font-size:13px; color:#9ca3af;">Tambah fitur baru untuk sistem RT 02</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px;">
          <div v-for="p in marketplacePlugins" :key="p.id" style="background:white; border-radius:12px; border:1px solid #f0f0f0; padding:20px; display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; align-items:flex-start; justify-content:space-between;">
              <div style="width:44px; height:44px; background:#f3f4f6; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:22px;">{{ p.icon }}</div>
              <span v-if="p.installed" style="font-size:10px; font-weight:600; background:#d1fae5; color:#065f46; padding:3px 8px; border-radius:99px;">Terpasang</span>
            </div>
            <div>
              <div style="font-size:14px; font-weight:700; color:#111827;">{{ p.name }}</div>
              <div style="font-size:12px; color:#9ca3af; margin-top:3px;">{{ p.desc }}</div>
            </div>
            <div style="margin-top:auto;">
              <button v-if="!p.installed" @click="installPlugin(p)" style="width:100%; background:#0d3d36; color:white; border:none; border-radius:8px; padding:8px 0; font-size:13px; font-weight:600; cursor:pointer;">
                Install
              </button>
              <button v-else @click="() => { uninstallPlugin(p); goPlugins() }" style="width:100%; background:#f3f4f6; color:#6b7280; border:none; border-radius:8px; padding:8px 0; font-size:13px; font-weight:500; cursor:pointer;">
                Kelola
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- KELOLA PLUGIN -->
      <div v-if="page === 'plugins'" style="padding:24px 28px; animation:fadeUp .35s ease;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
          <div>
            <h2 style="font-size:18px; font-weight:700; color:#111827; margin-bottom:4px;">Kelola Plugin</h2>
            <p style="font-size:13px; color:#9ca3af;">Plugin yang terpasang di sistem RT 02</p>
          </div>
          <button @click="goMarketplace" style="display:flex; align-items:center; gap:6px; background:#0d3d36; color:white; border:none; border-radius:8px; padding:9px 16px; font-size:13px; font-weight:600; cursor:pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Plugin
          </button>
        </div>

        <div style="background:white; border-radius:12px; border:1px solid #f0f0f0; overflow:hidden;">
          <div v-for="(p, i) in installedPlugins" :key="p.id" :style="`padding:16px 20px; display:flex; align-items:center; gap:14px; ${i > 0 ? 'border-top:1px solid #f5f5f5;' : ''}`">
            <div style="width:40px; height:40px; background:#f3f4f6; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">{{ p.icon }}</div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px; font-weight:600; color:#111827;">{{ p.name }}</div>
              <div style="font-size:12px; color:#9ca3af; margin-top:2px;">{{ p.desc }}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span :style="`font-size:11px; font-weight:600; padding:3px 10px; border-radius:99px; ${p.active ? 'background:#d1fae5; color:#065f46;' : 'background:#f3f4f6; color:#9ca3af;'}`">
                {{ p.active ? 'Aktif' : 'Nonaktif' }}
              </span>
              <button @click="togglePlugin(p)" :style="`border:none; border-radius:7px; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; ${p.active ? 'background:#fef2f2; color:#dc2626;' : 'background:#ecfdf5; color:#059669;'}`">
                {{ p.active ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>
            </div>
          </div>

          <div v-if="installedPlugins.length === 0" style="padding:48px 20px; text-align:center; color:#9ca3af;">
            <div style="font-size:32px; margin-bottom:10px;">🔌</div>
            <p style="font-size:14px; font-weight:500; color:#6b7280;">Belum ada plugin terpasang</p>
            <button @click="goMarketplace" style="margin-top:14px; background:#0d3d36; color:white; border:none; border-radius:8px; padding:9px 20px; font-size:13px; font-weight:600; cursor:pointer;">Buka Marketplace</button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.hover-row:hover { background: #fafafa; }
</style>
