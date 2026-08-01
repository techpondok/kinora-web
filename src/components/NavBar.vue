<template>
  <nav class="sticky top-0 z-50" style="background: rgba(247,251,255,0.9); backdrop-filter: blur(16px); border-bottom: 1px solid var(--color-border);">
    <div style="max-width:1100px; margin:0 auto; padding:0 20px; display:flex; align-items:center; justify-content:space-between; height:64px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#2B6CB0,#2C7A7B);display:flex;align-items:center;justify-content:center;">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" fill="white" opacity="0.9"/>
            <path d="M2 13c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="white" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
          </svg>
        </div>
        <span style="font-family:var(--font-display);font-weight:700;font-size:1.15rem;color:var(--color-text);">kinora</span>
      </div>
      <div class="hidden md:flex" style="gap:28px;">
        <a v-for="item in navItems" :key="item" href="#" style="font-size:0.875rem;font-weight:500;color:var(--color-muted);text-decoration:none;transition:color 0.15s;" @mouseover="e=>e.target.style.color='#2B6CB0'" @mouseleave="e=>e.target.style.color='var(--color-muted)'">{{ item }}</a>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <!-- Logged in: show profile -->
        <template v-if="user">
          <div style="position:relative;">
            <button
              class="hidden md:flex"
              style="display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:8px;border:1px solid var(--color-border);background:white;cursor:pointer;font-size:0.875rem;font-weight:500;color:var(--color-text);"
              @click="showDropdown = !showDropdown"
            >
              <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#2B6CB0,#2C7A7B);display:flex;align-items:center;justify-content:center;color:white;font-size:0.75rem;font-weight:600;">
                {{ userInitial }}
              </div>
              <span>{{ displayName }}</span>
            </button>
            <!-- Dropdown -->
            <div v-if="showDropdown" style="position:absolute;top:48px;right:0;min-width:180px;background:white;border:1px solid var(--color-border);border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.08);padding:6px 0;z-index:100;">
              <router-link to="/portal" style="display:block;padding:10px 16px;font-size:0.85rem;color:var(--color-text);text-decoration:none;" @click="showDropdown=false">Portal Saya</router-link>
              <button @click="handleSignOut" style="display:block;width:100%;text-align:left;padding:10px 16px;font-size:0.85rem;color:#e53e3e;border:none;background:none;cursor:pointer;">Keluar</button>
            </div>
          </div>
        </template>
        <!-- Not logged in: show Masuk -->
        <template v-else>
          <router-link to="/login" class="hidden md:block btn-outline" style="padding:8px 20px;font-size:0.875rem;text-decoration:none;">Masuk</router-link>
          <router-link to="/register" class="btn-primary" style="padding:10px 20px;font-size:0.875rem;text-decoration:none;">Mulai Gratis</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import { useRouter } from 'vue-router'

const { user, signOut } = useAuth()
const router = useRouter()
const showDropdown = ref(false)

const navItems = ['Family OS','Parenting','Finance','Health','Safety','Harga']

const displayName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.full_name || user.value.email?.split('@')[0] || 'User'
})

const userInitial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
})

async function handleSignOut() {
  showDropdown.value = false
  await signOut()
  router.push({ name: 'Home' })
}
</script>
