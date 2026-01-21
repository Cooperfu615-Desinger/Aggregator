import { h } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
    DashboardOutlined,
    PeopleAltOutlined,
    CasinoOutlined,
    BarChartOutlined,
    DescriptionOutlined,
    AttachMoneyOutlined,
    SettingsOutlined,
    SecurityOutlined,
    AdminPanelSettingsOutlined
} from '@vicons/material'

// Icon render helper
const renderIcon = (icon: any) => () => h(NIcon, null, { default: () => h(icon) })

/**
 * Master Admin Menu Configuration
 * Based on DESIGN_SPEC.md Section 2: Master Admin (總控後台)
 * All labels use i18n t() function for reactive language switching
 */
export const masterMenuOptions = (t: (key: string) => string): MenuOption[] => [
    {
        type: 'group',
        label: t('menu.warRoom'),
        key: 'dashboard-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/dashboard' }, { default: () => t('menu.globalDashboard') }),
                key: 'admin-dashboard',
                icon: renderIcon(DashboardOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: t('menu.downstream'),
        key: 'downstream-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/merchant/list' }, { default: () => t('menu.merchantList') }),
                key: 'merchant-list',
                icon: renderIcon(PeopleAltOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: t('menu.upstream'),
        key: 'upstream-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/game-center/providers' }, { default: () => t('menu.providerList') }),
                key: 'provider-list',
                icon: renderIcon(CasinoOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/game-center/list' }, { default: () => t('menu.gameInventory') }),
                key: 'game-center',
                icon: renderIcon(CasinoOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: t('menu.financeSettlement'),
        key: 'finance-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/data-center/report' }, { default: () => t('menu.platformPnL') }),
                key: 'FinancialReport',
                icon: renderIcon(AttachMoneyOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/finance/invoices' }, { default: () => t('menu.invoiceManagement') }),
                key: 'InvoiceManager',
                icon: renderIcon(DescriptionOutlined)
            }
        ]
    },
    {
        type: 'group',
        label: t('menu.riskSystem'),
        key: 'system-group',
        children: [
            {
                label: () => h(RouterLink, { to: '/admin/data-center/bet-log' }, { default: () => t('menu.betQuery') }),
                key: 'BetLog',
                icon: renderIcon(BarChartOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/job-levels' }, { default: () => t('menu.jobLevels') }),
                key: 'JobLevelList',
                icon: renderIcon(AdminPanelSettingsOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/staff' }, { default: () => t('menu.staffList') }),
                key: 'StaffList',
                icon: renderIcon(AdminPanelSettingsOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/audit-logs' }, { default: () => t('menu.auditLog') }),
                key: 'AuditLogs',
                icon: renderIcon(SecurityOutlined)
            },
            {
                label: () => h(RouterLink, { to: '/admin/system/settings' }, { default: () => t('menu.systemSettings') }),
                key: 'SystemSettings',
                icon: renderIcon(SettingsOutlined)
            }
        ]
    }
]
