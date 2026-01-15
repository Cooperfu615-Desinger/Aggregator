<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { 
  NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NLayoutFooter,
  NMenu, NButton, NAvatar, NDropdown, NTag
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { 
  DashboardOutlined, 
  PeopleAltOutlined, 
  CasinoOutlined, 
  BarChartOutlined,
  MenuOpenOutlined,
  MenuOutlined,
  DescriptionOutlined,
  AttachMoneyOutlined
} from '@vicons/material'
import { NIcon } from 'naive-ui'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const currentRoute = useRoute()
const authStore = useAuthStore()

// State
const collapsed = ref(false)

// Menu Icon Helper
const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// Menu Options
const menuOptions: MenuOption[] = [
  {
    label: () => h(RouterLink, { to: '/dashboard' }, { default: () => 'Dashboard' }),
    key: 'dashboard',
    icon: renderIcon(DashboardOutlined)
  },
  {
    label: () => h(RouterLink, { to: '/agent/list' }, { default: () => 'Agent Management' }),
    key: 'agent-list',
    icon: renderIcon(PeopleAltOutlined)
  },
  {
    label: () => h(RouterLink, { to: '/merchant/list' }, { default: () => 'Merchant (Legacy)' }),
    key: 'merchant-list',
    icon: renderIcon(PeopleAltOutlined)
  },
  {
    label: () => h(RouterLink, { to: '/game-center/list' }, { default: () => 'Game Center' }),
    key: 'game-center',
    icon: renderIcon(CasinoOutlined)
  },
  {
    label: 'Data Center',
    key: 'data-center',
    icon: renderIcon(BarChartOutlined),
    children: [
      {
        label: () => h(RouterLink, { to: '/data-center/bet-log' }, { default: () => 'Bet Logs' }),
        key: 'BetLog',
        icon: renderIcon(DescriptionOutlined)
      },
      {
        label: () => h(RouterLink, { to: '/data-center/report' }, { default: () => 'Financial Report' }),
        key: 'FinancialReport',
        icon: renderIcon(AttachMoneyOutlined)
      }
    ]
  }
]

// Active Key Logic
const activeKey = computed(() => {
    // Map route names to menu keys if simple match isn't enough
    // For now, we use route name or simple mapping
    return currentRoute.name as string
})

// Header Dropdown
const userOptions = [
    { label: 'Profile', key: 'profile' },
    { label: 'Logout', key: 'logout' }
]
const handleUserSelect = (key: string) => {
    if (key === 'logout') {
        authStore.logout()
        router.push('/login')
    }
}

const handleVersionClick = () => {
    window.alert('System Ready')
}
</script>

<template>
  <n-layout has-sider class="h-screen">
    <n-layout-sider
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
        <div class="h-16 flex items-center justify-center overflow-hidden whitespace-nowrap">
           <span v-if="!collapsed" class="text-xl font-bold text-white tracking-widest pl-4">Game Platform</span>
           <span v-else class="text-xl font-bold text-white">GP</span>
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

    <n-layout>
      <n-layout-header bordered class="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#18181c]">
         <div class="flex items-center">
            <n-button quaternary circle @click="collapsed = !collapsed">
                <template #icon>
                    <n-icon size="24">
                        <MenuOpenOutlined v-if="!collapsed"/>
                        <MenuOutlined v-else/>
                    </n-icon>
                </template>
            </n-button>
         </div>
         
         <div class="flex items-center gap-4">
             <div class="text-right hidden md:block">
                 <div class="text-sm font-bold">Admin User</div>
                 <div class="text-xs text-gray-400">Super Administrator</div>
             </div>
             <n-dropdown :options="userOptions" @select="handleUserSelect">
                <n-avatar round size="medium" src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" class="cursor-pointer" />
             </n-dropdown>
         </div>
      </n-layout-header>
      
      <n-layout-content content-style="padding: 24px; min-height: 85vh;">
         <router-view></router-view>
      </n-layout-content>
      <n-layout-footer bordered class="p-4 text-center">
          <n-tag :bordered="false" size="small" class="cursor-pointer opacity-50 hover:opacity-100 transition-opacity" @click="handleVersionClick">
             Version: v0.1.0 (Prototype)
          </n-tag>
      </n-layout-footer>
    </n-layout>
  </n-layout>
</template>
