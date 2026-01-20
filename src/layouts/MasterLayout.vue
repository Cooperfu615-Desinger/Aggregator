<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NLayoutFooter,
  NMenu, NButton, NTag, NDrawer, NDrawerContent, NIcon
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { ExitToAppOutlined } from '@vicons/material'
import { useAuthStore } from '../stores/auth'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { useI18n } from 'vue-i18n'
import { masterMenuOptions } from '../config/menu-master'

const router = useRouter()
const currentRoute = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// State
const collapsed = ref(false)
const showMobileMenu = ref(false)

// Mobile Detection
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const isDesktop = breakpoints.greaterOrEqual('md')

// Watch mobile state to auto-collapse/expand
// usage: v-if="isDesktop" on sider


// Menu Options from config
const menuOptions = computed<MenuOption[]>(() => masterMenuOptions(t))

// Active Key Logic
const activeKey = computed(() => currentRoute.name as string)

const handleLogout = () => {
    authStore.logout()
    router.push('/login')
}

const handleVersionClick = () => {
    window.alert('Master Admin Console v0.1.0')
}
</script>

<template>
  <n-layout has-sider class="h-screen">
    <!-- Dark Theme Sider for Master Admin -->
    <n-layout-sider
      v-if="isDesktop"
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger="bar"
      @collapse="collapsed = true"
      @expand="collapsed = false"
      :inverted="true"
    >
        <div class="h-16 flex items-center justify-center overflow-hidden whitespace-nowrap border-b border-gray-700">
           <span v-if="!collapsed" class="text-xl font-bold text-white tracking-widest pl-4">
             {{ t('layout.masterAdmin') }}
           </span>
           <span v-else class="text-xl font-bold text-white">👑</span>
        </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        :inverted="true"
      />
    </n-layout-sider>

    <!-- Mobile Drawer -->
    <n-drawer v-model:show="showMobileMenu" :width="240" placement="left" style="background-color: #001428;">
        <n-drawer-content body-content-style="padding: 0;">
            <div class="h-16 flex items-center justify-center border-b border-gray-700">
                <span class="text-xl font-bold text-white tracking-widest">{{ t('layout.masterAdmin') }}</span>
            </div>
            <n-menu
                :options="menuOptions"
                :value="activeKey"
                :inverted="true"
                @update:value="showMobileMenu = false"
            />
        </n-drawer-content>
    </n-drawer>

    <n-layout>
      <n-layout-header bordered class="h-16 flex items-center justify-between px-6 bg-[#18181c]">
         <div class="flex items-center">
            <n-button quaternary circle @click="isMobile ? showMobileMenu = true : collapsed = !collapsed">
                <template #icon>
                    <n-icon size="24">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="3" y1="12" x2="21" y2="12"></line>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </n-icon>
                </template>
            </n-button>
            <n-tag type="error" size="small" class="ml-4">MASTER</n-tag>
         </div>
         
         <div class="flex items-center gap-4">
             <div class="text-right hidden md:block">
                 <div class="text-sm font-bold text-white">{{ t('layout.systemAdmin') }}</div>
                 <div class="text-xs text-gray-400">{{ t('layout.superAdmin') }}</div>
             </div>
             <LanguageSwitcher />
             <div class="flex items-center gap-3 ml-2">
                <span class="text-gray-400 text-sm">
                  {{ t('common.hi') }} <span class="font-bold text-gray-200">Admin</span>
                </span>
                <n-button strong secondary type="error" size="small" @click="handleLogout">
                  <template #icon><n-icon><ExitToAppOutlined /></n-icon></template>
                  {{ t('common.logout') }}
                </n-button>
              </div>
         </div>
      </n-layout-header>
      
      <n-layout-content content-style="padding: 24px; min-height: 85vh;">
         <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
         </router-view>
      </n-layout-content>
      <n-layout-footer bordered class="p-4 text-center">
          <n-tag :bordered="false" size="small" class="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" @click="handleVersionClick">
             Version: v0.1.0 (Master Console)
          </n-tag>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>
